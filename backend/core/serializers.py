from rest_framework import serializers
from .models import ActivityLog, UserSession, FailedLoginAttempt, ModuleAssignment, Notification


class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_email', 'user_name', 'action',
            'resource_type', 'resource_id', 'details', 'ip_address',
            'user_agent', 'timestamp', 'severity'
        ]
        read_only_fields = ['id', 'timestamp']


class UserSessionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserSession
        fields = [
            'id', 'user', 'user_email', 'user_name', 'session_key',
            'ip_address', 'user_agent', 'created_at', 'last_activity',
            'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'last_activity']


class FailedLoginAttemptSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True, allow_null=True)
    
    class Meta:
        model = FailedLoginAttempt
        fields = [
            'id', 'username', 'email', 'ip_address', 'reason',
            'attempted_at', 'user', 'user_id'
        ]
        read_only_fields = ['id', 'attempted_at']


class ModuleAssignmentSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.legal_name', read_only=True)
    assigned_by_email = serializers.EmailField(source='assigned_by.email', read_only=True, allow_null=True)
    
    class Meta:
        model = ModuleAssignment
        fields = [
            'id', 'business', 'business_name', 'module_id', 'module_name',
            'enabled', 'assigned_at', 'assigned_by', 'assigned_by_email',
            'updated_at'
        ]
        read_only_fields = ['id', 'assigned_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.legal_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'business', 'business_name', 'title', 'message',
            'notification_type', 'priority', 'action_url', 'action_text',
            'resource_type', 'resource_id', 'is_read', 'read_at',
            'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']
