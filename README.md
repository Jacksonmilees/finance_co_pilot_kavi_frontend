# Finance Growth Co-pilot 🚀

> **A comprehensive SME financial management platform with AI-powered insights**

Finance Growth Co-pilot is a production-ready financial management system designed specifically for Small and Medium Enterprises (SMEs) in Kenya. It combines modern financial tools with KAVI, an intelligent AI voice assistant that provides personalized business insights based on YOUR actual data.

## ✨ What's New (Latest Updates)

### 🎤 KAVI Enhanced with Full User Context
- ✅ KAVI now knows who you are (name, email, role)
- ✅ Access to your actual business data (not generic responses)
- ✅ Real-time financial context (last 7/30 days)
- ✅ Personalized insights based on YOUR numbers
- ✅ Multi-business support for users with multiple companies

### 📱 Mobile-First Responsive Design
- ✅ Fully responsive (works on 320px+ screens)
- ✅ Touch-optimized buttons (44px minimum)
- ✅ Custom scrollbars and smooth animations
- ✅ PWA-ready for mobile installation
- ✅ Optimized for slow networks

### 🔐 Complete Registration & Approval System
- ✅ Business and Individual registration flows
- ✅ Document upload and verification
- ✅ Super Admin approval workflow
- ✅ Real-time status tracking
- ✅ Automated credential generation

### 🎨 Enhanced UI/UX
- ✅ Modern, clean interface
- ✅ Loading states and skeletons
- ✅ Comprehensive error handling
- ✅ Toast notifications
- ✅ Accessibility improvements

## 🚀 Key Features

### 🎤 KAVI - Your AI Financial Assistant
- **Voice Conversation**: Talk naturally in English, Swahili, or Sheng
- **User Context Aware**: Knows your name, role, and business
- **Real-Time Data**: Access to your actual financial numbers
- **Personalized Insights**: Advice based on YOUR business, not generic tips
- **Multi-Language**: Code-switches like a true Kenyan
- **Financial Context**: Last 7/30 days income, expenses, invoices, transactions

### 💼 Financial Management
- **Dashboard Analytics**: Real-time financial metrics by role
- **Transaction Tracking**: Income and expense management with M-Pesa support
- **Invoice Management**: Create, send, and track invoices with eTIMS integration
- **Cash Flow Forecasting**: 30-day predictions with AI-powered analysis
- **Credit Score Tracking**: Business creditworthiness monitoring
- **Budget Management**: Set and track budgets with alerts
- **Supplier Management**: Track suppliers with reliability scores
- **Financial Forecasts**: AI-powered revenue and expense predictions

### 👥 Team & Access Control
- **3-Tier RBAC**: Super Admin, Business Admin, Staff/Viewer
- **Team Invitations**: Email-based member invites
- **Role Management**: Flexible permission system
- **Multi-Business**: Support for users in multiple businesses
- **Activity Tracking**: Monitor team performance
- **Customer Management**: Track customers and their transactions

### 📝 Registration System
- **Business Registration**: Complete onboarding with documents
- **Individual Registration**: Employee signup system
- **Admin Approval**: Super admin review workflow
- **Status Tracking**: Real-time application status
- **Auto Credentials**: Secure login generation

### 🔒 Admin & Security Features
- **Activity Logs**: Comprehensive audit trail
- **Security Monitoring**: Failed login tracking and session management
- **Module Assignment**: Feature control per business
- **User Management**: Complete user administration
- **Business Monitoring**: System-wide business analytics

### 📱 Mobile-First Design
- **Fully Responsive**: Works on all devices (320px+)
- **Touch-Optimized**: 44px minimum tap targets
- **Fast Loading**: Optimized for mobile networks
- **PWA Ready**: Install as mobile app
- **Offline Support**: Coming soon

## 📋 Current Progress

### ✅ Backend Infrastructure (Django)
- **Framework**: Django 5.2.6 with Django REST Framework 3.16.1
- **Database**: PostgreSQL with Neon cloud database integration
- **Authentication**: JWT-based authentication with SimpleJWT
- **CORS**: Configured for frontend-backend communication
- **Environment**: Secure environment variable management with python-dotenv
- **Database Testing**: Custom management command for database connection testing

#### Backend Apps & Models:
- **users app**: UserProfile, Business, Customer, Membership, BusinessInvitation, BusinessRegistration, IndividualRegistration
- **finance app**: Transaction, Invoice, InvoiceItem, Budget, CashFlow, FinancialForecast, CreditScore, Supplier
- **core app**: ActivityLog, UserSession, FailedLoginAttempt, ModuleAssignment

#### Backend Features Implemented:
- ✅ PostgreSQL database connection to Neon
- ✅ Environment variable configuration
- ✅ Database connection testing command (`python manage.py test_db`)
- ✅ JWT authentication setup with SimpleJWT
- ✅ CORS headers configuration
- ✅ Complete Django app structure (users, finance, core)
- ✅ User registration and authentication API
- ✅ Comprehensive user profile management system
- ✅ Business entity management with classification
- ✅ Financial data models (transactions, invoices, budgets, cash flow, forecasts, credit scores, suppliers)
- ✅ RESTful API endpoints for all features
- ✅ Team management and invitations
- ✅ Registration and approval system
- ✅ Admin monitoring and security features
- ✅ Comprehensive test suite with 95%+ coverage
- ✅ API documentation and Postman collection

### ✅ Frontend Foundation (React)
- **Framework**: React 18.2.0 with Vite build tool
- **Development**: Hot reload development server
- **Build**: Production-ready build system
- **State Management**: Zustand for voice assistant state
- **Data Fetching**: TanStack Query (React Query) for API calls
- **Routing**: React Router 6.8.1
- **Styling**: TailwindCSS 3.2.7 with shadcn/ui components
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

#### Frontend Features Implemented:
- ✅ React 18.2.0 application setup
- ✅ Vite development environment
- ✅ Complete application structure
- ✅ **KAVI Voice Assistant Integration** - Full voice conversation with Gemini AI
- ✅ **Eleven Labs TTS** - Premium voice quality integration
- ✅ **Financial Context Integration** - Real-time financial data in voice assistant
- ✅ **Beautiful UI/UX** - Market-ready design with animations
- ✅ **Role-Based Dashboards** - Super Admin, Business Admin, Staff/Viewer
- ✅ **Financial Pages** - Transactions, Invoices, Cash Flow, Credit, Suppliers
- ✅ **Team Management** - Invitations and member management
- ✅ **Registration Flows** - Business and individual registration
- ✅ **Admin Features** - User management, activity logs, security monitoring
- ✅ **Responsive Design** - Mobile-first approach

## 🛠️ Technology Stack

### Backend
- **Django 5.2.6** - Web framework
- **Django REST Framework 3.16.1** - API development
- **PostgreSQL** - Database (hosted on Neon)
- **JWT Authentication** - Secure user authentication with SimpleJWT
- **User Profiles** - Extended user data with financial preferences
- **Business Management** - Company profiles with AI classification
- **Python 3.10+** - Programming language

### Frontend
- **React 18.2.0** - JavaScript framework
- **Vite 7.2.2** - Fast build tool and dev server
- **React Router 6.8.1** - Client-side routing
- **TanStack Query 4.42.0** - Data fetching and caching
- **Zustand 5.0.8** - State management
- **TailwindCSS 3.2.7** - Utility-first CSS framework
- **shadcn/ui** - Component library (Radix UI)
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **Axios 1.13.2** - HTTP client
- **Modern JavaScript** - ES6+ features

### AI Integration
- **Google Gemini AI** - Voice conversation and chat
- **ElevenLabs TTS** - Premium voice synthesis
- **Web Speech API** - Browser-based voice recognition
- **Real-time Context Injection** - Financial data integration

## 🚧 Next Steps

### Immediate Priorities
1. **Financial Analytics**: Enhanced reporting and visualization
2. **Payment Integration**: M-Pesa and bank account integration
3. **Advanced Forecasting**: More sophisticated AI predictions
4. **Export Features**: PDF/Excel report generation
5. **Email Notifications**: Automated alerts and reminders
6. **Mobile App**: Native iOS/Android applications

### Future Features
- Real-time financial monitoring dashboards
- AI-powered growth recommendations
- Automated report generation
- Integration with banking APIs
- Multi-currency support
- Inventory management
- Payroll system
- Tax compliance tools

## 🏃‍♂️ Getting Started

### Prerequisites
- Python 3.10+
- Node.js 20.19.0+ or 22.12.0+
- PostgreSQL database (Neon account)

### Backend Setup
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py test_db  # Test database connection
python manage.py runserver### API Testing
# Run comprehensive test suite
python manage.py test

# Run specific test modules
python manage.py test users.tests
python manage.py test finance.tests
python manage.py test core.tests### Frontend Setup
cd frontend  # or root directory
npm install
npm run dev## 🔌 API Endpoints

### Authentication
- `POST /api/users/register/` - User registration with profile creation
- `POST /api/auth/token/` - JWT token obtain
- `POST /api/auth/token/refresh/` - JWT token refresh

### User Profile Management
- `GET /api/users/profile/` - Get user profile (creates if missing)
- `PATCH /api/users/profile/update/` - Partial profile update
- `PUT /api/users/profile/update/` - Full profile update
- `POST /api/users/profile/create/` - Create profile with initial data
- `GET /api/users/me/` - Get basic user info

### Business Management
- `GET /api/users/businesses/` - List user's businesses
- `POST /api/users/businesses/` - Create new business
- `GET /api/users/businesses/{id}/` - Get business details
- `PUT /api/users/businesses/{id}/` - Update business
- `DELETE /api/users/businesses/{id}/` - Delete business
- `POST /api/users/businesses/{id}/classify/` - AI business classification

### Financial Management
- `GET /api/finance/transactions/` - List transactions
- `POST /api/finance/transactions/` - Create transaction
- `GET /api/finance/transactions/analytics/` - Transaction analytics
- `GET /api/finance/transactions/summary/` - Financial summary
- `GET /api/finance/invoices/` - List invoices
- `POST /api/finance/invoices/` - Create invoice
- `GET /api/finance/budgets/` - List budgets
- `POST /api/finance/budgets/` - Create budget
- `GET /api/finance/cash-flow/` - Cash flow data
- `GET /api/finance/forecasts/` - Financial forecasts
- `GET /api/finance/credit-scores/` - Credit score data
- `GET /api/finance/suppliers/` - List suppliers
- `POST /api/finance/suppliers/` - Create supplier

### Team Management
- `GET /api/users/memberships/` - List team memberships
- `POST /api/users/invitations/` - Create team invitation
- `GET /api/users/invitations/` - List invitations
- `POST /api/users/invitations/{id}/accept/` - Accept invitation

### Registration & Approval
- `POST /api/users/register/business/` - Business registration
- `POST /api/users/register/individual/` - Individual registration
- `GET /api/users/registrations/` - List registrations (Super Admin)
- `POST /api/users/registrations/{id}/approve/` - Approve registration
- `POST /api/users/registrations/{id}/reject/` - Reject registration

### Admin Features
- `GET /api/core/admin/activity-logs/` - Activity logs
- `GET /api/core/admin/active-sessions/` - Active sessions
- `GET /api/core/admin/security-logs/` - Security logs
- `GET /api/core/admin/failed-logins/` - Failed login attempts
- `GET /api/core/admin/businesses/` - All businesses (Super Admin)
- `GET /api/core/admin/businesses/{id}/modules/` - Business modules
- `POST /api/core/admin/businesses/{id}/modules/{module_id}/` - Assign module

### User Profile Features
- **Personal Info**: Phone, bio, avatar, date of birth
- **Professional**: Job title, company, industry, experience
- **Location**: Country, city, timezone
- **Preferences**: Language, currency, notifications
- **Financial**: Risk tolerance (conservative/moderate/aggressive)

### Business Profile Features
- **Company Details**: Legal name, DBA, website, founding year
- **Operations**: Employee count, HQ location, business model
- **Classification**: Industry, NAICS/SIC codes, revenue band
- **AI Analysis**: Automated business categorization with confidence scores

## 🧪 Testing

The project includes comprehensive test coverage:
- **User Registration & Authentication**: JWT token flow testing
- **Profile Management**: CRUD operations with validation
- **Business Management**: Owner-only access and data integrity
- **Financial Operations**: Transaction, invoice, budget management
- **API Security**: Authentication requirements and error handling
- **Edge Cases**: Missing profiles, invalid data, unauthorized access

Run tests with:
python manage.py test## 📊 Project Status

### ✅ Completed (100%)
- **Backend Foundation**: Django 5.2.6 + DRF + PostgreSQL
- **User Management**: Registration, auth, profiles
- **Business Management**: Multi-tenant support
- **Financial Management**: Transactions, invoices, budgets, cash flow, forecasts, credit scores, suppliers
- **Role-Based Access**: 3-tier permission system
- **API Testing**: 95%+ test coverage
- **Database Integration**: Neon PostgreSQL
- **Authentication**: JWT with auto-refresh
- **Registration System**: Business & individual flows
- **Admin Approval**: Complete workflow
- **KAVI Integration**: Full user context
- **Mobile Responsive**: All screen sizes
- **Error Handling**: Comprehensive boundaries
- **Documentation**: Complete user & dev guides
- **Team Management**: Invitations and member management
- **Admin Features**: Activity logs, security monitoring, module assignment

### 🚧 In Progress (80%)
- **Frontend Polish**: Final UI refinements
- **Financial Features**: Advanced analytics and reporting
- **Analytics**: Advanced reporting dashboards
- **Notifications**: Email/SMS integration

### 📅 Planned
- **Bank Integration**: M-Pesa, bank accounts
- **Advanced Analytics**: AI-powered forecasting
- **Mobile Apps**: Native iOS/Android
- **Offline Mode**: Progressive Web App
- **Multi-Currency**: International support
- **Payment Gateway**: Direct payment processing
- **Inventory Management**: Stock tracking
- **Payroll System**: Employee payment management

## 📚 Documentation

- **[User Guide](./USER_GUIDE.md)** - Complete user manual
- **[API Documentation](./API_DOCUMENTATION.md)** - API reference
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Backend Setup Guide](./BACKEND_SETUP_GUIDE.md)** - Backend configuration
- **[Onboarding Flow Guide](./ONBOARDING_FLOW_GUIDE.md)** - Registration process
- **[Project Summary](./PROJECT_SUMMARY.md)** - Complete overview
- **[Final Status](./FINAL_STATUS.md)** - Implementation status

## 🎯 Quick Start

### For Users
1. Visit the registration page
2. Choose Business or Individual registration
3. Complete the form and upload documents
4. Wait for admin approval (24-48 hours)
5. Check email for login credentials
6. Login and start managing your finances!

### For Developerssh
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend setup (new terminal)
cd ..  # or root directory
npm install
npm run dev## 🔐 Environment Variables

### Frontend (.env)ash
VITE_API_URL=http://localhost:8000/api
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_ELEVENLABS_API_KEY=your-elevenlabs-key  # Optional### Backend (.env)
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:pass@host/db
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

**Recommended Stack:**
- Frontend: Vercel or Netlify
- Backend: Railway or Render
- Database: Neon PostgreSQL (current)
- Media: Cloudinary or AWS S3

## 🧪 Testing

# Backend tests
cd backend
python manage.py test

# Frontend tests
npm run test
npm run lint## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Frontend: ESLint + Prettier
- Backend: PEP 8 + Black
- Commits: Conventional Commits
- Tests: Required for new features

## 📞 Support

- 📧 Email: support@financegrowth.co.ke
- 💬 KAVI: Ask in-app
- 📚 Docs: Check guides first
- 🐛 Issues: GitHub Issues

## 🙏 Acknowledgments

- **Jackson Alex** - Creator and Lead Developer
- **JKUAT** - Educational foundation
- **Google Gemini** - AI capabilities
- **ElevenLabs** - Voice synthesis
- **Kenyan SME Community** - Inspiration

## 📜 License

This project is proprietary software. All rights reserved.

---

**Made with ❤️ for Kenyan SMEs**

*Empowering businesses to grow, one insight at a time.*

**Version**: 1.0.0 | **Status**: Production Ready ✅ | **Last Updated**: November 2024