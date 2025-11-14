# backend/finance/models.py
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid


class Transaction(models.Model):
    """Financial transaction model for tracking income and expenses"""
    
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('transfer', 'Transfer'),
        ('investment', 'Investment'),
        ('loan', 'Loan'),
        ('refund', 'Refund'),
    ]
    
    PAYMENT_METHODS = [
        ('mpesa', 'M-Pesa'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('cheque', 'Cheque'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='transactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    
    # Transaction details
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.CharField(max_length=3, default='KES')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    
    # Transaction metadata
    description = models.TextField()
    reference_number = models.CharField(max_length=100, blank=True)
    external_id = models.CharField(max_length=100, blank=True)  # For M-Pesa, bank transaction IDs
    
    # Categorization
    category = models.CharField(max_length=100, blank=True)
    subcategory = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    # Related entities
    supplier = models.CharField(max_length=255, blank=True)
    customer = models.CharField(max_length=255, blank=True)
    invoice = models.ForeignKey('Invoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    
    # Timestamps
    transaction_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-transaction_date']
        indexes = [
            models.Index(fields=['business', 'transaction_date']),
            models.Index(fields=['transaction_type', 'status']),
            models.Index(fields=['category', 'subcategory']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type.title()}: {self.amount} {self.currency} - {self.description[:50]}"


class Invoice(models.Model):
    """Invoice model for managing customer invoices"""
    
    INVOICE_STATUS = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='invoices')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invoices')
    
    # Invoice details
    invoice_number = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    customer_address = models.TextField(blank=True)
    
    # Financial details
    subtotal = models.DecimalField(max_digits=15, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    
    # Status and dates
    status = models.CharField(max_length=20, choices=INVOICE_STATUS, default='draft')
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    # eTIMS integration
    etims_invoice_number = models.CharField(max_length=100, blank=True)
    etims_status = models.CharField(max_length=50, blank=True)
    
    # Additional fields
    notes = models.TextField(blank=True)
    terms_conditions = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['due_date', 'status']),
        ]
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer_name}"


class InvoiceItem(models.Model):
    """Individual items within an invoice"""
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    total_price = models.DecimalField(max_digits=15, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.description} - {self.quantity} x {self.unit_price}"


class Budget(models.Model):
    """Budget model for financial planning and tracking"""
    
    BUDGET_TYPES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
        ('project', 'Project'),
        ('department', 'Department'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='budgets')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='budgets')
    
    # Budget details
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    budget_type = models.CharField(max_length=20, choices=BUDGET_TYPES)
    category = models.CharField(max_length=100)
    
    # Financial details
    budgeted_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    spent_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='KES')
    
    # Time period
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Status and tracking
    is_active = models.BooleanField(default=True)
    alert_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=80.0, 
                                       validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['business', 'is_active']),
            models.Index(fields=['category', 'budget_type']),
        ]
    
    def save(self, *args, **kwargs):
        self.remaining_amount = self.budgeted_amount - self.spent_amount
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} - {self.budgeted_amount} {self.currency}"


class CashFlow(models.Model):
    """Cash flow analysis and forecasting model"""
    
    FLOW_TYPES = [
        ('inflow', 'Cash Inflow'),
        ('outflow', 'Cash Outflow'),
        ('net', 'Net Cash Flow'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='cash_flows')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cash_flows')
    
    # Cash flow details
    flow_type = models.CharField(max_length=20, choices=FLOW_TYPES)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    
    # Time period
    period_start = models.DateField()
    period_end = models.DateField()
    is_forecast = models.BooleanField(default=False)
    
    # Analysis metadata
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                         validators=[MinValueValidator(0), MaxValueValidator(100)])
    source = models.CharField(max_length=100, blank=True)  # 'actual', 'forecast', 'ai_prediction'
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-period_start']
        indexes = [
            models.Index(fields=['business', 'period_start']),
            models.Index(fields=['flow_type', 'is_forecast']),
        ]
    
    def __str__(self):
        return f"{self.flow_type.title()}: {self.amount} {self.currency} - {self.period_start}"


class FinancialForecast(models.Model):
    """AI-powered financial forecasting model"""
    
    FORECAST_TYPES = [
        ('revenue', 'Revenue Forecast'),
        ('expense', 'Expense Forecast'),
        ('cash_flow', 'Cash Flow Forecast'),
        ('profit_loss', 'Profit & Loss Forecast'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='forecasts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='forecasts')
    
    # Forecast details
    forecast_type = models.CharField(max_length=20, choices=FORECAST_TYPES)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Forecast data
    forecast_data = models.JSONField()  # Contains forecast values by period
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, 
                                         validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    # Time period
    forecast_start = models.DateField()
    forecast_end = models.DateField()
    
    # AI metadata
    model_version = models.CharField(max_length=50, blank=True)
    training_data_period = models.CharField(max_length=100, blank=True)
    accuracy_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'forecast_type']),
            models.Index(fields=['forecast_start', 'forecast_end']),
        ]
    
    def __str__(self):
        return f"{self.forecast_type.title()}: {self.name}"


class CreditScore(models.Model):
    """Credit scoring model for loan eligibility assessment"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='credit_scores')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='credit_scores')
    
    # Credit score details
    score = models.IntegerField(validators=[MinValueValidator(300), MaxValueValidator(850)])
    score_category = models.CharField(max_length=20, choices=[
        ('poor', 'Poor (300-579)'),
        ('fair', 'Fair (580-669)'),
        ('good', 'Good (670-739)'),
        ('very_good', 'Very Good (740-799)'),
        ('excellent', 'Excellent (800-850)'),
    ])
    
    # Scoring factors
    payment_history = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    credit_utilization = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    business_age = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    revenue_stability = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    debt_to_income = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Additional factors
    factors = models.JSONField(default=dict, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    
    # Metadata
    calculation_method = models.CharField(max_length=100, default='ai_enhanced')
    data_sources = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'score']),
            models.Index(fields=['score_category']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-categorize score
        if self.score >= 800:
            self.score_category = 'excellent'
        elif self.score >= 740:
            self.score_category = 'very_good'
        elif self.score >= 670:
            self.score_category = 'good'
        elif self.score >= 580:
            self.score_category = 'fair'
        else:
            self.score_category = 'poor'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Credit Score: {self.score} ({self.score_category})"


class Supplier(models.Model):
    """Supplier model for managing business suppliers"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('preferred', 'Preferred'),
        ('blocked', 'Blocked'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='suppliers')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='suppliers')
    
    # Supplier details
    supplier_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20)
    
    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='Kenya')
    
    # Business details
    category = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)
    
    # Status and rating
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    reliability_score = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True,
                                           validators=[MinValueValidator(0), MaxValueValidator(10)])
    
    # Payment terms
    payment_terms = models.CharField(max_length=100, blank=True)  # e.g., "Net 30", "COD"
    credit_limit = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Additional fields
    notes = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['category', 'status']),
        ]
    
    def __str__(self):
        return f"{self.supplier_name} - {self.business.legal_name}"


class MpesaPayment(models.Model):
    """M-Pesa payment transactions"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('initiated', 'Initiated'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='mpesa_payments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mpesa_payments')
    
    # Payment details
    phone_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # M-Pesa API response
    checkout_request_id = models.CharField(max_length=100, blank=True, null=True)
    merchant_request_id = models.CharField(max_length=100, blank=True, null=True)
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True)
    transaction_date = models.CharField(max_length=50, blank=True, null=True)
    
    # Related resources
    invoice = models.ForeignKey('Invoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='mpesa_payments')
    transaction = models.ForeignKey('Transaction', on_delete=models.SET_NULL, null=True, blank=True, related_name='mpesa_payments')
    
    # Metadata
    account_reference = models.CharField(max_length=100, blank=True)
    transaction_desc = models.CharField(max_length=200, blank=True)
    callback_data = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['checkout_request_id']),
            models.Index(fields=['mpesa_receipt_number']),
        ]
    
    def __str__(self):
        return f"M-Pesa Payment: {self.amount} KES - {self.status}"