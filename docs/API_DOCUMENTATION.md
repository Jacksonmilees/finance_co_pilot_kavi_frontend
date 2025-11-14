# Finance Growth Co-Pilot - API Documentation

##  API Overview

The Finance Growth Co-Pilot provides a comprehensive REST API for SME financial management with AI-powered insights and automation capabilities.

**Base URL**: `http://localhost:8000/api`

##  Authentication

All API endpoints (except registration and login) require JWT authentication.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

##  Financial Management APIs

### Dashboard Data

#### Get Dashboard Overview
```http
GET /api/finance/dashboard/
```

**Query Parameters:**
- `business_id` (optional): Filter by specific business
- `period` (optional): Time period in days (default: 30)

**Response:**
```json
{
  "summary": {
    "total_income": "50000.00",
    "total_expenses": "35000.00",
    "net_profit": "15000.00",
    "currency": "KES"
  },
  "recent_transactions": [...],
  "budgets": [...],
  "overdue_invoices": [...],
  "credit_score": {...},
  "businesses": [...]
}
```

### Transaction Management

#### List Transactions
```http
GET /api/finance/transactions/
```

**Query Parameters:**
- `business_id` (optional): Filter by business
- `transaction_type` (optional): income, expense, transfer, etc.
- `category` (optional): Transaction category
- `start_date` (optional): Start date filter
- `end_date` (optional): End date filter

**Response:**
```json
{
  "count": 25,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "business": "business_id",
      "amount": "1000.00",
      "currency": "KES",
      "transaction_type": "income",
      "payment_method": "mpesa",
      "status": "completed",
      "description": "Sales revenue",
      "category": "Sales",
      "transaction_date": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Create Transaction
```http
POST /api/finance/transactions/
```

**Request Body:**
```json
{
  "business": "business_id",
  "amount": "1000.00",
  "currency": "KES",
  "transaction_type": "income",
  "payment_method": "mpesa",
  "description": "Sales revenue",
  "category": "Sales",
  "supplier": "Customer Name",
  "transaction_date": "2024-01-15T10:30:00Z"
}
```

#### Transaction Analytics
```http
GET /api/finance/transactions/analytics/
```

**Query Parameters:**
- `business_id` (optional): Filter by business
- `period` (optional): Analysis period in days (default: 30)

**Response:**
```json
{
  "period": "30 days",
  "total_transactions": 25,
  "total_amount": "50000.00",
  "average_transaction": "2000.00",
  "income_count": 15,
  "expense_count": 10,
  "top_categories": [
    {"category": "Sales", "count": 8, "total": "25000.00"}
  ],
  "payment_methods": [
    {"payment_method": "mpesa", "count": 12, "total": "30000.00"}
  ],
  "currency": "KES"
}
```

#### Financial Summary
```http
GET /api/finance/transactions/summary/
```

**Response:**
```json
{
  "total_income": "50000.00",
  "total_expenses": "35000.00",
  "net_profit": "15000.00",
  "cash_flow": "15000.00",
  "outstanding_invoices": "10000.00",
  "overdue_invoices": "2000.00",
  "budget_utilization": 75.5,
  "credit_score": 750,
  "currency": "KES"
}
```

### Invoice Management

#### List Invoices
```http
GET /api/finance/invoices/
```

**Query Parameters:**
- `business_id` (optional): Filter by business
- `status` (optional): draft, sent, paid, overdue, cancelled
- `customer_name` (optional): Filter by customer

#### Create Invoice
```http
POST /api/finance/invoices/
```

**Request Body:**
```json
{
  "business": "business_id",
  "invoice_number": "INV-001",
  "customer_name": "Customer Name",
  "customer_email": "customer@example.com",
  "customer_phone": "+254700000000",
  "subtotal": "1000.00",
  "tax_amount": "160.00",
  "total_amount": "1160.00",
  "currency": "KES",
  "issue_date": "2024-01-15",
  "due_date": "2024-01-30",
  "notes": "Payment terms: 30 days"
}
```

#### Send Invoice
```http
POST /api/finance/invoices/{id}/send_invoice/
```

#### Mark Invoice as Paid
```http
POST /api/finance/invoices/{id}/mark_paid/
```

### Budget Management

#### List Budgets
```http
GET /api/finance/budgets/
```

#### Create Budget
```http
POST /api/finance/budgets/
```

**Request Body:**
```json
{
  "business": "business_id",
  "name": "Marketing Budget",
  "description": "Monthly marketing expenses",
  "budget_type": "monthly",
  "category": "Marketing",
  "budgeted_amount": "5000.00",
  "currency": "KES",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "alert_threshold": 80.0
}
```

#### Budget Analytics
```http
GET /api/finance/budgets/analytics/
```

**Response:**
```json
{
  "total_budgets": 5,
  "active_budgets": 4,
  "total_budgeted": "20000.00",
  "total_spent": "15000.00",
  "over_budget_count": 1,
  "near_limit_count": 2,
  "budget_utilization": 75.0,
  "currency": "KES"
}
```

##  AI-Powered Features

### Financial Forecasting

#### Generate Revenue Forecast
```http
POST /api/finance/forecasts/generate_forecast/
```

**Request Body:**
```json
{
  "forecast_type": "revenue",
  "business_id": "business_id"
}
```

**Response:**
```json
{
  "forecast_id": "uuid",
  "forecast_data": {
    "monthly_forecast": [5000, 5500, 6000, 6500, 7000, 7500],
    "confidence": 85.0,
    "trend": "growing",
    "growth_rate": 2.0
  },
  "confidence_score": 85.0,
  "recommendations": [
    "Revenue is projected to grow - consider expanding capacity",
    "Plan for increased working capital needs"
  ]
}
```

### Credit Scoring

#### Calculate Credit Score
```http
POST /api/finance/credit-scores/calculate_score/
```

**Request Body:**
```json
{
  "business_id": "business_id"
}
```

**Response:**
```json
{
  "credit_score_id": "uuid",
  "score": 750,
  "score_category": "Good",
  "factors": {
    "payment_history": "Payment history: 85.0%",
    "credit_utilization": "Credit utilization: 70.0%",
    "business_age": "Business age: 80.0%",
    "revenue_stability": "Revenue stability: 75.0%",
    "debt_to_income": "Debt-to-income: 65.0%"
  },
  "recommendations": [
    "Maintain consistent payment history",
    "Consider reducing credit utilization",
    "Continue building business credit"
  ]
}
```

##  Automation APIs

### M-Pesa Reconciliation
```http
POST /api/finance/automation/mpesa-reconcile/
```

**Request Body:**
```json
{
  "business_id": "business_id",
  "date_range": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }
}
```

### Invoice Reminders
```http
POST /api/finance/automation/send-reminder/
```

**Request Body:**
```json
{
  "invoice_id": "invoice_id",
  "reminder_type": "first"
}
```

### Budget Alerts
```http
POST /api/finance/automation/budget-alert/
```

**Request Body:**
```json
{
  "budget_id": "budget_id",
  "alert_type": "threshold_reached"
}
```

##  Market Intelligence APIs

### Market Analysis
```http
GET /api/finance/market-intelligence/
```

**Query Parameters:**
- `industry`: Industry to analyze
- `location`: Location (default: Kenya)

### Supplier Analysis
```http
GET /api/finance/supplier-analysis/
```

**Query Parameters:**
- `supplier_name`: Supplier to analyze
- `product_category`: Product category

### Competitor Analysis
```http
GET /api/finance/competitor-analysis/
```

**Query Parameters:**
- `business_name`: Your business name
- `industry`: Industry sector

##  User Management APIs

### User Registration
```http
POST /api/users/register/
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}
```

### User Login
```http
POST /api/auth/token/
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### User Profile
```http
GET /api/users/profile/
```

**Response:**
```json
{
  "id": 1,
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "phone_number": "+254700000000",
  "job_title": "CEO",
  "company": "My Business",
  "industry": "Technology",
  "country": "Kenya",
  "city": "Nairobi",
  "risk_tolerance": "moderate"
}
```

### Business Management
```http
GET /api/users/businesses/
POST /api/users/businesses/
GET /api/users/businesses/{id}/
PUT /api/users/businesses/{id}/
DELETE /api/users/businesses/{id}/
```

##  Frontend Integration

### Vue.js Components

The frontend includes these main components:

1. **Dashboard.vue**: Main financial dashboard
2. **Login.vue**: User authentication
3. **Register.vue**: User registration
4. **Navigation.vue**: App navigation
5. **TransactionList.vue**: Transaction management
6. **InvoiceManager.vue**: Invoice management
7. **BudgetTracker.vue**: Budget tracking
8. **ForecastView.vue**: AI forecasting display

### API Integration Example

```javascript
// Fetch dashboard data
const fetchDashboardData = async () => {
  const token = localStorage.getItem('access_token')
  const response = await fetch('http://localhost:8000/api/finance/dashboard/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return await response.json()
}

// Create transaction
const createTransaction = async (transactionData) => {
  const token = localStorage.getItem('access_token')
  const response = await fetch('http://localhost:8000/api/finance/transactions/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transactionData)
  })
  return await response.json()
}
```

## 🔒 Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

##  Rate Limiting

- **Authentication**: 5 requests per minute
- **Financial APIs**: 100 requests per hour
- **AI Services**: 20 requests per hour
- **General APIs**: 1000 requests per hour

##  Testing

### Test Data
Use the provided test data to verify API functionality:

```json
{
  "test_user": {
    "username": "testuser",
    "password": "testpass123",
    "email": "test@example.com"
  },
  "test_business": {
    "legal_name": "Test Business",
    "industry": "Technology"
  }
}
```

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass123"}'

# Test dashboard
curl -X GET http://localhost:8000/api/finance/dashboard/ \
  -H "Authorization: Bearer <access_token>"
```

##  SDKs and Libraries

### Python SDK
```python
from finance_growth_copilot import FinanceClient

client = FinanceClient(
    base_url="http://localhost:8000/api",
    access_token="your_access_token"
)

# Get dashboard data
dashboard = client.get_dashboard()

# Create transaction
transaction = client.create_transaction({
    "amount": "1000.00",
    "transaction_type": "income",
    "description": "Sales revenue"
})
```

### JavaScript SDK
```javascript
import { FinanceClient } from 'finance-growth-copilot-js'

const client = new FinanceClient({
  baseURL: 'http://localhost:8000/api',
  accessToken: 'your_access_token'
})

// Get dashboard data
const dashboard = await client.getDashboard()

// Create transaction
const transaction = await client.createTransaction({
  amount: '1000.00',
  transaction_type: 'income',
  description: 'Sales revenue'
})
```

---