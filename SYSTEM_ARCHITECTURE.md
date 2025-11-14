# Finance Growth Co-pilot - System Architecture

## High-Level Architecture Overview

```mermaid
graph LR
    A[Users] -->|HTTPS| B[React Frontend]
    B -->|REST API| C[Django Backend]
    C -->|SQL| D[(PostgreSQL)]
    B -->|WebSocket/API| E[Google Gemini AI]
    B -->|API| F[ElevenLabs TTS]
    C -->|API| G[Firecrawl]
    C -->|Webhook| H[N8N Automation]
    
    style A fill:#E8F4F8
    style B fill:#4A90E2
    style C fill:#50C878
    style D fill:#FF6B6B
    style E fill:#FFA500
    style F fill:#FFA500
    style G fill:#FFA500
    style H fill:#FFA500
```

## Detailed System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser<br/>React + Vite]
        MOBILE[Mobile Browser<br/>Responsive UI]
    end

    subgraph "Frontend Application"
        REACT[React 18.2.0<br/>SPA Application]
        ROUTER[React Router 6.8.1<br/>Client-side Routing]
        STATE[State Management<br/>Zustand + React Query]
        UI[UI Components<br/>shadcn/ui + TailwindCSS]
        
        subgraph "Frontend Modules"
            AUTH_UI[Authentication UI]
            DASHBOARD[Dashboard Pages]
            FINANCE_UI[Finance Management UI]
            VOICE_UI[Voice Assistant UI]
            ADMIN_UI[Admin Panel UI]
        end
    end

    subgraph "API Gateway / Backend"
        DJANGO[Django 5.2.6<br/>REST API Server]
        CORS[CORS Middleware]
        JWT[JWT Authentication<br/>SimpleJWT]
        MIDDLEWARE[Custom Middleware<br/>Logging & Security]
    end

    subgraph "Backend Applications"
        USERS_APP[Users App<br/>User & Business Management]
        FINANCE_APP[Finance App<br/>Financial Operations]
        CORE_APP[Core App<br/>System Core Services]
    end

    subgraph "Database Layer"
        POSTGRES[(PostgreSQL Database<br/>Neon Cloud)]
        
        subgraph "Database Models"
            USER_MODELS[User Models<br/>User, Profile, Business]
            FINANCE_MODELS[Finance Models<br/>Transaction, Invoice, Budget]
            CORE_MODELS[Core Models<br/>ActivityLog, ModuleAssignment]
        end
    end

    subgraph "External Services"
        GEMINI[Google Gemini AI<br/>Voice & Chat API]
        ELEVENLABS[ElevenLabs<br/>Text-to-Speech API]
        FIRECRAWL[Firecrawl<br/>Web Intelligence API]
        N8N[N8N Automation<br/>Workflow Engine]
    end

    subgraph "Storage & Media"
        MEDIA[Media Storage<br/>Document Uploads]
        CACHE[Database Cache<br/>Django Cache Framework]
    end

    subgraph "Security & Monitoring"
        ACTIVITY_LOG[Activity Logging<br/>Audit Trail]
        SECURITY[Security Module<br/>Session Management]
        FAILED_LOGINS[Failed Login Tracking]
    end

    %% Client to Frontend
    WEB --> REACT
    MOBILE --> REACT

    %% Frontend Internal Flow
    REACT --> ROUTER
    ROUTER --> STATE
    STATE --> UI
    UI --> AUTH_UI
    UI --> DASHBOARD
    UI --> FINANCE_UI
    UI --> VOICE_UI
    UI --> ADMIN_UI

    %% Frontend to Backend
    REACT -->|HTTPS/REST API| DJANGO
    VOICE_UI -->|WebSocket/Stream| GEMINI
    VOICE_UI -->|API Calls| ELEVENLABS

    %% Backend Internal Flow
    DJANGO --> CORS
    CORS --> JWT
    JWT --> MIDDLEWARE
    MIDDLEWARE --> USERS_APP
    MIDDLEWARE --> FINANCE_APP
    MIDDLEWARE --> CORE_APP

    %% Backend to Database
    USERS_APP --> USER_MODELS
    FINANCE_APP --> FINANCE_MODELS
    CORE_APP --> CORE_MODELS
    USER_MODELS --> POSTGRES
    FINANCE_MODELS --> POSTGRES
    CORE_MODELS --> POSTGRES

    %% Backend to External Services
    USERS_APP --> FIRECRAWL
    FINANCE_APP --> N8N
    CORE_APP --> GEMINI

    %% Backend to Storage
    DJANGO --> MEDIA
    DJANGO --> CACHE
    CACHE --> POSTGRES

    %% Security & Monitoring
    CORE_APP --> ACTIVITY_LOG
    CORE_APP --> SECURITY
    CORE_APP --> FAILED_LOGINS
    ACTIVITY_LOG --> POSTGRES
    SECURITY --> POSTGRES
    FAILED_LOGINS --> POSTGRES

    %% Styling
    classDef frontend fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    classDef backend fill:#50C878,stroke:#2D8659,stroke-width:2px,color:#fff
    classDef database fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    classDef external fill:#FFA500,stroke:#CC7700,stroke-width:2px,color:#fff
    classDef storage fill:#9B59B6,stroke:#6C3483,stroke-width:2px,color:#fff

    class REACT,ROUTER,STATE,UI,AUTH_UI,DASHBOARD,FINANCE_UI,VOICE_UI,ADMIN_UI,WEB,MOBILE frontend
    class DJANGO,CORS,JWT,MIDDLEWARE,USERS_APP,FINANCE_APP,CORE_APP backend
    class POSTGRES,USER_MODELS,FINANCE_MODELS,CORE_MODELS database
    class GEMINI,ELEVENLABS,FIRECRAWL,N8N external
    class MEDIA,CACHE,ACTIVITY_LOG,SECURITY,FAILED_LOGINS storage
```

## Component Details

### Frontend Architecture

#### Core Technologies
- **React 18.2.0**: UI framework
- **Vite 7.2.2**: Build tool and dev server
- **React Router 6.8.1**: Client-side routing
- **TanStack Query 4.42.0**: Server state management
- **Zustand 5.0.8**: Client state management
- **Axios 1.13.2**: HTTP client

#### Key Pages & Components
- **Authentication**: Login, Register, Registration Status
- **Dashboards**: 
  - Super Admin Dashboard
  - Business Admin Dashboard
  - User Dashboard
- **Finance Modules**: Transactions, Invoices, Cash Flow, Credit, Suppliers
- **Voice Assistant**: KAVI voice interface
- **Admin Panel**: User Management, Security, Analytics

### Backend Architecture

#### Core Technologies
- **Django 5.2.6**: Web framework
- **Django REST Framework 3.16.1**: API framework
- **PostgreSQL**: Primary database (Neon Cloud)
- **JWT Authentication**: Token-based auth
- **Python 3.10+**: Runtime

#### Application Modules

**1. Users App** (`backend/users/`)
- User authentication & registration
- Business management
- User profiles & roles
- Team management (Memberships, Invitations)
- Business registration workflow

**2. Finance App** (`backend/finance/`)
- Transaction management
- Invoice creation & tracking
- Budget planning
- Cash flow analysis & forecasting
- Credit score calculation
- Supplier management

**3. Core App** (`backend/core/`)
- Activity logging & audit trails
- Security monitoring
- Module assignment system
- Session management
- Failed login tracking

### Database Schema

#### User Models
- `User` (Django built-in)
- `UserProfile` - Extended user information
- `Business` - Business entity
- `Membership` - User-Business relationships
- `BusinessInvitation` - Team invitations
- `BusinessRegistration` - Registration applications
- `Customer` - Client management

#### Finance Models
- `Transaction` - Financial transactions
- `Invoice` - Customer invoices
- `InvoiceItem` - Invoice line items
- `Budget` - Budget planning
- `CashFlow` - Cash flow analysis
- `FinancialForecast` - AI-powered forecasts
- `CreditScore` - Credit assessment
- `Supplier` - Supplier management

#### Core Models
- `ActivityLog` - System activity tracking
- `UserSession` - Active session management
- `FailedLoginAttempt` - Security monitoring
- `ModuleAssignment` - Feature access control

### External Integrations

#### AI Services
- **Google Gemini AI**: Voice conversations, chat, financial analysis
- **ElevenLabs**: Premium text-to-speech for voice assistant

#### Automation & Intelligence
- **Firecrawl**: Web intelligence for business classification
- **N8N**: Workflow automation (M-Pesa reconciliation, invoice reminders)

### Security Features

1. **Authentication**
   - JWT token-based authentication
   - Token refresh mechanism
   - Role-based access control (RBAC)

2. **Authorization**
   - Super Admin role
   - Business Admin role
   - Staff/Viewer roles
   - Route guards for protected pages

3. **Monitoring**
   - Activity logging for all system actions
   - Failed login attempt tracking
   - Session management & termination
   - IP address & user agent tracking

4. **Data Protection**
   - CORS configuration
   - CSRF protection
   - Secure password validation
   - Database-level security

### Data Flow Diagrams

#### Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant D as Database
    
    U->>F: Enter credentials
    F->>B: POST /api/auth/token/
    B->>D: Validate user
    D-->>B: User data
    B-->>F: JWT Token
    F->>F: Store in AuthContext
    F-->>U: Redirect to Dashboard
```

#### Financial Data Flow
```mermaid
sequenceDiagram
    participant U as User
    participant C as React Component
    participant Q as React Query
    participant A as Axios
    participant B as Django API
    participant D as PostgreSQL
    
    U->>C: Input transaction data
    C->>A: POST /api/finance/transactions/
    A->>B: HTTP Request + JWT
    B->>B: Validate & Serialize
    B->>D: INSERT transaction
    D-->>B: Success
    B-->>A: JSON Response
    A->>Q: Update cache
    Q->>C: Re-render with new data
    C-->>U: Show updated UI
```

#### Voice Assistant Flow
```mermaid
sequenceDiagram
    participant U as User
    participant W as Web Speech API
    participant F as Frontend
    participant G as Gemini AI
    participant E as ElevenLabs
    participant A as Audio Player
    
    U->>W: Speak
    W->>F: Transcribed text
    F->>G: Send message + context
    G->>G: Process with AI
    G-->>F: Text response
    F->>E: Convert to speech
    E-->>F: Audio stream
    F->>A: Play audio
    A-->>U: Hear response
```

### Deployment Architecture

#### Frontend
- **Build**: Vite production build
- **Hosting**: Static file hosting (Vercel/Netlify/Render)
- **Port**: 5173 (dev), 80/443 (production)

#### Backend
- **Server**: Django WSGI/ASGI
- **Hosting**: Render/Railway/Fly.io
- **Database**: Neon PostgreSQL (cloud)
- **Media**: Local storage or cloud storage (S3)

### Performance Optimizations

1. **Frontend**
   - Code splitting with React Router
   - React Query caching
   - Lazy loading components
   - Optimized bundle size

2. **Backend**
   - Database query optimization (indexes)
   - Database caching layer
   - API response pagination
   - Connection pooling

3. **Database**
   - Indexed fields for common queries
   - Efficient foreign key relationships
   - JSON field usage for flexible data

### Scalability Considerations

- **Horizontal Scaling**: Stateless API design
- **Database**: PostgreSQL connection pooling
- **Caching**: Database-backed cache for session data
- **CDN**: Static asset delivery
- **Load Balancing**: Multiple backend instances

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18.2.0 |
| Build Tool | Vite 7.2.2 |
| Routing | React Router 6.8.1 |
| State Management | Zustand + TanStack Query |
| UI Library | shadcn/ui + TailwindCSS |
| Backend Framework | Django 5.2.6 |
| API Framework | Django REST Framework |
| Database | PostgreSQL (Neon) |
| Authentication | JWT (SimpleJWT) |
| AI Services | Google Gemini, ElevenLabs |
| Automation | N8N |
| Web Intelligence | Firecrawl |

