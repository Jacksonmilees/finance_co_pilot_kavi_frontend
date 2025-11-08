# backend/users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BusinessViewSet, MembershipViewSet,
    super_admin_dashboard, business_admin_dashboard, user_dashboard,
    admin_reset_user_password, CurrentUserView,
    register_business, check_registration_status, list_pending_registrations, list_all_registrations,
    debug_registration_counts, list_approved_businesses, assign_user_to_business,
    approve_business_registration, reject_business_registration,
    register_individual, list_pending_individual_registrations,
    approve_individual_registration, reject_individual_registration,
    check_individual_registration_status,
    businesses_monitoring, business_summary,
    CustomerViewSet, me, register, profile_detail, profile_update, profile_create,
    admin_users_list, admin_dashboard_stats, admin_update_user_role, admin_register_user,
    BusinessInvitationViewSet, accept_invitation, upload_document,
)

router = DefaultRouter()
router.register(r'businesses', BusinessViewSet, basename='business')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'memberships', MembershipViewSet, basename='membership')
router.register(r'invitations', BusinessInvitationViewSet, basename='invitation')

urlpatterns = [
    path('me/', me, name='me'),
    path('register/', register, name='register'),
    path('profile/', profile_detail, name='profile_detail'),
    path('profile/update/', profile_update, name='profile_update'),
    path('profile/create/', profile_create, name='profile_create'),
    # File upload endpoint
    path('upload-document/', upload_document, name='upload_document'),
    # Admin endpoints
    path('admin/users/', admin_users_list, name='admin_users_list'),
    path('admin/users/register/', admin_register_user, name='admin_register_user'),
    path('admin/stats/', admin_dashboard_stats, name='admin_dashboard_stats'),
    path('admin/users/<int:user_id>/role/', admin_update_user_role, name='admin_update_user_role'),
    path('admin/users/<int:user_id>/password/', admin_reset_user_password, name='admin_reset_user_password'),
    # Dashboard endpoints
    path('admin/dashboard/', super_admin_dashboard, name='super_admin_dashboard'),
    path('business/<int:business_id>/dashboard/', business_admin_dashboard, name='business_admin_dashboard'),
    path('user/dashboard/', user_dashboard, name='user_dashboard'),
    path('user/dashboard/<int:business_id>/', user_dashboard, name='user_dashboard_business'),
    # Invitation endpoints
    path('invitations/accept/<str:token>/', accept_invitation, name='accept_invitation'),
    # Business Registration endpoints
    path('business-registration/', register_business, name='register_business'),
    path('business-registration/status/<str:email>/', check_registration_status, name='check_registration_status'),
    path('admin/pending-registrations/', list_pending_registrations, name='list_pending_registrations'),
    path('admin/all-registrations/', list_all_registrations, name='list_all_registrations'),
    path('admin/debug-registrations/', debug_registration_counts, name='debug_registration_counts'),
    path('admin/approved-businesses/', list_approved_businesses, name='list_approved_businesses'),
    path('admin/assign-user-to-business/', assign_user_to_business, name='assign_user_to_business'),
    path('admin/approve-registration/<int:registration_id>/', approve_business_registration, name='approve_business_registration'),
    path('admin/reject-registration/<int:registration_id>/', reject_business_registration, name='reject_business_registration'),
    # Individual Registration endpoints
    path('individual-registration/', register_individual, name='register_individual'),
    path('individual-registration/status/<str:email>/', check_individual_registration_status, name='check_individual_registration_status'),
    path('admin/pending-individual-registrations/', list_pending_individual_registrations, name='list_pending_individual_registrations'),
    path('admin/approve-individual-registration/<int:registration_id>/', approve_individual_registration, name='approve_individual_registration'),
    path('admin/reject-individual-registration/<int:registration_id>/', reject_individual_registration, name='reject_individual_registration'),
    # Business Monitoring endpoints
    path('admin/businesses-monitoring/', businesses_monitoring, name='businesses_monitoring'),
    path('admin/business-summary/', business_summary, name='business_summary'),
    path('', include(router.urls)),
]