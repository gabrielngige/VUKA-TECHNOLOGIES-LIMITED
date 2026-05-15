# Vuka Cereals - E-Commerce Platform

A full-stack e-commerce application for wholesale and retail cereal distribution in Kenya. Built with React, Express.js, and modern web technologies.

![Vuka Logo](favicon.svg)

## Features

- **Dual Pricing Model** - Separate retail and wholesale pricing tiers
- **Shopping Cart** - Persistent cart with quantity management
- **User Authentication** - JWT-based login/register with secure password hashing
- **Admin Dashboard** - Manage products, view orders, and track inventory
- **Live Delivery Tracking** - Interactive Leaflet map with real-time order tracking
- **M-Pesa Integration** - Mobile payment support for Kenyan market
- **Error Handling** - Comprehensive error boundaries and graceful error messages
- **Responsive Design** - Mobile-first UI with Tailwind CSS

## Tech Stack

### Frontend
- **React 18.3** - UI framework with hooks
- **Vite 8** - Fast bundler and dev server
- **React Router 6** - Client-side routing with v7 compatibility
- **Zustand** - Lightweight state management with persistence
- **Tailwind CSS** - Utility-first styling framework
- **Leaflet** - Interactive mapping library
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

### Backend
- **Express.js 4.19** - Web server framework
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## Prerequisites

- Node.js 16+ and npm 8+
- A code editor (VS Code recommended)

## Installation

1. **Clone and navigate to the project:**
```bash
cd vuka-cereals
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
# Copy .env template and add your values
cp .env.example .env  # or create manually with:
# JWT_SECRET=your_secret_key
# PORT=4000
```

##  Running the Application

### Development Mode (Both Frontend & Backend)
```bash
npm run dev:all
```
This runs:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000

### Frontend Only
```bash
npm run dev
```
Starts Vite dev server at `http://localhost:5173`

### Backend Only
```bash
npm run server
```
Starts Express server at `http://localhost:4000`

### Production Build
```bash
npm run build
npm run preview
```

## Project Structure

```
vuka-cereals/
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.jsx      # Error fallback UI
│   │   ├── layout/                # Navigation & branding
│   │   ├── catalog/               # Product display & filters
│   │   ├── cart/                  # Shopping cart
│   │   ├── delivery/              # Map-based delivery tracking
│   │   ├── payment/               # Payment processing
│   │   └── admin/                 # Admin management
│   ├── pages/
│   │   ├── HomePage.jsx           # Catalog & product browsing
│   │   ├── LoginPage.jsx          # Authentication
│   │   ├── CartPage.jsx           # Shopping cart view
│   │   ├── DeliveryPage.jsx       # Delivery tracking
│   │   └── AdminPage.jsx          # Admin dashboard
│   ├── store/
│   │   └── index.js               # Zustand state stores
│   ├── App.jsx                    # Main app component
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles
├── server/
│   ├── index.js                   # Express server setup
│   ├── routes/
│   │   ├── auth.js                # Authentication endpoints
│   │   ├── mpesa.js               # Payment endpoints
│   │   └── upload.js              # File upload endpoints
│   ├── db/
│   │   └── users.json             # User database
│   └── uploads/                   # Uploaded files storage
├── public/                        # Static assets
├── package.json                   # Dependencies & scripts
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS config
└── README.md                      # This file
```

## Authentication

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1234567890,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  "token": "eyJhbGc..."
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": { ... },
  "token": "eyJhbGc..."
}
```

### Default Admin Credentials
```
Email: admin@vuka.co.ke
```

## 🛒 State Management (Zustand)

### useCartStore
- `items` - Array of cart items
- `mode` - 'retail' or 'wholesale'
- `addItem(product)` - Add product to cart
- `removeItem(id)` - Remove product from cart
- `updateQty(id, qty)` - Update item quantity
- `clearCart()` - Empty the cart
- `total` - Computed total price
- `count` - Total number of items

### useAuthStore
- `user` - Current logged-in user or null
- `token` - JWT token
- `isAdmin` - Is user an admin
- `login(user, token)` - Set authenticated user
- `logout()` - Clear auth data

### useProductStore
- `products` - Array of available products
- `activeCategory` - Selected filter category
- `search` - Search query
- `filtered` - Computed filtered product list
- `addProduct(product)` - Add new product
- `updateProduct(id, data)` - Update product
- `deleteProduct(id)` - Delete product

### useDeliveryStore
- `orders` - Array of delivery orders
- `updateStatus(id, status)` - Update order status
- `addOrders(newOrder)` - Add new order

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/mpesa/pay` | Process M-Pesa payment |
| POST | `/api/upload` | Upload file |
| GET | `/api/health` | Health check |

## Development Workflow

1. **Create a feature branch:**
```bash
git checkout -b feature/my-feature
```

2. **Make changes and test:**
```bash
npm run dev:all
```

3. **Check code quality:**
```bash
npm run lint
```

4. **Build and preview:**
```bash
npm run build
npm run preview
```

## Error Handling

The application includes:
- **Error Boundary** - Catches React component errors
- **Try-Catch Blocks** - Handles async operations
- **HTTP Error Status Handling**:
  - 400 - Validation errors
  - 401 - Unauthorized (wrong credentials)
  - 409 - Conflict (email already registered)
  - 500+ - Server errors
- **Toast Notifications** - User-friendly error messages

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run server` | Start backend server |
| `npm run dev:all` | Start both concurrently |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint checks |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- [ ] Migrate to MongoDB/PostgreSQL database
- [ ] Add comprehensive test suite (Jest, React Testing Library)
- [ ] Implement role-based access control (RBAC)
- [ ] Add order history and invoices
- [ ] Real-time notifications via WebSocket
- [ ] Product image optimization
- [ ] Pagination for product catalog
- [ ] Advanced analytics dashboard
- [ ] Docker containerization
- [ ] API documentation (Swagger/OpenAPI)

## Configuration

### Environment Variables (.env)
```
JWT_SECRET=your_jwt_secret_key
PORT=4000
NODE_ENV=development
```

### Vite Dev Proxy
Frontend automatically proxies `/api` and `/uploads` to `http://localhost:4000`

## License

MIT License - See LICENSE file for details

## Contributing

1. Follow existing code style and naming conventions
2. Ensure ESLint passes: `npm run lint`
3. Write clear commit messages
4. Test your changes before submitting PR

## Support

For issues or questions, please check:
1. GitHub Issues
2. Project documentation
3. Code comments in source files

---

**Built by AVENUE MOBILE SOLUTIONS || Gabriel Ngige**
