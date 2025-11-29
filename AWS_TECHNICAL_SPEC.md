# Finance Co-Pilot KAVI - Technical Specification for AWS

## Document Information
**Project**: Finance Co-Pilot KAVI  
**Document Type**: Technical Specification  
**Version**: 1.0  
**Date**: November 24, 2025  
**Status**: Ready for Implementation  

---

## Table of Contents
1. [System Overview](#system-overview)
2. [AWS Services Required](#aws-services-required)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Database Schema](#database-schema)
5. [API Specification](#api-specification)
6. [Security Configuration](#security-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Disaster Recovery](#disaster-recovery)
9. [Performance Requirements](#performance-requirements)
10. [Cost Management](#cost-management)

---

## 1. System Overview

### Application Components

#### Frontend Application
- **Technology**: React 18.2.0 + Vite 7.2.2
- **Build Output**: Static files (HTML, CSS, JS)
- **Size**: ~5-10 MB (gzipped)
- **Hosting**: AWS S3 + AWS CloudFront
- **Domain**: financegrowth.co.ke

#### Backend Application
- **Technology**: Django 5.2.6 + Django REST Framework 3.16.1
- **Runtime**: Python 3.10+
- **Container**: Docker (Alpine Linux base)
- **Hosting**: AWS ECS Fargate
- **API**: RESTful with JWT authentication

#### Database
- **Technology**: PostgreSQL 15+
- **Current Size**: <100 MB (MVP)
- **Expected Growth**: 1 GB/month
- **Hosting**: AWS RDS PostgreSQL

---

## 2. AWS Services Required

### Core Services

| Service | Purpose | Configuration | Estimated Cost |
|---------|---------|---------------|----------------|
| **ECS Fargate** | Container orchestration | 2 tasks @ 0.5 vCPU, 1GB RAM | $40/month |
| **RDS PostgreSQL** | Primary database | db.t3.micro, Multi-AZ | $20/month |
| **S3** | Static files + uploads | Standard storage, ~10GB | $3/month |
| **CloudFront** | CDN | 100GB data transfer | $7/month |
| **ALB** | Load balancing | Application Load Balancer | $20/month |
| **Route 53** | DNS management | 1 hosted zone | $1/month |
| **ECR** | Container registry | 5GB storage | $0.50/month |
| **Secrets Manager** | Secrets storage | 10 secrets | $2/month |
| **CloudWatch** | Monitoring & logging | Logs + metrics | $7/month |
| **AWS Backup** | Automated backups | RDS + S3 | $5/month |

**Total Estimated Cost**: $105.50/month (MVP)

### Optional Services (Future)

| Service | Purpose | When Needed |
|---------|---------|-------------|
| **ElastiCache (Redis)** | Session storage, caching | >500 users |
| **SQS** | Message queuing | Asynchronous tasks |
| **SNS** | Notifications | Email/SMS alerts |
| **Lambda** | Serverless functions | Background jobs |
| **AWS Cognito** | User management | Alternative to JWT |
| **AWS WAF** | Web application firewall | Security enhancement |
| **GuardDuty** | Threat detection | Security monitoring |

---

## 3. Infrastructure Setup

### VPC Configuration

```
VPC: 10.0.0.0/16 (65,536 IPs)

Availability Zone A:
  - Public Subnet:  10.0.1.0/24 (256 IPs)
  - Private Subnet: 10.0.2.0/24 (256 IPs)
  - Database Subnet: 10.0.5.0/24 (256 IPs)

Availability Zone B:
  - Public Subnet:  10.0.3.0/24 (256 IPs)
  - Private Subnet: 10.0.4.0/24 (256 IPs)
  - Database Subnet: 10.0.6.0/24 (256 IPs)

Internet Gateway: igw-xxxxx
NAT Gateways: 2 (one per AZ)
```

### Security Groups

**ALB Security Group** (sg-alb):
```
Inbound:
  - Port 443 (HTTPS) from 0.0.0.0/0
  - Port 80 (HTTP) from 0.0.0.0/0 (redirect to HTTPS)
Outbound:
  - All traffic to ECS security group
```

**ECS Security Group** (sg-ecs):
```
Inbound:
  - Port 8000 from ALB security group
  - Port 5173 from ALB security group
Outbound:
  - Port 443 to 0.0.0.0/0 (API calls)
  - Port 5432 to RDS security group
```

**RDS Security Group** (sg-rds):
```
Inbound:
  - Port 5432 from ECS security group
Outbound:
  - None (database doesn't initiate connections)
```

### ECS Task Definitions

**Backend Task** (Django):
```json
{
  "family": "kavi-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "django-app",
      "image": "{AWS_ACCOUNT_ID}.dkr.ecr.{REGION}.amazonaws.com/kavi-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "DJANGO_SETTINGS_MODULE", "value": "FG_copilot.settings"},
        {"name": "DEBUG", "value": "False"}
      ],
      "secrets": [
        {"name": "SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/kavi-backend",
          "awslogs-region": "{REGION}",
          "awslogs-stream-prefix": "django"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/api/health/ || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

**Frontend Task** (React - Optional if using S3):
```json
{
  "family": "kavi-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "react-app",
      "image": "{AWS_ACCOUNT_ID}.dkr.ecr.{REGION}.amazonaws.com/kavi-frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "API_URL", "value": "https://api.financegrowth.co.ke"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/kavi-frontend",
          "awslogs-region": "{REGION}",
          "awslogs-stream-prefix": "react"
        }
      }
    }
  ]
}
```

### RDS Configuration

```
Instance Class: db.t3.micro
Engine: PostgreSQL 15.4
Multi-AZ: Yes
Storage: 20 GB gp3
Storage Autoscaling: Up to 100 GB
Backup Retention: 7 days
Backup Window: 03:00-04:00 UTC
Maintenance Window: Sun 04:00-05:00 UTC
Encryption: Enabled (AWS KMS)
Public Access: No
VPC: kavi-vpc
Subnet Group: kavi-db-subnet-group
Security Group: sg-rds
```

### S3 Buckets

**Static Files Bucket** (kavi-static-prod):
```
Region: Same as CloudFront
Versioning: Enabled
Encryption: AES-256
Public Access: Blocked (CloudFront OAI only)
Lifecycle Rules:
  - Delete old versions after 30 days
CORS: Configured for domain
```

**User Uploads Bucket** (kavi-uploads-prod):
```
Region: Same as RDS
Versioning: Enabled
Encryption: AES-256
Public Access: Blocked
Lifecycle Rules:
  - Move to Glacier after 90 days
  - Delete after 365 days
Max Object Size: 10 MB
```

### CloudFront Distribution

```
Origin: S3 bucket (kavi-static-prod)
Alternate Domain: www.financegrowth.co.ke
SSL Certificate: ACM certificate
Price Class: Use Only North America, Europe, Asia
Caching: Optimized for web applications
TTL: Default 86400 (1 day)
Compress Objects: Yes
HTTP to HTTPS: Redirect
Supported HTTP Versions: HTTP/2, HTTP/3
WAF: Associated (optional)
```

---

## 4. Database Schema

### Key Tables (15 total)

**users_userprofile**
```sql
id: SERIAL PRIMARY KEY
user_id: INTEGER FOREIGN KEY (auth_user)
phone: VARCHAR(20)
bio: TEXT
avatar_url: VARCHAR(500)
date_of_birth: DATE
job_title: VARCHAR(100)
company: VARCHAR(100)
country: VARCHAR(100)
city: VARCHAR(100)
timezone: VARCHAR(50)
language_preference: VARCHAR(10)
currency_preference: VARCHAR(3)
notification_preferences: JSONB
risk_tolerance: VARCHAR(20)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

**users_business**
```sql
id: SERIAL PRIMARY KEY
legal_name: VARCHAR(255) UNIQUE
dba_name: VARCHAR(255)
registration_number: VARCHAR(100)
tax_id: VARCHAR(100)
email: VARCHAR(254)
phone: VARCHAR(20)
website: VARCHAR(500)
address: TEXT
country: VARCHAR(100)
founding_year: INTEGER
employee_count: INTEGER
industry: VARCHAR(100)
business_model: VARCHAR(100)
revenue_band: VARCHAR(50)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

**finance_transaction**
```sql
id: SERIAL PRIMARY KEY
business_id: INTEGER FOREIGN KEY (users_business)
user_id: INTEGER FOREIGN KEY (auth_user)
amount: DECIMAL(15, 2)
currency: VARCHAR(3)
transaction_type: VARCHAR(20)  -- income/expense/transfer
category: VARCHAR(100)
description: TEXT
payment_method: VARCHAR(50)
transaction_date: TIMESTAMP WITH TIME ZONE
reference_number: VARCHAR(100)
external_id: VARCHAR(255)
status: VARCHAR(20)
supplier_id: INTEGER FOREIGN KEY (finance_supplier)
customer_id: INTEGER FOREIGN KEY (users_customer)
invoice_id: INTEGER FOREIGN KEY (finance_invoice)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

**finance_invoice**
```sql
id: SERIAL PRIMARY KEY
business_id: INTEGER FOREIGN KEY (users_business)
user_id: INTEGER FOREIGN KEY (auth_user)
customer_id: INTEGER FOREIGN KEY (users_customer)
invoice_number: VARCHAR(100) UNIQUE
issue_date: DATE
due_date: DATE
status: VARCHAR(20)  -- draft/sent/paid/overdue/cancelled
subtotal: DECIMAL(15, 2)
tax_amount: DECIMAL(15, 2)
total_amount: DECIMAL(15, 2)
currency: VARCHAR(3)
notes: TEXT
paid_date: DATE
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

**Indexes**:
```sql
CREATE INDEX idx_transaction_business_date ON finance_transaction(business_id, transaction_date DESC);
CREATE INDEX idx_transaction_user_date ON finance_transaction(user_id, transaction_date DESC);
CREATE INDEX idx_transaction_type ON finance_transaction(transaction_type);
CREATE INDEX idx_invoice_business ON finance_invoice(business_id);
CREATE INDEX idx_invoice_customer ON finance_invoice(customer_id);
CREATE INDEX idx_invoice_status ON finance_invoice(status);
```

---

## 5. API Specification

### Base URL
- **Production**: `https://api.financegrowth.co.ke/api/`
- **Staging**: `https://staging-api.financegrowth.co.ke/api/`
- **Development**: `http://localhost:8000/api/`

### Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer {access_token}
```

### Key Endpoints

**Authentication**:
```
POST /auth/token/              - Get access/refresh tokens
POST /auth/token/refresh/      - Refresh access token
POST /users/register/          - Register new user
```

**User Management**:
```
GET  /users/me/                - Get current user
GET  /users/profile/           - Get user profile
PATCH /users/profile/update/   - Update profile
GET  /users/businesses/        - List businesses
POST /users/businesses/        - Create business
```

**Transactions**:
```
GET  /finance/transactions/              - List transactions
POST /finance/transactions/              - Create transaction
GET  /finance/transactions/{id}/         - Get transaction
PUT  /finance/transactions/{id}/         - Update transaction
DELETE /finance/transactions/{id}/       - Delete transaction
GET  /finance/transactions/analytics/    - Get analytics
GET  /finance/transactions/summary/      - Get summary
```

**Invoices**:
```
GET  /finance/invoices/                  - List invoices
POST /finance/invoices/                  - Create invoice
GET  /finance/invoices/{id}/             - Get invoice
PUT  /finance/invoices/{id}/             - Update invoice
POST /finance/invoices/{id}/send/        - Send invoice
POST /finance/invoices/{id}/mark_paid/   - Mark as paid
```

### Rate Limiting
```
Authenticated users: 1000 requests/hour
Unauthenticated: 100 requests/hour
KAVI API: 60 requests/minute
```

---

## 6. Security Configuration

### SSL/TLS Certificates
- **Provider**: AWS Certificate Manager (ACM)
- **Domains**: 
  - financegrowth.co.ke
  - www.financegrowth.co.ke
  - api.financegrowth.co.ke
- **Validation**: DNS validation
- **Auto-renewal**: Enabled

### Secrets Management
Store in AWS Secrets Manager:
```
kavi/prod/django-secret-key
kavi/prod/database-url
kavi/prod/gemini-api-key
kavi/prod/elevenlabs-api-key
kavi/prod/jwt-secret
```

### CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    "https://financegrowth.co.ke",
    "https://www.financegrowth.co.ke",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
]
```

### Django Security Settings
```python
DEBUG = False
ALLOWED_HOSTS = ['api.financegrowth.co.ke', '*.elasticbeanstalk.com']
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

---

## 7. Monitoring & Logging

### CloudWatch Dashboards

**Application Dashboard**:
- ECS CPU utilization
- ECS memory utilization
- ALB target response time
- ALB request count
- ALB 4XX/5XX errors
- RDS CPU utilization
- RDS database connections

**Business Dashboard**:
- API calls per endpoint
- User registrations
- Transactions created
- KAVI conversations
- Error rates by type

### CloudWatch Alarms

**Critical Alarms** (PagerDuty):
```
- ALB 5XX errors > 5% for 5 minutes
- RDS CPU > 90% for 10 minutes
- ECS task failures > 2 in 5 minutes
- Application errors > 10/minute
```

**Warning Alarms** (Email):
```
- ALB response time > 1s average for 15 minutes
- RDS connections > 80% of max
- S3 bucket size > 80% of expected
- ECS CPU > 70% for 30 minutes
```

### Log Groups
```
/ecs/kavi-backend         - Retention: 30 days
/ecs/kavi-frontend        - Retention: 7 days
/rds/kavi-postgres        - Retention: 14 days
/aws/lambda/kavi-*        - Retention: 7 days
```

---

## 8. Disaster Recovery

### Backup Strategy

**Database**:
- Automated RDS snapshots: Daily
- Retention: 7 days
- Cross-region backup: Enabled (secondary region)
- Point-in-time recovery: Enabled

**S3**:
- Versioning: Enabled
- Cross-region replication: Optional
- Lifecycle policies: Archive old versions

**Configuration**:
- Infrastructure as Code (Terraform/CloudFormation)
- Version controlled in Git
- Automated deployment

### Recovery Time Objectives (RTO)
- **Database failure**: < 15 minutes
- **Application failure**: < 5 minutes
- **Region failure**: < 2 hours

### Recovery Point Objectives (RPO)
- **Database**: < 5 minutes (automated backups)
- **User uploads**: < 1 hour (S3 versioning)
- **Configuration**: 0 (version controlled)

---

## 9. Performance Requirements

### Response Time Targets
- **API endpoints**: < 200ms (p95)
- **Page load time**: < 2s (first contentful paint)
- **Time to interactive**: < 3s
- **KAVI response**: < 3s

### Throughput Targets
- **Concurrent users**: 100 (MVP), 1000 (Year 1)
- **Requests per second**: 100 (MVP), 500 (Year 1)
- **Database queries**: < 100ms (p95)

### Availability Targets
- **Uptime**: 99.9% (8.76 hours downtime/year)
- **Planned maintenance**: < 2 hours/month
- **Unplanned outages**: < 1 hour/quarter

---

## 10. Cost Management

### Cost Allocation Tags
```
Project: FinanceGrowth
Environment: Production/Staging/Development
Component: Frontend/Backend/Database
Owner: Engineering
CostCenter: Product
```

### Monthly Budget Alerts
- **Warning**: $100 (90% of budget)
- **Critical**: $115 (100% of budget)
- **Action**: $130 (115% of budget - investigate)

### Cost Optimization Strategies
1. Use Spot instances for non-critical workloads
2. Right-size ECS tasks based on actual usage
3. Enable S3 Intelligent-Tiering
4. Use CloudFront caching aggressively
5. Archive old logs to S3 Glacier
6. Use Reserved Instances for predictable workloads
7. Enable AWS Cost Explorer recommendations

---

## Appendix A: Environment Variables

```bash
# Django Settings
SECRET_KEY=<from Secrets Manager>
DEBUG=False
ALLOWED_HOSTS=api.financegrowth.co.ke
DATABASE_URL=postgresql://user:pass@host:5432/kavi
CORS_ALLOWED_ORIGINS=https://financegrowth.co.ke

# AWS Settings
AWS_ACCESS_KEY_ID=<IAM user>
AWS_SECRET_ACCESS_KEY=<from Secrets Manager>
AWS_STORAGE_BUCKET_NAME=kavi-uploads-prod
AWS_S3_REGION_NAME=eu-west-1

# External APIs
GEMINI_API_KEY=<from Secrets Manager>
ELEVENLABS_API_KEY=<from Secrets Manager>

# Application Settings
FRONTEND_URL=https://financegrowth.co.ke
API_URL=https://api.financegrowth.co.ke
```

---

## Appendix B: Deployment Checklist

### Pre-Launch
- [ ] Domain registered and DNS configured
- [ ] SSL certificates issued
- [ ] VPC and subnets created
- [ ] Security groups configured
- [ ] RDS database created and initialized
- [ ] ECS cluster created
- [ ] Container images built and pushed to ECR
- [ ] Task definitions created
- [ ] Services created
- [ ] Load balancer configured
- [ ] CloudFront distribution created
- [ ] Secrets stored in Secrets Manager
- [ ] CloudWatch alarms configured
- [ ] Backup policies configured
- [ ] IAM roles and policies created

### Launch Day
- [ ] Deploy latest code to production
- [ ] Verify health checks passing
- [ ] Run smoke tests
- [ ] Monitor logs for errors
- [ ] Test critical user flows
- [ ] Verify database migrations
- [ ] Test payment flows
- [ ] Verify external API integrations

### Post-Launch
- [ ] Monitor error rates
- [ ] Review CloudWatch dashboards
- [ ] Check cost reports
- [ ] Gather user feedback
- [ ] Plan optimization improvements

---

**END OF TECHNICAL SPECIFICATION**

For questions or clarifications, contact: [Your Email]  
Last Updated: November 24, 2025  
Next Review: December 24, 2025
