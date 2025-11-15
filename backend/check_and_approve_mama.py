#!/usr/bin/env python
"""Check if Mama Ochiengi is approved and fix if needed"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FG_copilot.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import UserProfile, IndividualRegistration

User = get_user_model()

print("="*80)
print("CHECKING MAMA OCHIENGI APPROVAL STATUS")
print("="*80)

try:
    mama = User.objects.get(username='mama_ochiengi')
    print(f"\n✓ Found user: {mama.username}")
    print(f"  - ID: {mama.id}")
    print(f"  - Email: {mama.email}")
    print(f"  - Is Active: {mama.is_active}")
    print(f"  - Is Staff: {mama.is_staff}")
    print(f"  - Is Superuser: {mama.is_superuser}")
    
    # Check if there's a registration record
    try:
        registration = IndividualRegistration.objects.get(email=mama.email)
        print(f"\n✓ Found registration record:")
        print(f"  - Status: {registration.status}")
        print(f"  - Approved: {registration.status == 'approved'}")
        
        if registration.status != 'approved':
            print(f"\n⚠️  Registration is '{registration.status}' - needs approval!")
            
            # Approve it
            registration.status = 'approved'
            registration.save()
            print(f"✓ Changed status to 'approved'")
        
    except IndividualRegistration.DoesNotExist:
        print(f"\n⚠️  No registration record found")
        print(f"  This is okay - user was created directly, not through registration")
    
    # Check user profile
    try:
        profile = UserProfile.objects.get(user=mama)
        print(f"\n✓ User Profile:")
        print(f"  - Role: {profile.role}")
        print(f"  - Phone: {profile.phone_number}")
    except UserProfile.DoesNotExist:
        print(f"\n⚠️  No user profile found - creating one")
        profile = UserProfile.objects.create(
            user=mama,
            role='owner',
            phone_number='+254720123456'
        )
        print(f"✓ Created user profile")
    
    # Ensure account is fully active
    if not mama.is_active:
        print(f"\n⚠️  Account is not active - activating now")
        mama.is_active = True
        mama.save()
        print(f"✓ Account activated")
    else:
        print(f"\n✓ Account is ACTIVE")
    
    # Test authentication
    from django.contrib.auth import authenticate
    test_user = authenticate(username='mama_ochiengi', password='MamaOchiengi2025!')
    
    print(f"\n{'='*80}")
    if test_user:
        print(f"✓✓✓ AUTHENTICATION TEST: SUCCESS! ✓✓✓")
        print(f"{'='*80}")
        print(f"\nMama Ochiengi CAN login with:")
        print(f"  Username: mama_ochiengi")
        print(f"  Password: MamaOchiengi2025!")
    else:
        print(f"✗✗✗ AUTHENTICATION TEST: FAILED! ✗✗✗")
        print(f"{'='*80}")
        print(f"\nSomething is still wrong!")
        
except User.DoesNotExist:
    print(f"\n✗ ERROR: User 'mama_ochiengi' does not exist!")
    print(f"\nRun this command first:")
    print(f"  python manage.py seed_mama_ochiengi")
    
except Exception as e:
    print(f"\n✗ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "="*80)

