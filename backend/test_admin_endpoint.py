#!/usr/bin/env python
"""Test what the admin users list endpoint returns"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FG_copilot.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import UserProfile

User = get_user_model()

print("="*80)
print("TESTING ADMIN USERS LIST ENDPOINT")
print("="*80)

# Simulate what the endpoint does
users = User.objects.all()
user_data = []

print(f"\nProcessing {users.count()} users...")

for user in users:
    try:
        profile = user.profile
        user_obj = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'role': profile.role,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat(),
            'businesses_count': user.businesses.count(),
            'last_login': user.last_login.isoformat() if user.last_login else None
        }
        user_data.append(user_obj)
        
        if user.username == 'mama_ochiengi':
            print(f"\n✓ FOUND Mama Ochiengi in results!")
            print(f"  Position: {len(user_data)}")
            print(json.dumps(user_obj, indent=2))
            
    except UserProfile.DoesNotExist:
        user_obj = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'role': 'owner',
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat(),
            'businesses_count': user.businesses.count(),
            'last_login': user.last_login.isoformat() if user.last_login else None
        }
        user_data.append(user_obj)
        
        if user.username == 'mama_ochiengi':
            print(f"\n✓ FOUND Mama Ochiengi in results (no profile)!")
            print(f"  Position: {len(user_data)}")
            print(json.dumps(user_obj, indent=2))

print(f"\n✓ Total users in response: {len(user_data)}")

# Check if Mama is in the list
mama_in_list = any(u['username'] == 'mama_ochiengi' for u in user_data)
print(f"✓ Mama Ochiengi in list: {mama_in_list}")

if mama_in_list:
    mama_data = next(u for u in user_data if u['username'] == 'mama_ochiengi')
    print(f"\n✓ Mama Ochiengi will be visible to frontend!")
    print(f"  ID: {mama_data['id']}")
    print(f"  Username: {mama_data['username']}")
    print(f"  Email: {mama_data['email']}")
    print(f"  Role: {mama_data['role']}")
    print(f"  Full Name: {mama_data['full_name']}")
else:
    print(f"\n✗ Mama Ochiengi is NOT in the API response!")
    print(f"  This means there's a database or code issue")

# Show last 5 users for reference
print(f"\n✓ Last 5 users in response:")
for user in user_data[-5:]:
    print(f"  - {user['id']}: {user['username']} ({user['email']})")

print("\n" + "="*80)

