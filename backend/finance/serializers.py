# backend/finance/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Transaction, Invoice, InvoiceItem, Budget, CashFlow, 
    FinancialForecast, CreditScore, Supplier, MpesaPayment
)
from users.models import Business, UserProfile


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model"""
    
    business_name = serializers.CharField(source='business.legal_name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'business', 'user', 'business_name', 'user_name',
            'amount', 'currency', 'transaction_type', 'payment_method', 'status',
            'description', 'reference_number', 'external_id', 'category', 'subcategory',
            'tags', 'supplier', 'customer', 'invoice', 'transaction_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for InvoiceItem model"""
    
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total_price', 'created_at']
        read_only_fields = ['id', 'total_price', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model"""
    
    items = InvoiceItemSerializer(many=True, read_only=True)
    business_name = serializers.CharField(source='business.legal_name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    days_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'business', 'user', 'business_name', 'user_name',
            'invoice_number', 'customer_name', 'customer_email', 'customer_phone',
            'customer_address', 'subtotal', 'tax_amount', 'total_amount', 'currency',
            'status', 'issue_date', 'due_date', 'paid_date', 'etims_invoice_number',
            'etims_status', 'notes', 'terms_conditions', 'items', 'days_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'days_overdue']
    
    def get_days_overdue(self, obj):
        if obj.status == 'overdue':
            from django.utils import timezone
            return (timezone.now().date() - obj.due_date).days
        return 0


class BudgetSerializer(serializers.ModelSerializer):
    """Serializer for Budget model"""
    
    business_name = serializers.CharField(source='business.legal_name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    utilization_percentage = serializers.SerializerMethodField()
    is_over_budget = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'business', 'user', 'business_name', 'user_name',
            'name', 'description', 'budget_type', 'category',
            'budgeted_amount', 'spent_amount', 'remaining_amount', 'currency',
            'start_date', 'end_date', 'is_active', 'alert_threshold',
            'utilization_percentage', 'is_over_budget',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'remaining_amount', 'created_at', 'updated_at']
    
    def get_utilization_percentage(self, obj):
        if obj.budgeted_amount > 0:
            return round((obj.spent_amount / obj.budgeted_amount) * 100, 2)
        return 0
    
    def get_is_over_budget(self, obj):
        return obj.spent_amount > obj.budgeted_amount


class CashFlowSerializer(serializers.ModelSerializer):
    """Serializer for CashFlow model"""
    
    business_name = serializers.CharField(source='business.legal_name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = CashFlow
        fields = [
            'id', 'business', 'user', 'business_name', 'user_name',
            'flow_type', 'category', 'amount', 'currency',
            'period_start', 'period_end', 'is_forecast', 'confidence_score',
            'source', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FinancialForecastSerializer(serializers.ModelSerializer):
    """Serializer for FinancialForecast model"""
    
    business_name = serializers.CharField(source='business.legal_name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = FinancialForecast
        fields = [
            'id', 'business', 'user', 'business_name', 'user_name',
            'forecast_type', 'name', 'description', 'forecast_data',
            'confidence_score', 'forecast_start', 'forecast_end',
            'model_version', 'training_data_period', 'accuracy_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreditScoreSerializer(serializers.ModelSerializer):
    """Serializer for CreditScore model"""
    
    business_name = serializers.CharField(source='business.legal_name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = CreditScore
        fields = [
            'id', 'business', 'user', 'business_name', 'user_name',
            'score', 'score_category', 'payment_history', 'credit_utilization',
            'business_age', 'revenue_stability', 'debt_to_income',
            'factors', 'recommendations', 'calculation_method', 'data_sources',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'score_category', 'created_at', 'updated_at']


# Summary and Analytics Serializers
class FinancialSummarySerializer(serializers.Serializer):
    """Serializer for financial summary data"""
    
    total_income = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=15, decimal_places=2)
    net_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    cash_flow = serializers.DecimalField(max_digits=15, decimal_places=2)
    outstanding_invoices = serializers.DecimalField(max_digits=15, decimal_places=2)
    overdue_invoices = serializers.DecimalField(max_digits=15, decimal_places=2)
    budget_utilization = serializers.DecimalField(max_digits=5, decimal_places=2)
    credit_score = serializers.IntegerField()
    currency = serializers.CharField(max_length=3)


class TransactionAnalyticsSerializer(serializers.Serializer):
    """Serializer for transaction analytics"""
    
    period = serializers.CharField()
    total_transactions = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_transaction = serializers.DecimalField(max_digits=15, decimal_places=2)
    income_count = serializers.IntegerField()
    expense_count = serializers.IntegerField()
    top_categories = serializers.ListField()
    payment_methods = serializers.DictField()
    currency = serializers.CharField(max_length=3)


class BudgetAnalyticsSerializer(serializers.Serializer):
    """Serializer for budget analytics"""
    
    total_budgets = serializers.IntegerField()
    active_budgets = serializers.IntegerField()
    total_budgeted = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_spent = serializers.DecimalField(max_digits=15, decimal_places=2)
    over_budget_count = serializers.IntegerField()
    near_limit_count = serializers.IntegerField()
    budget_utilization = serializers.DecimalField(max_digits=5, decimal_places=2)
    currency = serializers.CharField(max_length=3)


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier model"""
    
    business_name = serializers.CharField(source='business.legal_name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Supplier
        fields = [
            'id', 'business', 'user', 'business_name', 'user_name',
            'supplier_name', 'contact_person', 'email', 'phone_number',
            'address', 'city', 'country', 'category', 'tax_id',
            'registration_number', 'status', 'reliability_score',
            'payment_terms', 'credit_limit', 'notes', 'tags',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MpesaPaymentSerializer(serializers.ModelSerializer):
    """Serializer for M-Pesa Payment model"""
    
    business_name = serializers.CharField(source='business.legal_name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True, allow_null=True)
    
    class Meta:
        model = MpesaPayment
        fields = [
            'id', 'business', 'user', 'business_name', 'user_name',
            'phone_number', 'amount', 'currency', 'status',
            'checkout_request_id', 'merchant_request_id',
            'mpesa_receipt_number', 'transaction_date',
            'invoice', 'invoice_number', 'transaction',
            'account_reference', 'transaction_desc',
            'callback_data', 'error_message',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'checkout_request_id', 'merchant_request_id',
            'mpesa_receipt_number', 'transaction_date',
            'callback_data', 'error_message',
            'created_at', 'updated_at', 'completed_at'
        ]
