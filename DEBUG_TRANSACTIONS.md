# Transactions Page Debugging Guide

## Quick Debugging Steps

### Step 1: Check Browser Console
1. Open the Transactions page in your browser
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Look for these specific log messages:

#### Expected Logs (Good ✅):
```
⚠️ No businessId provided
⚠️ User not authenticated, cannot fetch transactions
📤 Fetching transactions with params: {business: X}
📥 Raw API response: [...]
✅ Loaded N transactions for business X
```

#### Error Logs (Problem ❌):
```
❌ Error fetching transactions: ...
Error details: ...
```

### Step 2: Check Network Tab
1. In Developer Tools, go to **Network** tab
2. Filter by **Fetch/XHR**
3. Look for a request to: `/api/finance/transactions/?business=X`
4. Click on it and check:
   - **Status**: Should be 200 (OK)
   - **Preview/Response**: Should show an array of transactions
   - If Status is 401: Authentication issue
   - If Status is 404: Backend not running or wrong URL
   - If Status is 500: Backend error

### Step 3: Common Issues & Fixes

#### Issue 1: "⚠️ No businessId provided"
**Cause**: No business selected or business context not loaded
**Fix**: 
- Check if you're logged in
- Check if you have a business assigned to your account
- Look at the top of the page - is there a business selector?

#### Issue 2: "⚠️ User not authenticated"
**Cause**: User not logged in or session expired
**Fix**:
- Log out and log back in
- Check localStorage for `access_token`:
  ```javascript
  // In console, run:
  localStorage.getItem('access_token')
  ```
- If null, you need to log in again

#### Issue 3: "❌ Error fetching transactions"
**Cause**: Network/Backend error
**Fix**:
- Check if backend is running on http://localhost:8000
- Check the .env file for correct VITE_API_URL
- Look at the full error in console for more details

#### Issue 4: API returns empty array []
**Cause**: No transactions exist OR permission issue
**Fix**:
- Try creating a transaction manually
- Check if you're using the correct business ID
- Verify your user role (staff vs admin)

### Step 4: Manual API Test
You can test the API directly in the browser console:

```javascript
// 1. Get your current businessId
const businessId = localStorage.getItem('activeBusinessId');
console.log('Business ID:', businessId);

// 2. Get your auth token
const token = localStorage.getItem('access_token');
console.log('Token exists:', !!token);

// 3. Manually fetch transactions
fetch(`http://localhost:8000/api/finance/transactions/?business=${businessId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err));
```

### Step 5: Check React Query DevTools
If you have React Query DevTools enabled:
1. Look for the query with key: `['transactions', businessId, userId]`
2. Check its status: `loading`, `success`, `error`
3. Look at the data stored in the cache

### Step 6: Verify Backend is Running
Check that the Django backend is running:
```bash
# In a terminal
cd d:\2025-Projects\November-2025\finance_co_pilot_kavi_frontend\backend
python manage.py runserver
```

Check backend logs for any errors when the request is made.

---

## What to Report Back

Please share:
1. **Console logs** - Copy/paste or screenshot
2. **Network request details** - Status code, Response
3. **Any error messages** - Full text
4. **Current values**:
   ```javascript
   // Run in console and share output:
   console.log({
     businessId: localStorage.getItem('activeBusinessId'),
     hasToken: !!localStorage.getItem('access_token'),
     userId: JSON.parse(localStorage.getItem('user') || '{}').id
   });
   ```

This will help me pinpoint the exact issue!
