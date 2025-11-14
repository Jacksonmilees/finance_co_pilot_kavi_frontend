# Backend_KAVI_SME

Finance Growth Co-pilot Backend - KAVI (Kenyan AI Voice Interface) for SMEs

## Description

Backend API for the Finance Growth Co-pilot application, providing financial management services for small and medium enterprises (SMEs) with AI-powered voice assistance via KAVI.

## Features

- User authentication and profile management
- Financial data management (invoices, expenses, cash flow)
- AI-powered financial insights and analysis
- Voice conversation handling for KAVI integration
- Automated financial operations

## Tech Stack

- Django
- Django REST Framework
- PostgreSQL (recommended) / SQLite (development)
- Python 3.8+

## Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create superuser:
```bash
python manage.py createsuperuser
```
## API Endpoints

- `/api/users/` - User management
- `/api/finance/` - Financial operations
- `/api/core/` - Core business operations

## Environment Variables

See `.env.example` for required environment variables.

## License

Proprietary


