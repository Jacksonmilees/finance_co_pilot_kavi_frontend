# Backend Cache Table Fix

## Problem
Django is configured to use database caching (see `backend/FG_copilot/settings.py` line 108-117), but the `cache_table` hasn't been created in the PostgreSQL database on Render.com.

**Error:**
```
ProgrammingError: relation "cache_table" does not exist
```

## Solution

You need to SSH into your Render.com backend service and run the Django command to create the cache table.

### Steps to Fix on Render.com:

1. **Open Render Dashboard:**
   - Go to https://dashboard.render.com
   - Navigate to your backend service (`backend-kavi-sme`)

2. **Open Shell:**
   - Click on the "Shell" tab in your service dashboard

3. **Run the Cache Table Creation Command:**
   ```bash
   python manage.py createcachetable
   ```

4. **Verify:**
   - The command should output: `Cache table 'cache_table' created.`
   - Try creating an invoice again - the error should be gone

### Alternative: Disable Caching (Temporary Workaround)

If you can't access the shell right now, you can temporarily disable database caching by updating `backend/FG_copilot/settings.py`:

```python
# Replace lines 108-117 with:
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}
```

Then redeploy. **Note:** This disables caching entirely, so performance may be slower.

### Why This Happened

The `createcachetable` command is not run automatically during migrations. It needs to be run manually whenever you set up database caching for the first time.

### Long-term Fix

Add this to your deployment script (e.g., in `backend/build.sh` or Render's build command):

```bash
python manage.py migrate
python manage.py createcachetable
python manage.py collectstatic --no-input
```

---

## Current Status
- Frontend has been made resilient to handle backend errors gracefully
- KAVI user data tracking is now working correctly
- Sidebar is fully functional and collapsible

