# Record Management System

A modern full-stack web application for managing customers, products, orders, and allergen information. Built with React, Django REST Framework, and PostgreSQL.

## Features

- **Authentication**: Secure login system with token-based authentication
- **Dashboard**: Overview of business metrics with quick actions
- **Customer Management**: CRUD operations for customer records with search
- **Product Management**: Product catalog with allergen tracking and filtering
- **Order Management**: Create and manage orders with product selection
- **Allergen Information**: Track and display allergen data for food safety compliance

## Tech Stack

### Frontend

- React 18 with Vite
- React Router v6 for navigation
- Tailwind CSS for styling
- Axios for API requests
- Lucide React for icons
- date-fns for date formatting

### Backend

- Django 4.2+
- Django REST Framework
- PostgreSQL (with SQLite fallback for development)
- Token Authentication

## Project Structure

```
record-management-system/
├── backend/
│   ├── api/
│   │   ├── models.py        # Data models
│   │   ├── serializers.py   # API serializers
│   │   ├── views.py         # API endpoints
│   │   ├── urls.py          # URL routing
│   │   └── admin.py         # Admin interface
│   ├── core/
│   │   ├── settings.py      # Django settings
│   │   └── urls.py          # Root URLs
│   ├── requirements.txt     # Python dependencies
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS files
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 13+ (optional, SQLite can be used for development)

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create environment file:

   ```bash
   cp .env.example .env
   ```

5. Configure your `.env` file for development (SQLite):

   ```
   # Django Configuration
   DEBUG=true
   DJANGO_SECRET_KEY=your-secret-key-here-change-this-in-production

   # Database - Use SQLite for development
   USE_SQLITE=true

   # CORS Configuration
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

   Or for production (PostgreSQL):

   ```
   DEBUG=false
   DJANGO_SECRET_KEY=your-production-secret-key
   USE_SQLITE=false
   DB_NAME=record_management_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   ```

6. Run migrations:

   ```bash
   python manage.py migrate
   ```

7. Create a superuser:

   ```bash
   python manage.py createsuperuser
   ```

8. Start the development server:
   ```bash
   python manage.py runserver
   ```

The backend API will be available at `http://localhost:8000/api/`

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000/`

## API Endpoints

### Authentication

- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/register/` - Register new user
- `GET /api/auth/me/` - Get current user

### Customers

- `GET /api/customers/` - List customers
- `POST /api/customers/` - Create customer
- `GET /api/customers/{id}/` - Get customer
- `PUT /api/customers/{id}/` - Update customer
- `DELETE /api/customers/{id}/` - Delete customer
- `GET /api/customers/list_simple/` - Simple list for dropdowns

### Products

- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `GET /api/products/{id}/` - Get product
- `PUT /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product
- `GET /api/products/types/` - Get product types
- `GET /api/products/suitabilities/` - Get suitability options

### Orders

- `GET /api/orders/` - List orders
- `POST /api/orders/` - Create order
- `GET /api/orders/{id}/` - Get order
- `PUT /api/orders/{id}/` - Update order
- `DELETE /api/orders/{id}/` - Delete order
- `GET /api/orders/{id}/products/` - Get order products
- `POST /api/orders/{id}/add_product/` - Add product to order
- `GET /api/orders/payment_methods/` - Get payment methods
- `GET /api/orders/statuses/` - Get order statuses

### Allergens

- `GET /api/allergens/` - List allergens
- `POST /api/allergens/` - Create allergen
- `GET /api/allergens/{id}/` - Get allergen
- `PUT /api/allergens/{id}/` - Update allergen
- `DELETE /api/allergens/{id}/` - Delete allergen

### Dashboard

- `GET /api/dashboard/stats/` - Get dashboard statistics

## Default Data Models

### Customer

- Prefix (Mr, Mrs, Dr, etc.)
- First Name
- Last Name
- Phone
- Email
- Suffix

### Product

- Name
- Price
- Product Type (food, beverage, dessert, etc.)
- Suitability (vegetarian, vegan, gluten-free, etc.)
- Is Active
- Allergens (many-to-many)

### Order

- Customer
- Total Price
- Payment Method
- Order Placed (datetime)
- Order Due (datetime)
- Status
- Comments
- Products (through OrderProduct)

### Allergen

- Name
- Description
- Products (many-to-many)

## Development

### Running Tests

Backend:

```bash
cd backend
python manage.py test
```

Frontend:

```bash
cd frontend
npm run test
```

### Building for Production

Frontend:

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

### Environment Variables

#### Backend (.env)

| Variable    | Description                      | Default   |
| ----------- | -------------------------------- | --------- |
| SECRET_KEY  | Django secret key                | -         |
| DEBUG       | Debug mode                       | false     |
| USE_SQLITE  | Use SQLite instead of PostgreSQL | false     |
| DB_NAME     | PostgreSQL database name         | recordms  |
| DB_USER     | PostgreSQL user                  | -         |
| DB_PASSWORD | PostgreSQL password              | -         |
| DB_HOST     | PostgreSQL host                  | localhost |
| DB_PORT     | PostgreSQL port                  | 5432      |

#### Frontend (.env)

| Variable     | Description     | Default |
| ------------ | --------------- | ------- |
| VITE_API_URL | Backend API URL | /api    |

## License

This project is for educational purposes.

## Acknowledgements

- Original VB.NET application design
- React and Django communities
- Tailwind CSS team
