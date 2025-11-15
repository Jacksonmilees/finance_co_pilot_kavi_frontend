#!/usr/bin/env python
"""Fix Mama Ochiengi login by resetting password"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FG_copilot.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("="*80)
print("FIXING MAMA OCHIENGI LOGIN")
print("="*80)

try:
    mama = User.objects.get(username='mama_ochiengi')
    print(f"\n✓ Found user: {mama.username}")
    print(f"  - Email: {mama.email}")
    print(f"  - ID: {mama.id}")
    print(f"  - Is Active: {mama.is_active}")
    print(f"  - Has Usable Password: {mama.has_usable_password()}")
    
    # Reset password
    new_password = 'MamaOchiengi2025!'
    mama.set_password(new_password)
    
    # Ensure account is active
    mama.is_active = True
    mama.save()
    
    print(f"\n✓ Password has been reset!")
    print(f"✓ Account is active!")
    
    # Test the password
    from django.contrib.auth import authenticate
    test_user = authenticate(username='mama_ochiengi', password=new_password)
    
    if test_user:
        print(f"\n✓ PASSWORD TEST SUCCESSFUL!")
        print(f"  User can now login with:")
        print(f"  Username: mama_ochiengi")
        print(f"  Password: {new_password}")
    else:
        print(f"\n✗ PASSWORD TEST FAILED!")
        print(f"  Authentication returned None")
        
except User.DoesNotExist:
    print("\n✗ ERROR: User 'mama_ochiengi' not found!")
    print("\nCreating user now...")
    
    mama = User.objects.create_user(
        username='mama_ochiengi',
        email='mama.ochiengi@kisumutraders.co.ke',
        password='MamaOchiengi2025!',
        first_name='Mama',
        last_name='Ochiengi',
        is_active=True
    )
    print(f"✓ Created user: {mama.username}")
    
except Exception as e:
    print(f"\n✗ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "="*80)

