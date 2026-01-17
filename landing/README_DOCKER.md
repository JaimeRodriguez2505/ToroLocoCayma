# Landing Page - Configuración Docker

## 🌐 Sistema de URLs (Dual URL System)

La landing page usa un sistema de URLs dual para funcionar correctamente tanto en Docker como en el navegador del usuario:

### Server-Side (SSR/SSG) - Dentro de Docker
- **Variable**: `BACKEND_URL=http://backend:3000`
- **Uso**: Para fetch durante Server-Side Rendering
- **Alcance**: Solo funciona dentro de la red Docker
- **Ejemplo**: Next.js hace fetch a `http://backend:3000/api/ecommerce/banners` durante el render del servidor

### Client-Side (Browser) - Navegador del Usuario
- **Variable**: `NEXT_PUBLIC_BACKEND_URL=http://localhost:3000`
- **Uso**: Para fetch desde el navegador del usuario
- **Alcance**: Debe ser accesible públicamente
- **Ejemplo**: `PromoGrid` hace fetch a `http://localhost:3000/api/ecommerce/ofertas` desde el navegador

### ¿Cómo funciona?

```typescript
// src/lib/url.ts
export function getBackendBaseUrl() {
  if (typeof window === 'undefined') {
    // Server-side: usar URL interna de Docker
    return process.env.BACKEND_URL ?? "http://backend:3000";
  } else {
    // Client-side: usar URL pública
    return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
  }
}
```

### Normalización de URLs

Las URLs devueltas por el backend que contienen `http://backend:3000` se normalizan automáticamente a `http://localhost:3000` para que el navegador pueda cargarlas:

```typescript
// src/lib/url.ts
export function toAbsoluteUrl(pathOrUrl: string | null) {
  // ...
  if (cleanUrl.includes('http://backend:3000')) {
    cleanUrl = cleanUrl.replace('http://backend:3000',
      process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000');
  }
  // ...
}
```

## 📝 Variables de Entorno

### Desarrollo Local (sin Docker)
Crear `.env.local`:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### Producción (Docker)
El archivo `.env.production` ya está configurado:
```bash
# Server-side (SSR/SSG)
BACKEND_URL=http://backend:3000

# Client-side (navegador)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### Producción en Servidor Público
Si despliegas en un servidor con dominio público, actualiza:
```bash
BACKEND_URL=http://backend:3000  # Mantener para red interna Docker
NEXT_PUBLIC_BACKEND_URL=https://api.tudominio.com  # URL pública del backend
```

## 🔧 Configuración Docker Compose

El servicio está configurado en `docker-compose.yml`:

```yaml
landing:
  build:
    context: ./landing
    dockerfile: Dockerfile
  container_name: tiktendry-landing
  restart: unless-stopped
  environment:
    - TZ=America/Lima
    - NODE_ENV=production
    - NEXT_TELEMETRY_DISABLED=1
    - BACKEND_URL=http://backend:3000          # Server-side
    - NEXT_PUBLIC_BACKEND_URL=http://localhost:3000  # Client-side
  ports:
    - "8081:3000"
  depends_on:
    - backend
  networks:
    - tiktendry-net
```

## 🚀 Comandos

### Build y Start
```bash
docker-compose build landing
docker-compose up -d landing
```

### Ver logs
```bash
docker-compose logs -f landing
```

### Rebuild después de cambios
```bash
docker-compose build landing && docker-compose up -d landing
```

### Acceder
- **URL**: http://localhost:8081
- **Backend API**: http://localhost:3000

## 🐛 Troubleshooting

### Problema: "Failed to load resource: A server with the specified hostname could not be found"
**Causa**: Las URLs del backend contienen `http://backend:3000` que no es accesible desde el navegador.

**Solución**: Asegúrate de que:
1. `NEXT_PUBLIC_BACKEND_URL=http://localhost:3000` está configurado
2. El backend está corriendo en `localhost:3000`
3. Reconstruiste el contenedor después de cambiar las variables

### Problema: Imágenes no cargan
**Causa**: Las URLs de las imágenes apuntan a `http://backend:3000/uploads/...`

**Solución**: La función `toAbsoluteUrl()` normaliza estas URLs automáticamente. Si sigues teniendo problemas:
1. Verifica que el backend esté accesible: `curl http://localhost:3000/api/ecommerce/banners`
2. Revisa los logs del landing: `docker-compose logs -f landing`

### Problema: CORS errors
**Causa**: El backend no permite requests desde `http://localhost:8081`

**Solución**: Verifica la configuración CORS en el backend (`Backend/src/app.js`):
```javascript
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:5173'],
  credentials: true
}));
```

## 📊 Arquitectura de Red

```
┌─────────────────────────────────────────────┐
│            Navegador del Usuario            │
│                                             │
│  http://localhost:8081  (Landing)          │
│         ↓                                   │
│  http://localhost:3000  (Backend API)      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          Red Docker (tiktendry-net)         │
│                                             │
│  ┌────────────┐    ┌──────────────┐       │
│  │  landing   │───→│   backend    │       │
│  │ :3000      │    │   :3000      │       │
│  └────────────┘    └──────────────┘       │
│      ↓ (SSR)           ↓                   │
│  http://backend:3000/api/...              │
└─────────────────────────────────────────────┘
```

## 🔐 Seguridad

### Variables de Entorno Públicas vs Privadas

- **`NEXT_PUBLIC_*`**: Se exponen al navegador (client-side)
  - Usar solo para URLs públicas
  - NO incluir secretos o tokens

- **Sin prefijo**: Solo server-side
  - Seguras para secretos
  - No se exponen al navegador

### Ejemplo Seguro
```bash
# ✅ OK - URL pública
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000

# ❌ MAL - Nunca exponer secretos
NEXT_PUBLIC_API_KEY=secret123

# ✅ OK - Solo server-side
API_SECRET_KEY=secret123
```

## 🎯 Dynamic Rendering

Las páginas que hacen fetch al backend usan `force-dynamic` para evitar errores en build time:

```typescript
// src/app/page.tsx
export const dynamic = 'force-dynamic';

export default async function Home() {
  const banners = await getEcommerceBanners();
  // ...
}
```

Esto asegura que el fetch se ejecute en runtime, no durante el build.

## 📱 Testing

### Test 1: Verificar que el servidor funciona
```bash
curl http://localhost:8081
```

### Test 2: Verificar que el backend es accesible
```bash
curl http://localhost:3000/api/ecommerce/banners
```

### Test 3: Verificar variables de entorno en el contenedor
```bash
docker exec tiktendry-landing env | grep BACKEND
```

Deberías ver:
```
BACKEND_URL=http://backend:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### Test 4: Verificar fetch desde dentro del contenedor
```bash
docker exec tiktendry-landing wget -qO- http://backend:3000/api/ecommerce/banners
```

## 📚 Referencias

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Next.js Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)
- [Docker Networking](https://docs.docker.com/network/)
