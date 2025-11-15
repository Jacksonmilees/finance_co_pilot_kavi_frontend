#!/usr/bin/env python
"""Debug why Mama Ochiengi isn't visible in Super Admin dashboard"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FG_copilot.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import UserProfile, Membership, Business

User = get_user_model()

print("="*80)
print("DEBUGGING MAMA OCHIENGI VISIBILITY")
print("="*80)

# Get all users
all_users = User.objects.all()
print(f"\n✓ Total users in database: {all_users.count()}")

# Check if Mama exists
mama_exists = User.objects.filter(username='mama_ochiengi').exists()
print(f"✓ Mama Ochiengi exists: {mama_exists}")

if mama_exists:
    mama = User.objects.get(username='mama_ochiengi')
    print(f"\n✓ Mama Ochiengi Details:")
    print(f"  - ID: {mama.id}")
    print(f"  - Username: {mama.username}")
    print(f"  - Email: {mama.email}")
    print(f"  - First Name: {mama.first_name}")
    print(f"  - Last Name: {mama.last_name}")
    print(f"  - Is Active: {mama.is_active}")
    print(f"  - Is Staff: {mama.is_staff}")
    print(f"  - Is Superuser: {mama.is_superuser}")
    print(f"  - Date Joined: {mama.date_joined}")
    print(f"  - Last Login: {mama.last_login}")
    
    # Check profile
    try:
        profile = UserProfile.objects.get(user=mama)
        print(f"\n✓ User Profile:")
        print(f"  - Role: {profile.role}")
        print(f"  - Phone: {profile.phone_number}")
        print(f"  - Country: {profile.country}")
        print(f"  - City: {profile.city}")
    except UserProfile.DoesNotExist:
        print(f"\n✗ No UserProfile found!")
    
    # Check memberships
    memberships = Membership.objects.filter(user=mama)
    print(f"\n✓ Memberships: {memberships.count()}")
    for m in memberships:
        print(f"  - Business: {m.business.legal_name} (ID: {m.business_id})")
        print(f"    Role: {m.role_in_business}")
        print(f"    Active: {m.is_active}")
    
    # Check businesses owned
    owned_businesses = Business.objects.filter(owner=mama)
    print(f"\n✓ Businesses Owned: {owned_businesses.count()}")
    for b in owned_businesses:
        print(f"  - {b.legal_name} (ID: {b.id})")
else:
    print(f"\n✗ Mama Ochiengi NOT FOUND in database!")
    print(f"\nLet me check all usernames...")
    for user in User.objects.all().order_by('id'):
        print(f"  - {user.id}: {user.username} ({user.email})")

# List recent users
print(f"\n✓ Last 10 users created:")
recent_users = User.objects.all().order_by('-date_joined')[:10]
for user in recent_users:
    print(f"  - {user.id}: {user.username} ({user.email}) - {user.date_joined.strftime('%Y-%m-%d %H:%M')}")

# Check what Super Admin endpoint sees
print(f"\n✓ Checking Super Admin view filters:")
print(f"  - Active users: {User.objects.filter(is_active=True).count()}")
print(f"  - Users with profiles: {User.objects.filter(profile__isnull=False).count()}")
print(f"  - Users with memberships: {User.objects.filter(memberships__isnull=False).distinct().count()}")

print("\n" + "="*80)

