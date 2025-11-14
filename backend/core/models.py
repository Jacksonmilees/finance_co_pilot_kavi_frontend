from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

class ActivityLog(models.Model):
    """Track all system activities for audit trail"""
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    action = models.CharField(max_length=200)
    resource_type = models.CharField(max_length=50, null=True, blank=True)
    resource_id = models.IntegerField(null=True, blank=True)
    details = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='info')
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action']),
        ]
    
    def __str__(self):
        return f"{self.action} by {self.user.email if self.user else 'System'} at {self.timestamp}"


class UserSession(models.Model):
    """Track active user sessions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-last_activity']
    
    def __str__(self):
        return f"{self.user.email} - {self.ip_address}"


class FailedLoginAttempt(models.Model):
    """Track failed login attempts for security monitoring"""
    username = models.CharField(max_length=255)
    email = models.EmailField(null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    reason = models.CharField(max_length=255)
    attempted_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='failed_logins')
    
    class Meta:
        ordering = ['-attempted_at']
        indexes = [
            models.Index(fields=['-attempted_at']),
            models.Index(fields=['ip_address']),
        ]
    
    def __str__(self):
        return f"Failed login: {self.username} from {self.ip_address}"


class ModuleAssignment(models.Model):
    """Assign modules/features to businesses"""
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='module_assignments')
    module_id = models.CharField(max_length=50)
    module_name = models.CharField(max_length=100)
    enabled = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['business', 'module_id']
        ordering = ['business', 'module_name']
    
    def __str__(self):
        return f"{self.business.legal_name} - {self.module_name} ({'Enabled' if self.enabled else 'Disabled'})"


class Notification(models.Model):
    """In-app notifications for users"""
    NOTIFICATION_TYPES = [
        ('invoice_paid', 'Invoice Paid'),
        ('invoice_overdue', 'Invoice Overdue'),
        ('payment_received', 'Payment Received'),
        ('payment_reminder', 'Payment Reminder'),
        ('low_cash', 'Low Cash Alert'),
        ('transaction_added', 'Transaction Added'),
        ('recurring_invoice', 'Recurring Invoice Generated'),
        ('mpesa_payment', 'M-Pesa Payment'),
        ('system', 'System Notification'),
        ('alert', 'Alert'),
        ('info', 'Information'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    
    # Notification content
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='info')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Action link
    action_url = models.CharField(max_length=500, blank=True, null=True)
    action_text = models.CharField(max_length=100, blank=True, null=True)
    
    # Related resource
    resource_type = models.CharField(max_length=50, blank=True, null=True)  # e.g., 'invoice', 'transaction'
    resource_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at', 'is_read']),
            models.Index(fields=['business', '-created_at']),
            models.Index(fields=['notification_type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])