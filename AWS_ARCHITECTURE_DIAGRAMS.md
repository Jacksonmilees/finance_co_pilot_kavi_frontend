# Finance Co-Pilot KAVI - AWS Architectural Diagrams

## Document Overview
These architectural diagrams represent the Finance Co-Pilot KAVI MVP system for AWS infrastructure planning.

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Web App    │  │  Mobile App  │  │   Tablet     │              │
│  │  (React SPA) │  │  (PWA/Native)│  │  (Responsive)│              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│         └─────────────────┴──────────────────┘                       │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            │ HTTPS/WSS
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AWS CLOUD INFRASTRUCTURE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                   AWS CloudFront (CDN)                      │    │
│  │   • Global content delivery                                 │    │
│  │   • SSL/TLS termination                                     │    │
│  │   • DDoS protection                                         │    │
│  └────────────────────┬───────────────────────────────────────┘    │
│                       │                                             │
│       ┌───────────────┴────────────────┐                            │
│       │                                │                            │
│       ▼                                ▼                            │
│  ┌─────────────┐                ┌──────────────┐                   │
│  │  Amazon S3  │                │     ALB      │                   │
│  │  (Static    │                │  (Load       │                   │
│  │   Files)    │                │   Balancer)  │                   │
│  └─────────────┘                └──────┬───────┘                   │
│                                        │                            │
│                                        ▼                            │
│              ┌─────────────────────────────────────┐                │
│              │         AWS ECS/Fargate             │                │
│              │    (Container Orchestration)        │                │
│              ├─────────────────────────────────────┤                │
│              │                                     │                │
│              │  ┌────────────┐   ┌────────────┐  │                │
│              │  │  Frontend  │   │  Backend   │  │                │
│              │  │  Container │   │  Container │  │                │
│              │  │  (React    │   │  (Django   │  │                │
│              │  │   + Vite)  │   │   + DRF)   │  │                │
│              │  └────────────┘   └─────┬──────┘  │                │
│              │                          │         │                │
│              └──────────────────────────┼─────────┘                │
│                                         │                           │
│                                         ▼                           │
│              ┌──────────────────────────────────┐                  │
│              │      Amazon RDS PostgreSQL       │                  │
│              │  • Multi-AZ deployment           │                  │
│              │  • Automated backups             │                  │
│              │  • Read replicas (future)        │                  │
│              └──────────────────────────────────┘                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES (SaaS)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Google      │  │  ElevenLabs  │  │   M-Pesa     │              │
│  │  Gemini AI   │  │  (TTS)       │  │   API        │              │
│  │  (Voice AI)  │  │              │  │   (Payments) │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed AWS Architecture (Recommended MVP Setup)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              AWS REGION (e.g., eu-west-1)                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                       Route 53 (DNS)                              │   │
│  │  • Domain: financegrowth.co.ke                                   │   │
│  │  • Health checks                                                 │   │
│  └─────────────────────────┬────────────────────────────────────────┘   │
│                            │                                             │
│                            ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    AWS CloudFront                                 │   │
│  │  • Edge locations globally                                       │   │
│  │  • AWS WAF enabled                                               │   │
│  │  • SSL certificate (ACM)                                         │   │
│  └───────────┬────────────────────────────────┬─────────────────────┘   │
│              │                                 │                         │
│              ▼                                 ▼                         │
│  ┌──────────────────────┐        ┌──────────────────────────┐           │
│  │     Amazon S3        │        │   Application            │           │
│  │  ┌────────────────┐  │        │   Load Balancer (ALB)    │           │
│  │  │ Static Assets  │  │        │  • SSL termination       │           │
│  │  │ • HTML/CSS/JS  │  │        │  • Path-based routing    │           │
│  │  │ • Images       │  │        │  • Health checks         │           │
│  │  │ • Videos       │  │        └──────────┬───────────────┘           │
│  │  └────────────────┘  │                   │                           │
│  │                      │                   │                           │
│  │  ┌────────────────┐  │                   │                           │
│  │  │ User Uploads   │  │                   │                           │
│  │  │ • Documents    │  │  ┌────────────────┼────────────────┐          │
│  │  │ • Attachments  │  │  │                │                │          │
│  │  └────────────────┘  │  │                │                │          │
│  └──────────────────────┘  │                │                │          │
│                            │                │                │          │
│  ┌─────────────────────────┼────────────────┼────────────────┼─┐        │
│  │         VPC             │                │                │ │        │
│  │  (10.0.0.0/16)          │                │                │ │        │
│  │                         │                │                │ │        │
│  │  ┌──────────────────────┼────────────────┼────────────────┼─────┐   │
│  │  │  Availability Zone A │                │                │     │   │
│  │  │                      │                │                │     │   │
│  │  │  ┌─────────────┐     │  ┌─────────────▼─────┐          │     │   │
│  │  │  │ Public      │     │  │  Private Subnet   │          │     │   │
│  │  │  │ Subnet      │     │  │  (10.0.2.0/24)    │          │     │   │
│  │  │  │(10.0.1.0/24)│     │  │                   │          │     │   │
│  │  │  │             │     │  │  ┌─────────────┐  │          │     │   │
│  │  │  │  NAT        │     │  │  │   ECS       │  │          │     │   │
│  │  │  │  Gateway    │     │  │  │   Tasks     │  │          │     │   │
│  │  │  └─────────────┘     │  │  │             │  │          │     │   │
│  │  │                      │  │  │ ┌─────────┐ │  │          │     │   │
│  │  └──────────────────────┼──┼──┼─┤Frontend │ ├──┼──────────┼─────┘   │
│  │                         │  │  │ │Container│ │  │          │         │
│  │  ┌──────────────────────┼──┼──┼─└─────────┘ ├──┼──────────┼─────┐   │
│  │  │  Availability Zone B │  │  │             │  │          │     │   │
│  │  │                      │  │  │ ┌─────────┐ │  │          │     │   │
│  │  │  ┌─────────────┐     │  │  │ │Backend  │ │  │          │     │   │
│  │  │  │ Public      │     │  │  │ │Container│ │  │          │     │   │
│  │  │  │ Subnet      │     │  │  │ └────┬────┘ │  │          │     │   │
│  │  │  │(10.0.3.0/24)│     │  │  └──────┼──────┘  │          │     │   │
│  │  │  │             │     │  │         │         │          │     │   │
│  │  │  │  NAT        │     │  │  PrivateSubnet    │          │     │   │
│  │  │  │  Gateway    │     │  │  (10.0.4.0/24)    │          │     │   │
│  │  │  └─────────────┘     │  └──────────┬────────┘          │     │   │
│  │  │                      │             │                   │     │   │
│  │  └──────────────────────┴─────────────┼───────────────────┘     │   │
│  │                                        │                         │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │          Database Subnet Group                            │   │   │
│  │  │                                                           │   │   │
│  │  │  ┌───────────────────┐      ┌───────────────────┐        │   │   │
│  │  │  │   RDS Primary     │      │   RDS Standby     │        │   │   │
│  │  │  │   (PostgreSQL)    ├──────► (Multi-AZ)        │        │   │   │
│  │  │  │   AZ-A            │      │   AZ-B            │        │   │   │
│  │  │  └───────────────────┘      └───────────────────┘        │   │   │
│  │  │                                                           │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                  Supporting Services                              │   │
│  │                                                                   │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │   │
│  │  │ Amazon ECR    │  │ CloudWatch    │  │ AWS Secrets   │        │   │
│  │  │ (Container    │  │ (Monitoring   │  │ Manager       │        │   │
│  │  │  Registry)    │  │  & Logs)      │  │ (Keys/Env)    │        │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘        │   │
│  │                                                                   │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │   │
│  │  │ AWS IAM       │  │ AWS Backup    │  │ AWS X-Ray     │        │   │
│  │  │ (Identity &   │  │ (Automated    │  │ (Tracing)     │        │   │
│  │  │  Access Mgmt) │  │  Backups)     │  │               │        │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Application Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                               │
│                         (React 18.2.0)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │  UI Components │  │  State Mgmt    │  │  Routing       │        │
│  │  • shadcn/ui   │  │  • Zustand     │  │  • React       │        │
│  │  • Tailwind    │  │  • TanStack    │  │    Router 6    │        │
│  │  • Lucide      │  │    Query       │  │                │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │              Feature Modules                              │       │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐           │       │
│  │  │ Dashboard  │ │Transaction │ │  Invoice   │           │       │
│  │  │            │ │Management  │ │ Management │           │       │
│  │  └────────────┘ └────────────┘ └────────────┘           │       │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐           │       │
│  │  │ Cash Flow  │ │   Budget   │ │    KAVI    │           │       │
│  │  │ Analytics  │ │            │ │Voice Agent │           │       │
│  │  └────────────┘ └────────────┘ └────────────┘           │       │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐           │       │
│  │  │ Team Mgmt  │ │  Suppliers │ │  Credit    │           │       │
│  │  │            │ │            │ │  Scoring   │           │       │
│  │  └────────────┘ └────────────┘ └────────────┘           │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │              API Client Layer                             │       │
│  │  • Axios HTTP Client                                     │       │
│  │  • JWT Token Management                                  │       │
│  │  • Request/Response Interceptors                         │       │
│  │  • Error Handling                                        │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ REST API (HTTPS)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                                  │
│                       (Django 5.2.6 + DRF 3.16.1)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │              API Gateway (Django URLs)                    │       │
│  │  • URL Routing                                           │       │
│  │  • API Versioning (/api/v1/)                            │       │
│  │  • CORS Configuration                                    │       │
│  └────────────────────┬─────────────────────────────────────┘       │
│                       │                                             │
│                       ▼                                             │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │         Authentication & Authorization                    │       │
│  │  • JWT Token Generation (SimpleJWT)                      │       │
│  │  • Token Refresh                                         │       │
│  │  • Role-Based Access Control (RBAC)                      │       │
│  │  • Permission Classes                                    │       │
│  └────────────────────┬─────────────────────────────────────┘       │
│                       │                                             │
│                       ▼                                             │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │              Django Apps & ViewSets                       │       │
│  │                                                           │       │
│  │  ┌─────────────────────────────────────────────────┐     │       │
│  │  │  Users App                                       │     │       │
│  │  │  • UserProfile ViewSet                          │     │       │
│  │  │  • Business ViewSet                             │     │       │
│  │  │  • Customer ViewSet                             │     │       │
│  │  │  • Membership ViewSet                           │     │       │
│  │  │  • BusinessInvitation ViewSet                   │     │       │
│  │  │  • BusinessRegistration ViewSet                 │     │       │
│  │  │  • Dashboard API                                │     │       │
│  │  └─────────────────────────────────────────────────┘     │       │
│  │                                                           │       │
│  │  ┌─────────────────────────────────────────────────┐     │       │
│  │  │  Finance App                                     │     │       │
│  │  │  • Transaction ViewSet                          │     │       │
│  │  │  • Invoice ViewSet                              │     │       │
│  │  │  • InvoiceItem ViewSet                          │     │       │
│  │  │  • Budget ViewSet                               │     │       │
│  │  │  • CashFlow ViewSet                             │     │       │
│  │  │  • FinancialForecast ViewSet                    │     │       │
│  │  │  • CreditScore ViewSet                          │     │       │
│  │  │  • Supplier ViewSet                             │     │       │
│  │  │  • Analytics API                                │     │       │
│  │  └─────────────────────────────────────────────────┘     │       │
│  │                                                           │       │
│  │  ┌─────────────────────────────────────────────────┐     │       │
│  │  │  Core App                                        │     │       │
│  │  │  • ActivityLog ViewSet                          │     │       │
│  │  │  • UserSession ViewSet                          │     │       │
│  │  │  • FailedLoginAttempt ViewSet                   │     │       │
│  │  │  • ModuleAssignment ViewSet                     │     │       │
│  │  │  • Admin Analytics API                          │     │       │
│  │  └─────────────────────────────────────────────────┘     │       │
│  └──────────────────────────────────────────────────────────┘       │
│                               │                                     │
│                               ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │              Business Logic Layer                         │       │
│  │  • Data validation                                       │       │
│  │  • Business rules enforcement                            │       │
│  │  • Financial calculations                               │       │
│  │  • Permission checks                                    │       │
│  └────────────────────┬─────────────────────────────────────┘       │
│                       │                                             │
│                       ▼                                             │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │              Django ORM Layer                             │       │
│  │  • Models (15+ tables)                                   │       │
│  │  • QuerySets                                             │       │
│  │  • Database abstraction                                  │       │
│  └────────────────────┬─────────────────────────────────────┘       │
│                       │                                             │
└───────────────────────┼─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                    │
│                    (PostgreSQL 15+)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   Users Schema   │  │  Finance Schema  │  │   Core Schema    │  │
│  │  • auth_user     │  │  • transactions  │  │  • activity_logs │  │
│  │  • user_profiles │  │  • invoices      │  │  • user_sessions │  │
│  │  • businesses    │  │  • invoice_items │  │  • failed_logins │  │
│  │  • customers     │  │  • budgets       │  │  • module_assign.│  │
│  │  • memberships   │  │  • cash_flows    │  │                  │  │
│  │  • invitations   │  │  • forecasts     │  │                  │  │
│  │  • registrations │  │  • credit_scores │  │                  │  │
│  │                  │  │  • suppliers     │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow Diagram

```
┌─────────────┐
│    USER     │
└──────┬──────┘
       │
       │ 1. Login Request
       ▼
┌─────────────────────────┐
│   Frontend (React)      │
│   • Validate inputs     │
│   • Store in state      │
└──────┬──────────────────┘
       │
       │ 2. POST /api/auth/token/
       │    {username, password}
       ▼
┌──────────────────────────────────┐
│   Django Backend                 │
│   • Validate credentials         │
│   • Generate JWT tokens          │
│   • Log activity                 │
└──────┬───────────────────────────┘
       │
       │ 3. Query database
       ▼
┌─────────────────────────┐
│   PostgreSQL            │
│   • auth_user table     │
│   • user_profiles table │
└──────┬──────────────────┘
       │
       │ 4. Return user data
       ▼
┌──────────────────────────────────┐
│   Django Backend                 │
│   • Create JWT payload           │
│   • Return tokens + user data    │
└──────┬───────────────────────────┘
       │
       │ 5. {access, refresh, user}
       ▼
┌─────────────────────────┐
│   Frontend (React)      │
│   • Store tokens        │
│   • Update app state    │
│   • Redirect to dash    │
└──────┬──────────────────┘
       │
       │ 6. Display Dashboard
       ▼
┌─────────────┐
│    USER     │
└─────────────┘


Transaction Flow:
─────────────────

User → Create Transaction
  ↓
Frontend validates form
  ↓
POST /api/finance/transactions/
  {business_id, amount, type, ...}
  ↓
Backend ViewSet
  • Verify JWT token
  • Check business access
  • Validate business rules
  ↓
Save to Database
  • transactions table
  • Update related budgets
  • Log activity
  ↓
Return transaction object
  ↓
Frontend updates
  • Invalidate cache
  • Refetch dashboard
  • Show toast notification
  ↓
User sees updated data


KAVI Voice Assistant Flow:
───────────────────────────

User speaks → Web Speech API
  ↓
Voice to text
  ↓
Frontend sends text + context
  POST /api/kavi/chat/
  {message, user_id, business_id}
  ↓
Backend fetches financial context
  • Last 30 days transactions
  • Budget status
  • Invoice data
  • Credit score
  ↓
Call Gemini AI with context
  ↓
Gemini generates personalized response
  ↓
Backend returns response
  {message, suggestions, data}
  ↓
Frontend displays text
  ↓
Call ElevenLabs TTS
  ↓
Convert text to speech
  ↓
Play audio to user
```

---

## 5. Security Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Layer 1: Network Security                                         │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  • AWS WAF (Web Application Firewall)                    │     │
│  │  • DDoS Protection (AWS Shield)                          │     │
│  │  • VPC with private/public subnets                       │     │
│  │  • Security Groups (firewall rules)                      │     │
│  │  • Network ACLs                                          │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  Layer 2: Transport Security                                       │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  • HTTPS only (TLS 1.3)                                  │     │
│  │  • SSL certificates (AWS ACM)                            │     │
│  │  • Secure WebSocket (WSS)                                │     │
│  │  • HTTP Strict Transport Security                        │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  Layer 3: Application Security                                     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  • JWT Token Authentication                              │     │
│  │  • Token refresh mechanism                               │     │
│  │  • CORS policy enforcement                               │     │
│  │  • CSRF protection                                       │     │
│  │  • XSS protection headers                                │     │
│  │  • SQL injection prevention (ORM)                        │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  Layer 4: Access Control                                           │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  • Role-Based Access Control (RBAC)                      │     │
│  │  • 3-tier permission system:                             │     │
│  │    - Super Admin                                         │     │
│  │    - Business Admin                                      │     │
│  │    - Staff/Viewer                                        │     │
│  │  • Business-level data isolation                         │     │
│  │  • User-level data isolation                             │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  Layer 5: Data Security                                            │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  • Database encryption at rest (RDS)                     │     │
│  │  • S3 bucket encryption                                  │     │
│  │  • Secrets Manager for credentials                       │     │
│  │  • Password hashing (Django PBKDF2)                      │     │
│  │  • Sensitive data masking                                │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
│  Layer 6: Monitoring & Auditing                                    │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  • Activity logging                                      │     │
│  │  • Failed login tracking                                 │     │
│  │  • Session monitoring                                    │     │
│  │  • CloudWatch logs                                       │     │
│  │  • AWS CloudTrail (audit trail)                          │     │
│  │  • Intrusion detection (GuardDuty)                       │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 6. Deployment & CI/CD Pipeline

```
Developer Workstation
       │
       │ git push
       ▼
┌─────────────────┐
│   GitHub        │
│   Repository    │
└────────┬────────┘
         │
         │ Webhook trigger
         ▼
┌─────────────────────────────────┐
│   GitHub Actions / AWS CodePipeline│
│   • Run tests                   │
│   • Lint code                   │
│   • Security scan               │
└────────┬────────────────────────┘
         │
         │ Tests pass
         ▼
┌─────────────────────────────────┐
│   Build Stage                   │
│   • Build Frontend (Vite)       │
│   • Build Backend (Docker)      │
│   • Push to ECR                 │
└────────┬────────────────────────┘
         │
         │ Build success
         ▼
┌─────────────────────────────────┐
│   Deploy Stage                  │
│   • Update ECS task definition  │
│   • Deploy to staging           │
│   • Run smoke tests             │
└────────┬────────────────────────┘
         │
         │ Staging tests pass
         ▼
┌─────────────────────────────────┐
│   Production Deploy             │
│   • Blue/Green deployment       │
│   • Health checks               │
│   • Auto rollback if needed     │
└─────────────────────────────────┘
```

---

## 7. Scalability & Performance

```
┌────────────────────────────────────────────────────────────┐
│               SCALABILITY ARCHITECTURE                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Horizontal Scaling                                        │
│  ┌──────────────────────────────────────────────────┐      │
│  │  ECS Auto Scaling                                │      │
│  │  • CPU/Memory thresholds                         │      │
│  │  • Min: 2 tasks, Max: 10 tasks                   │      │
│  │  • Target tracking scaling                       │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  Database Optimization                                     │
│  ┌──────────────────────────────────────────────────┐      │
│  │  • Connection pooling                            │      │
│  │  • Query optimization                            │      │
│  │  • Indexes on frequently queried fields          │      │
│  │  • Read replicas (future)                        │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  Caching Strategy                                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │  • CloudFront CDN for static assets              │      │
│  │  • Application-level caching (Redis - future)    │      │
│  │  • Browser caching headers                       │      │
│  │  • Database query caching                        │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  Load Balancing                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │  • Application Load Balancer                     │      │
│  │  • Multi-AZ distribution                         │      │
│  │  • Health checks & failover                      │      │
│  │  • Session affinity (sticky sessions)            │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 8. Cost Optimization Strategy

```
Service              Tier           Est. Monthly Cost   Total
─────────────────────────────────────────────────────────────
ECS Fargate         2 tasks         $30 - $50          $40
RDS PostgreSQL      db.t3.micro     $15 - $25          $20
S3 + CloudFront     Standard        $5 - $15           $10
ALB                 Standard        $15 - $25          $20
Route 53            1 hosted zone   $0.50 - $1         $1
CloudWatch          Basic           $5 - $10           $7
Secrets Manager     10 secrets      $1 - $2            $2
Data Transfer       Moderate        $10 - $20          $15
─────────────────────────────────────────────────────────────
TOTAL MVP ESTIMATE                                    $115/mo

Scaling Costs (at 1000 users):
ECS Fargate         5-8 tasks       $75 - $150         $110
RDS PostgreSQL      db.t3.small     $30 - $50          $40
S3 + CloudFront     Higher usage    $15 - $30          $22
Other services                                         $50
─────────────────────────────────────────────────────────────
TOTAL (1000 users)                                    $222/mo
```

