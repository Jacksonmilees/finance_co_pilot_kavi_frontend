# Create Mama Ochiengi on Production (Render) - LIVE SYSTEM

## 🎯 Goal
Create Mama Ochiengi on your LIVE production backend so you can login immediately.

---

## 🚀 Quick Steps (5 Minutes)

### Step 1: Open Render Dashboard
Go to: **https://dashboard.render.com/**

### Step 2: Select Your Backend Service
Click on: **`backend-kavi-sme`** (or whatever your backend service is named)

### Step 3: Open Shell
Click the **"Shell"** tab at the top

### Step 4: Wait for Shell to Connect
You'll see a terminal window loading...

### Step 5: Enter Django Shell
Type this command:
```bash
python manage.py shell
```
Press Enter and wait for the `>>>` prompt

### Step 6: Copy and Paste This ENTIRE Script

```python
from django.contrib.auth import get_user_model
from users.models import Business, Membership, UserProfile
from core.models import ModuleAssignment

User = get_user_model()

print("Creating Mama Ochiengi on PRODUCTION...")

# 1. Create User
mama, created = User.objects.get_or_create(
    username='mama_ochiengi',
    defaults={
        'email': 'mama.ochiengi@kisumutraders.co.ke',
        'first_name': 'Mama',
        'last_name': 'Ochiengi',
        'is_active': True,
        'is_staff': False,
        'is_superuser': False
    }
)

# Set password
mama.set_password('MamaOchiengi2025!')
mama.save()
print(f"✓ User created: {mama.username} (ID: {mama.id})")

# 2. Create User Profile
profile, _ = UserProfile.objects.get_or_create(
    user=mama,
    defaults={
        'role': 'owner',
        'phone_number': '+254720123456',
        'country': 'Kenya',
        'city': 'Kisumu'
    }
)
print(f"✓ Profile created: Role = {profile.role}")

# 3. Create Business
business, _ = Business.objects.get_or_create(
    legal_name='Mama Ochiengi Fresh Produce Ltd',
    defaults={
        'owner': mama,
        'dba_name': 'Mama Ochiengi Fresh Produce',
        'website': 'https://mamaochiengi-produce.co.ke',
        'year_founded': 2018,
        'employee_count': 8,
        'hq_city': 'Kisumu',
        'hq_country': 'Kenya',
        'revenue_band': '500K-1M',
        'business_model': 'B2C',
        'sales_motion': 'transactional',
        'registration_number': 'BN-KSM-2018-4521'
    }
)
print(f"✓ Business created: {business.legal_name} (ID: {business.id})")

# 4. Create Membership (Business Admin)
membership, _ = Membership.objects.get_or_create(
    business=business,
    user=mama,
    defaults={
        'role_in_business': 'business_admin',
        'is_active': True
    }
)
print(f"✓ Membership created: {membership.role_in_business}")

# 5. Assign ALL Modules
modules = [
    ('transactions', 'Transactions'),
    ('invoices', 'Invoices'),
    ('cash-flow', 'Cash Flow'),
    ('credit', 'Credit Management'),
    ('suppliers', 'Suppliers'),
    ('clients', 'Clients'),
    ('reports', 'Reports & Analytics'),
    ('insights', 'AI Insights'),
    ('proactive-alerts', 'Proactive Alerts'),
    ('team', 'Team Management'),
    ('voice-assistant', 'KAVI Voice Assistant'),
    ('settings', 'Settings'),
    ('budgets', 'Budgets'),
    ('dashboard', 'Dashboard'),
]

for module_id, module_name in modules:
    ModuleAssignment.objects.get_or_create(
        business=business,
        module_id=module_id,
        defaults={
            'module_name': module_name,
            'enabled': True,
            'assigned_by': mama
        }
    )

print(f"✓ Assigned {len(modules)} modules")

# 6. Test Authentication
from django.contrib.auth import authenticate
test_user = authenticate(username='mama_ochiengi', password='MamaOchiengi2025!')

print("\n" + "="*60)
if test_user:
    print("✓✓✓ SUCCESS! Mama Ochiengi is ready!")
    print("="*60)
    print(f"\nLogin Credentials:")
    print(f"  Username: mama_ochiengi")
    print(f"  Password: MamaOchiengi2025!")
    print(f"\n✓ You can now login on the LIVE site!")
else:
    print("✗ Authentication test failed - check password")

print("="*60)

# Exit shell
exit()
```

### Step 7: Wait for Completion
You'll see output like:
```
✓ User created: mama_ochiengi (ID: XX)
✓ Profile created: Role = owner
✓ Business created: Mama Ochiengi Fresh Produce Ltd (ID: XX)
✓ Membership created: business_admin
✓ Assigned 14 modules
============================================================
✓✓✓ SUCCESS! Mama Ochiengi is ready!
============================================================

Login Credentials:
  Username: mama_ochiengi
  Password: MamaOchiengi2025!

✓ You can now login on the LIVE site!
============================================================
```

### Step 8: Login to LIVE System
1. Go to your LIVE frontend URL
2. Click **Login**
3. Enter:
   - **Username:** `mama_ochiengi`
   - **Password:** `MamaOchiengi2025!`
4. Click **Login**

### Step 9: Verify in Super Admin
1. Login as Super Admin
2. Go to **Users** page
3. You should now see **Mama Ochiengi** in the list!

---

## 📋 Login Credentials for Production

```
Username: mama_ochiengi
Password: MamaOchiengi2025!
Email:    mama.ochiengi@kisumutraders.co.ke
Role:     Owner / Business Admin
Business: Mama Ochiengi Fresh Produce Ltd
```

---

## ✅ What Gets Created

1. ✅ User account (mama_ochiengi)
2. ✅ User profile (Owner role)
3. ✅ Business (Mama Ochiengi Fresh Produce Ltd)
4. ✅ Business Admin membership
5. ✅ All 14 modules enabled:
   - Transactions
   - Invoices
   - Cash Flow
   - Credit Management
   - Suppliers
   - Clients
   - Reports & Analytics
   - AI Insights
   - Proactive Alerts
   - Team Management
   - KAVI Voice Assistant
   - Settings
   - Budgets
   - Dashboard

---

## 🔍 If Script Fails

If you get any errors, try creating just the user first:

```python
from django.contrib.auth import get_user_model
User = get_user_model()

# Simple user creation
mama = User.objects.create_user(
    username='mama_ochiengi',
    email='mama.ochiengi@kisumutraders.co.ke',
    password='MamaOchiengi2025!',
    first_name='Mama',
    last_name='Ochiengi'
)
mama.is_active = True
mama.save()

print(f"User created: {mama.username}")

# Test it
from django.contrib.auth import authenticate
test = authenticate(username='mama_ochiengi', password='MamaOchiengi2025!')
print("Login works!" if test else "Login failed!")

exit()
```

Then you can assign business/modules from Super Admin UI.

---

## 🎯 Expected Result

After running this:
- ✅ Mama Ochiengi will appear in Super Admin users list
- ✅ Her business will appear in businesses list
- ✅ She can login to the LIVE system
- ✅ All modules will be accessible to her
- ✅ She will be Business Admin of her business

---

## ⏱️ Timeline

- **Step 1-4:** 1 minute (navigate and open shell)
- **Step 5-6:** 2 minutes (paste and run script)
- **Step 7-9:** 2 minutes (verify and login)

**Total: ~5 minutes**

---

## 🚨 Important Notes

1. This creates the user on **PRODUCTION** (Render)
2. This is separate from your LOCAL database
3. After this, you can login on the LIVE site
4. The local Mama Ochiengi (with 656 transactions) is separate
5. If you want the transaction data on production, you'd need to run `python manage.py seed_mama_ochiengi` in Render shell

---

## 📞 If You Need Help

If the Render shell doesn't work or you get stuck:
1. Check that you're logged into Render
2. Make sure the backend service is running
3. Try refreshing the Shell tab
4. Make sure you're in the correct project

---

**Ready? Go to https://dashboard.render.com/ and follow the steps!** 🚀

