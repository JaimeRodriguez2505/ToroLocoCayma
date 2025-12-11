# 📡 API Pública para Página Web - Toro Loco Cayma

**Fecha:** 9 de diciembre de 2025
**Base URL:** `http://localhost:3000/api/ecommerce`
**Producción:** `https://tu-dominio.com/api/ecommerce`

---

## 🔓 **IMPORTANTE: APIs Públicas (Sin Autenticación)**

Todos estos endpoints son **públicos** y **NO requieren token de autenticación**.
Están diseñados específicamente para ser consumidos por la página web pública del restaurante.

---

## 📋 **Índice de Endpoints**

1. [Categorías](#1-categorías)
2. [Productos](#2-productos)
3. [Productos en Oferta](#3-productos-en-oferta)
4. [Banners de Marketing](#4-banners-de-marketing)
5. [Tarjetas Promocionales](#5-tarjetas-promocionales)
6. [Libro de Reclamaciones](#6-libro-de-reclamaciones)

---

## 1. Categorías

### 📌 **Obtener todas las categorías**

```http
GET /api/ecommerce/categorias
```

**Descripción:** Obtiene el listado completo de todas las categorías de productos con sus imágenes.

#### Request en Postman:
```
Method: GET
URL: http://localhost:3000/api/ecommerce/categorias
Headers: (ninguno requerido)
Body: (ninguno)
```

#### Respuesta Exitosa (200):
```json
[
  {
    "id_categoria": 1,
    "nombre": "Pollos a la Brasa",
    "descripcion": "Deliciosos pollos a la brasa dorados y jugosos",
    "imagen_url": "https://tu-servidor.com/uploads/categorias/pollos.jpg"
  },
  {
    "id_categoria": 2,
    "nombre": "Parrillas",
    "descripcion": "Carnes a la parrilla de primera calidad",
    "imagen_url": "https://tu-servidor.com/uploads/categorias/parrillas.jpg"
  },
  {
    "id_categoria": 3,
    "nombre": "Bebidas",
    "descripcion": "Bebidas frías y calientes",
    "imagen_url": "https://tu-servidor.com/uploads/categorias/bebidas.jpg"
  }
]
```

#### Campos de respuesta:
- `id_categoria` (number): ID único de la categoría
- `nombre` (string): Nombre de la categoría
- `descripcion` (string): Descripción de la categoría
- `imagen_url` (string): URL completa de la imagen de la categoría

---

## 2. Productos

### 📌 **Obtener todos los productos**

```http
GET /api/ecommerce/productos
```

**Descripción:** Obtiene el listado completo de todos los productos disponibles, incluyendo su categoría y precios.

#### Request en Postman:
```
Method: GET
URL: http://localhost:3000/api/ecommerce/productos
Headers: (ninguno requerido)
Body: (ninguno)
```

#### Respuesta Exitosa (200):
```json
[
  {
    "id_producto": 1,
    "nombre": "Pollo a la Brasa 1/4",
    "descripcion": "1/4 de pollo a la brasa con papas fritas y ensalada",
    "precio": 18.50,
    "es_oferta": false,
    "precio_oferta": null,
    "imagen_url": "https://tu-servidor.com/uploads/productos/pollo-cuarto.jpg",
    "id_categoria": 1,
    "categoria": {
      "nombre": "Pollos a la Brasa"
    }
  },
  {
    "id_producto": 2,
    "nombre": "Parrillada Familiar",
    "descripcion": "Parrillada para 4 personas con anticuchos, mollejitas y chorizos",
    "precio": 85.00,
    "es_oferta": true,
    "precio_oferta": 75.00,
    "imagen_url": "https://tu-servidor.com/uploads/productos/parrillada.jpg",
    "id_categoria": 2,
    "categoria": {
      "nombre": "Parrillas"
    }
  }
]
```

#### Campos de respuesta:
- `id_producto` (number): ID único del producto
- `nombre` (string): Nombre del producto
- `descripcion` (string): Descripción detallada del producto
- `precio` (number): Precio normal del producto con IGV incluido
- `es_oferta` (boolean): Indica si el producto está en oferta
- `precio_oferta` (number|null): Precio con descuento si está en oferta
- `imagen_url` (string): URL completa de la imagen del producto
- `id_categoria` (number): ID de la categoría a la que pertenece
- `categoria.nombre` (string): Nombre de la categoría

---

### 📌 **Obtener productos por categoría**

```http
GET /api/ecommerce/categorias/:id_categoria/productos
```

**Descripción:** Obtiene todos los productos que pertenecen a una categoría específica.

#### Request en Postman:
```
Method: GET
URL: http://localhost:3000/api/ecommerce/categorias/1/productos
Headers: (ninguno requerido)
Body: (ninguno)
```

**Nota:** Reemplaza `1` por el ID de la categoría que deseas consultar.

#### Respuesta Exitosa (200):
```json
[
  {
    "id_producto": 1,
    "nombre": "Pollo a la Brasa 1/4",
    "descripcion": "1/4 de pollo a la brasa con papas fritas y ensalada",
    "precio": 18.50,
    "es_oferta": false,
    "precio_oferta": null,
    "imagen_url": "https://tu-servidor.com/uploads/productos/pollo-cuarto.jpg",
    "id_categoria": 1,
    "categoria": {
      "nombre": "Pollos a la Brasa"
    }
  },
  {
    "id_producto": 3,
    "nombre": "Pollo a la Brasa Entero",
    "descripcion": "Pollo entero a la brasa con papas, ensalada y cremas",
    "precio": 65.00,
    "es_oferta": false,
    "precio_oferta": null,
    "imagen_url": "https://tu-servidor.com/uploads/productos/pollo-entero.jpg",
    "id_categoria": 1,
    "categoria": {
      "nombre": "Pollos a la Brasa"
    }
  }
]
```

#### Respuesta Error (404):
```json
{
  "message": "La categoría especificada no existe"
}
```

---

### 📌 **Obtener un producto específico**

```http
GET /api/ecommerce/productos/:id
```

**Descripción:** Obtiene los detalles completos de un producto específico.

#### Request en Postman:
```
Method: GET
URL: http://localhost:3000/api/ecommerce/productos/1
Headers: (ninguno requerido)
Body: (ninguno)
```

**Nota:** Reemplaza `1` por el ID del producto que deseas consultar.

#### Respuesta Exitosa (200):
```json
{
  "id_producto": 1,
  "nombre": "Pollo a la Brasa 1/4",
  "descripcion": "1/4 de pollo a la brasa con papas fritas y ensalada",
  "precio": 18.50,
  "es_oferta": false,
  "precio_oferta": null,
  "imagen_url": "https://tu-servidor.com/uploads/productos/pollo-cuarto.jpg",
  "id_categoria": 1,
  "categoria": {
    "nombre": "Pollos a la Brasa"
  }
}
```

#### Respuesta Error (404):
```json
{
  "message": "Producto no encontrado"
}
```

---

## 3. Productos en Oferta

### 📌 **Obtener todos los productos en oferta**

```http
GET /api/ecommerce/ofertas
```

**Descripción:** Obtiene únicamente los productos que están marcados como oferta (con descuento).

#### Request en Postman:
```
Method: GET
URL: http://localhost:3000/api/ecommerce/ofertas
Headers: (ninguno requerido)
Body: (ninguno)
```

#### Respuesta Exitosa (200):
```json
[
  {
    "id_producto": 2,
    "nombre": "Parrillada Familiar",
    "descripcion": "Parrillada para 4 personas con anticuchos, mollejitas y chorizos",
    "precio": 85.00,
    "es_oferta": true,
    "precio_oferta": 75.00,
    "imagen_url": "https://tu-servidor.com/uploads/productos/parrillada.jpg",
    "id_categoria": 2,
    "categoria": {
      "nombre": "Parrillas"
    }
  },
  {
    "id_producto": 5,
    "nombre": "Combo Familiar Pollo + Bebidas",
    "descripcion": "Pollo entero + papas + ensalada + 2 litros de Inka Kola",
    "precio": 80.00,
    "es_oferta": true,
    "precio_oferta": 69.90,
    "imagen_url": "https://tu-servidor.com/uploads/productos/combo-familiar.jpg",
    "id_categoria": 1,
    "categoria": {
      "nombre": "Pollos a la Brasa"
    }
  }
]
```

**💡 Nota:** Este endpoint solo retorna productos donde `es_oferta: true`.

---

## 4. Banners de Marketing

### 📌 **Obtener el banner principal (más reciente)**

```http
GET /api/ecommerce/banner
```

**Descripción:** Obtiene el banner más reciente para mostrar como imagen principal en la página de inicio.

#### Request en Postman:
```
Method: GET
URL: http://localhost:3000/api/ecommerce/banner
Headers: (ninguno requerido)
Body: (ninguno)
```

#### Respuesta Exitosa (200):
```json
{
  "id_banner": 1,
  "titulo": "¡Oferta de Fin de Semana!",
  "descripcion": "30% de descuento en parrilladas",
  "imagen_url": "https://tu-servidor.com/uploads/banner/oferta-weekend.jpg",
  "url_destino": "/productos/parrillas",
  "activo": true,
  "creado_en": "2025-12-09T10:30:00.000Z",
  "actualizado_en": "2025-12-09T10:30:00.000Z"
}
```

#### Respuesta Error (404):
```json
{
  "message": "No hay banner disponible"
}
```

#### Campos de respuesta:
- `id_banner` (number): ID único del banner
- `titulo` (string): Título del banner
- `descripcion` (string): Descripción o texto del banner
- `imagen_url` (string): URL completa de la imagen del banner
- `url_destino` (string|null): URL a la que redirige al hacer clic
- `activo` (boolean): Si el banner está activo
- `creado_en` (string): Fecha de creación
- `actualizado_en` (string): Fecha de última actualización

---

### 📌 **Obtener todos los banners (para carrusel)**

```http
GET /api/ecommerce/banners
```

**Descripción:** Obtiene todos los banners disponibles, ordenados por fecha de creación (más reciente primero). Ideal para crear un carrusel de imágenes.

#### Request en Postman:
```
Method: GET
URL: http://localhost:3000/api/ecommerce/banners
Headers: (ninguno requerido)
Body: (ninguno)
```

#### Respuesta Exitosa (200):
```json
[
  {
    "id_banner": 3,
    "titulo": "¡Nueva Carta de Postres!",
    "descripcion": "Descubre nuestros deliciosos postres caseros",
    "imagen_url": "https://tu-servidor.com/uploads/banner/postres.jpg",
    "url_destino": "/productos/postres",
    "activo": true,
    "creado_en": "2025-12-09T15:00:00.000Z",
    "actualizado_en": "2025-12-09T15:00:00.000Z"
  },
  {
    "id_banner": 2,
    "titulo": "Miércoles de Pollo",
    "descripcion": "Todos los miércoles 20% de descuento en pollos",
    "imagen_url": "https://tu-servidor.com/uploads/banner/miercoles-pollo.jpg",
    "url_destino": "/productos/pollos",
    "activo": true,
    "creado_en": "2025-12-08T10:00:00.000Z",
    "actualizado_en": "2025-12-08T10:00:00.000Z"
  },
  {
    "id_banner": 1,
    "titulo": "¡Oferta de Fin de Semana!",
    "descripcion": "30% de descuento en parrilladas",
    "imagen_url": "https://tu-servidor.com/uploads/banner/oferta-weekend.jpg",
    "url_destino": "/productos/parrillas",
    "activo": true,
    "creado_en": "2025-12-07T10:30:00.000Z",
    "actualizado_en": "2025-12-07T10:30:00.000Z"
  }
]
```

**💡 Nota:** Los banners están ordenados del más reciente al más antiguo.

---

## 5. Tarjetas Promocionales

### 📌 **Obtener todas las tarjetas**

```http
GET /api/ecommerce/tarjetas
```

**Descripción:** Obtiene todas las tarjetas promocionales disponibles. Las tarjetas son elementos visuales más pequeños que los banners, útiles para mostrar promociones rápidas o destacar productos.

#### Request en Postman:
```
Method: GET
URL: http://localhost:3000/api/ecommerce/tarjetas
Headers: (ninguno requerido)
Body: (ninguno)
```

#### Respuesta Exitosa (200):
```json
[
  {
    "id_tarjeta": 1,
    "titulo": "Delivery Gratis",
    "descripcion": "En compras mayores a S/ 50",
    "imagen_url": "https://tu-servidor.com/uploads/tarjetas/delivery.jpg",
    "url_destino": "/delivery",
    "activo": true,
    "creado_en": "2025-12-09T10:00:00.000Z",
    "actualizado_en": "2025-12-09T10:00:00.000Z"
  },
  {
    "id_tarjeta": 2,
    "titulo": "Reserva tu Mesa",
    "descripcion": "Reserva online y obtén 10% de descuento",
    "imagen_url": "https://tu-servidor.com/uploads/tarjetas/reserva.jpg",
    "url_destino": "/reservas",
    "activo": true,
    "creado_en": "2025-12-08T14:30:00.000Z",
    "actualizado_en": "2025-12-08T14:30:00.000Z"
  }
]
```

---

### 📌 **Obtener una tarjeta específica**

```http
GET /api/ecommerce/tarjetas/:id
```

**Descripción:** Obtiene los detalles de una tarjeta promocional específica.

#### Request en Postman:
```
Method: GET
URL: http://localhost:3000/api/ecommerce/tarjetas/1
Headers: (ninguno requerido)
Body: (ninguno)
```

#### Respuesta Exitosa (200):
```json
{
  "id_tarjeta": 1,
  "titulo": "Delivery Gratis",
  "descripcion": "En compras mayores a S/ 50",
  "imagen_url": "https://tu-servidor.com/uploads/tarjetas/delivery.jpg",
  "url_destino": "/delivery",
  "activo": true,
  "creado_en": "2025-12-09T10:00:00.000Z",
  "actualizado_en": "2025-12-09T10:00:00.000Z"
}
```

#### Respuesta Error (404):
```json
{
  "message": "Tarjeta no encontrada"
}
```

---

## 6. Libro de Reclamaciones

### 📌 **Enviar una reclamación desde la web**

```http
POST /api/ecommerce/libro-reclamaciones
```

**Descripción:** Permite enviar una reclamación o queja desde la página web pública.

#### Request en Postman:
```
Method: POST
URL: http://localhost:3000/api/ecommerce/libro-reclamaciones
Headers:
  Content-Type: application/json
Body (raw JSON):
```

```json
{
  "tipo_documento": "DNI",
  "numero_documento": "72345678",
  "nombres": "Juan",
  "apellidos": "Pérez García",
  "email": "juan.perez@email.com",
  "telefono": "987654321",
  "direccion": "Av. Los Incas 123, Cayma, Arequipa",
  "tipo_reclamacion": "QUEJA",
  "detalle": "El pedido llegó tarde y la comida estaba fría",
  "pedido": "La entrega del pedido #12345 del día 8 de diciembre"
}
```

#### Campos requeridos:
- `tipo_documento` (string): Tipo de documento (DNI, RUC, CE, Pasaporte)
- `numero_documento` (string): Número del documento
- `nombres` (string): Nombres del reclamante
- `apellidos` (string): Apellidos del reclamante
- `email` (string): Email de contacto
- `telefono` (string): Teléfono de contacto
- `direccion` (string): Dirección completa
- `tipo_reclamacion` (string): Tipo (RECLAMO o QUEJA)
- `detalle` (string): Descripción detallada de la reclamación
- `pedido` (string): Descripción del pedido o servicio relacionado

#### Respuesta Exitosa (201):
```json
{
  "message": "Reclamación registrada exitosamente",
  "id_reclamacion": 1,
  "codigo_reclamacion": "REC-2025-001"
}
```

#### Respuesta Error (400):
```json
{
  "message": "Faltan campos requeridos",
  "errors": [
    "El campo 'nombres' es requerido",
    "El campo 'email' debe ser un email válido"
  ]
}
```

---

## 🧪 **Guía de Pruebas en Postman**

### Paso 1: Configurar Postman

1. Abre Postman
2. Crea una nueva Collection llamada "Toro Loco - API Pública"
3. Crea una variable de entorno:
   - Variable: `base_url`
   - Valor: `http://localhost:3000/api/ecommerce`

### Paso 2: Crear los Requests

Crea un request para cada endpoint siguiendo este patrón:

#### Ejemplo: Obtener Categorías

1. **Nuevo Request**
   - Name: `Obtener Categorías`
   - Method: `GET`
   - URL: `{{base_url}}/categorias`

2. **Enviar Request**
   - Click en "Send"
   - Verifica que la respuesta sea 200 OK
   - Revisa el JSON de respuesta

#### Ejemplo: Obtener Productos en Oferta

1. **Nuevo Request**
   - Name: `Obtener Productos en Oferta`
   - Method: `GET`
   - URL: `{{base_url}}/ofertas`

2. **Enviar Request**
   - Click en "Send"
   - Verifica que solo retorne productos con `es_oferta: true`
   - Revisa que cada producto tenga `precio_oferta`

### Paso 3: Probar con Datos Reales

Para obtener datos reales, asegúrate de que:

1. El servidor backend esté corriendo: `cd Backend && npm start`
2. La base de datos tenga datos de prueba
3. Las imágenes estén en la carpeta `Backend/src/uploads/`

---

## 📝 **Notas Importantes**

### URLs de Imágenes

Las URLs de las imágenes se generan automáticamente según:
- **Productos**: `http://tu-servidor.com/uploads/productos/nombre-archivo.jpg`
- **Categorías**: `http://tu-servidor.com/uploads/categorias/nombre-archivo.jpg`
- **Banners**: `http://tu-servidor.com/uploads/banner/nombre-archivo.jpg`
- **Tarjetas**: `http://tu-servidor.com/uploads/tarjetas/nombre-archivo.jpg`

### CORS

Si vas a consumir estos endpoints desde un dominio diferente (ej. frontend en otro servidor), asegúrate de que el backend tenga CORS configurado correctamente.

### Producción

En producción, reemplaza `http://localhost:3000` por tu dominio real:
- `https://api.torolocoscayma.com/api/ecommerce`

---

## 🎯 **Casos de Uso para la Página Web**

### Página de Inicio
```javascript
// Cargar banners para el carrusel
GET /api/ecommerce/banners

// Mostrar productos en oferta destacados
GET /api/ecommerce/ofertas

// Mostrar tarjetas promocionales
GET /api/ecommerce/tarjetas
```

### Página de Menú/Productos
```javascript
// Cargar categorías para el menú lateral
GET /api/ecommerce/categorias

// Cargar todos los productos
GET /api/ecommerce/productos

// Filtrar por categoría cuando el usuario hace clic
GET /api/ecommerce/categorias/1/productos
```

### Página de Producto Individual
```javascript
// Mostrar detalles de un producto
GET /api/ecommerce/productos/5
```

### Página de Ofertas
```javascript
// Mostrar solo productos en oferta
GET /api/ecommerce/ofertas
```

### Formulario de Reclamaciones
```javascript
// Enviar reclamación
POST /api/ecommerce/libro-reclamaciones
```

---

## 🚀 **Orden Recomendado de Pruebas**

1. ✅ **Categorías** → Verifica que existan categorías en la BD
2. ✅ **Productos** → Verifica que los productos tengan categorías asignadas
3. ✅ **Productos por Categoría** → Usa un ID de categoría válido
4. ✅ **Producto Individual** → Usa un ID de producto válido
5. ✅ **Ofertas** → Marca algunos productos como oferta en el admin
6. ✅ **Banners** → Crea banners desde el módulo de marketing
7. ✅ **Tarjetas** → Crea tarjetas desde el módulo de marketing
8. ✅ **Libro Reclamaciones** → Prueba enviar una reclamación de prueba

---

## 📞 **Soporte**

Si encuentras algún error o necesitas ayuda:
1. Verifica que el servidor backend esté corriendo
2. Revisa los logs del servidor en la consola
3. Verifica que la base de datos tenga datos de prueba
4. Asegúrate de usar las URLs correctas

---

**Generado el:** 9 de diciembre de 2025
**Versión de la API:** 1.0
**Backend:** Node.js + Express + Sequelize
**Base de Datos:** MySQL
