from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ActivityLog, UserSession, FailedLoginAttempt, ModuleAssignment, Notification
from .serializers import (
    ActivityLogSerializer, UserSessionSerializer,
    FailedLoginAttemptSerializer, ModuleAssignmentSerializer, NotificationSerializer
)
from users.models import Business
from django.contrib.auth import get_user_model

User = get_user_model()

@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def test_cors(request):
    """Test endpoint for CORS"""
    if request.method == "OPTIONS":
        response = JsonResponse({"message": "CORS preflight"})
        response["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
    
    return JsonResponse({"message": "CORS test successful", "method": request.method})


def root_view(request):
    """Root endpoint - API information"""
    return JsonResponse({
        "message": "Finance Growth Co-pilot API",
        "version": "1.0.0",
        "endpoints": {
            "admin": "/admin/",
            "api": {
                "users": "/api/users/",
                "finance": "/api/finance/",
                "auth": {
                    "token": "/api/auth/token/",
                    "refresh": "/api/auth/token/refresh/"
                }
            },
            "docs": "See API_DOCUMENTATION.md for details"
        },
        "frontend": "http://localhost:3000",
        "status": "running"
    })


# Helper function to check if user is super admin
def is_super_admin(user):
    return user.is_authenticated and user.is_superuser


# ==================== SECURITY & MONITORING ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def security_logs(request):
    """Get security-related activity logs"""
    if not is_super_admin(request.user):
        return Response(
            {"error": "Super admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get logs with warning or critical severity
    logs = ActivityLog.objects.filter(
        severity__in=['warning', 'critical']
    ).select_related('user')[:100]
    
    serializer = ActivityLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_sessions(request):
    """Get all active user sessions"""
    if not is_super_admin(request.user):
        return Response(
            {"error": "Super admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    sessions = UserSession.objects.filter(
        is_active=True
    ).select_related('user').order_by('-last_activity')
    
    serializer = UserSessionSerializer(sessions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def terminate_session(request, session_id):
    """Terminate a user session"""
    if not is_super_admin(request.user):
        return Response(
            {"error": "Super admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        session = UserSession.objects.get(id=session_id)
        session.is_active = False
        session.save()
        
        # Log the action
        ActivityLog.objects.create(
            user=request.user,
            action=f"Terminated session for {session.user.email}",
            resource_type="session",
            resource_id=session_id,
            details=f"Session from {session.ip_address}",
            ip_address=get_client_ip(request),
            severity='warning'
        )
        
        return Response({"message": "Session terminated successfully"})
    except UserSession.DoesNotExist:
        return Response(
            {"error": "Session not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def failed_logins(request):
    """Get failed login attempts from last 24 hours"""
    if not is_super_admin(request.user):
        return Response(
            {"error": "Super admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get failed logins from last 24 hours
    since = timezone.now() - timedelta(hours=24)
    attempts = FailedLoginAttempt.objects.filter(
        attempted_at__gte=since
    ).order_by('-attempted_at')
    
    serializer = FailedLoginAttemptSerializer(attempts, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lock_user_account(request, user_id):
    """Lock a user account"""
    if not is_super_admin(request.user):
        return Response(
            {"error": "Super admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        from users.models import User
        user = User.objects.get(id=user_id)
        user.is_active = False
        user.save()
        
        # Log the action
        ActivityLog.objects.create(
            user=request.user,
            action=f"Locked account for {user.email}",
            resource_type="user",
            resource_id=user_id,
            details="Account locked due to security concerns",
            ip_address=get_client_ip(request),
            severity='critical'
        )
        
        return Response({"message": "Account locked successfully"})
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )


# ==================== ACTIVITY LOGS ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_logs(request):
    """Get activity logs with filtering"""
    if not is_super_admin(request.user):
        return Response(
            {"error": "Super admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    logs = ActivityLog.objects.select_related('user').all()
    
    # Apply filters
    action_type = request.GET.get('type')
    user_id = request.GET.get('user')
    date_range = request.GET.get('range', 'today')
    
    # Filter by action type
    if action_type and action_type != 'all':
        logs = logs.filter(action__icontains=action_type)
    
    # Filter by user
    if user_id and user_id != 'all':
        logs = logs.filter(user_id=user_id)
    
    # Filter by date range
    now = timezone.now()
    if date_range == 'today':
        logs = logs.filter(timestamp__date=now.date())
    elif date_range == 'week':
        week_ago = now - timedelta(days=7)
        logs = logs.filter(timestamp__gte=week_ago)
    elif date_range == 'month':
        month_ago = now - timedelta(days=30)
        logs = logs.filter(timestamp__gte=month_ago)
    
    # Limit to last 100 logs
    logs = logs[:100]
    
    serializer = ActivityLogSerializer(logs, many=True)
    return Response(serializer.data)


# ==================== MODULE ASSIGNMENT ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_businesses(request):
    """List all businesses for module assignment"""
    if not is_super_admin(request.user):
        return Response(
            {"error": "Super admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        businesses = Business.objects.all().order_by('legal_name')
        
        data = []
        for b in businesses:
            # Business model doesn't have business_type, use business_model or ownership_type
            business_type = getattr(b, 'business_model', None) or getattr(b, 'ownership_type', None) or 'N/A'
            created_at = b.created_at.isoformat() if hasattr(b.created_at, 'isoformat') else str(b.created_at)
            
            data.append({
                'id': b.id,
                'legal_name': b.legal_name,
                'business_type': business_type,
                'created_at': created_at
            })
        
        return Response(data)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching businesses: {str(e)}")
        return Response(
            {'error': f'Failed to fetch businesses: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def business_modules(request, business_id):
    """Get module assignments for a business"""
    if not is_super_admin(request.user):
        return Response(
            {"error": "Super admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        business = Business.objects.get(id=business_id)
        assignments = ModuleAssignment.objects.filter(business=business)
        
        serializer = ModuleAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
    except Business.DoesNotExist:
        return Response(
            {"error": "Business not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_modules(request):
    """Get modules accessible to the current user"""
    user = request.user
    
    # Super admins have access to all modules
    if user.is_superuser:
        all_modules = [
            {'module_id': 'transactions', 'enabled': True, 'module_name': 'Transactions'},
            {'module_id': 'invoices', 'enabled': True, 'module_name': 'Invoices'},
            {'module_id': 'cash-flow', 'enabled': True, 'module_name': 'Cash Flow'},
            {'module_id': 'credit', 'enabled': True, 'module_name': 'Credit Management'},
            {'module_id': 'suppliers', 'enabled': True, 'module_name': 'Suppliers'},
            {'module_id': 'clients', 'enabled': True, 'module_name': 'Clients'},
            {'module_id': 'reports', 'enabled': True, 'module_name': 'Reports & Analytics'},
            {'module_id': 'insights', 'enabled': True, 'module_name': 'AI Insights'},
            {'module_id': 'proactive-alerts', 'enabled': True, 'module_name': 'Proactive Alerts'},
            {'module_id': 'team', 'enabled': True, 'module_name': 'Team Management'},
            {'module_id': 'voice-assistant', 'enabled': True, 'module_name': 'KAVI Voice Assistant'},
            {'module_id': 'settings', 'enabled': True, 'module_name': 'Settings'},
        ]
        return Response(all_modules)
    
    # Get user's business memberships
    from users.models import Membership
    memberships = Membership.objects.filter(user=user, is_active=True)
    
    if not memberships.exists():
        # Return only required modules if no business membership
        return Response([
            {'module_id': 'voice-assistant', 'enabled': True, 'module_name': 'KAVI Voice Assistant'},
            {'module_id': 'settings', 'enabled': True, 'module_name': 'Settings'},
        ])
    
    # Get modules for all businesses user belongs to
    business_ids = memberships.values_list('business_id', flat=True)
    assignments = ModuleAssignment.objects.filter(
        business_id__in=business_ids,
        enabled=True
    ).values('module_id', 'module_name').distinct()
    
    enabled_modules = [
        {'module_id': a['module_id'], 'enabled': True, 'module_name': a.get('module_name', a['module_id'].title())} 
        for a in assignments
    ]
    
    # Add required modules (always enabled) if not already present
    required_modules = [
        {'module_id': 'voice-assistant', 'enabled': True, 'module_name': 'KAVI Voice Assistant'},
        {'module_id': 'settings', 'enabled': True, 'module_name': 'Settings'},
    ]
    
    for req_mod in required_modules:
        if not any(m['module_id'] == req_mod['module_id'] for m in enabled_modules):
            enabled_modules.append(req_mod)
    
    return Response(enabled_modules)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_module(request, business_id, module_id):
    """Enable or disable a module for a business"""
    if not is_super_admin(request.user):
        return Response(
            {"error": "Super admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        business = Business.objects.get(id=business_id)
        enabled = request.data.get('enabled', True)
        
        # Module names mapping - Complete list
        module_names = {
            'transactions': 'Transactions',
            'invoices': 'Invoices',
            'cash-flow': 'Cash Flow',
            'credit': 'Credit Management',
            'suppliers': 'Suppliers',
            'clients': 'Clients',
            'reports': 'Reports & Analytics',
            'insights': 'AI Insights',
            'proactive-alerts': 'Proactive Alerts',
            'team': 'Team Management',
            'voice-assistant': 'KAVI Voice Assistant',
            'settings': 'Settings'
        }
        
        # Get or create module assignment
        assignment, created = ModuleAssignment.objects.get_or_create(
            business=business,
            module_id=module_id,
            defaults={
                'module_name': module_names.get(module_id, module_id.title()),
                'enabled': enabled,
                'assigned_by': request.user
            }
        )
        
        if not created:
            assignment.enabled = enabled
            assignment.save()
        
        # Log the action
        ActivityLog.objects.create(
            user=request.user,
            action=f"{'Enabled' if enabled else 'Disabled'} {module_id} module for {business.legal_name}",
            resource_type="module_assignment",
            resource_id=assignment.id,
            details=f"Module: {module_id}, Business: {business.legal_name}",
            ip_address=get_client_ip(request),
            severity='info'
        )
        
        serializer = ModuleAssignmentSerializer(assignment)
        return Response(serializer.data)
    except Business.DoesNotExist:
        return Response(
            {"error": "Business not found"},
            status=status.HTTP_404_NOT_FOUND
        )


# ==================== NOTIFICATION ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications(request):
    """Get all notifications for the current user"""
    user = request.user
    
    # Query parameters
    is_read = request.query_params.get('is_read')
    notification_type = request.query_params.get('type')
    limit = int(request.query_params.get('limit', 50))
    
    # Base queryset
    notifications = Notification.objects.filter(user=user)
    
    # Filters
    if is_read is not None:
        notifications = notifications.filter(is_read=is_read.lower() == 'true')
    
    if notification_type:
        notifications = notifications.filter(notification_type=notification_type)
    
    # Order and limit
    try:
        notifications = notifications.select_related('business')[:limit]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching notifications: {str(e)}")
        # Return empty list if there's an error (likely migration issue)
        return Response([])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_notifications_count(request):
    """Get count of unread notifications"""
    user = request.user
    try:
        count = Notification.objects.filter(user=user, is_read=False).count()
        return Response({'count': count})
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error counting notifications: {str(e)}")
        # Return 0 if there's an error (likely migration issue)
        return Response({'count': 0})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.mark_as_read()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read for the current user"""
    user = request.user
    updated = Notification.objects.filter(user=user, is_read=False).update(
        is_read=True,
        read_at=timezone.now()
    )
    return Response({'updated': updated})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_notification(request):
    """Create a notification (for system use or admin)"""
    user = request.user
    
    # Only super admins or business admins can create notifications
    if not user.is_superuser:
        from users.views import user_is_business_admin
        business_id = request.data.get('business')
        if not business_id or not user_is_business_admin(user, business_id):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    # Get target user (default to current user)
    target_user_id = request.data.get('user_id') or request.data.get('user')
    if target_user_id:
        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Target user not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        target_user = user
    
    serializer = NotificationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=target_user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """Delete a notification"""
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.delete()
        return Response({'message': 'Notification deleted'}, status=status.HTTP_204_NO_CONTENT)
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notification not found'},
            status=status.HTTP_404_NOT_FOUND
        )


# ==================== HELPER FUNCTIONS ====================

def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_activity(user, action, resource_type=None, resource_id=None, details=None, request=None, severity='info'):
    """Helper function to log activities"""
    ActivityLog.objects.create(
        user=user,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=get_client_ip(request) if request else None,
        user_agent=request.META.get('HTTP_USER_AGENT', '') if request else '',
        severity=severity
    )