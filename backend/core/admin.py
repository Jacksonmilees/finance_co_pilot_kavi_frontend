from django.contrib import admin
from .models import Notification, ActivityLog, ModuleAssignment

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'notification_type', 'priority', 'is_read', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__email']
    readonly_fields = ['id', 'created_at', 'read_at']
    ordering = ['-created_at']

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user', 'severity', 'timestamp']
    list_filter = ['severity', 'timestamp']
    search_fields = ['action', 'user__email']
    readonly_fields = ['timestamp']

@admin.register(ModuleAssignment)
class ModuleAssignmentAdmin(admin.ModelAdmin):
    list_display = ['business', 'module_name', 'enabled', 'assigned_at']
    list_filter = ['enabled', 'module_id']
    search_fields = ['business__legal_name', 'module_name']
