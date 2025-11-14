# Environment Variables Required

## M-Pesa Configuration Variables

Add these to your `.env` file in the `backend/` directory:

```env
# ==================== M-PESA CONFIGURATION ====================
# Get these from: https://developer.safaricom.co.ke/

# Sandbox Mode (True for testing, False for production)
MPESA_SANDBOX=True

# Consumer Key and Secret (from Safaricom Developer Portal)
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here

# Shortcode (Paybill or Till Number)
# Sandbox: Usually 174379
# Production: Your actual Paybill/Till number
MPESA_SHORTCODE=174379

# Passkey (from Safaricom Developer Portal)
MPESA_PASSKEY=your_passkey_here

# Initiator Name and Password (for B2C payments)
# Sandbox: Usually "testapi"
# Production: Your actual initiator name
MPESA_INITIATOR_NAME=testapi
MPESA_INITIATOR_PASSWORD=your_initiator_password_here

# Base URL for callbacks (your backend URL)
# Development: http://localhost:8000
# Production: https://your-domain.com
BASE_URL=http://localhost:8000
```

## How to Get These Values

### Step 1: Register on Safaricom Developer Portal
1. Go to https://developer.safaricom.co.ke/
2. Sign up for a developer account
3. Verify your email

### Step 2: Create an App
1. Log in to the developer portal
2. Go to "My Apps"
3. Click "Create App"
4. Fill in app details
5. You'll receive:
   - **MPESA_CONSUMER_KEY**
   - **MPESA_CONSUMER_SECRET**

### Step 3: Get Sandbox Credentials (For Testing)
1. Go to "Sandbox" section
2. You'll see:
   - **MPESA_SHORTCODE**: Usually `174379`
   - **MPESA_PASSKEY**: Generated automatically
   - **MPESA_INITIATOR_NAME**: Usually `testapi`
   - **MPESA_INITIATOR_PASSWORD**: Generated automatically

### Step 4: Production Credentials
1. Complete onboarding process
2. Submit business details
3. Wait for Safaricom approval
4. Once approved, you'll receive production credentials

## Example .env File (Complete)

```env
# Database Configuration
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=your_db_password
DB_HOST=ep-rapid-cake-adbchjjz-pooler.c-2.us-east-1.aws.neon.tech
DB_PORT=5432

# Django Configuration
SECRET_KEY=your_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# M-Pesa Configuration (Sandbox)
MPESA_SANDBOX=True
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_sandbox_passkey
MPESA_INITIATOR_NAME=testapi
MPESA_INITIATOR_PASSWORD=your_sandbox_initiator_password
BASE_URL=http://localhost:8000
```

## Testing M-Pesa Integration

### Sandbox Test Phone Number
- **Phone**: `254708374149`
- **Amount**: Any amount (will be simulated)
- **PIN**: Use test PIN from Safaricom documentation

### Testing Steps
1. Ensure all environment variables are set
2. Start Django server: `python manage.py runserver`
3. Use M-Pesa payment modal in frontend
4. Enter test phone number
5. Complete payment on phone (sandbox will simulate)

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to version control
- Use environment variables in production
- Use HTTPS in production (required by M-Pesa)
- Validate all callbacks
- Implement rate limiting

## Troubleshooting

### "Invalid credentials" error
- Check all environment variables are set
- Verify credentials in Safaricom portal
- Ensure no extra spaces in values

### "Callback not received"
- Check `BASE_URL` is correct and accessible
- Verify callback URL in Safaricom portal
- Check server logs for callback requests
- Use ngrok for local testing

### "Payment timeout"
- Ensure callback URL is publicly accessible
- Check firewall settings
- Verify SSL certificate (production)

## Support

- Safaricom Developer Portal: https://developer.safaricom.co.ke/
- API Documentation: https://developer.safaricom.co.ke/APIs
- Support Email: developer@safaricom.co.ke






