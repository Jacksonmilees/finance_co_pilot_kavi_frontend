# Fixing 401 Unauthorized Error for Mama Ochiengi

## Error Message
```
POST https://backend-kavi-sme.onrender.com/api/auth/token/ 401 (Unauthorized)
Error: No active account found with the given credentials
```

## ✅ Backend Verification

The backend has been tested and confirmed:
- ✅ User exists: `mama_ochiengi` (ID: 46)
- ✅ Password is correct: `MamaOchiengi2025!`
- ✅ Account is active: `True`
- ✅ Authentication test: **SUCCESSFUL**

**The credentials work on the backend!**

---

## 🔍 Root Causes

Since the backend authentication works, the 401 error is caused by one of these:

### 1. **Backend Not Deployed** (Most Likely)
**Problem:** Changes made locally haven't been deployed to Render

**Solution:**
```bash
# From project root
git add -A
git commit -m "Add Mama Ochiengi account with business and modules"
git push origin main
```

Then wait for Render to redeploy (5-10 minutes)

### 2. **Database Not Synced on Production**
**Problem:** Mama Ochiengi user exists locally but not on production database

**Check:** Look at Render deployment logs

**Solution:** Run migrations and seed on production:
- In Render dashboard, go to your web service
- Open "Shell" tab
- Run:
```bash
python manage.py migrate
python manage.py setup_mama_ochiengi
```

### 3. **Frontend Using Cached Old Backend**
**Problem:** Browser cached old API responses

**Solution:**
- Clear browser cache
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or open in Incognito/Private window

---

## 🔧 Quick Fix Steps

### Step 1: Check if Backend is Deployed

Visit in browser:
```
https://backend-kavi-sme.onrender.com/api/users/
```

If you get an error page or "Service Unavailable", the backend needs to be deployed.

### Step 2: Deploy Backend Changes

```bash
cd C:\Users\Hp\Desktop\Finance-Growth-Co-pilot

# Stage all changes
git add -A

# Commit
git commit -m "Setup Mama Ochiengi: assign business, modules, and verify login"

# Push to trigger Render deployment
git push origin main
```

### Step 3: Run Setup Command on Production

Once deployed, in Render Shell:
```bash
python manage.py setup_mama_ochiengi
python manage.py fix_mama_login.py
```

Or create the user directly on production using Django shell:
```bash
python manage.py shell
```

Then:
```python
from django.contrib.auth import get_user_model
User = get_user_model()

# Create or get user
mama, created = User.objects.get_or_create(
    username='mama_ochiengi',
    defaults={
        'email': 'mama.ochiengi@kisumutraders.co.ke',
        'first_name': 'Mama',
        'last_name': 'Ochiengi',
        'is_active': True
    }
)

# Set password
mama.set_password('MamaOchiengi2025!')
mama.save()

print(f"User {mama.username} ready with ID {mama.id}")
```

### Step 4: Assign Business on Production

Still in Django shell:
```python
from users.models import Business, Membership

# Get or create business
business, _ = Business.objects.get_or_create(
    legal_name='Mama Ochiengi Fresh Produce Ltd',
    defaults={
        'owner': mama,
        'dba_name': 'Mama Ochiengi Fresh Produce',
        'hq_city': 'Kisumu',
        'hq_country': 'Kenya'
    }
)

# Create membership
membership, _ = Membership.objects.get_or_create(
    business=business,
    user=mama,
    defaults={
        'role_in_business': 'business_admin',
        'is_active': True
    }
)

print(f"Membership created: {membership}")
```

### Step 5: Test Login

Try logging in again with:
- Username: `mama_ochiengi`
- Password: `MamaOchiengi2025!`

---

## 🎯 Alternative: Use Existing Test User

If you need to test immediately, use existing credentials:

**Option 1: Jackson (Super Admin)**
- Username: `Jackson`
- Password: `3r14F65gMv`

**Option 2: Demo Users**
Check `backend/core/management/commands/seed_demo_data.py` for other test accounts

---

## 📋 Verification Checklist

After deployment:

- [ ] Backend is accessible at `https://backend-kavi-sme.onrender.com`
- [ ] API health check works: `/api/`
- [ ] User endpoint works: `/api/users/`
- [ ] Login works with Mama Ochiengi credentials
- [ ] User sees business assignment
- [ ] Transactions and invoices load

---

## 🔍 Debug Commands

### Check if user exists on production:
```bash
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(User.objects.filter(username='mama_ochiengi').exists())"
```

### List all users:
```bash
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); [print(f'{u.id}: {u.username} - {u.email}') for u in User.objects.all()]"
```

### Test authentication:
```bash
python manage.py shell -c "from django.contrib.auth import authenticate; user = authenticate(username='mama_ochiengi', password='MamaOchiengi2025!'); print('Success!' if user else 'Failed!')"
```

---

## 📝 Summary

**Local Status:** ✅ Everything works  
**Production Status:** ⚠️ Needs deployment  
**Action Required:** Deploy backend changes to Render  
**ETA:** 5-10 minutes after git push

**The credentials are correct - the user just needs to exist on production!**

