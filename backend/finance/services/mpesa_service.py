"""
M-Pesa Integration Service using Safaricom Daraja API
"""
import requests
import base64
from datetime import datetime
from django.conf import settings
import json
import logging

logger = logging.getLogger(__name__)


class MpesaService:
    """Service for M-Pesa API integration"""
    
    def __init__(self):
        # M-Pesa API credentials from settings
        self.consumer_key = getattr(settings, 'MPESA_CONSUMER_KEY', '')
        self.consumer_secret = getattr(settings, 'MPESA_CONSUMER_SECRET', '')
        self.passkey = getattr(settings, 'MPESA_PASSKEY', '')
        self.shortcode = getattr(settings, 'MPESA_SHORTCODE', '')
        self.initiator_name = getattr(settings, 'MPESA_INITIATOR_NAME', '')
        self.initiator_password = getattr(settings, 'MPESA_INITIATOR_PASSWORD', '')
        
        # API URLs
        self.sandbox_base_url = 'https://sandbox.safaricom.co.ke'
        self.production_base_url = 'https://api.safaricom.co.ke'
        self.is_sandbox = getattr(settings, 'MPESA_SANDBOX', True)
        self.base_url = self.sandbox_base_url if self.is_sandbox else self.production_base_url
        
        self.access_token = None
        self.token_expires_at = None
    
    def get_access_token(self):
        """Get OAuth access token from M-Pesa API"""
        try:
            # Check if token is still valid
            if self.access_token and self.token_expires_at:
                if datetime.now() < self.token_expires_at:
                    return self.access_token
            
            # Generate token
            url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
            
            # Encode credentials
            credentials = f"{self.consumer_key}:{self.consumer_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            self.access_token = data.get('access_token')
            
            # Token expires in 1 hour, set expiry to 55 minutes for safety
            from datetime import timedelta
            self.token_expires_at = datetime.now() + timedelta(minutes=55)
            
            return self.access_token
            
        except Exception as e:
            logger.error(f"Error getting M-Pesa access token: {str(e)}")
            raise
    
    def generate_password(self):
        """Generate password for STK Push"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        data_to_encode = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(data_to_encode.encode()).decode()
        return password, timestamp
    
    def stk_push(self, phone_number, amount, account_reference, transaction_desc, callback_url=None):
        """
        Initiate STK Push (Lipa na M-Pesa Online)
        
        Args:
            phone_number: Customer phone number (254XXXXXXXXX format)
            amount: Amount to charge
            account_reference: Account reference (e.g., invoice number)
            transaction_desc: Transaction description
            callback_url: Callback URL for payment confirmation
        
        Returns:
            dict: Response from M-Pesa API
        """
        try:
            access_token = self.get_access_token()
            password, timestamp = self.generate_password()
            
            # Format phone number (remove + if present, ensure 254 format)
            phone_number = phone_number.replace('+', '').replace(' ', '')
            if not phone_number.startswith('254'):
                if phone_number.startswith('0'):
                    phone_number = '254' + phone_number[1:]
                else:
                    phone_number = '254' + phone_number
            
            url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                "BusinessShortCode": self.shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(amount),
                "PartyA": phone_number,
                "PartyB": self.shortcode,
                "PhoneNumber": phone_number,
                "CallBackURL": callback_url or f"{getattr(settings, 'BASE_URL', 'http://localhost:8000')}/api/finance/mpesa/callback/",
                "AccountReference": account_reference[:12],  # Max 12 characters
                "TransactionDesc": transaction_desc[:20]  # Max 20 characters
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Error initiating STK Push: {str(e)}")
            raise
    
    def query_stk_status(self, checkout_request_id):
        """
        Query STK Push status
        
        Args:
            checkout_request_id: Checkout request ID from STK Push response
        
        Returns:
            dict: Response from M-Pesa API
        """
        try:
            access_token = self.get_access_token()
            password, timestamp = self.generate_password()
            
            url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                "BusinessShortCode": self.shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "CheckoutRequestID": checkout_request_id
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Error querying STK status: {str(e)}")
            raise
    
    def register_c2b_urls(self, confirmation_url, validation_url):
        """
        Register C2B URLs for receiving payments
        
        Args:
            confirmation_url: URL to receive payment confirmations
            validation_url: URL to validate payments
        
        Returns:
            dict: Response from M-Pesa API
        """
        try:
            access_token = self.get_access_token()
            
            url = f"{self.base_url}/mpesa/c2b/v1/registerurl"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                "ShortCode": self.shortcode,
                "ResponseType": "Completed",
                "ConfirmationURL": confirmation_url,
                "ValidationURL": validation_url
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Error registering C2B URLs: {str(e)}")
            raise
    
    def b2c_payment(self, phone_number, amount, remarks, occasion=None):
        """
        Initiate B2C payment (Business to Customer)
        
        Args:
            phone_number: Customer phone number (254XXXXXXXXX format)
            amount: Amount to pay
            remarks: Payment remarks
            occasion: Optional occasion
        
        Returns:
            dict: Response from M-Pesa API
        """
        try:
            access_token = self.get_access_token()
            
            # Format phone number
            phone_number = phone_number.replace('+', '').replace(' ', '')
            if not phone_number.startswith('254'):
                if phone_number.startswith('0'):
                    phone_number = '254' + phone_number[1:]
                else:
                    phone_number = '254' + phone_number
            
            url = f"{self.base_url}/mpesa/b2c/v1/paymentrequest"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            security_credential = self._generate_security_credential()
            
            payload = {
                "InitiatorName": self.initiator_name,
                "SecurityCredential": security_credential,
                "CommandID": "SalaryPayment",
                "Amount": int(amount),
                "PartyA": self.shortcode,
                "PartyB": phone_number,
                "Remarks": remarks[:100],
                "QueueTimeOutURL": f"{getattr(settings, 'BASE_URL', 'http://localhost:8000')}/api/finance/mpesa/b2c-timeout/",
                "ResultURL": f"{getattr(settings, 'BASE_URL', 'http://localhost:8000')}/api/finance/mpesa/b2c-result/",
                "Occasion": occasion[:100] if occasion else ""
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Error initiating B2C payment: {str(e)}")
            raise
    
    def _generate_security_credential(self):
        """
        Generate security credential for B2C
        Note: In production, this should use RSA encryption with M-Pesa public key
        For sandbox, you can use the plain initiator password
        """
        if self.is_sandbox:
            return self.initiator_password
        else:
            # In production, encrypt with RSA
            # This is a placeholder - implement RSA encryption in production
            return self.initiator_password


# Singleton instance
_mpesa_service = None

def get_mpesa_service():
    """Get singleton M-Pesa service instance"""
    global _mpesa_service
    if _mpesa_service is None:
        _mpesa_service = MpesaService()
    return _mpesa_service







