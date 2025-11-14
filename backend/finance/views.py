# backend/finance/views.py
from .cache_utils import cached_response, invalidate_dashboard_cache
from django.shortcuts import render
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import (
    Transaction, Invoice, InvoiceItem, Budget, CashFlow, 
    FinancialForecast, CreditScore, Supplier, MpesaPayment
)
from .serializers import (
    TransactionSerializer, InvoiceSerializer, InvoiceItemSerializer,
    BudgetSerializer, CashFlowSerializer, FinancialForecastSerializer,
    CreditScoreSerializer, FinancialSummarySerializer, TransactionAnalyticsSerializer,
    BudgetAnalyticsSerializer, SupplierSerializer, MpesaPaymentSerializer
)
from users.models import Business, Membership

def get_user_businesses(user):
    """Get all businesses a user is a member of"""
    if user.is_superuser:
        return Business.objects.all()
    memberships = Membership.objects.filter(user=user, is_active=True)
    return Business.objects.filter(id__in=[m.business_id for m in memberships])

def get_business_queryset(user, business_id=None):
    """Get queryset filtered by user's business access"""
    if user.is_superuser:
        businesses = Business.objects.all()
    else:
        memberships = Membership.objects.filter(user=user, is_active=True)
        businesses = Business.objects.filter(id__in=[m.business_id for m in memberships])
    
    if business_id:
        businesses = businesses.filter(id=business_id)
    
    return businesses.values_list('id', flat=True)


class IsOwner(permissions.BasePermission):
    """Permission to only allow owners to access their data"""
    def has_object_permission(self, request, view, obj):
        return getattr(obj, 'user_id', None) == request.user.id


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing transactions"""
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Transaction.objects.none()
        
        business_id = self.request.query_params.get('business')
        business_ids = list(get_business_queryset(user, business_id))
        
        if not business_ids:
            return Transaction.objects.none()
        
        # Filter by business and user (for members)
        qs = Transaction.objects.filter(business_id__in=business_ids)
        
        # If user is not superuser, also filter by user or check membership role
        if not user.is_superuser:
            # Staff can see their own transactions, admins see all in business
            from users.views import user_is_business_admin
            if business_id and user_is_business_admin(user, business_id):
                # Business admin sees all transactions in their business
                pass
            else:
                # Staff sees only their own transactions
                qs = qs.filter(user=user)
        
        return qs.order_by('-transaction_date')
    
    def get_permissions(self):
        # Allow list access for unauthenticated users (demo mode)
        if self.action == 'list':
            return [AllowAny()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError, PermissionDenied
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Validate business exists and user has access
            business_id = self.request.data.get('business')
            if not business_id:
                raise ValidationError({'business': 'Business ID is required'})
            
            # Convert to int for comparison
            try:
                business_id_int = int(business_id)
            except (ValueError, TypeError):
                raise ValidationError({'business': 'Invalid business ID format'})
            
            business_ids = list(get_business_queryset(self.request.user, business_id_int))
            if not business_ids or business_id_int not in business_ids:
                raise PermissionDenied('You do not have access to this business')
            
            # Get Business object
            from users.models import Business
            try:
                business = Business.objects.get(id=business_id_int)
            except Business.DoesNotExist:
                raise ValidationError({'business': 'Business not found'})
            
            # Handle transaction_date - convert date string to datetime if needed
            transaction_date = self.request.data.get('transaction_date')
            from django.utils import timezone
            from datetime import datetime, time as dt_time
            
            if transaction_date:
                from django.utils.dateparse import parse_datetime, parse_date
                dt = None
                
                # Try parsing as datetime first
                if isinstance(transaction_date, str):
                    # Try ISO format with timezone
                    dt = parse_datetime(transaction_date)
                    if not dt:
                        # Try ISO format without timezone (add timezone)
                        try:
                            # If format is YYYY-MM-DDTHH:mm:ss, add timezone
                            if 'T' in transaction_date and len(transaction_date) == 19:
                                dt = datetime.fromisoformat(transaction_date)
                                dt = timezone.make_aware(dt)
                            else:
                                # Try parsing as date and convert to datetime
                                d = parse_date(transaction_date)
                                if d:
                                    dt = timezone.make_aware(datetime.combine(d, dt_time.min))
                        except (ValueError, TypeError) as e:
                            logger.warning(f"Date parsing error: {e}, transaction_date: {transaction_date}")
                    
                    if dt:
                        serializer.validated_data['transaction_date'] = dt
                    else:
                        # If parsing fails, use current time as fallback
                        logger.warning(f"Could not parse transaction_date: {transaction_date}, using current time")
                        serializer.validated_data['transaction_date'] = timezone.now()
                else:
                    serializer.validated_data['transaction_date'] = timezone.now()
            else:
                # If no transaction_date provided, use current time
                serializer.validated_data['transaction_date'] = timezone.now()
            
            # Log before save for debugging
            logger.info(f"Creating transaction: user={self.request.user.id}, business={business.id}, amount={serializer.validated_data.get('amount')}")
            serializer.save(user=self.request.user, business=business)
        except (ValidationError, PermissionDenied):
            # Re-raise validation/permission errors as-is
            raise
        except Exception as e:
            logger.error(f"Error creating transaction: {str(e)}", exc_info=True)
            # For other errors, wrap in ValidationError with detailed message
            raise ValidationError({'error': f'Failed to create transaction: {str(e)}'})
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get transaction analytics for the user's businesses"""
        business_id = request.query_params.get('business_id')
        period = request.query_params.get('period', '30')  # days
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=int(period))
        
        # Filter transactions
        queryset = self.get_queryset().filter(transaction_date__gte=start_date)
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        
        # Calculate analytics
        total_transactions = queryset.count()
        total_amount = queryset.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        avg_transaction = queryset.aggregate(avg=Avg('amount'))['avg'] or Decimal('0')
        
        # Income vs Expenses
        income_count = queryset.filter(transaction_type='income').count()
        expense_count = queryset.filter(transaction_type='expense').count()
        
        # Top categories
        top_categories = queryset.values('category').annotate(
            count=Count('id'),
            total=Sum('amount')
        ).order_by('-total')[:5]
        
        # Payment methods
        payment_methods = queryset.values('payment_method').annotate(
            count=Count('id'),
            total=Sum('amount')
        )
        
        analytics_data = {
            'period': f"{period} days",
            'total_transactions': total_transactions,
            'total_amount': total_amount,
            'average_transaction': avg_transaction,
            'income_count': income_count,
            'expense_count': expense_count,
            'top_categories': list(top_categories),
            'payment_methods': list(payment_methods),
            'currency': 'KES'
        }
        
        serializer = TransactionAnalyticsSerializer(analytics_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get financial summary for user's businesses"""
        business_id = request.query_params.get('business_id')
        period = request.query_params.get('period', '30')  # days
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=int(period))
        
        # Filter transactions
        transactions = self.get_queryset().filter(transaction_date__gte=start_date)
        if business_id:
            transactions = transactions.filter(business_id=business_id)
        
        # Calculate summary
        total_income = transactions.filter(transaction_type='income').aggregate(
            total=Sum('amount'))['total'] or Decimal('0')
        total_expenses = transactions.filter(transaction_type='expense').aggregate(
            total=Sum('amount'))['total'] or Decimal('0')
        net_profit = total_income - total_expenses
        
        # Outstanding invoices
        invoices = Invoice.objects.filter(user=request.user)
        if business_id:
            invoices = invoices.filter(business_id=business_id)
        
        outstanding_invoices = invoices.filter(status__in=['sent', 'overdue']).aggregate(
            total=Sum('total_amount'))['total'] or Decimal('0')
        overdue_invoices = invoices.filter(status='overdue').aggregate(
            total=Sum('total_amount'))['total'] or Decimal('0')
        
        # Budget utilization
        budgets = Budget.objects.filter(user=request.user, is_active=True)
        if business_id:
            budgets = budgets.filter(business_id=business_id)
        
        total_budgeted = budgets.aggregate(total=Sum('budgeted_amount'))['total'] or Decimal('0')
        total_spent = budgets.aggregate(total=Sum('spent_amount'))['total'] or Decimal('0')
        budget_utilization = (total_spent / total_budgeted * 100) if total_budgeted > 0 else 0
        
        # Credit score
        credit_score = CreditScore.objects.filter(user=request.user).order_by('-created_at').first()
        score = credit_score.score if credit_score else 0
        
        summary_data = {
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_profit': net_profit,
            'cash_flow': net_profit,  # Simplified for now
            'outstanding_invoices': outstanding_invoices,
            'overdue_invoices': overdue_invoices,
            'budget_utilization': round(budget_utilization, 2),
            'credit_score': score,
            'currency': 'KES'
        }
        
        serializer = FinancialSummarySerializer(summary_data)
        return Response(serializer.data)#
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        
        # Invalidate dashboard cache for this user
        if response.status_code in [200, 201]:
            user_id = request.user.id
            business_id = request.data.get('business', '')
            cache_key_pattern = f"dashboard:user_{user_id}:business_{business_id}:period_*"
            # For database cache, we need to delete specific keys
            # Delete common periods
            from django.core.cache import cache
            for period in ['30', '7', '90', '365']:
                cache_key = f"dashboard:user_{user_id}:business_{business_id}:period_{period}"
                cache.delete(cache_key)
                cache_key_no_biz = f"dashboard:user_{user_id}:business_:period_{period}"
                cache.delete(cache_key_no_biz)
        
        return response 


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing invoices"""
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Invoice.objects.none()
        
        business_id = self.request.query_params.get('business')
        business_ids = list(get_business_queryset(user, business_id))
        
        if not business_ids:
            return Invoice.objects.none()
        
        # Filter by business
        qs = Invoice.objects.filter(business_id__in=business_ids)
        
        # If user is not superuser, filter by user or check membership role
        if not user.is_superuser:
            from users.views import user_is_business_admin
            if business_id and user_is_business_admin(user, business_id):
                # Business admin sees all invoices in their business
                pass
            else:
                # Staff sees only their own invoices
                qs = qs.filter(user=user)
        
        return qs.order_by('-issue_date')
    
    def get_permissions(self):
        # Allow list access for unauthenticated users (demo mode)
        if self.action == 'list':
            return [AllowAny()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        # Validate business exists and user has access
        business_id = self.request.data.get('business')
        if not business_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Business ID is required'})
        
        # Convert to int for comparison
        try:
            business_id_int = int(business_id)
        except (ValueError, TypeError):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Invalid business ID format'})
        
        business_ids = list(get_business_queryset(self.request.user, business_id_int))
        if not business_ids or business_id_int not in business_ids:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have access to this business')
        
        # Get Business object
        from users.models import Business
        try:
            business = Business.objects.get(id=business_id_int)
        except Business.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Business not found'})
        
        serializer.save(user=self.request.user, business=business)
    
    @action(detail=True, methods=['post'])
    def send_invoice(self, request, pk=None):
        """Send invoice to customer"""
        invoice = self.get_object()
        # TODO: Implement email/SMS sending logic
        invoice.status = 'sent'
        invoice.save()
        return Response({'message': 'Invoice sent successfully'})
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark invoice as paid"""
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.paid_date = timezone.now().date()
        invoice.save()
        return Response({'message': 'Invoice marked as paid'})

    # In InvoiceViewSet class, update/create these methods:

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code in [200, 201]:
            from .cache_utils import invalidate_dashboard_cache
            business_id = request.data.get('business', '')
            invalidate_dashboard_cache(request.user.id, business_id)
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code in [200]:
            from .cache_utils import invalidate_dashboard_cache
            invoice = self.get_object()
            business_id = str(invoice.business_id) if invoice.business_id else None
            invalidate_dashboard_cache(request.user.id, business_id)
        return response

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark invoice as paid"""
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.paid_date = timezone.now().date()
        invoice.save()
        # Invalidate cache
        from .cache_utils import invalidate_dashboard_cache
        business_id = str(invoice.business_id) if invoice.business_id else None
        invalidate_dashboard_cache(request.user.id, business_id)
        return Response({'message': 'Invoice marked as paid'})


class InvoiceItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing invoice items"""
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        invoice_id = self.request.query_params.get('invoice_id')
        if invoice_id:
            return InvoiceItem.objects.filter(invoice_id=invoice_id, invoice__user=self.request.user)
        return InvoiceItem.objects.none()
    
    def perform_create(self, serializer):
        # Validate invoice belongs to user
        invoice_id = self.request.data.get('invoice')
        if invoice_id:
            try:
                invoice = Invoice.objects.get(id=invoice_id, user=self.request.user)
                serializer.save(invoice=invoice)
            except Invoice.DoesNotExist:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('Invoice not found or you do not have access to it')
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'invoice': 'Invoice ID is required'})


class BudgetViewSet(viewsets.ModelViewSet):
    """ViewSet for managing budgets"""
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).order_by('-start_date')
    
    def perform_create(self, serializer):
        # Validate business exists and user has access
        business_id = self.request.data.get('business')
        if not business_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Business ID is required'})
        
        business_ids = list(get_business_queryset(self.request.user, business_id))
        if not business_ids or business_id not in [str(bid) for bid in business_ids]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have access to this business')
        
        # Convert business_id to Business object if needed
        if isinstance(business_id, str):
            from users.models import Business
            try:
                business = Business.objects.get(id=business_id)
            except Business.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'business': 'Business not found'})
        else:
            business = business_id
        
        serializer.save(user=self.request.user, business=business)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get budget analytics"""
        business_id = request.query_params.get('business_id')
        
        budgets = self.get_queryset()
        if business_id:
            budgets = budgets.filter(business_id=business_id)
        
        active_budgets = budgets.filter(is_active=True)
        
        analytics_data = {
            'total_budgets': budgets.count(),
            'active_budgets': active_budgets.count(),
            'total_budgeted': active_budgets.aggregate(total=Sum('budgeted_amount'))['total'] or Decimal('0'),
            'total_spent': active_budgets.aggregate(total=Sum('spent_amount'))['total'] or Decimal('0'),
            'over_budget_count': active_budgets.filter(spent_amount__gt=F('budgeted_amount')).count(),
            'near_limit_count': active_budgets.filter(
                spent_amount__gte=F('budgeted_amount') * F('alert_threshold') / 100
            ).count(),
            'budget_utilization': 0,  # Will be calculated
            'currency': 'KES'
        }
        
        # Calculate utilization percentage
        if analytics_data['total_budgeted'] > 0:
            analytics_data['budget_utilization'] = round(
                (analytics_data['total_spent'] / analytics_data['total_budgeted']) * 100, 2
            )
        
        serializer = BudgetAnalyticsSerializer(analytics_data)
        return Response(serializer.data)


    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code in [200, 201]:
            from .cache_utils import invalidate_dashboard_cache
            business_id = request.data.get('business', '')
            invalidate_dashboard_cache(request.user.id, business_id)
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code in [200]:
            from .cache_utils import invalidate_dashboard_cache
            budget = self.get_object()
            business_id = str(budget.business_id) if budget.business_id else None
            invalidate_dashboard_cache(request.user.id, business_id)
        return response


class CashFlowViewSet(viewsets.ModelViewSet):
    """ViewSet for managing cash flow data"""
    queryset = CashFlow.objects.all()
    serializer_class = CashFlowSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        return CashFlow.objects.filter(user=self.request.user).order_by('-period_start')
    
    def perform_create(self, serializer):
        # Validate business exists and user has access
        business_id = self.request.data.get('business')
        if not business_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Business ID is required'})
        
        business_ids = list(get_business_queryset(self.request.user, business_id))
        if not business_ids or business_id not in [str(bid) for bid in business_ids]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have access to this business')
        
        # Convert business_id to Business object if needed
        if isinstance(business_id, str):
            from users.models import Business
            try:
                business = Business.objects.get(id=business_id)
            except Business.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'business': 'Business not found'})
        else:
            business = business_id
        
        serializer.save(user=self.request.user, business=business)


class FinancialForecastViewSet(viewsets.ModelViewSet):
    """ViewSet for managing financial forecasts"""
    queryset = FinancialForecast.objects.all()
    serializer_class = FinancialForecastSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        return FinancialForecast.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        # Validate business exists and user has access
        business_id = self.request.data.get('business')
        if not business_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Business ID is required'})
        
        business_ids = list(get_business_queryset(self.request.user, business_id))
        if not business_ids or business_id not in [str(bid) for bid in business_ids]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have access to this business')
        
        # Convert business_id to Business object if needed
        if isinstance(business_id, str):
            from users.models import Business
            try:
                business = Business.objects.get(id=business_id)
            except Business.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'business': 'Business not found'})
        else:
            business = business_id
        
        serializer.save(user=self.request.user, business=business)
    
    @action(detail=False, methods=['post'])
    def generate_forecast(self, request):
        """Generate AI-powered financial forecast"""
        # TODO: Implement AI forecasting logic using LangChain and OpenAI
        forecast_type = request.data.get('forecast_type', 'revenue')
        business_id = request.data.get('business_id')
        
        # Placeholder implementation
        forecast_data = {
            'forecast_type': forecast_type,
            'name': f'{forecast_type.title()} Forecast',
            'description': f'AI-generated {forecast_type} forecast',
            'forecast_data': {
                'monthly': [1000, 1200, 1100, 1300, 1400, 1500],
                'confidence': 85.5
            },
            'confidence_score': 85.5,
            'forecast_start': timezone.now().date(),
            'forecast_end': timezone.now().date() + timedelta(days=180),
            'model_version': 'v1.0',
            'training_data_period': '6 months'
        }
        
        serializer = self.get_serializer(data=forecast_data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreditScoreViewSet(viewsets.ModelViewSet):
    """ViewSet for managing credit scores"""
    queryset = CreditScore.objects.all()
    serializer_class = CreditScoreSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        return CreditScore.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        # Validate business exists and user has access
        business_id = self.request.data.get('business')
        if not business_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Business ID is required'})
        
        business_ids = list(get_business_queryset(self.request.user, business_id))
        if not business_ids or business_id not in [str(bid) for bid in business_ids]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have access to this business')
        
        # Convert business_id to Business object if needed
        if isinstance(business_id, str):
            from users.models import Business
            try:
                business = Business.objects.get(id=business_id)
            except Business.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'business': 'Business not found'})
        else:
            business = business_id
        
        serializer.save(user=self.request.user, business=business)
    
    @action(detail=False, methods=['post'])
    def calculate_score(self, request):
        """Calculate credit score for business"""
        business_id = request.data.get('business_id')
        
        if not business_id:
            return Response({'error': 'Business ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            business = Business.objects.get(id=business_id, owner=request.user)
        except Business.DoesNotExist:
            return Response({'error': 'Business not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # TODO: Implement AI-powered credit scoring using LangChain and OpenAI
        # For now, return a placeholder score
        score_data = {
            'business': business.id,
            'score': 750,
            'payment_history': 85.0,
            'credit_utilization': 70.0,
            'business_age': 80.0,
            'revenue_stability': 75.0,
            'debt_to_income': 65.0,
            'factors': {
                'payment_history': 'Good payment history',
                'credit_utilization': 'Moderate utilization',
                'business_age': 'Established business',
                'revenue_stability': 'Stable revenue stream'
            },
            'recommendations': [
                'Maintain consistent payment history',
                'Consider reducing credit utilization',
                'Continue building business credit'
            ],
            'calculation_method': 'ai_enhanced',
            'data_sources': ['transactions', 'invoices', 'business_profile']
        }
        
        serializer = self.get_serializer(data=score_data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Additional API endpoints
@cached_response(timeout=300, key_prefix="dashboard")  # Cache for 5 minutes
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_data(request):
    """Get comprehensive dashboard data"""
    business_id = request.query_params.get('business_id')
    period = request.query_params.get('period', '30')
    
    # Get user's businesses
    businesses = Business.objects.filter(owner=request.user)
    if business_id:
        businesses = businesses.filter(id=business_id)
    
    # Calculate date range
    end_date = timezone.now()
    start_date = end_date - timedelta(days=int(period))
    
    # Get transactions
    transactions = Transaction.objects.filter(
        user=request.user,
        transaction_date__gte=start_date
    )
    if business_id:
        transactions = transactions.filter(business_id=business_id)
    
    # Calculate key metrics
    total_income = transactions.filter(transaction_type='income').aggregate(
        total=Sum('amount'))['total'] or Decimal('0')
    total_expenses = transactions.filter(transaction_type='expense').aggregate(
        total=Sum('amount'))['total'] or Decimal('0')
    net_profit = total_income - total_expenses
    
    # Get recent transactions
    recent_transactions = transactions.order_by('-transaction_date')[:10]
    
    # Get budgets
    budgets = Budget.objects.filter(user=request.user, is_active=True)
    if business_id:
        budgets = budgets.filter(business_id=business_id)
    
    # Get invoices
    invoices = Invoice.objects.filter(user=request.user)
    if business_id:
        invoices = invoices.filter(business_id=business_id)
    
    overdue_invoices = invoices.filter(status='overdue')
    
    # Get credit score
    credit_score = CreditScore.objects.filter(user=request.user).order_by('-created_at').first()
    
    dashboard_data = {
        'summary': {
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_profit': net_profit,
            'currency': 'KES'
        },
        'recent_transactions': TransactionSerializer(recent_transactions, many=True).data,
        'budgets': BudgetSerializer(budgets, many=True).data,
        'overdue_invoices': InvoiceSerializer(overdue_invoices, many=True).data,
        'credit_score': CreditScoreSerializer(credit_score).data if credit_score else None,
        'businesses': [{'id': b.id, 'name': b.legal_name} for b in businesses]
    }
    
    return Response(dashboard_data)


class SupplierViewSet(viewsets.ModelViewSet):
    """ViewSet for managing suppliers"""
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Supplier.objects.none()
        
        business_id = self.request.query_params.get('business')
        business_ids = list(get_business_queryset(user, business_id))
        
        if not business_ids:
            return Supplier.objects.none()
        
        # Filter by business
        qs = Supplier.objects.filter(business_id__in=business_ids)
        
        # If user is not superuser, filter by user or check membership role
        if not user.is_superuser:
            from users.views import user_is_business_admin
            if business_id and user_is_business_admin(user, business_id):
                # Business admin sees all suppliers in their business
                pass
            else:
                # Staff sees only suppliers they created
                qs = qs.filter(user=user)
        
        return qs.order_by('-created_at')
    
    def get_permissions(self):
        # Allow list access for unauthenticated users (demo mode)
        if self.action == 'list':
            return [AllowAny()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        # Validate business exists and user has access
        business_id = self.request.data.get('business')
        if not business_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Business ID is required'})
        
        # Convert to int for comparison
        try:
            business_id_int = int(business_id)
        except (ValueError, TypeError):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Invalid business ID format'})
        
        business_ids = list(get_business_queryset(self.request.user, business_id_int))
        if not business_ids or business_id_int not in business_ids:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have access to this business')
        
        # Get Business object
        from users.models import Business
        try:
            business = Business.objects.get(id=business_id_int)
        except Business.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Business not found'})
        
        serializer.save(user=self.request.user, business=business)


class VoiceConversationViewSet(viewsets.ModelViewSet):
    """ViewSet for storing voice conversation history"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Return empty queryset for now - conversations are stored client-side
        return []
    
    def get_serializer_class(self):
        # Simple serializer for accepting conversation data
        from rest_framework import serializers
        
        class VoiceConversationSerializer(serializers.Serializer):
            conversation_id = serializers.CharField(required=False)
            messages = serializers.ListField(required=False)
            timestamp = serializers.DateTimeField(required=False)
            
            class Meta:
                fields = ['conversation_id', 'messages', 'timestamp']
        
        return VoiceConversationSerializer
    
    def create(self, request, *args, **kwargs):
        # Accept the data but don't store it (client-side storage)
        # Return success response
        return Response({
            'status': 'success',
            'message': 'Conversation logged (client-side storage)'
        }, status=status.HTTP_201_CREATED)
    
    def list(self, request, *args, **kwargs):
        # Return empty list - conversations are client-side
        return Response([])


# ==================== M-PESA ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_mpesa_payment(request):
    """Initiate M-Pesa STK Push payment"""
    try:
        from .services.mpesa_service import get_mpesa_service
        from django.utils import timezone
        
        user = request.user
        phone_number = request.data.get('phone_number')
        amount = request.data.get('amount')
        business_id = request.data.get('business')
        invoice_id = request.data.get('invoice')
        account_reference = request.data.get('account_reference', '')
        transaction_desc = request.data.get('transaction_desc', 'Payment')
        
        # Validate required fields
        if not phone_number or not amount or not business_id:
            return Response(
                {'error': 'phone_number, amount, and business are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate business access
        business_ids = list(get_business_queryset(user, business_id))
        if not business_ids or business_id not in business_ids:
            return Response(
                {'error': 'You do not have access to this business'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        business = Business.objects.get(id=business_id)
        
        # Create M-Pesa payment record
        mpesa_payment = MpesaPayment.objects.create(
            user=user,
            business=business,
            phone_number=phone_number,
            amount=Decimal(str(amount)),
            status='pending',
            account_reference=account_reference or f"INV-{invoice_id}" if invoice_id else f"PAY-{user.id}",
            transaction_desc=transaction_desc,
            invoice_id=invoice_id if invoice_id else None
        )
        
        # Initiate STK Push
        mpesa_service = get_mpesa_service()
        response = mpesa_service.stk_push(
            phone_number=phone_number,
            amount=amount,
            account_reference=mpesa_payment.account_reference,
            transaction_desc=transaction_desc
        )
        
        # Update payment with response
        if response.get('ResponseCode') == '0':
            mpesa_payment.checkout_request_id = response.get('CheckoutRequestID')
            mpesa_payment.merchant_request_id = response.get('MerchantRequestID')
            mpesa_payment.status = 'initiated'
            mpesa_payment.callback_data = response
            mpesa_payment.save()
            
            return Response({
                'success': True,
                'message': 'Payment request sent. Please check your phone.',
                'payment_id': str(mpesa_payment.id),
                'checkout_request_id': mpesa_payment.checkout_request_id
            }, status=status.HTTP_200_OK)
        else:
            mpesa_payment.status = 'failed'
            mpesa_payment.error_message = response.get('CustomerMessage', 'Payment initiation failed')
            mpesa_payment.callback_data = response
            mpesa_payment.save()
            
            return Response({
                'success': False,
                'error': response.get('CustomerMessage', 'Payment initiation failed'),
                'payment_id': str(mpesa_payment.id)
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error initiating M-Pesa payment: {str(e)}")
        return Response(
            {'error': f'Payment initiation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow callback from M-Pesa
def mpesa_callback(request):
    """Handle M-Pesa STK Push callback"""
    try:
        from django.utils import timezone
        import json
        
        data = request.data
        body = data.get('Body', {})
        stk_callback = body.get('stkCallback', {})
        
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        
        # Find payment by checkout request ID
        try:
            mpesa_payment = MpesaPayment.objects.get(checkout_request_id=checkout_request_id)
        except MpesaPayment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Update payment status
        mpesa_payment.callback_data = data
        
        if result_code == 0:
            # Payment successful
            callback_metadata = stk_callback.get('CallbackMetadata', {})
            items = callback_metadata.get('Item', [])
            
            receipt_number = None
            transaction_date = None
            phone_number = None
            amount = None
            
            for item in items:
                if item.get('Name') == 'MpesaReceiptNumber':
                    receipt_number = item.get('Value')
                elif item.get('Name') == 'TransactionDate':
                    transaction_date = str(item.get('Value'))
                elif item.get('Name') == 'PhoneNumber':
                    phone_number = item.get('Value')
                elif item.get('Name') == 'Amount':
                    amount = item.get('Value')
            
            mpesa_payment.status = 'completed'
            mpesa_payment.mpesa_receipt_number = receipt_number
            mpesa_payment.transaction_date = transaction_date
            mpesa_payment.completed_at = timezone.now()
            mpesa_payment.save()
            
            # Create transaction record if invoice exists
            if mpesa_payment.invoice:
                Transaction.objects.create(
                    business=mpesa_payment.business,
                    user=mpesa_payment.user,
                    amount=mpesa_payment.amount,
                    currency=mpesa_payment.currency,
                    transaction_type='income',
                    payment_method='mpesa',
                    status='completed',
                    description=f"M-Pesa payment for invoice {mpesa_payment.invoice.invoice_number}",
                    reference_number=receipt_number,
                    external_id=receipt_number,
                    invoice=mpesa_payment.invoice,
                    transaction_date=timezone.now()
                )
                
                # Update invoice status
                mpesa_payment.invoice.status = 'paid'
                mpesa_payment.invoice.paid_at = timezone.now()
                mpesa_payment.invoice.save()
            
            # Create notification
            from core.models import Notification
            Notification.objects.create(
                user=mpesa_payment.user,
                business=mpesa_payment.business,
                title='Payment Received',
                message=f'M-Pesa payment of {mpesa_payment.amount} KES received. Receipt: {receipt_number}',
                notification_type='mpesa_payment',
                priority='high',
                action_url=f"/invoices/{mpesa_payment.invoice.id}" if mpesa_payment.invoice else "/transactions",
                resource_type='payment',
                resource_id=str(mpesa_payment.id)
            )
        else:
            # Payment failed
            mpesa_payment.status = 'failed'
            mpesa_payment.error_message = result_desc
            mpesa_payment.save()
        
        return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error processing M-Pesa callback: {str(e)}")
        return Response({'ResultCode': 1, 'ResultDesc': 'Error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mpesa_payment_status(request, payment_id):
    """Get M-Pesa payment status"""
    try:
        user = request.user
        mpesa_payment = MpesaPayment.objects.get(id=payment_id)
        
        # Check access
        business_ids = list(get_business_queryset(user, mpesa_payment.business_id))
        if mpesa_payment.business_id not in business_ids:
            return Response(
                {'error': 'You do not have access to this payment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = MpesaPaymentSerializer(mpesa_payment)
        return Response(serializer.data)
        
    except MpesaPayment.DoesNotExist:
        return Response(
            {'error': 'Payment not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mpesa_payments(request):
    """Get all M-Pesa payments for user's businesses"""
    user = request.user
    business_id = request.query_params.get('business')
    
    business_ids = list(get_business_queryset(user, business_id))
    if not business_ids:
        return Response([])
    
    payments = MpesaPayment.objects.filter(business_id__in=business_ids).order_by('-created_at')
    
    # Filters
    status_filter = request.query_params.get('status')
    if status_filter:
        payments = payments.filter(status=status_filter)
    
    serializer = MpesaPaymentSerializer(payments, many=True)
    return Response(serializer.data)
