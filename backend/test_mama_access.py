#!/usr/bin/env python
"""
Quick test script to verify Mama Ochiengi can access her financial data
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FG_copilot.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Business, Membership
from finance.models import Transaction, Invoice

User = get_user_model()

print("="*80)
print("TESTING MAMA OCHIENGI DATA ACCESS")
print("="*80)

# Get Mama Ochiengi
try:
    mama = User.objects.get(username='mama_ochiengi')
    print(f"\n✓ Found user: {mama.username} ({mama.email})")
    print(f"  - ID: {mama.id}")
    print(f"  - Is Active: {mama.is_active}")
    print(f"  - Is Superuser: {mama.is_superuser}")
except User.DoesNotExist:
    print("\n✗ ERROR: Mama Ochiengi user not found!")
    exit(1)

# Check memberships
memberships = Membership.objects.filter(user=mama, is_active=True)
print(f"\n✓ Memberships: {memberships.count()}")
for membership in memberships:
    print(f"  - Business: {membership.business.legal_name} (ID: {membership.business_id})")
    print(f"    Role: {membership.role_in_business}")
    print(f"    Active: {membership.is_active}")

if not memberships.exists():
    print("\n✗ ERROR: No active memberships found!")
    exit(1)

# Get the business
business = memberships.first().business
print(f"\n✓ Business: {business.legal_name} (ID: {business.id})")

# Check transactions
transactions = Transaction.objects.filter(business=business)
print(f"\n✓ Total Transactions in Business: {transactions.count()}")

mama_transactions = Transaction.objects.filter(business=business, user=mama)
print(f"✓ Mama's Transactions: {mama_transactions.count()}")

if mama_transactions.exists():
    recent = mama_transactions.order_by('-transaction_date').first()
    print(f"  - Most recent: {recent.description} - {recent.amount} {recent.currency}")
    print(f"  - Date: {recent.transaction_date}")
    print(f"  - Type: {recent.transaction_type}")

# Check invoices
invoices = Invoice.objects.filter(business=business)
print(f"\n✓ Total Invoices in Business: {invoices.count()}")

mama_invoices = Invoice.objects.filter(business=business, user=mama)
print(f"✓ Mama's Invoices: {mama_invoices.count()}")

if mama_invoices.exists():
    recent_invoice = mama_invoices.order_by('-created_at').first()
    print(f"  - Most recent: {recent_invoice.invoice_number} - {recent_invoice.total_amount} {recent_invoice.currency}")
    print(f"  - Customer: {recent_invoice.customer_name}")
    print(f"  - Status: {recent_invoice.status}")

# Test business admin check
from users.views import user_is_business_admin
is_admin = user_is_business_admin(mama, business.id)
print(f"\n✓ Is Business Admin: {is_admin}")

# Test get_business_queryset
from finance.views import get_business_queryset
accessible_business_ids = list(get_business_queryset(mama, business.id))
print(f"✓ Accessible Business IDs: {accessible_business_ids}")

print("\n" + "="*80)
print("TEST COMPLETE")
print("="*80)

if mama_transactions.count() > 0 and mama_invoices.count() > 0 and is_admin:
    print("\n✓ ALL CHECKS PASSED - Mama Ochiengi should be able to see her data!")
else:
    print("\n✗ ISSUES DETECTED:")
    if mama_transactions.count() == 0:
        print("  - No transactions found")
    if mama_invoices.count() == 0:
        print("  - No invoices found")
    if not is_admin:
        print("  - Not recognized as business admin")

