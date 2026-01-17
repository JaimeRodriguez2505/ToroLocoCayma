# Servicios Dockerizados - Toro Loco ERP

## 🐳 Servicios Disponibles

### 1. **Backend** (Node.js/Express)
- **Puerto**: `3000`
- **URL**: http://localhost:3000
- **Descripción**: API REST con autenticación JWT, manejo de ventas, inventario, gastos, etc.
- **Container**: `tiktendry-backend`

### 2. **Frontend** (React + Vite)
- **Puerto**: `8080`
- **URL**: http://localhost:8080
- **Descripción**: Aplicación web principal del ERP (Dashboard, ventas, productos, etc.)
- **Container**: `tiktendry-frontend`
- **Build**: Nginx sirviendo build estático de Vite

### 3. **Landing** (Next.js 16) ✨ **NUEVO**
- **Puerto**: `8081`
- **URL**: http://localhost:8081
- **Descripción**: Página landing pública del restaurante con menú digital, reservas, promociones
- **Container**: `tiktendry-landing`
- **Features**:
  - Servidor Next.js en modo standalone
  - Rendering dinámico para datos del backend
  - Integración con API de ecommerce
  - Formulario de reclamaciones
  - Sistema de reservas

### 4. **Factura (Laravel PHP)**
- **Puerto**: `8000`
- **URL**: http://localhost:8000
- **Descripción**: Sistema de facturación electrónica (integración SUNAT Perú)
- **Containers**:
  - `tiktendry-factura-php` (PHP-FPM)
  - `tiktendry-factura-nginx` (Nginx)

### 5. **Base de Datos (MySQL 8.0)**
- **Puerto**: `3306`
- **Host**: `localhost:3306`
- **Database**: `tiktendry`
- **Credentials**:
  - Usuario: `tiktendry`
  - Password: `tiktendry`
  - Root Password: `root`
- **Container**: `tiktendry-mysql`
- **Volume**: `db_data` (persistente)

---

## 🚀 Comandos Docker Compose

### Construir todos los servicios
```bash
docker-compose build
```

### Construir un servicio específico
```bash
docker-compose build backend
docker-compose build frontend
docker-compose build landing
docker-compose build factura-php
```

### Levantar todos los servicios
```bash
docker-compose up -d
```

### Levantar un servicio específico
```bash
docker-compose up -d landing
```

### Ver logs de un servicio
```bash
docker-compose logs -f landing
docker-compose logs -f backend
```

### Detener todos los servicios
```bash
docker-compose down
```

### Reiniciar un servicio
```bash
docker-compose restart landing
```

### Ver estado de servicios
```bash
docker-compose ps
```

---

## 📁 Estructura de Archivos

```
.
├── Backend/
│   ├── Dockerfile
│   ├── src/
│   └── .env
├── Frontend/
│   ├── Dockerfile
│   ├── src/
│   └── nginx.conf
├── landing/                    # ✨ NUEVO
│   ├── Dockerfile
│   ├── next.config.ts
│   ├── .env.production
│   └── src/
├── Factura/
│   ├── Dockerfile
│   ├── Dockerfile.nginx
│   └── app/
└── docker-compose.yml
```

---

## 🔧 Variables de Entorno

### Backend (.env)
```env
DB_HOST=db
DB_USER=tiktendry
DB_PASSWORD=tiktendry
DB_NAME=tiktendry
JWT_SECRET=your_secret_here
PORT=3000
TZ=America/Lima
```

### Landing (.env.production)
```env
NEXT_PUBLIC_BACKEND_URL=http://backend:3000
```

---

## 🌐 Red Docker

Todos los servicios están en la red `tiktendry-net` (bridge mode), permitiendo comunicación interna:

- `backend:3000` - Accesible desde landing y factura
- `db:3306` - Accesible desde backend y factura-php
- `factura-php:9000` - Accesible desde factura-nginx

---

## 📝 Notas Importantes

1. **Zona Horaria**: Todos los servicios usan `TZ=America/Lima`
2. **Volúmenes Compartidos**:
   - `Backend/src/uploads/certs` compartido con Factura
   - `Backend/src/uploads/logos` compartido con Factura
3. **Persistencia**: Solo la base de datos tiene volumen persistente (`db_data`)
4. **Hot Reload**: Backend tiene volumen montado para desarrollo

---

## 🧪 Testing

Para probar que todos los servicios están funcionando:

```bash
# Backend
curl http://localhost:3000/api/health

# Frontend
curl -I http://localhost:8080

# Landing
curl -I http://localhost:8081

# Factura
curl -I http://localhost:8000

# MySQL
mysql -h 127.0.0.1 -P 3306 -u tiktendry -ptiktendry tiktendry

# Test CORS desde Landing
curl -H "Origin: http://localhost:8081" http://localhost:3000/api/ecommerce/ofertas
```

---

## ⚠️ Configuración CORS

El backend está configurado para aceptar requests desde múltiples orígenes:

```javascript
// Backend/src/app.js
app.use(cors({
  origin: [
    'http://localhost:8080',      // Frontend (React ERP)
    'http://localhost:8081',      // Landing (Next.js)
    'http://localhost:8000',      // Factura
    'http://localhost:5173',      // Frontend dev
    'http://localhost:3033',      // Landing dev
    // ... más orígenes
  ],
  credentials: true
}))
```

**Importante**: Si agregas un nuevo servicio o cambias puertos, actualiza la configuración CORS en `Backend/src/app.js` y reinicia el contenedor backend:

```bash
docker-compose restart backend
```

---

## 📊 Recursos

### Uso de Puertos
- `3000` - Backend API
- `3306` - MySQL
- `8000` - Factura (Laravel)
- `8080` - Frontend (React)
- `8081` - Landing (Next.js) ✨

### Containers Activos
```bash
docker-compose ps
```

### Logs Consolidados
```bash
docker-compose logs -f --tail=100
```
