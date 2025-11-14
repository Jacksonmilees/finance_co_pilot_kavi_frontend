# Migration Instructions

## Issue
The Notification and MpesaPayment models have been added but migrations haven't been created/run yet, causing 500 errors.

## Solution

Run these commands in the `backend/` directory:

```bash
cd backend

# Create migrations for new models
python manage.py makemigrations core
python manage.py makemigrations finance

# Apply migrations
python manage.py migrate
```

## What This Will Do

1. **Create migrations for:**
   - `Notification` model in `core` app
   - `MpesaPayment` model in `finance` app

2. **Apply migrations:**
   - Create the database tables
   - Set up indexes
   - Enable the new features

## After Migration

The following endpoints will work:
- `/api/core/notifications/` - Get notifications
- `/api/core/notifications/unread-count/` - Get unread count
- `/api/finance/mpesa/initiate/` - Initiate M-Pesa payment
- `/api/finance/mpesa/payments/` - List M-Pesa payments

## Verification

After running migrations, test:
1. Notifications should load without 500 errors
2. Module Assignment should load businesses
3. M-Pesa payments should work






