# Deploy Mama Ochiengi to Production (Render)

## 🔴 Problem

**Frontend Error:**
```
POST https://backend-kavi-sme.onrender.com/api/auth/token/ 401 (Unauthorized)
Error: No active account found with the given credentials
```

**Root Cause:**
- ✅ Mama Ochiengi exists in LOCAL database
- ❌ Mama Ochiengi does NOT exist on PRODUCTION (Render)
- Frontend is connecting to PRODUCTION backend
- Therefore: Login fails!

---

## ✅ Solution: Deploy to Production

### Option 1: Quick Fix - Use Render Shell (5 minutes)

**Step 1:** Go to Render Dashboard
- Navigate to: https://dashboard.render.com/
- Select your `backend-kavi-sme` service

**Step 2:** Open Shell
- Click on "Shell" tab
- Wait for shell to connect

**Step 3:** Create Mama Ochiengi on Production

Copy and paste this command:

```bash
python manage.py shell
```

Then paste this Python code:

```python
from django.contrib.auth import get_user_model
from users.models import Business, Membership, UserProfile
from core.models import ModuleAssignment

User = get_user_model()

# Create Mama Ochiengi
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

# Create user profile
profile, _ = UserProfile.objects.get_or_create(
    user=mama,
    defaults={
        'role': 'owner',
        'phone_number': '+254720123456'
    }
)

print(f"✓ Profile created")

# Create or get business
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

# Create membership
membership, _ = Membership.objects.get_or_create(
    business=business,
    user=mama,
    defaults={
        'role_in_business': 'business_admin',
        'is_active': True
    }
)

print(f"✓ Membership created: {membership}")

# Assign all modules
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

# Test authentication
from django.contrib.auth import authenticate
test_user = authenticate(username='mama_ochiengi', password='MamaOchiengi2025!')

if test_user:
    print("\n" + "="*60)
    print("✓✓✓ SUCCESS! Mama Ochiengi ready to login!")
    print("="*60)
else:
    print("\n✗ Authentication test failed")

# Exit
exit()
```

**Step 4:** Test Login
- Go to your frontend
- Try logging in with:
  - Username: `mama_ochiengi`
  - Password: `MamaOchiengi2025!`

---

### Option 2: Deploy Full Codebase (10-15 minutes)

**If you want to deploy the transaction/invoice data too:**

**Step 1:** Commit local changes

```bash
cd C:\Users\Hp\Desktop\Finance-Growth-Co-pilot

git add -A
git commit -m "Add Mama Ochiengi: user, business, modules, and seed data"
git push origin main
```

**Step 2:** Wait for Render to deploy
- Monitor at: https://dashboard.render.com/
- Should take 5-10 minutes

**Step 3:** Run seed commands on production

In Render Shell:
```bash
python manage.py migrate
python manage.py setup_mama_ochiengi
```

**Step 4:** OPTIONAL - Seed transaction data

If you want the 656 transactions and 25 invoices on production:

```bash
# Note: This might fail if seed_mama_ochiengi command has encoding issues
# Safer to just create the user/business manually as shown in Option 1
```

---

### Option 3: Test Locally (Immediate)

**If you want to test NOW without deploying:**

**Step 1:** Start local backend

```bash
cd backend
python manage.py runserver
```

**Step 2:** Update frontend API URL

Find your API configuration (usually in `.env` or `apiClient.js`) and change:

**FROM:**
```javascript
const API_URL = 'https://backend-kavi-sme.onrender.com'
```

**TO:**
```javascript
const API_URL = 'http://localhost:8000'
```

**Step 3:** Restart frontend

**Step 4:** Login with Mama Ochiengi credentials

---

## ✅ Verification

After deploying to production, verify:

1. **Test Login:**
   - Go to frontend login page
   - Enter: `mama_ochiengi` / `MamaOchiengi2025!`
   - Should succeed ✅

2. **Check User Info:**
   - After login, user should see business name
   - Dashboard should load

3. **Check Modules:**
   - All 14 modules should be accessible

---

## 🎯 Recommended Approach

**For QUICKEST fix:** Use **Option 1** (Render Shell)
- Takes 5 minutes
- Creates user directly on production
- No deployment wait time
- No code changes needed

**For COMPLETE setup:** Use **Option 2** (Full Deploy)
- Takes 10-15 minutes
- Deploys all code changes
- Includes seed data
- More permanent solution

**For TESTING:** Use **Option 3** (Local)
- Immediate
- Good for development
- Doesn't affect production

---

## 📋 Commands Summary

### Create User on Production (Copy-Paste Ready)

```python
from django.contrib.auth import get_user_model
User = get_user_model()
mama = User.objects.create_user(username='mama_ochiengi', email='mama.ochiengi@kisumutraders.co.ke', password='MamaOchiengi2025!', first_name='Mama', last_name='Ochiengi')
mama.is_active = True
mama.save()
print(f"Created: {mama.username}")
```

### Test Login on Production

```python
from django.contrib.auth import authenticate
user = authenticate(username='mama_ochiengi', password='MamaOchiengi2025!')
print("Success!" if user else "Failed!")
```

---

## 🚨 Important Notes

1. **Local ≠ Production:** Changes in local database don't automatically go to production
2. **JWT Tokens:** After creating user, frontend will get fresh token with correct permissions
3. **Seed Data:** If you need the 656 transactions on production, you'll need to run seed commands there too
4. **Alternative:** For quick testing, you can use existing production users (Jackson, etc.)

---

**Status:** User exists locally ✅ | User exists on production ❌  
**Action:** Deploy to production using Option 1, 2, or 3 above  
**ETA:** 5-15 minutes depending on option chosen

