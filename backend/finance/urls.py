# backend/finance/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    TransactionViewSet, InvoiceViewSet, InvoiceItemViewSet,
    BudgetViewSet, CashFlowViewSet, FinancialForecastViewSet,
    CreditScoreViewSet, SupplierViewSet, dashboard_data, VoiceConversationViewSet
)

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'invoice-items', InvoiceItemViewSet)
router.register(r'budgets', BudgetViewSet)
router.register(r'cash-flows', CashFlowViewSet)
router.register(r'forecasts', FinancialForecastViewSet)
router.register(r'credit-scores', CreditScoreViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'voice-conversations', VoiceConversationViewSet, basename='voice-conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', dashboard_data, name='dashboard_data'),
    # M-Pesa endpoints
    path('mpesa/initiate/', views.initiate_mpesa_payment, name='initiate-mpesa-payment'),
    path('mpesa/callback/', views.mpesa_callback, name='mpesa-callback'),
    path('mpesa/payments/', views.mpesa_payments, name='mpesa-payments'),
    path('mpesa/payments/<uuid:payment_id>/', views.mpesa_payment_status, name='mpesa-payment-status'),
]
