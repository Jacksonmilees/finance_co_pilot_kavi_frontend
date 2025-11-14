# Fix 500 Internal Server Errors

## Root Cause
The 500 errors are happening because:
1. **Notification model** - Database table doesn't exist (migration not run)
2. **MpesaPayment model** - Database table doesn't exist (migration not run)
3. **Business model** - Trying to access `business_type` field that doesn't exist on Business model

## Immediate Fix Applied
I've added error handling to prevent 500 errors:
- Notifications endpoints now return empty array/0 if table doesn't exist
- Business listing now handles missing fields gracefully

## Permanent Fix - Run Migrations

**Run these commands in the `backend/` directory:**

```bash
cd backend

# Create migrations for new models
python manage.py makemigrations core
python manage.py makemigrations finance

# Apply migrations to database
python manage.py migrate
```

## What Will Be Created

### Core App Migrations:
- `Notification` table with all fields
- Indexes for performance

### Finance App Migrations:
- `MpesaPayment` table with all fields
- Indexes for performance

## After Running Migrations

All endpoints will work properly:
- ✅ `/api/core/notifications/` - Will return actual notifications
- ✅ `/api/core/notifications/unread-count/` - Will return actual count
- ✅ `/api/core/admin/businesses/` - Will return businesses correctly
- ✅ `/api/finance/mpesa/initiate/` - Will save payments to database
- ✅ `/api/finance/mpesa/payments/` - Will list payments

## Verification

After migrations:
1. Check Django admin - you should see Notification and MpesaPayment models
2. Test notifications - should work without errors
3. Test module assignment - businesses should load
4. Test M-Pesa - payments should save to database

## Error Handling

The code now has error handling that:
- Returns empty arrays instead of 500 errors for notifications
- Returns 0 count instead of 500 errors for unread count
- Handles missing Business fields gracefully

This allows the frontend to work even before migrations are run, but you should run migrations for full functionality.






