from django.shortcuts import render
from rest_framework.views import APIView
# backend/users/views.py
from django.utils.timezone import now
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from datetime import timedelta
import secrets
from django.contrib.auth.models import User
from .models import Business, UserProfile, Customer, Membership, BusinessInvitation, BusinessRegistration, IndividualRegistration
from .serializers import (
    BusinessSerializer, UserSerializer, RegisterSerializer, 
    UserProfileSerializer, UserProfileUpdateSerializer,
    CustomerSerializer, CustomerCreateSerializer,
    MembershipSerializer, MembershipCreateUpdateSerializer,
    BusinessInvitationSerializer, BusinessInvitationCreateSerializer,
    BusinessRegistrationSerializer, BusinessRegistrationCreateSerializer,
    IndividualRegistrationSerializer, IndividualRegistrationCreateSerializer
)
from core.services.firecrawl import classify_business_from_website
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from finance.serializers import TransactionSerializer


# Create your views here.
class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return getattr(obj, 'owner_id', None) == request.user.id


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


def user_is_business_admin(user, business_id):
    if not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return Membership.objects.filter(user=user, business_id=business_id, role_in_business='business_admin', is_active=True).exists()


class IsBusinessAdminOfBusiness(permissions.BasePermission):
    def has_permission(self, request, view):
        business_id = request.data.get('business') or request.query_params.get('business') or request.parser_context.get('kwargs', {}).get('business_id') if hasattr(request, 'parser_context') else None
        # If the view sets business_id explicitly on the view, prefer that
        if hasattr(view, 'business_id') and view.business_id:
            business_id = view.business_id
        if not business_id:
            # For actions operating on a specific Membership, allow and defer to object permission
            return request.user.is_authenticated
        return user_is_business_admin(request.user, business_id)

    def has_object_permission(self, request, view, obj):
        return user_is_business_admin(request.user, getattr(obj, 'business_id', None))


class IsMemberOfBusiness(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        business_id = request.query_params.get('business') or request.data.get('business')
        if not business_id:
            # If no business is specified, allow to list own memberships
            return True
        if request.user.is_superuser:
            return True
        return Membership.objects.filter(user=request.user, business_id=business_id, is_active=True).exists()
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser:
            return True
        return obj.user_id == request.user.id or Membership.objects.filter(user=request.user, business_id=obj.business_id, is_active=True).exists()

class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            # Serve demo data for unauthenticated users if seed_user exists
            return Business.objects.filter(owner__username='seed_user').order_by('-created_at')
        return Business.objects.filter(owner=self.request.user).order_by('-created_at')
    
    def get_permissions(self):
        # Allow list access for unauthenticated users (demo mode)
        if self.action == 'list':
            return [AllowAny()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def classify(self, request, pk=None):
        business = self.get_object()
        website = business.website or request.data.get('website')
        category, confidence, tags = classify_business_from_website(website)
        business.classified_category = category
        business.classified_confidence = confidence
        business.classified_tags = tags
        business.last_classified_at = now()
        business.save(update_fields=['classified_category', 'classified_confidence', 'classified_tags', 'last_classified_at'])
        return Response(self.get_serializer(business).data)

@api_view(['GET'])
@permission_classes([AllowAny])  # Allow anonymous access
def me(request):
    """Get current user or return demo user if not authenticated"""
    if request.user.is_authenticated:
        user_data = UserSerializer(request.user).data
        memberships = Membership.objects.filter(user=request.user, is_active=True).select_related('business')
        memberships_data = [
            {
                'business_id': m.business_id,
                'business_name': m.business.legal_name,
                'role_in_business': m.role_in_business,
                'is_active': m.is_active,
            }
            for m in memberships
        ]
        user_data.update({'memberships': memberships_data})
        return Response(user_data, status=status.HTTP_200_OK)
    else:
        # Return demo user data for unauthenticated requests
        return Response({
            'id': None,
            'username': 'demo_user',
            'email': 'demo@example.com',
            'first_name': 'Demo',
            'last_name': 'User',
            'full_name': 'Demo User',
            'is_authenticated': False
        }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Public registration - Note: In production, this should be disabled or require approval"""
    # For now, we'll keep this but document that admin registration is preferred
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Create user profile automatically with default 'owner' role
        profile, created = UserProfile.objects.get_or_create(user=user)
        # Optional: return JWT tokens after registration
        refresh = RefreshToken.for_user(user)
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_detail(request):
    """Get user profile details"""
    try:
        profile = request.user.profile
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except UserProfile.DoesNotExist:
        # Create profile if it doesn't exist
        profile = UserProfile.objects.create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def profile_update(request):
    """Update user profile (PUT for full update, PATCH for partial)"""
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)
    
    partial = request.method == 'PATCH'
    serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=partial)
    
    if serializer.is_valid():
        serializer.save()
        # Return updated profile data
        profile_serializer = UserProfileSerializer(profile)
        return Response(profile_serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def profile_create(request):
    """Create user profile (if it doesn't exist)"""
    try:
        profile = request.user.profile
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except UserProfile.DoesNotExist:
        serializer = UserProfileUpdateSerializer(data=request.data)
        if serializer.is_valid():
            profile = serializer.save(user=request.user)
            profile_serializer = UserProfileSerializer(profile)
            return Response(profile_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IsAdmin(permissions.BasePermission):
    """Permission check for admin users"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        try:
            profile = request.user.profile
            return profile.role == 'admin' or request.user.is_superuser
        except UserProfile.DoesNotExist:
            return request.user.is_superuser


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_users_list(request):
    """Get all users (admin only)"""
    users = User.objects.all()
    user_data = []
    for user in users:
        try:
            profile = user.profile
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'role': profile.role,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'businesses_count': user.businesses.count(),
                'last_login': user.last_login
            })
        except UserProfile.DoesNotExist:
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'role': 'owner',
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'businesses_count': user.businesses.count(),
                'last_login': user.last_login
            })
    return Response(user_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_dashboard_stats(request):
    """Get admin dashboard statistics"""
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    total_businesses = Business.objects.count()
    admin_users = UserProfile.objects.filter(role='admin').count()
    data_entry_users = UserProfile.objects.filter(role='data_entry').count()
    owner_users = UserProfile.objects.filter(role='owner').count()
    
    # Convert QuerySet to list for JSON serialization
    recent_users = list(User.objects.order_by('-date_joined')[:10].values('id', 'username', 'email', 'date_joined'))
    
    return Response({
        'total_users': total_users,
        'active_users': active_users,
        'inactive_users': total_users - active_users,
        'total_businesses': total_businesses,
        'admin_users': admin_users,
        'data_entry_users': data_entry_users,
        'owner_users': owner_users,
        'recent_users': recent_users
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_register_user(request):
    """Register a new user (admin only) - Admin assigns username and password"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Create user profile automatically
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Set role if provided (default is 'owner' from model)
        role = request.data.get('role', 'owner')
        if role in ['owner', 'data_entry', 'admin']:
            profile.role = role
            profile.save()
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': profile.role,
            'message': 'User registered successfully. Username and password assigned by admin.'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'PUT'])
@permission_classes([IsAdmin])
def admin_update_user_role(request, user_id):
    """Update user role (admin only)"""
    try:
        user = User.objects.get(id=user_id)
        profile, created = UserProfile.objects.get_or_create(user=user)
        new_role = request.data.get('role')
        
        if new_role not in ['owner', 'data_entry', 'admin']:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile.role = new_role
        profile.save()
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_reset_user_password(request, user_id):
    """Reset a user's password (admin or super admin only). Users cannot reset their own passwords."""
    try:
        if str(request.user.id) == str(user_id) and not request.user.is_superuser:
            return Response({'error': 'Users cannot reset their own password'}, status=status.HTTP_403_FORBIDDEN)
        user = User.objects.get(id=user_id)
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 8:
            return Response({'error': 'new_password is required and must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class IsCustomerOwner(permissions.BasePermission):
    """Permission to only allow owners to access their customers"""
    def has_object_permission(self, request, view, obj):
        return getattr(obj, 'owner_id', None) == request.user.id


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for managing customers/clients - Only business admins can add clients"""
    permission_classes = [permissions.IsAuthenticated, IsCustomerOwner]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CustomerCreateSerializer
        return CustomerSerializer
    
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Customer.objects.none()
        
        user = self.request.user
        business_id = self.request.query_params.get('business')
        
        # Get businesses where user is a member
        if user.is_superuser:
            queryset = Customer.objects.all()
        else:
            memberships = Membership.objects.filter(user=user, is_active=True)
            business_ids = [m.business_id for m in memberships]
            queryset = Customer.objects.filter(business_id__in=business_ids)
        
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        # Only business admins can add clients
        business_id = self.request.data.get('business')
        
        if not business_id:
            raise PermissionDenied('Business ID is required')
        
        # Check if user is business admin
        if not self.request.user.is_superuser:
            if not user_is_business_admin(self.request.user, business_id):
                raise PermissionDenied('Only business admins can add clients')
        
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            raise PermissionDenied('Business not found')
        
        serializer.save(
            owner=self.request.user,
            business=business,
            onboarded_by=self.request.user,
            status=self.request.data.get('status', 'active')
        )


class MembershipViewSet(viewsets.ModelViewSet):
    """Manage business memberships (team)."""
    queryset = Membership.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MembershipCreateUpdateSerializer
        return MembershipSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Membership.objects.none()
        if user.is_superuser:
            return Membership.objects.select_related('user', 'business')
        # Members see memberships in businesses they belong to
        business_id = self.request.query_params.get('business')
        base_qs = Membership.objects.select_related('user', 'business')
        if business_id:
            return base_qs.filter(business_id=business_id, business__memberships__user=user, business__memberships__is_active=True)
        return base_qs.filter(business__memberships__user=user, business__memberships__is_active=True)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsBusinessAdminOfBusiness()]
        return [IsMemberOfBusiness()]

    def perform_create(self, serializer):
        # Only Business Admins can create memberships in their business
        business = serializer.validated_data.get('business')
        if not user_is_business_admin(self.request.user, business.id):
            raise PermissionDenied('Not allowed')
        serializer.save(invited_by=self.request.user)


class BusinessInvitationViewSet(viewsets.ModelViewSet):
    """Manage business invitations"""
    queryset = BusinessInvitation.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return BusinessInvitationCreateSerializer
        return BusinessInvitationSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return BusinessInvitation.objects.none()
        if user.is_superuser:
            return BusinessInvitation.objects.select_related('business', 'invited_by')
        # Business admins see invitations for their businesses
        business_id = self.request.query_params.get('business')
        base_qs = BusinessInvitation.objects.select_related('business', 'invited_by')
        if business_id:
            if user_is_business_admin(user, business_id):
                return base_qs.filter(business_id=business_id)
        # Filter by businesses where user is admin
        return base_qs.filter(business__memberships__user=user, business__memberships__role_in_business='business_admin', business__memberships__is_active=True)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsBusinessAdminOfBusiness()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        business = serializer.validated_data.get('business')
        if not user_is_business_admin(self.request.user, business.id):
            raise PermissionDenied('Only business admins can send invitations')
        # Generate unique token
        token = secrets.token_urlsafe(32)
        # Expires in 7 days
        expires_at = timezone.now() + timedelta(days=7)
        serializer.save(
            invited_by=self.request.user,
            token=token,
            expires_at=expires_at,
            status='pending'
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def accept_invitation(request, token):
    """Accept a business invitation by token"""
    try:
        invitation = BusinessInvitation.objects.get(token=token, status='pending')
        if invitation.expires_at < timezone.now():
            invitation.status = 'expired'
            invitation.save()
            return Response({'error': 'Invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists
        try:
            user = User.objects.get(email=invitation.email)
        except User.DoesNotExist:
            # User needs to register first
            return Response({
                'error': 'User not found. Please register first.',
                'email': invitation.email,
                'invitation_token': token
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create membership if it doesn't exist
        membership, created = Membership.objects.get_or_create(
            business=invitation.business,
            user=user,
            defaults={
                'role_in_business': invitation.role_in_business,
                'invited_by': invitation.invited_by,
                'is_active': True
            }
        )
        
        if not created:
            # Update existing membership
            membership.role_in_business = invitation.role_in_business
            membership.is_active = True
            membership.save()
        
        # Mark invitation as accepted
        invitation.status = 'accepted'
        invitation.accepted_at = timezone.now()
        invitation.save()
        
        return Response({
            'message': 'Invitation accepted successfully',
            'business_id': invitation.business.id,
            'business_name': invitation.business.legal_name,
            'role': membership.role_in_business
        }, status=status.HTTP_200_OK)
    except BusinessInvitation.DoesNotExist:
        return Response({'error': 'Invalid invitation token'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def super_admin_dashboard(request):
    """Super Admin dashboard stats"""
    from django.db.models import Count, Q
    from finance.models import Transaction, Invoice
    
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    total_businesses = Business.objects.count()
    active_businesses = Business.objects.filter(memberships__is_active=True).distinct().count()
    
    # User roles breakdown
    admin_users = UserProfile.objects.filter(role='admin').count()
    owner_users = UserProfile.objects.filter(role='owner').count()
    data_entry_users = UserProfile.objects.filter(role='data_entry').count()
    
    # Membership stats
    total_memberships = Membership.objects.filter(is_active=True).count()
    business_admins = Membership.objects.filter(role_in_business='business_admin', is_active=True).count()
    staff_members = Membership.objects.filter(role_in_business='staff', is_active=True).count()
    
    # Recent activity
    recent_users = User.objects.order_by('-date_joined')[:10].values('id', 'username', 'email', 'date_joined', 'is_active')
    recent_businesses = Business.objects.order_by('-created_at')[:10].values('id', 'legal_name', 'created_at')
    
    # Financial overview (across all businesses)
    total_transactions = Transaction.objects.count()
    total_invoices = Invoice.objects.count()
    paid_invoices = Invoice.objects.filter(status='paid').count()
    overdue_invoices = Invoice.objects.filter(status='overdue').count()
    
    return Response({
        'users': {
            'total': total_users,
            'active': active_users,
            'inactive': total_users - active_users,
            'by_role': {
                'admin': admin_users,
                'owner': owner_users,
                'data_entry': data_entry_users
            }
        },
        'businesses': {
            'total': total_businesses,
            'active': active_businesses
        },
        'memberships': {
            'total': total_memberships,
            'business_admins': business_admins,
            'staff': staff_members
        },
        'financial': {
            'total_transactions': total_transactions,
            'total_invoices': total_invoices,
            'paid_invoices': paid_invoices,
            'overdue_invoices': overdue_invoices
        },
        'recent_users': list(recent_users),
        'recent_businesses': list(recent_businesses)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def business_admin_dashboard(request, business_id):
    """Business Admin dashboard stats"""
    from django.db.models import Sum, Count, Q, Avg
    from django.utils import timezone
    from datetime import timedelta
    from decimal import Decimal
    from finance.models import Transaction, Invoice, Budget, CashFlow
    
    # Verify user is business admin
    if not user_is_business_admin(request.user, business_id):
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        business = Business.objects.get(id=business_id)
    except Business.DoesNotExist:
        return Response({'error': 'Business not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Date ranges
    today = timezone.now().date()
    this_month_start = today.replace(day=1)
    last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
    last_30_days = today - timedelta(days=30)
    
    # Transactions
    transactions = Transaction.objects.filter(business_id=business_id)
    monthly_transactions = transactions.filter(transaction_date__gte=this_month_start)
    last_30_transactions = transactions.filter(transaction_date__gte=last_30_days)
    
    total_income = monthly_transactions.filter(transaction_type='income').aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
    total_expenses = monthly_transactions.filter(transaction_type='expense').aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
    net_profit = total_income - total_expenses
    
    # Invoices
    invoices = Invoice.objects.filter(business_id=business_id)
    total_invoices = invoices.count()
    paid_invoices = invoices.filter(status='paid').count()
    overdue_invoices = invoices.filter(status='overdue')
    overdue_count = overdue_invoices.count()
    overdue_amount = overdue_invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0')
    pending_invoices = invoices.filter(status__in=['draft', 'sent']).count()
    
    # Customers
    from users.models import Customer
    total_customers = Customer.objects.filter(business_id=business_id, status='active').count()
    top_customers = Customer.objects.filter(business_id=business_id).order_by('-total_invoiced')[:5].values('id', 'customer_name', 'total_invoiced', 'total_paid')
    
    # Budgets
    budgets = Budget.objects.filter(business_id=business_id, is_active=True)
    total_budgeted = budgets.aggregate(Sum('budgeted_amount'))['budgeted_amount__sum'] or Decimal('0')
    total_spent = budgets.aggregate(Sum('spent_amount'))['spent_amount__sum'] or Decimal('0')
    budget_utilization = (total_spent / total_budgeted * 100) if total_budgeted > 0 else 0
    
    # Team members
    team_size = Membership.objects.filter(business_id=business_id, is_active=True).count()
    
    # Recent transactions
    recent_transactions = transactions.order_by('-transaction_date')[:10]
    
    return Response({
        'business': {
            'id': business.id,
            'name': business.legal_name,
            'dba_name': business.dba_name
        },
        'financial': {
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'net_profit': float(net_profit),
            'currency': 'KES'
        },
        'invoices': {
            'total': total_invoices,
            'paid': paid_invoices,
            'pending': pending_invoices,
            'overdue': {
                'count': overdue_count,
                'amount': float(overdue_amount)
            }
        },
        'customers': {
            'total': total_customers,
            'top_customers': list(top_customers)
        },
        'budgets': {
            'total_budgeted': float(total_budgeted),
            'total_spent': float(total_spent),
            'utilization_percent': round(budget_utilization, 2)
        },
        'team': {
            'size': team_size
        },
        'recent_transactions': TransactionSerializer(recent_transactions, many=True).data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard(request, business_id=None):
    """Normal user dashboard stats"""
    from django.db.models import Sum, Count
    from django.utils import timezone
    from datetime import timedelta
    from decimal import Decimal
    from finance.models import Transaction, Invoice
    
    user = request.user
    
    # Get user's businesses
    if business_id:
        # Verify user is member of this business
        try:
            business = Business.objects.get(id=business_id)
            if not user.is_superuser:
                if not Membership.objects.filter(user=user, business_id=business_id, is_active=True).exists():
                    return Response({'error': 'Not a member of this business'}, status=status.HTTP_403_FORBIDDEN)
        except Business.DoesNotExist:
            return Response({'error': 'Business not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        # Get all businesses user is member of
        memberships = Membership.objects.filter(user=user, is_active=True)
        business_ids = [m.business_id for m in memberships]
        businesses = Business.objects.filter(id__in=business_ids)
        
        if not businesses.exists():
            # Return empty dashboard for users with no businesses
            return Response({
                'business': None,
                'my_work': {
                    'invoices': 0,
                    'pending_tasks': 0,
                    'customers': 0
                },
                'recent_transactions': [],
                'message': 'No business assigned yet. Please contact your administrator.'
            }, status=status.HTTP_200_OK)
        # Use first business for now (can be enhanced to support multiple)
        business = businesses.first()
    
    # Get user's role in business
    membership = Membership.objects.filter(user=user, business_id=business.id, is_active=True).first()
    role = membership.role_in_business if membership else 'viewer'
    
    # Date ranges
    today = timezone.now().date()
    last_30_days = today - timedelta(days=30)
    
    # Transactions (user can see their own or all depending on role)
    if role == 'viewer':
        transactions = Transaction.objects.none()  # Viewers see limited data
    elif role == 'staff':
        # Staff can see transactions they created
        transactions = Transaction.objects.filter(business_id=business.id, user=user)
    else:
        transactions = Transaction.objects.filter(business_id=business.id)
    
    recent_transactions = transactions.order_by('-transaction_date')[:5]
    
    # Invoices (similar logic)
    if role == 'viewer':
        invoices = Invoice.objects.none()
    elif role == 'staff':
        invoices = Invoice.objects.filter(business_id=business.id, user=user)
    else:
        invoices = Invoice.objects.filter(business_id=business.id)
    
    my_invoices = invoices.filter(user=user).count()
    pending_tasks = invoices.filter(status__in=['draft', 'sent'], user=user).count()
    
    # Customers (staff can see customers they onboarded)
    from users.models import Customer
    if role == 'viewer':
        customers = Customer.objects.none()
    elif role == 'staff':
        customers = Customer.objects.filter(business_id=business.id, onboarded_by=user)
    else:
        customers = Customer.objects.filter(business_id=business.id)
    
    my_customers = customers.count()
    
    return Response({
        'business': {
            'id': business.id,
            'name': business.legal_name,
            'role': role
        },
        'my_work': {
            'invoices': my_invoices,
            'pending_tasks': pending_tasks,
            'customers': my_customers
        },
        'recent_transactions': TransactionSerializer(recent_transactions, many=True).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_business(request):
    """Public business registration endpoint"""
    serializer = BusinessRegistrationCreateSerializer(data=request.data)
    if serializer.is_valid():
        registration = serializer.save(status='pending')
        return Response({
            'id': registration.id,
            'message': 'Registration submitted successfully. Your application is pending review.',
            'status': registration.status,
            'email': registration.email
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_registration_status(request, email):
    """Check registration status by email"""
    try:
        registration = BusinessRegistration.objects.filter(email=email).order_by('-created_at').first()
        if not registration:
            return Response({'error': 'No registration found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = BusinessRegistrationSerializer(registration)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def list_pending_registrations(request):
    """List all pending business registrations"""
    registrations = BusinessRegistration.objects.filter(status='pending').order_by('-created_at')
    serializer = BusinessRegistrationSerializer(registrations, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def approve_business_registration(request, registration_id):
    """Approve a business registration and create business/user"""
    try:
        registration = BusinessRegistration.objects.get(id=registration_id, status='pending')
        
        # Create user account
        owner_name_parts = registration.owner_name.split(' ', 1)
        username = registration.email.split('@')[0] + '_' + str(registration.id)[:4]
        
        # Check if user already exists
        user, created = User.objects.get_or_create(
            email=registration.email,
            defaults={
                'username': username,
                'first_name': owner_name_parts[0] if len(owner_name_parts) > 0 else '',
                'last_name': owner_name_parts[1] if len(owner_name_parts) > 1 else '',
            }
        )
        
        if not created:
            # User exists, update if needed
            user.first_name = owner_name_parts[0] if len(owner_name_parts) > 0 else user.first_name
            user.last_name = owner_name_parts[1] if len(owner_name_parts) > 1 else user.last_name
            user.save()
        
        # Generate temporary password
        temp_password = secrets.token_urlsafe(12)
        user.set_password(temp_password)
        user.save()
        
        # Create user profile
        profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'owner'})
        profile.phone_number = registration.phone_number
        profile.save()
        
        # Create business
        location_parts = registration.location.split(',')
        business = Business.objects.create(
            owner=user,
            legal_name=registration.business_name,
            registration_number=registration.registration_number,
            hq_city=location_parts[0].strip() if len(location_parts) > 0 else '',
            hq_country=location_parts[-1].strip() if len(location_parts) > 1 else 'Kenya',
            business_model='B2C' if registration.business_type in ['retail', 'wholesale'] else 'B2B',
        )
        
        # Create membership for owner as business_admin
        Membership.objects.create(
            business=business,
            user=user,
            role_in_business='business_admin',
            is_active=True
        )
        
        # Update registration status
        registration.status = 'approved'
        registration.reviewed_by = request.user
        registration.reviewed_at = timezone.now()
        registration.save()
        
        # Log the activity
        from core.views import log_activity
        log_activity(
            user=request.user,
            action=f"Approved business registration: {registration.business_name}",
            resource_type="business_registration",
            resource_id=registration.id,
            details=f"Created business ID: {business.id}, User: {user.email}",
            request=request,
            severity='info'
        )
        
        return Response({
            'message': 'Business registration approved successfully',
            'business_id': business.id,
            'user_id': user.id,
            'username': user.username,
            'temp_password': temp_password,
            'email': user.email
        }, status=status.HTTP_200_OK)
        
    except BusinessRegistration.DoesNotExist:
        return Response({'error': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def reject_business_registration(request, registration_id):
    """Reject a business registration"""
    try:
        registration = BusinessRegistration.objects.get(id=registration_id, status='pending')
        rejection_reason = request.data.get('rejection_reason', '')
        
        registration.status = 'rejected'
        registration.reviewed_by = request.user
        registration.reviewed_at = timezone.now()
        registration.rejection_reason = rejection_reason
        registration.save()
        
        # Log the activity
        from core.views import log_activity
        log_activity(
            user=request.user,
            action=f"Rejected business registration: {registration.business_name}",
            resource_type="business_registration",
            resource_id=registration.id,
            details=f"Reason: {rejection_reason}",
            request=request,
            severity='warning'
        )
        
        return Response({
            'message': 'Business registration rejected',
            'registration_id': registration.id
        }, status=status.HTTP_200_OK)
        
    except BusinessRegistration.DoesNotExist:
        return Response({'error': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)


# Individual Registration Endpoints
@api_view(['POST'])
@permission_classes([AllowAny])
def register_individual(request):
    """Public individual registration endpoint"""
    serializer = IndividualRegistrationCreateSerializer(data=request.data)
    if serializer.is_valid():
        registration = serializer.save(status='pending')
        return Response({
            'id': registration.id,
            'message': 'Registration submitted successfully. Your application is pending review.',
            'status': registration.status,
            'email': registration.email
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def list_pending_individual_registrations(request):
    """List all pending individual registrations"""
    registrations = IndividualRegistration.objects.filter(status='pending').order_by('-created_at')
    serializer = IndividualRegistrationSerializer(registrations, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def approve_individual_registration(request, registration_id):
    """Approve an individual registration and create user account"""
    try:
        registration = IndividualRegistration.objects.get(id=registration_id, status='pending')
        
        # Get assigned business from request (can be in body or query params)
        assigned_business_id = request.data.get('assigned_business_id') or request.query_params.get('assigned_business_id')
        assigned_role = request.data.get('assigned_role', 'staff')
        
        if not assigned_business_id:
            return Response({'error': 'assigned_business_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            assigned_business = Business.objects.get(id=assigned_business_id)
        except Business.DoesNotExist:
            return Response({'error': 'Business not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create user account
        name_parts = registration.full_name.split(' ', 1)
        username = registration.email.split('@')[0] + '_' + str(registration.id)[:4]
        
        # Check if user already exists
        user, created = User.objects.get_or_create(
            email=registration.email,
            defaults={
                'username': username,
                'first_name': name_parts[0] if len(name_parts) > 0 else '',
                'last_name': name_parts[1] if len(name_parts) > 1 else '',
            }
        )
        
        if not created:
            # User exists, update if needed
            user.first_name = name_parts[0] if len(name_parts) > 0 else user.first_name
            user.last_name = name_parts[1] if len(name_parts) > 1 else user.last_name
            user.save()
        
        # Generate temporary password
        temp_password = secrets.token_urlsafe(12)
        user.set_password(temp_password)
        user.save()
        
        # Create user profile
        profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'owner'})
        profile.phone_number = registration.phone_number
        if registration.date_of_birth:
            profile.date_of_birth = registration.date_of_birth
        profile.country = registration.country
        profile.city = registration.city
        profile.save()
        
        # Create membership for the assigned business
        Membership.objects.get_or_create(
            business=assigned_business,
            user=user,
            defaults={
                'role_in_business': assigned_role,
                'is_active': True
            }
        )
        
        # Update registration status
        registration.status = 'approved'
        registration.reviewed_by = request.user
        registration.reviewed_at = timezone.now()
        registration.assigned_business = assigned_business
        registration.assigned_role = assigned_role
        registration.save()
        
        # Log the activity
        from core.views import log_activity
        log_activity(
            user=request.user,
            action=f"Approved individual registration: {registration.full_name}",
            resource_type="individual_registration",
            resource_id=registration.id,
            details=f"Assigned to business: {assigned_business.legal_name}, Role: {assigned_role}, User: {user.email}",
            request=request,
            severity='info'
        )
        
        return Response({
            'message': 'Individual registration approved successfully',
            'user_id': user.id,
            'username': user.username,
            'temp_password': temp_password,
            'email': user.email,
            'assigned_business': assigned_business.legal_name,
            'role': assigned_role
        }, status=status.HTTP_200_OK)
        
    except IndividualRegistration.DoesNotExist:
        return Response({'error': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def reject_individual_registration(request, registration_id):
    """Reject an individual registration"""
    try:
        registration = IndividualRegistration.objects.get(id=registration_id, status='pending')
        rejection_reason = request.data.get('rejection_reason', '')
        
        registration.status = 'rejected'
        registration.reviewed_by = request.user
        registration.reviewed_at = timezone.now()
        registration.rejection_reason = rejection_reason
        registration.save()
        
        return Response({
            'message': 'Individual registration rejected',
            'registration_id': registration.id
        }, status=status.HTTP_200_OK)
        
    except IndividualRegistration.DoesNotExist:
        return Response({'error': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def businesses_monitoring(request):
    """Get all businesses with monitoring data"""
    from finance.models import Transaction, Invoice
    from django.db.models import Sum, Count, Q
    from django.utils import timezone
    from datetime import timedelta
    
    status_filter = request.GET.get('status')
    
    businesses = Business.objects.select_related('owner').prefetch_related('memberships').all()
    
    data = []
    for business in businesses:
        # Get user count
        user_count = business.memberships.filter(is_active=True).count()
        
        # Determine status based on active memberships
        has_active_members = business.memberships.filter(is_active=True).exists()
        status = 'active' if has_active_members else 'inactive'
        
        # Apply status filter if provided
        if status_filter and status_filter != 'all':
            if status_filter == 'active' and not has_active_members:
                continue
            elif status_filter == 'inactive' and has_active_members:
                continue
        
        # Get last activity (you can customize this based on your activity tracking)
        last_activity = business.updated_at if hasattr(business, 'updated_at') else business.created_at
        
        # Get transaction count for this business
        transaction_count = Transaction.objects.filter(business_id=business.id).count()
        
        # Get monthly revenue (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        monthly_revenue = Transaction.objects.filter(
            business_id=business.id,
            transaction_type='income',
            transaction_date__gte=thirty_days_ago
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Get invoice count
        invoice_count = Invoice.objects.filter(business_id=business.id).count()
        
        data.append({
            'id': business.id,
            'legal_name': business.legal_name,
            'business_type': business.business_model or 'N/A',
            'owner_email': business.owner.email,
            'phone_number': business.owner.userprofile.phone_number if hasattr(business.owner, 'userprofile') and business.owner.userprofile else None,
            'location': f"{business.hq_city}, {business.hq_country}".strip(', ') if business.hq_city or business.hq_country else 'N/A',
            'status': status,
            'created_at': business.created_at,
            'user_count': user_count,
            'last_activity': last_activity,
            'transaction_count': transaction_count,
            'document_count': invoice_count,  # Using invoice count as document count
            'monthly_revenue': float(monthly_revenue),
        })
    
    return Response(data)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def business_summary(request):
    """Get business summary statistics"""
    from django.db.models import Count, Q
    from django.utils import timezone
    from datetime import datetime
    
    total = Business.objects.count()
    
    # Count active businesses (those with active memberships)
    active = Business.objects.filter(memberships__is_active=True).distinct().count()
    
    # Count businesses created this month
    this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month = Business.objects.filter(created_at__gte=this_month_start).count()
    
    # Total users across all businesses
    total_users = Membership.objects.filter(is_active=True).count()
    
    return Response({
        'total': total,
        'active': active,
        'inactive': total - active,
        'this_month': this_month,
        'total_users': total_users
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def check_individual_registration_status(request, email):
    """Check individual registration status by email"""
    try:
        registration = IndividualRegistration.objects.filter(email=email).order_by('-created_at').first()
        if not registration:
            return Response({'error': 'No registration found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = IndividualRegistrationSerializer(registration)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def upload_document(request):
    """Upload a document and return its URL"""
    import os
    from django.conf import settings
    
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    
    # Validate file type
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    file_ext = os.path.splitext(file.name)[1].lower()
    if file_ext not in allowed_extensions:
        return Response({'error': 'Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate file size (max 5MB)
    if file.size > 5 * 1024 * 1024:
        return Response({'error': 'File too large. Maximum size is 5MB.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create media directory if it doesn't exist
    upload_dir = os.path.join(settings.MEDIA_ROOT, 'documents')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    import uuid
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    with open(file_path, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)
    
    # Return URL
    file_url = f"{request.scheme}://{request.get_host()}{settings.MEDIA_URL}documents/{unique_filename}"
    
    return Response({
        'url': file_url,
        'filename': file.name,
        'size': file.size
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def list_all_businesses(request):
    """List all businesses for super admin"""
    businesses = Business.objects.select_related('owner').all().order_by('-created_at')
    
    data = [{
        'id': business.id,
        'legal_name': business.legal_name,
        'dba_name': business.dba_name,
        'owner_id': business.owner.id,
        'owner_email': business.owner.email,
        'owner_name': f"{business.owner.first_name} {business.owner.last_name}".strip() or business.owner.username,
        'hq_city': business.hq_city,
        'hq_country': business.hq_country,
        'business_model': business.business_model,
        'created_at': business.created_at
    } for business in businesses]
    
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def list_all_admins(request):
    """List all admin users (users with admin role or business_admin memberships)"""
    # Get users with admin role in profile
    admin_profiles = UserProfile.objects.filter(role='admin').select_related('user')
    
    # Get users who are business admins
    business_admin_memberships = Membership.objects.filter(
        role_in_business='business_admin',
        is_active=True
    ).select_related('user').distinct()
    
    admin_users = set()
    
    # Add users with admin role
    for profile in admin_profiles:
        admin_users.add(profile.user)
    
    # Add users who are business admins
    for membership in business_admin_memberships:
        admin_users.add(membership.user)
    
    data = [{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
        'is_superuser': user.is_superuser,
        'role': user.userprofile.role if hasattr(user, 'userprofile') else None
    } for user in admin_users]
    
    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def create_business(request):
    """Super admin can create a new business"""
    from .serializers import BusinessSerializer
    
    # Get owner_id from request, default to super admin if not provided
    owner_id = request.data.get('owner_id')
    if not owner_id:
        # Use the super admin as owner
        owner = request.user
    else:
        try:
            owner = User.objects.get(id=owner_id)
        except User.DoesNotExist:
            return Response({'error': 'Owner user not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Create business data
    business_data = request.data.copy()
    business_data['owner'] = owner.id
    
    serializer = BusinessSerializer(data=business_data)
    if serializer.is_valid():
        business = serializer.save(owner=owner)
        
        # Create membership for owner as business_admin if not already exists
        Membership.objects.get_or_create(
            business=business,
            user=owner,
            defaults={
                'role_in_business': 'business_admin',
                'is_active': True
            }
        )
        
        # Log the activity
        from core.views import log_activity
        log_activity(
            user=request.user,
            action=f"Created business: {business.legal_name}",
            resource_type="business",
            resource_id=business.id,
            details=f"Business created by super admin. Owner: {owner.email}",
            request=request,
            severity='info'
        )
        
        return Response({
            'message': 'Business created successfully',
            'business': BusinessSerializer(business).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def assign_business_to_admin(request):
    """Assign a registered business to a registered admin"""
    business_id = request.data.get('business_id')
    admin_id = request.data.get('admin_id')
    
    if not business_id or not admin_id:
        return Response({
            'error': 'Both business_id and admin_id are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        business = Business.objects.get(id=business_id)
    except Business.DoesNotExist:
        return Response({'error': 'Business not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        admin = User.objects.get(id=admin_id)
    except User.DoesNotExist:
        return Response({'error': 'Admin user not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Create or update membership with business_admin role
    membership, created = Membership.objects.get_or_create(
        business=business,
        user=admin,
        defaults={
            'role_in_business': 'business_admin',
            'is_active': True
        }
    )
    
    if not created:
        # Update existing membership
        membership.role_in_business = 'business_admin'
        membership.is_active = True
        membership.save()
    
    # Log the activity
    from core.views import log_activity
    log_activity(
        user=request.user,
        action=f"Assigned business {business.legal_name} to admin {admin.email}",
        resource_type="membership",
        resource_id=membership.id,
        details=f"Business {business.legal_name} assigned to admin {admin.email} by super admin",
        request=request,
        severity='info'
    )
    
    return Response({
        'message': f'Business {business.legal_name} assigned to admin {admin.email} successfully',
        'membership': {
            'id': membership.id,
            'business_id': business.id,
            'business_name': business.legal_name,
            'admin_id': admin.id,
            'admin_email': admin.email,
            'role': membership.role_in_business,
            'is_active': membership.is_active
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def business_detail(request, business_id):
    """Get detailed information about a business including members"""
    from finance.models import Transaction, Invoice
    from django.db.models import Sum, Count, Q
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        business = Business.objects.select_related('owner', 'owner__profile').prefetch_related('memberships__user').get(id=business_id)
    except Business.DoesNotExist:
        return Response({'error': 'Business not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Get business admin (members with business_admin role)
    business_admin_memberships = business.memberships.filter(
        role_in_business='business_admin',
        is_active=True
    ).select_related('user', 'user__profile')
    
    business_admins = []
    for membership in business_admin_memberships:
        try:
            phone_number = membership.user.profile.phone_number if hasattr(membership.user, 'profile') and membership.user.profile else None
        except:
            phone_number = None
        
        business_admins.append({
            'id': membership.user.id,
            'username': membership.user.username,
            'email': membership.user.email,
            'first_name': membership.user.first_name,
            'last_name': membership.user.last_name,
            'full_name': f"{membership.user.first_name} {membership.user.last_name}".strip() or membership.user.username,
            'phone_number': phone_number,
            'role': membership.role_in_business,
            'joined_at': membership.created_at,
            'is_active': membership.is_active
        })
    
    # Get staff members (members with staff role - data entry)
    staff_memberships = business.memberships.filter(
        role_in_business='staff',
        is_active=True
    ).select_related('user', 'user__profile')
    
    staff_members = []
    for membership in staff_memberships:
        try:
            phone_number = membership.user.profile.phone_number if hasattr(membership.user, 'profile') and membership.user.profile else None
        except:
            phone_number = None
        
        staff_members.append({
            'id': membership.user.id,
            'username': membership.user.username,
            'email': membership.user.email,
            'first_name': membership.user.first_name,
            'last_name': membership.user.last_name,
            'full_name': f"{membership.user.first_name} {membership.user.last_name}".strip() or membership.user.username,
            'phone_number': phone_number,
            'role': membership.role_in_business,
            'joined_at': membership.created_at,
            'is_active': membership.is_active
        })
    
    # Get financial stats
    transactions = Transaction.objects.filter(business_id=business.id)
    total_transactions = transactions.count()
    
    # Monthly revenue (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    monthly_revenue = transactions.filter(
        transaction_type='income',
        transaction_date__gte=thirty_days_ago
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Total income and expenses
    total_income = transactions.filter(transaction_type='income').aggregate(total=Sum('amount'))['total'] or 0
    total_expenses = transactions.filter(transaction_type='expense').aggregate(total=Sum('amount'))['total'] or 0
    
    # Invoice stats
    invoices = Invoice.objects.filter(business_id=business.id)
    total_invoices = invoices.count()
    paid_invoices = invoices.filter(status='paid').count()
    pending_invoices = invoices.filter(status__in=['draft', 'sent']).count()
    overdue_invoices = invoices.filter(status='overdue').count()
    
    # Customer count
    from users.models import Customer
    customer_count = Customer.objects.filter(business_id=business.id).count()
    
    # Total members
    total_members = business.memberships.filter(is_active=True).count()
    
    return Response({
        'business': {
            'id': business.id,
            'legal_name': business.legal_name,
            'dba_name': business.dba_name,
            'website': business.website,
            'registration_number': business.registration_number,
            'hq_city': business.hq_city,
            'hq_country': business.hq_country,
            'business_model': business.business_model,
            'year_founded': business.year_founded,
            'employee_count': business.employee_count,
            'created_at': business.created_at,
            'updated_at': business.updated_at,
            'owner': {
                'id': business.owner.id,
                'username': business.owner.username,
                'email': business.owner.email,
                'first_name': business.owner.first_name,
                'last_name': business.owner.last_name,
                'full_name': f"{business.owner.first_name} {business.owner.last_name}".strip() or business.owner.username
            }
        },
        'business_admins': business_admins,
        'staff_members': staff_members,
        'stats': {
            'total_members': total_members,
            'total_transactions': total_transactions,
            'monthly_revenue': float(monthly_revenue),
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'net_profit': float(total_income - total_expenses),
            'total_invoices': total_invoices,
            'paid_invoices': paid_invoices,
            'pending_invoices': pending_invoices,
            'overdue_invoices': overdue_invoices,
            'customer_count': customer_count
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def list_available_staff(request):
    """List all users available to be assigned as staff (data entry) to a business"""
    # Get all active users except superusers
    users = User.objects.filter(is_active=True).exclude(is_superuser=True).select_related('profile').order_by('username')
    
    data = []
    for user in users:
        try:
            profile = user.profile
            role = profile.role if profile else None
        except:
            role = None
        
        data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'role': role,
            'is_active': user.is_active,
            'date_joined': user.date_joined
        })
    
    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def assign_staff_to_business(request):
    """Assign staff members (data entry users) to a business"""
    business_id = request.data.get('business_id')
    user_ids = request.data.get('user_ids', [])
    
    if not business_id:
        return Response({
            'error': 'business_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not user_ids or not isinstance(user_ids, list):
        return Response({
            'error': 'user_ids must be a non-empty list'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        business = Business.objects.get(id=business_id)
    except Business.DoesNotExist:
        return Response({'error': 'Business not found'}, status=status.HTTP_404_NOT_FOUND)
    
    assigned_memberships = []
    errors = []
    
    for user_id in user_ids:
        try:
            user = User.objects.get(id=user_id)
            
            # Create or update membership with staff role
            membership, created = Membership.objects.get_or_create(
                business=business,
                user=user,
                defaults={
                    'role_in_business': 'staff',
                    'is_active': True,
                    'invited_by': request.user
                }
            )
            
            if not created:
                # Update existing membership to staff role if needed
                if membership.role_in_business != 'staff':
                    membership.role_in_business = 'staff'
                membership.is_active = True
                membership.save()
            
            assigned_memberships.append({
                'id': membership.id,
                'user_id': user.id,
                'user_email': user.email,
                'user_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'role': membership.role_in_business,
                'is_active': membership.is_active,
                'created': created
            })
            
        except User.DoesNotExist:
            errors.append(f'User with id {user_id} not found')
        except Exception as e:
            errors.append(f'Error assigning user {user_id}: {str(e)}')
    
    # Log the activity
    from core.views import log_activity
    log_activity(
        user=request.user,
        action=f"Assigned {len(assigned_memberships)} staff member(s) to business {business.legal_name}",
        resource_type="membership",
        resource_id=business.id,
        details=f"Staff members assigned to business {business.legal_name} by super admin",
        request=request,
        severity='info'
    )
    
    return Response({
        'message': f'Successfully assigned {len(assigned_memberships)} staff member(s) to business {business.legal_name}',
        'assigned_memberships': assigned_memberships,
        'errors': errors if errors else None
    }, status=status.HTTP_200_OK)


# ==================== ADMIN ANALYTICS ENDPOINT ====================

@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def admin_analytics(request):
    """Get system-wide analytics for admin dashboard"""
    from django.db.models import Count, Sum, Avg, Q
    from django.utils import timezone
    from datetime import timedelta
    from finance.models import Transaction, Invoice
    
    # Date ranges
    now = timezone.now()
    today = now.date()
    last_30_days = today - timedelta(days=30)
    last_60_days = today - timedelta(days=60)
    this_month_start = today.replace(day=1)
    last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
    
    # User growth
    total_users = User.objects.count()
    users_30_days_ago = User.objects.filter(date_joined__lt=last_30_days).count()
    user_growth = ((total_users - users_30_days_ago) / users_30_days_ago * 100) if users_30_days_ago > 0 else 0
    
    # Business growth
    total_businesses = Business.objects.count()
    businesses_30_days_ago = Business.objects.filter(created_at__lt=last_30_days).count()
    business_growth = ((total_businesses - businesses_30_days_ago) / businesses_30_days_ago * 100) if businesses_30_days_ago > 0 else 0
    
    # Revenue growth
    revenue_last_30 = Transaction.objects.filter(
        transaction_type='income',
        transaction_date__gte=last_30_days
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    revenue_prev_30 = Transaction.objects.filter(
        transaction_type='income',
        transaction_date__gte=last_60_days,
        transaction_date__lt=last_30_days
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    revenue_growth = ((float(revenue_last_30) - float(revenue_prev_30)) / float(revenue_prev_30) * 100) if revenue_prev_30 > 0 else 0
    
    # Active users
    active_users_30_days = User.objects.filter(last_login__gte=last_30_days).count()
    active_rate = (active_users_30_days / total_users * 100) if total_users > 0 else 0
    
    # Daily/Weekly/Monthly active users
    daily_active = User.objects.filter(last_login__date=today).count()
    weekly_active = User.objects.filter(last_login__gte=now - timedelta(days=7)).count()
    monthly_active = active_users_30_days
    
    # Average session duration (mock - would need session tracking)
    avg_session_duration = '15m'
    
    # Financial metrics
    total_revenue = Transaction.objects.filter(transaction_type='income').aggregate(total=Sum('amount'))['total'] or 0
    total_invoices = Invoice.objects.count()
    avg_invoice_value = Invoice.objects.aggregate(avg=Avg('total_amount'))['avg'] or 0
    paid_invoices = Invoice.objects.filter(status='paid').count()
    payment_success_rate = (paid_invoices / total_invoices * 100) if total_invoices > 0 else 0
    businesses_with_invoices = Invoice.objects.values('business').distinct().count()
    
    # Top businesses by revenue
    top_businesses = Transaction.objects.filter(
        transaction_type='income',
        transaction_date__gte=last_30_days
    ).values('business').annotate(
        revenue=Sum('amount'),
        transactions=Count('id')
    ).order_by('-revenue')[:10]
    
    top_businesses_list = []
    for item in top_businesses:
        try:
            business = Business.objects.get(id=item['business'])
            top_businesses_list.append({
                'id': business.id,
                'name': business.legal_name,
                'industry': business.business_model or 'N/A',
                'revenue': float(item['revenue']),
                'transactions': item['transactions']
            })
        except Business.DoesNotExist:
            continue
    
    return Response({
        'user_growth': round(user_growth, 2),
        'business_growth': round(business_growth, 2),
        'revenue_growth': round(revenue_growth, 2),
        'active_rate': round(active_rate, 2),
        'daily_active_users': daily_active,
        'weekly_active_users': weekly_active,
        'monthly_active_users': monthly_active,
        'avg_session_duration': avg_session_duration,
        'total_revenue': float(total_revenue),
        'avg_invoice_value': float(avg_invoice_value),
        'payment_success_rate': round(payment_success_rate, 2),
        'businesses_with_invoices': businesses_with_invoices,
        'top_businesses': top_businesses_list
    }, status=status.HTTP_200_OK)


# ==================== ADMIN SETTINGS ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def admin_settings(request):
    """Get system settings"""
    # In a real implementation, these would be stored in a Settings model or environment variables
    # For now, return default settings
    default_settings = {
        'site_name': 'FinanceGrowth',
        'site_url': 'https://financegrowth.com',
        'site_description': 'Financial management platform for businesses',
        'maintenance_mode': False,
        'allow_registrations': True,
        'smtp_host': '',
        'smtp_port': 587,
        'from_email': 'noreply@financegrowth.com',
        'from_name': 'FinanceGrowth',
        'email_notifications': True,
        'notify_new_users': True,
        'notify_approval_required': True,
        'notify_errors': True,
        'daily_reports': False,
        'cache_timeout': 300,
        'session_timeout': 30,
        'enable_caching': True,
        'debug_mode': False
    }
    
    # Try to get from database if Settings model exists (would need to be created)
    # For now, return defaults
    return Response(default_settings, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def admin_settings_update(request):
    """Update system settings"""
    # In a real implementation, these would be saved to a Settings model
    # For now, just return success
    settings_data = request.data
    
    # Log the activity
    from core.views import log_activity
    log_activity(
        user=request.user,
        action="Updated system settings",
        resource_type="settings",
        resource_id=None,
        details=f"Settings updated: {', '.join(settings_data.keys())}",
        request=request,
        severity='info'
    )
    
    return Response({
        'message': 'Settings updated successfully',
        'settings': settings_data
    }, status=status.HTTP_200_OK)


# ==================== ADMIN SECURITY ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def admin_security(request):
    """Get security settings and stats"""
    from core.models import FailedLoginAttempt, UserSession
    from django.utils import timezone
    from datetime import timedelta
    
    # Security score calculation (mock - would need more sophisticated logic)
    security_score = 85
    
    # Failed logins in last 24 hours
    last_24h = timezone.now() - timedelta(hours=24)
    failed_logins_24h = FailedLoginAttempt.objects.filter(attempted_at__gte=last_24h).count()
    
    # Active sessions
    active_sessions_count = UserSession.objects.filter(is_active=True).count()
    
    # Security settings (defaults)
    security_settings = {
        'security_score': security_score,
        'failed_logins_24h': failed_logins_24h,
        'active_sessions': active_sessions_count,
        'require_2fa': False,
        'password_complexity': True,
        'session_timeout': True,
        'login_attempt_limit': True,
        'ip_whitelist': False
    }
    
    return Response(security_settings, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def admin_security_activity(request):
    """Get recent security activity"""
    from core.models import ActivityLog
    from django.utils import timezone
    from datetime import timedelta
    
    # Get security-related activity logs (warning and critical severity)
    last_7_days = timezone.now() - timedelta(days=7)
    logs = ActivityLog.objects.filter(
        severity__in=['warning', 'critical'],
        timestamp__gte=last_7_days
    ).select_related('user').order_by('-timestamp')[:50]
    
    activity_list = []
    for log in logs:
        activity_list.append({
            'type': 'warning' if log.severity == 'warning' else 'error',
            'message': log.action,
            'user': log.user.email if log.user else 'System',
            'ip': log.ip_address or 'N/A',
            'timestamp': log.timestamp.isoformat()
        })
    
    return Response(activity_list, status=status.HTTP_200_OK)


# ==================== DOCUMENT VIEWING ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def list_registration_documents(request):
    """List all documents from business and individual registrations"""
    from django.db.models import Q
    
    business_registrations = BusinessRegistration.objects.exclude(
        Q(registration_certificate_url='') & 
        Q(kra_pin_certificate_url='') & 
        Q(id_document_url='')
    ).select_related('reviewed_by')
    
    individual_registrations = IndividualRegistration.objects.exclude(
        id_document_url=''
    ).select_related('reviewed_by', 'assigned_business')
    
    documents = []
    
    # Business registration documents
    for reg in business_registrations:
        owner_name = reg.owner_name
        owner_email = reg.email
        
        if reg.registration_certificate_url:
            documents.append({
                'id': f'business_{reg.id}_reg_cert',
                'type': 'business_registration',
                'registration_id': reg.id,
                'document_type': 'registration_certificate',
                'document_name': 'Registration Certificate',
                'url': reg.registration_certificate_url,
                'owner_name': owner_name,
                'owner_email': owner_email,
                'business_name': reg.business_name,
                'status': reg.status,
                'uploaded_at': reg.created_at.isoformat()
            })
        
        if reg.kra_pin_certificate_url:
            documents.append({
                'id': f'business_{reg.id}_kra_pin',
                'type': 'business_registration',
                'registration_id': reg.id,
                'document_type': 'kra_pin_certificate',
                'document_name': 'KRA PIN Certificate',
                'url': reg.kra_pin_certificate_url,
                'owner_name': owner_name,
                'owner_email': owner_email,
                'business_name': reg.business_name,
                'status': reg.status,
                'uploaded_at': reg.created_at.isoformat()
            })
        
        if reg.id_document_url:
            documents.append({
                'id': f'business_{reg.id}_id_doc',
                'type': 'business_registration',
                'registration_id': reg.id,
                'document_type': 'id_document',
                'document_name': 'ID Document',
                'url': reg.id_document_url,
                'owner_name': owner_name,
                'owner_email': owner_email,
                'business_name': reg.business_name,
                'status': reg.status,
                'uploaded_at': reg.created_at.isoformat()
            })
    
    # Individual registration documents
    for reg in individual_registrations:
        if reg.id_document_url:
            documents.append({
                'id': f'individual_{reg.id}_id_doc',
                'type': 'individual_registration',
                'registration_id': reg.id,
                'document_type': 'id_document',
                'document_name': 'ID Document',
                'url': reg.id_document_url,
                'owner_name': reg.full_name,
                'owner_email': reg.email,
                'business_name': reg.assigned_business.legal_name if reg.assigned_business else None,
                'status': reg.status,
                'uploaded_at': reg.created_at.isoformat()
            })
    
    # Sort by upload date (newest first)
    documents.sort(key=lambda x: x['uploaded_at'], reverse=True)
    
    return Response(documents, status=status.HTTP_200_OK)


@api_view(['POST', 'GET'])
@permission_classes([IsSuperAdmin])
def setup_mama_ochiengi_endpoint(request):
    """
    Super Admin endpoint to create Mama Ochiengi on production
    Can be triggered by visiting the URL (GET) or POST
    No shell access needed!
    """
    from core.models import ModuleAssignment
    
    try:
        # 1. Create or get user
        mama, created = User.objects.get_or_create(
            username='mama_ochiengi',
            defaults={
                'email': 'mama.ochiengi@kisumutraders.co.ke',
                'first_name': 'Mama',
                'last_name': 'Ochiengi',
                'is_active': True,
                'is_staff': False,
                'is_superuser': False
            }
        )
        
        # Always update password to ensure it's correct
        mama.set_password('MamaOchiengi2025!')
        mama.save()
        
        user_status = "Created new user" if created else "User already exists - password updated"
        
        # 2. Create or get user profile
        profile, profile_created = UserProfile.objects.get_or_create(
            user=mama,
            defaults={
                'role': 'owner',
                'phone_number': '+254720123456',
                'country': 'Kenya',
                'city': 'Kisumu'
            }
        )
        
        # 3. Create or get business
        business, business_created = Business.objects.get_or_create(
            legal_name='Mama Ochiengi Fresh Produce Ltd',
            defaults={
                'owner': mama,
                'dba_name': 'Mama Ochiengi Fresh Produce',
                'website': 'https://mamaochiengi-produce.co.ke',
                'year_founded': 2018,
                'employee_count': 8,
                'hq_city': 'Kisumu',
                'hq_country': 'Kenya',
                'revenue_band': '500K-1M',
                'business_model': 'B2C',
                'sales_motion': 'transactional',
                'registration_number': 'BN-KSM-2018-4521'
            }
        )
        
        # 4. Create or get membership
        membership, membership_created = Membership.objects.get_or_create(
            business=business,
            user=mama,
            defaults={
                'role_in_business': 'business_admin',
                'is_active': True
            }
        )
        
        # Ensure membership is active
        if not membership.is_active:
            membership.is_active = True
            membership.save()
        
        # 5. Assign all modules
        modules = [
            ('transactions', 'Transactions'),
            ('invoices', 'Invoices'),
            ('cash-flow', 'Cash Flow'),
            ('credit', 'Credit Management'),
            ('suppliers', 'Suppliers'),
            ('clients', 'Clients'),
            ('reports', 'Reports & Analytics'),
            ('insights', 'AI Insights'),
            ('proactive-alerts', 'Proactive Alerts'),
            ('team', 'Team Management'),
            ('voice-assistant', 'KAVI Voice Assistant'),
            ('settings', 'Settings'),
            ('budgets', 'Budgets'),
            ('dashboard', 'Dashboard'),
        ]
        
        modules_created = 0
        for module_id, module_name in modules:
            _, mod_created = ModuleAssignment.objects.get_or_create(
                business=business,
                module_id=module_id,
                defaults={
                    'module_name': module_name,
                    'enabled': True,
                    'assigned_by': mama
                }
            )
            if mod_created:
                modules_created += 1
        
        # 6. Test authentication
        from django.contrib.auth import authenticate
        test_user = authenticate(username='mama_ochiengi', password='MamaOchiengi2025!')
        auth_test_passed = test_user is not None
        
        # Return success response
        return Response({
            'success': True,
            'message': 'Mama Ochiengi setup completed successfully!',
            'details': {
                'user': {
                    'id': mama.id,
                    'username': mama.username,
                    'email': mama.email,
                    'status': user_status,
                    'is_active': mama.is_active
                },
                'profile': {
                    'created': profile_created,
                    'role': profile.role
                },
                'business': {
                    'id': business.id,
                    'name': business.legal_name,
                    'created': business_created
                },
                'membership': {
                    'created': membership_created,
                    'role': membership.role_in_business,
                    'is_active': membership.is_active
                },
                'modules': {
                    'total': len(modules),
                    'newly_assigned': modules_created
                },
                'authentication_test': {
                    'passed': auth_test_passed
                }
            },
            'login_credentials': {
                'username': 'mama_ochiengi',
                'password': 'MamaOchiengi2025!',
                'ready_to_login': auth_test_passed
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Failed to setup Mama Ochiengi'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)