# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "TikTrendry" (formerly ERP-Restaurantes Toro Loco), a complete restaurant management system built as a multi-service application. The system handles inventory, sales (POS), invoicing (e-facturación), comandas (kitchen orders), cash register management, marketing, and more.

**Technology Stack:**
- **Backend**: Node.js/Express REST API with MySQL (Sequelize ORM)
- **Frontend**: React 19 + TypeScript + Vite with Tailwind CSS and shadcn/ui
- **Factura (Invoicing)**: Laravel PHP application for electronic invoicing (SUNAT integration for Peru)
- **Database**: MySQL 8.0
- **Deployment**: Docker Compose with 9 services (separated databases, Redis, Gateway)

## Architecture

The application follows a microservices-like architecture with three main applications:

### 1. Backend (Node.js/Express)
- **Location**: `./Backend/`
- **Port**: 4240 (exposed), 3000 (internal)
- **Database**: `tiktrendry_erp` (MySQL, port 3307)
- **Structure**:
  - `src/models/`: Sequelize models (18+ models including User, Producto, Venta, CierreCaja, etc.)
  - `src/controllers/`: Business logic for each entity
  - `src/routes/`: Express route definitions
  - `src/middlewares/`: Auth, validation, admin, audit, upload middlewares
  - `src/services/`: Background services (automatic cash register closing scheduler)
  - `src/utils/`: Utilities for migrations, admin user creation
  - `src/uploads/`: File storage for certificates, logos, and product images

**Key Features**:
- JWT authentication with role-based access control (roles: admin, manager, cashier)
- Barcode generation and management (bwip-js)
- Automated daily cash register closing (node-cron scheduler)
- Audit logging system
- Multi-payment methods (cash, card, transfer)
- Product inventory with SKU and barcode support
- Sales with IGV (tax) calculation
- Kitchen order management (comandas)
- Personal expense tracking (gastos_personal)

### 2. Frontend (React + TypeScript)
- **Location**: `./Frontend/`
- **Port**: 4242 (exposed), 80 (internal), 5173 (dev via Vite)
- **Structure**:
  - `src/pages/`: Route-based page components
  - `src/components/`: Reusable UI components (shadcn/ui + custom)
  - `src/services/`: API client services for backend communication
  - `src/contexts/`: React contexts (Auth, KeyboardShortcuts, Theme)
  - `src/hooks/`: Custom React hooks
  - `src/lib/`: Utilities and helpers
  - `src/styles/`: Global styles

**Key Features**:
- Protected routes with role-based access
- Business hours restrictions for certain operations
- Dark mode support
- Keyboard shortcuts system
- Real-time data with TanStack Query
- PDF generation for tickets and reports
- Excel export functionality
- Chart.js integration for analytics
- Mobile-responsive design

### 3. Factura (Laravel PHP)
- **Location**: `./Factura/`
- **Port**: 4244 (exposed), 80 (internal)
- **Database**: `tiktrendry_factura` (MySQL, port 3308)
- **Purpose**: Electronic invoicing (e-facturación) integration with SUNAT (Peru's tax authority)
- **Services**:
  - `factura-php`: PHP-FPM container (tiktrendry-factura-php)
  - `factura-nginx`: Nginx web server (tiktrendry-factura-nginx)

### 4. Landing Page (Next.js)
- **Location**: `./landing/`
- **Port**: 4243 (exposed), 3000 (internal)

## Common Development Commands

### Docker Compose (Recommended for Development)

The project includes a helper script `gestor.sh` for managing Docker services:

```bash
# Run the interactive manager
./gestor.sh

# Or use docker-compose directly:
docker-compose build              # Build all services
docker-compose up -d              # Start all services in detached mode
docker-compose down               # Stop all services
docker-compose restart backend    # Restart specific service
docker-compose logs -f backend    # View logs for specific service
```

### Backend Development

```bash
cd Backend

# Start development server (requires MySQL running)
npm start                         # Uses nodemon for auto-reload

# Database initialization (automatic on server start):
# - Connects to MySQL
# - Runs Sequelize sync
# - Executes migrations
# - Seeds initial roles
# - Creates admin user if not exists
# - Starts automatic cash closing scheduler
```

**Database Connection**: The backend expects MySQL at `db-erp:3306` (Docker) or `localhost:3307` (local). Database name is `tiktrendry_erp`. Credentials defined in `.env` file.

**IMPORTANT**: Backend and Factura now use **separate databases** to avoid table conflicts (especially the `users` table).

### Frontend Development

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev                       # Vite dev server on port 5173

# Build for production
npm run build                     # TypeScript compilation + Vite build

# Lint code
npm run lint                      # ESLint

# Preview production build
npm run preview
```

**API Base URL**: The frontend connects to backend at `http://localhost:3000/api` (configurable in `src/config/`).

### Factura (Laravel) Development

```bash
cd Factura

# Install dependencies (if not using Docker)
composer install

# Run migrations
php artisan migrate

# Clear caches
php artisan config:clear
php artisan cache:clear
```

## Database Architecture

**Main Tables**:
- `users`: User accounts with role-based permissions (1=Admin, 2=Manager, 3=Cashier)
- `categorias`: Product categories with barcode support
- `productos`: Products with SKU, pricing, stock, and multiple barcodes
- `codigos_barras`: Many-to-many relationship for product barcodes
- `ventas`: Sales transactions with payment methods and IGV calculation
- `detalle_ventas`: Line items for each sale
- `comandas`: Kitchen orders (pending/completed status)
- `cierres_caja`: Daily cash register closings with automatic reconciliation
- `gastos_personal`: Personal expenses with approval workflow
- `audit_logs`: System-wide audit trail
- `ofertas`: Daily offers and promotions
- `banners`: Marketing banners
- `companies`: Company information for invoicing
- `libro_reclamaciones`: Customer complaints book
- `carritos_guardados`: Saved shopping carts

**Important Relationships**:
- Products can have multiple barcodes (many-to-many via `codigos_barras`)
- Sales contain multiple products via `detalle_ventas`
- Cash closings (`cierres_caja`) aggregate ventas and gastos_personal
- Users have roles that determine access permissions

## Key Business Logic

### Automated Cash Register Closing
The system automatically closes the cash register daily at 11:59 PM Lima time using a cron scheduler (`src/services/cierreScheduler.service.js`). The process:
1. Aggregates all sales and approved expenses for the day
2. Calculates expected cash balance
3. Creates a `cierre_caja` record with status "completado"
4. Can be manually triggered via API endpoint for specific dates

### Sales Flow
1. Frontend creates sale with items (by barcode or product ID)
2. Backend validates stock availability
3. Calculates subtotals, IGV (18% tax), and total
4. Decrements product stock
5. Records payment method (cash, card, transfer, or mixed)
6. Optionally generates invoice via Factura service

### Authentication & Authorization
- JWT tokens issued on login (`/api/auth/login`)
- Tokens include user ID, role, and name
- Middleware validates tokens and checks role permissions
- Business hours middleware restricts certain operations outside 8 AM - 10 PM

## Testing

### Testing Backend API
The `Backend/README.md` contains comprehensive API testing examples using curl. Key endpoints:

```bash
# Register user
POST /api/auth/register

# Login
POST /api/auth/login

# Create category
POST /api/categorias (requires auth token)

# Create product
POST /api/productos (requires auth token)

# Create sale
POST /api/ventas (requires auth token)

# Get cash closing
GET /api/cierre-caja/:date (requires auth token)

# Run manual cash closing for date
POST /api/scheduler/run-for-date (requires auth token)
```

### Testing Cash Closing
Use the provided test script:
```bash
./test-cierre.sh
```
This script tests the automated cash closing functionality for October 10, 2025.

## Environment Configuration

### Backend .env
Key variables (see `.env.example`):
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: MySQL connection
- `JWT_SECRET`: Secret for JWT token signing
- `PORT`: Server port (default 3000)
- `TZ`: Timezone (America/Lima)

### Frontend
API configuration in `src/config/` should point to backend URL.

### Factura .env
Laravel standard configuration plus SUNAT API credentials for e-invoicing.

## Docker Services

The `docker-compose.yml` defines 9 services with **separated databases** to avoid table conflicts:

### Database Services (Separated)
1. **db-erp** (MySQL 8.0): Port 3307, database `tiktrendry_erp`, container `tiktrendry-db-erp`
   - Used exclusively by Backend
   - Persistent volume `db_erp_data`

2. **db-factura** (MySQL 8.0): Port 3308, database `tiktrendry_factura`, container `tiktrendry-db-factura`
   - Used exclusively by Factura service
   - Persistent volume `db_factura_data`
   - **Solves the "users table conflict" issue**

3. **redis** (Redis 7): Port 6380, container `tiktrendry-redis`
   - Shared cache and session store
   - Used by both Backend and Factura

### Application Services
4. **backend** (Node.js): Port 4240, container `tiktrendry-backend`
   - Connects to db-erp
   - Health checks enabled

5. **frontend** (React + Nginx): Port 4242, container `tiktrendry-frontend`
   - Built React application served by Nginx

6. **landing** (Next.js): Port 4243, container `tiktrendry-landing`
   - Marketing/landing page

7. **factura-php** (PHP-FPM): Container `tiktrendry-factura-php`
   - Connects to db-factura
   - Laravel application

8. **factura-nginx** (Nginx): Port 4244, container `tiktrendry-factura-nginx`
   - Serves Factura app

9. **nginx-gateway** (Nginx): Ports 80/443, container `tiktrendry-gateway`
   - Reverse proxy for all services
   - Routes: `/` (landing), `/api/` (backend), `/erp/` (frontend), `/factura/` (factura)

### Volume Architecture
**Database Volumes** (persistent):
- `db_erp_data`: ERP database data
- `db_factura_data`: Factura database data
- `redis_data`: Redis cache data

**Application Volumes**:
- `./Backend/src/uploads`: File uploads (shared read-only with Factura for certs/logos)
- `backend_logs`, `factura_logs`, `factura_nginx_logs`, `gateway_logs`: Service logs

**Key Change**: Databases are now **completely separated**, eliminating the "users table already exists" error when running migrations.

## Important Notes

### Timezone
All services use `America/Lima` timezone. The scheduler and date calculations depend on this setting.

### Database Initialization
On first startup, the Backend automatically:
1. Creates tables via Sequelize sync
2. Runs custom migrations for schema updates
3. Seeds default roles (Admin, Manager, Cashier)
4. Creates a default admin user if none exists

### File Uploads
Product images, certificates, and company logos are stored in `Backend/src/uploads/` and served via `/uploads` route.

### Role IDs
- 1 = Admin (full access)
- 2 = Manager (most features, no user management)
- 3 = Cashier (POS operations, limited features)

### Frontend Routes
Protected routes require authentication. Some routes have additional `requiresBusinessHours` constraint (8 AM - 10 PM).

## Troubleshooting

### Backend won't start
- Check MySQL is running and credentials are correct
- Review logs: `docker-compose logs -f backend`
- Verify `.env` file exists and has correct values

### Frontend can't connect to Backend
- Ensure Backend is running on port 3000
- Check CORS settings in `Backend/src/app.js`
- Verify API base URL in Frontend config

### Database errors
- Check MySQL container status: `docker-compose ps`
- Access MySQL ERP directly: `docker exec -it tiktrendry-db-erp mysql -uroot -p` (database: `tiktrendry_erp`)
- Access MySQL Factura directly: `docker exec -it tiktrendry-db-factura mysql -uroot -p` (database: `tiktrendry_factura`)
- Review migration logs on Backend startup

### "Table users already exists" error
✅ **This issue is now RESOLVED**. Backend and Factura use separate databases:
- Backend uses `tiktrendry_erp` (port 3307)
- Factura uses `tiktrendry_factura` (port 3308)

If you still see this error, verify your `.env` files have the correct database names.

### Scheduler not running
- Check Backend logs for scheduler initialization
- Verify timezone settings (TZ=America/Lima)
- Manually trigger: `POST /api/scheduler/run-for-date` with auth token

## Production Deployment

For production deployment, see **DEPLOYMENT.md** which includes:
- Complete setup guide for VPS
- Environment configuration
- SSL/HTTPS setup with Let's Encrypt
- Backup and restore procedures
- Security checklist
- Monitoring and troubleshooting

### Quick Start for Production

1. Copy environment template:
   ```bash
   cp .env.production .env
   ```

2. Update all passwords in `.env` (CRITICAL!)

3. Build and start services:
   ```bash
   ./gestor.sh
   # Select option 1 to start all services
   ```

4. The improved `gestor.sh` script provides:
   - Service management (start/stop/restart)
   - Log viewing for all services
   - Database access and backups
   - Resource monitoring
   - Migrations runner
   - Cleanup utilities

See `./gestor.sh` menu for all available options.
