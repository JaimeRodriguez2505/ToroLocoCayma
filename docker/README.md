# Docker Configuration

Esta carpeta contiene las configuraciones de Docker para TikTrendry.

## Estructura

```
docker/
├── mysql/
│   ├── init-erp.sql          # Script de inicialización de BD ERP
│   └── init-factura.sql      # Script de inicialización de BD Factura
├── nginx/
│   ├── nginx.conf            # Configuración del gateway Nginx
│   └── ssl/                  # Certificados SSL (crear aquí)
│       ├── cert.pem          # Certificado SSL (no incluido)
│       └── key.pem           # Llave privada SSL (no incluida)
└── README.md                 # Este archivo
```

## MySQL Init Scripts

Los scripts en `mysql/` se ejecutan automáticamente cuando se crea el contenedor de MySQL por primera vez:

- **init-erp.sql**: Configura la base de datos `tiktrendry_erp` para el Backend
- **init-factura.sql**: Configura la base de datos `tiktrendry_factura` para el servicio de Factura

Estos scripts:
- Establecen el timezone a America/Lima
- Configuran charset UTF8MB4
- Optimizan parámetros de MySQL

## Nginx Gateway

El archivo `nginx/nginx.conf` configura el reverse proxy que enruta las peticiones a los diferentes servicios:

- `/` → Landing page
- `/api/` → Backend API
- `/erp/` → Frontend ERP
- `/factura/` → Sistema de facturación
- `/uploads/` → Archivos estáticos

## SSL Certificates

Para habilitar HTTPS:

1. Obtén certificados SSL (Let's Encrypt recomendado)
2. Copia los certificados a `nginx/ssl/`:
   ```bash
   cp /path/to/fullchain.pem nginx/ssl/cert.pem
   cp /path/to/privkey.pem nginx/ssl/key.pem
   ```
3. Descomenta la sección HTTPS en `nginx/nginx.conf`
4. Reinicia el gateway: `docker-compose restart nginx-gateway`

Ver DEPLOYMENT.md para más detalles sobre configuración SSL.
