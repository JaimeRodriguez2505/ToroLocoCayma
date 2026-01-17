# Changelog - Dockerización Landing Page

## 📅 Fecha: 2026-01-16

## ✅ Completado

### 🐳 Dockerización de Landing Page (Next.js 16)

#### Archivos Creados

1. **`landing/Dockerfile`**
   - Dockerfile multi-stage optimizado para Next.js 16
   - Tres stages: deps, builder, runner
   - Imagen base: `node:20-alpine`
   - Usuario no-root: `nextjs:nodejs` (UID/GID 1001)
   - Modo standalone para mejor rendimiento

2. **`landing/.dockerignore`**
   - Optimiza build excluyendo archivos innecesarios
   - Reduce contexto de build significativamente

3. **`landing/.env.production`**
   - Variables de entorno para producción
   - Sistema dual de URLs (server-side y client-side)

4. **`landing/README_DOCKER.md`**
   - Documentación completa del sistema de URLs
   - Troubleshooting y testing
   - Ejemplos de uso

5. **`landing/PAGINAS_FALTANTES.md`**
   - Documentación de páginas pendientes
   - Guía para crear páginas legales
   - Plantillas y ejemplos

6. **`SERVICIOS.md`**
   - Documentación de todos los servicios Docker
   - Comandos útiles
   - Testing y configuración CORS

7. **`CHANGELOG_DOCKER_LANDING.md`** (este archivo)
   - Registro de cambios

#### Archivos Modificados

1. **`landing/next.config.ts`**
   - Agregado `output: 'standalone'` para Docker

2. **`landing/src/lib/url.ts`**
   - Implementado sistema dual de URLs
   - Server-side: `http://backend:3000` (red interna Docker)
   - Client-side: `http://localhost:3000` (público)
   - Normalización automática de URLs internas

3. **`landing/src/app/page.tsx`**
   - Agregado `export const dynamic = 'force-dynamic'`
   - Evita errores de fetch en build time

4. **`landing/src/app/menu/page.tsx`**
   - Agregado `export const dynamic = 'force-dynamic'`

5. **`docker-compose.yml`**
   - Nuevo servicio `landing`
   - Puerto: `8081:3000`
   - Variables de entorno configuradas
   - Dependencia de `backend`
   - Red: `tiktendry-net`

6. **`Backend/src/app.js`**
   - Actualizada configuración CORS
   - Agregado `http://localhost:8081` a orígenes permitidos
   - Agregado `http://127.0.0.1:8081` a orígenes permitidos

---

## 🎯 Problemas Resueltos

### 1. Error de Build - Fetch Failed Durante Build Time
**Problema**: Next.js intentaba hacer fetch al backend durante el build, pero el backend no estaba disponible.

**Solución**:
- Agregado `export const dynamic = 'force-dynamic'` en páginas que hacen fetch
- Esto fuerza rendering dinámico en runtime, no en build time

### 2. Error de URLs - Backend Hostname No Accesible desde Navegador
**Problema**: Las URLs contenían `http://backend:3000` que solo funciona dentro de Docker.

**Solución**:
- Sistema dual de URLs:
  - Server-side (SSR): `http://backend:3000` (red interna Docker)
  - Client-side (navegador): `http://localhost:3000` (público)
- Normalización automática en `toAbsoluteUrl()`

### 3. Error CORS - Origin Not Allowed
**Problema**: El backend no permitía requests desde `http://localhost:8081`.

**Solución**:
- Actualizada configuración CORS en `Backend/src/app.js`
- Agregados puertos 8081 (landing) a la whitelist
- Reiniciado contenedor backend

### 4. Páginas 404 - Privacidad, Términos, Reservas
**Problema**: Enlaces en Footer a páginas que no existen.

**Solución**:
- Documentadas en `PAGINAS_FALTANTES.md`
- Provistas plantillas y guías para crearlas
- No afecta funcionalidad principal

---

## 🚀 Configuración Final

### Servicios Activos

| Servicio | Container | Puerto | URL | Status |
|----------|-----------|--------|-----|--------|
| MySQL | tiktendry-mysql | 3306 | localhost:3306 | ✅ Running |
| Backend | tiktendry-backend | 3000 | http://localhost:3000 | ✅ Running |
| Frontend | tiktendry-frontend | 8080 | http://localhost:8080 | ✅ Running |
| **Landing** | **tiktendry-landing** | **8081** | **http://localhost:8081** | ✅ Running |
| Factura PHP | tiktendry-factura-php | 9000 | - | ✅ Running |
| Factura Nginx | tiktendry-factura-nginx | 8000 | http://localhost:8000 | ✅ Running |

### Variables de Entorno

#### Landing Container
```bash
TZ=America/Lima
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
BACKEND_URL=http://backend:3000                # Server-side (SSR)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000  # Client-side
```

#### CORS Backend
```javascript
origin: [
  'http://localhost:8080',      // Frontend (React ERP)
  'http://localhost:8081',      // Landing (Next.js) ✨ NEW
  'http://127.0.0.1:8081',      // Landing (Next.js) ✨ NEW
  'http://localhost:8000',      // Factura
  'http://localhost:5173',      // Frontend dev
  'http://localhost:3033',      // Landing dev
  // ...
]
```

---

## 📊 Tests Realizados

### ✅ Build Test
```bash
docker-compose build landing
# ✅ Build exitoso (45s aprox)
```

### ✅ Container Test
```bash
docker-compose up -d landing
docker-compose ps
# ✅ Contenedor corriendo
```

### ✅ HTTP Test
```bash
curl -I http://localhost:8081
# ✅ HTTP/1.1 200 OK
```

### ✅ Server-Side Fetch Test
```bash
docker exec tiktendry-landing wget -qO- http://backend:3000/api/ecommerce/banners
# ✅ JSON response con banners
```

### ✅ CORS Test
```bash
curl -H "Origin: http://localhost:8081" http://localhost:3000/api/ecommerce/ofertas
# ✅ Access-Control-Allow-Origin: http://localhost:8081
```

### ✅ Client-Side Fetch Test
- Abrir http://localhost:8081/promociones
- ✅ Ofertas y tarjetas cargan correctamente
- ✅ No hay errores CORS en consola

---

## 🔧 Comandos Útiles

### Reconstruir y Reiniciar
```bash
docker-compose build landing && docker-compose up -d landing
```

### Ver Logs
```bash
docker-compose logs -f landing
```

### Ver Variables de Entorno
```bash
docker exec tiktendry-landing env | grep BACKEND
```

### Reiniciar Backend (después de cambios CORS)
```bash
docker-compose restart backend
```

### Ver Estado de Servicios
```bash
docker-compose ps
```

### Detener Todo
```bash
docker-compose down
```

### Levantar Todo
```bash
docker-compose up -d
```

---

## 📝 Notas Importantes

### Para Desarrollo Local (sin Docker)
Si quieres desarrollar la landing sin Docker:

```bash
cd landing
npm install
npm run dev  # Puerto 3033 por defecto
```

Crear `.env.local`:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### Para Producción con Dominio Público
Si despliegas en un servidor con dominio:

Actualizar en `docker-compose.yml`:
```yaml
environment:
  - BACKEND_URL=http://backend:3000
  - NEXT_PUBLIC_BACKEND_URL=https://api.tudominio.com  # ⚠️ Cambiar
```

Y actualizar CORS en backend:
```javascript
origin: [
  'https://tudominio.com',      // Landing pública
  'https://api.tudominio.com',  // API pública
  // ...
]
```

### Arquitectura de Red

```
┌─────────────────────────────────────────────┐
│         Navegador del Usuario               │
│                                             │
│  Landing: http://localhost:8081            │
│       ↓ (fetch desde navegador)            │
│  Backend: http://localhost:3000            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│    Red Docker (tiktendry-net - bridge)      │
│                                             │
│  ┌──────────┐  SSR  ┌──────────┐          │
│  │ landing  │──────→│ backend  │          │
│  │ :3000    │       │ :3000    │          │
│  └──────────┘       └──────────┘          │
│       │                  │                 │
│  http://backend:3000/api/...              │
└─────────────────────────────────────────────┘
```

---

## 🎉 Resultado Final

- ✅ Landing dockerizada y funcionando en puerto 8081
- ✅ Sistema dual de URLs (server-side y client-side)
- ✅ CORS configurado correctamente
- ✅ Fetch desde navegador funciona (ofertas, tarjetas, banners)
- ✅ SSR funciona con red interna Docker
- ✅ Imágenes cargan correctamente
- ✅ Documentación completa creada
- ✅ Tests exitosos
- ✅ Integración completa con el ecosistema Docker

---

## 📚 Documentación Adicional

- **Sistema de URLs**: `landing/README_DOCKER.md`
- **Páginas Faltantes**: `landing/PAGINAS_FALTANTES.md`
- **Todos los Servicios**: `SERVICIOS.md`
- **Configuración Backend**: `Backend/README.md`
- **Proyecto General**: `CLAUDE.md`

---

## 🚨 Próximos Pasos

### Opcionales (No Críticos)

1. **Crear páginas legales**:
   - [ ] `/terminos` - Términos y Condiciones
   - [ ] `/privacidad` - Política de Privacidad
   - [ ] `/reservas` - Sistema de reservas (o redirigir)

2. **Optimizaciones**:
   - [ ] Configurar Next.js Image Optimization
   - [ ] Implementar caching de API responses
   - [ ] Agregar Sentry o logging

3. **Producción**:
   - [ ] Configurar dominio público
   - [ ] Actualizar URLs de producción
   - [ ] Configurar HTTPS/SSL
   - [ ] Optimizar build para producción

---

## 👨‍💻 Autor

Dockerización realizada por Claude Code
Fecha: 2026-01-16
Proyecto: Toro Loco ERP - Landing Page Integration
