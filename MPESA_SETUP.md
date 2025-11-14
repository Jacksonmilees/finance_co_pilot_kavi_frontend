# M-Pesa Integration Setup Guide

## Required Environment Variables

Add these environment variables to your `.env` file or deployment environment:

### For Sandbox (Testing)

```env
# M-Pesa Configuration
MPESA_SANDBOX=True
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_sandbox_passkey
MPESA_INITIATOR_NAME=testapi
MPESA_INITIATOR_PASSWORD=your_sandbox_initiator_password
BASE_URL=http://localhost:8000
```

### For Production

```env
# M-Pesa Configuration
MPESA_SANDBOX=False
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_SHORTCODE=your_paybill_number
MPESA_PASSKEY=your_production_passkey
MPESA_INITIATOR_NAME=your_initiator_name
MPESA_INITIATOR_PASSWORD=your_production_initiator_password
BASE_URL=https://your-domain.com
```

## How to Get M-Pesa Credentials

### 1. Register on Safaricom Developer Portal

1. Go to https://developer.safaricom.co.ke/
2. Sign up for a developer account
3. Verify your email

### 2. Create an App

1. Log in to the developer portal
2. Go to "My Apps"
3. Click "Create App"
4. Fill in the app details:
   - App Name: Your app name
   - Short Description: Brief description
5. After creation, you'll get:
   - **Consumer Key**
   - **Consumer Secret**

### 3. Get Sandbox Credentials (For Testing)

1. Go to "Sandbox" section
2. You'll see:
   - **Shortcode**: Usually `174379` for sandbox
   - **Passkey**: Generated automatically
   - **Initiator Name**: Usually `testapi`
   - **Initiator Password**: Generated automatically

### 4. Get Production Credentials

1. Complete the onboarding process
2. Submit your business details
3. Wait for approval from Safaricom
4. Once approved, you'll receive:
   - Production Consumer Key & Secret
   - Your Paybill/Till Number (Shortcode)
   - Production Passkey
   - Initiator Name & Password

### 5. Configure Callback URLs

In your Safaricom Developer Portal:

1. Go to your app settings
2. Set the callback URL for STK Push:
   ```
   https://your-domain.com/api/finance/mpesa/callback/
   ```
3. Make sure your server is accessible from the internet (use ngrok for local testing)

## Testing M-Pesa Integration

### Sandbox Test Numbers

Use these test numbers for sandbox testing:

- **Phone Number**: 254708374149
- **Amount**: Any amount (will be simulated)
- **PIN**: Use the test PIN provided in Safaricom documentation

### Testing Steps

1. Ensure all environment variables are set
2. Start your Django server
3. Use the M-Pesa payment modal in the frontend
4. Enter the test phone number
5. Complete the payment on your phone (sandbox will simulate the payment)

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit credentials to version control**
   - Use `.env` file (already in `.gitignore`)
   - Use environment variables in production

2. **Use HTTPS in production**
   - M-Pesa requires HTTPS for production callbacks
   - Use a valid SSL certificate

3. **Validate callbacks**
   - Always verify callback signatures
   - Store payment records securely

4. **Rate Limiting**
   - Implement rate limiting on payment endpoints
   - Monitor for suspicious activity

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Check that all environment variables are set correctly
   - Verify credentials in Safaricom Developer Portal

2. **"Callback not received"**
   - Check that `BASE_URL` is correct and accessible
   - Verify callback URL is set in Safaricom portal
   - Check server logs for callback requests

3. **"Payment timeout"**
   - Ensure callback URL is publicly accessible
   - Check firewall settings
   - Verify SSL certificate (for production)

4. **"Invalid phone number format"**
   - Phone numbers must be in format: `254XXXXXXXXX` (Kenya)
   - Remove leading `+` or `0`
   - Example: `0712345678` → `254712345678`

## Support

For M-Pesa API issues:
- Safaricom Developer Portal: https://developer.safaricom.co.ke/
- API Documentation: https://developer.safaricom.co.ke/APIs
- Support: developer@safaricom.co.ke

## Example .env File

```env
# Database
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432

# Django
SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# M-Pesa (Sandbox)
MPESA_SANDBOX=True
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_INITIATOR_NAME=testapi
MPESA_INITIATOR_PASSWORD=your_initiator_password_here
BASE_URL=http://localhost:8000
```







