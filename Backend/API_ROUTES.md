# Documentación de Rutas API - Toro Loco ERP

Este documento detalla los endpoints disponibles en la API del Backend.

**Base URL:** `/api` (excepto la raíz `/` que verifica el estado del servidor)

**Autenticación:**
La mayoría de las rutas privadas requieren un token JWT en el header `Authorization`.
Formato: `Bearer <token>`

---

## 1. Autenticación (`/api/auth`)
| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | **Pública** | Iniciar sesión y obtener token JWT. |
| `POST` | `/register` | **Privada** (Admin/Gerente) | Registrar un nuevo usuario administrativo o empleado. |

## 2. Usuarios (`/api/users`)
| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | **Privada** | Listar todos los usuarios. |
| `GET` | `/:id` | **Privada** | Obtener detalles de un usuario específico. |
| `GET` | `/:id/basic` | **Privada** | Obtener información básica de un usuario. |
| `POST` | `/` | **Privada** (Rol 1) | Crear un nuevo usuario (Solo Gerentes). |
| `PUT` | `/:id` | **Privada** (Rol 1) | Actualizar información completa de un usuario. |
| `PATCH` | `/:id` | **Privada** (Rol 1) | Actualizar campos específicos de un usuario. |
| `DELETE` | `/:id` | **Privada** (Rol 1) | Eliminar (desactivar) un usuario. |

## 3. Ventas (`/api/ventas`)
| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | **Privada** | Listar ventas. |
| `POST` | `/` | **Horario Laboral** | Registrar una nueva venta. |
| `GET` | `/rango-fechas` | **Privada** | Obtener ventas en un rango de fechas. |
| `GET` | `/ticket/:venta_id` | **Privada** | Obtener datos para el ticket de venta. |
| `POST` | `/comprobante/:venta_id` | **Horario Laboral** | Generar/Emitir comprobante electrónico. |
| `PATCH` | `/actualizar-comprobante/:venta_id` | **Privada** | Actualizar estado de un comprobante. |
| `DELETE` | `/:id` | **Privada** (Rol 1) | Anular/Eliminar una venta. |

## 4. Productos (`/api/productos`)
| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | **Privada** | Listar todos los productos (vista administrativa). |
| `GET` | `/categoria/:id_categoria` | **Privada** | Listar productos por categoría. |
| `POST` | `/` | **Horario Laboral** | Crear un nuevo producto. |
| `PUT` | `/:id` | **Horario Laboral** | Actualizar un producto existente. |
| `PATCH` | `/:id/stock` | **Horario Laboral** | Ajustar stock de un producto. |
| `DELETE` | `/:id` | **Horario Laboral** | Eliminar un producto. |

## 5. Categorías (`/api/categorias`)
| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | **Privada** | Listar todas las categorías. |
| `POST` | `/` | **Horario Laboral** | Crear una nueva categoría. |
| `PUT` | `/:id` | **Horario Laboral** | Actualizar una categoría. |
| `DELETE` | `/:id` | **Horario Laboral** | Eliminar una categoría. |

## 6. Comandas (`/api/comandas`)
| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | **Privada** | Listar comandas activas e históricas. |
| `POST` | `/` | **Privada** | Crear nueva comanda o agregar items. |
| `PUT` | `/:id/estado` | **Privada** | Cambiar estado (Pendiente, Preparación, Servido, etc.). |
| `DELETE` | `/:id` | **Privada** | Cancelar comanda. |

## 7. Ecommerce (Tienda Virtual) (`/api/ecommerce`)
Estas rutas están diseñadas para ser consumidas por el frontend público de la tienda.
| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/productos` | **Pública** | Catálogo de productos para clientes. |
| `GET` | `/categorias` | **Pública** | Listado de categorías visibles en web. |
| `GET` | `/ofertas` | **Pública** | Ofertas activas. |
| `GET` | `/banner` | **Pública** | Banners promocionales activos. |
| `POST` | `/libro-reclamaciones` | **Pública** | Registrar una hoja de reclamación. |

## 8. Carritos Guardados (`/api/carritos`)
| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/initialize` | **Pública** | Inicializar o recuperar un carrito anónimo/persistente. |
| `GET` | `/:id` | **Privada** | Consultar un carrito específico. |
| `POST` | `/` | **Privada** | Guardar items en el carrito. |

## 9. Marketing (`/api/marketing`)
| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/banners` | **Privada** | Listar banners (vista admin). |
| `POST` | `/banners` | **Horario Laboral** | Subir nuevo banner. |
| `DELETE` | `/banners/:id` | **Horario Laboral** | Eliminar banner. |

## 10. Consultas Externas
| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ruc/:ruc` | **Privada** | Consultar datos de empresa por RUC. |
| `GET` | `/api/dni/:dni` | **Privada** | Consultar datos de persona por DNI. |

## 11. Sistema y Auditoría
| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | **Pública** | Health check del servidor. |
| `GET` | `/api/audit-logs` | **Privada** (Rol 1) | Ver historial de acciones de usuarios. |
| `POST` | `/api/cierre-caja` | **Privada** (Rol 1, 2) | Realizar cierre de caja. |
| `GET` | `/api/scheduler/status` | **Privada** | Estado de tareas programadas. |

---

### Notas sobre Seguridad
*   **Pública:** Accesible sin token.
*   **Privada:** Requiere token válido.
*   **Horario Laboral:** Además del token, verifica si el usuario está operando dentro de su horario permitido (aplica principalmente a vendedores).
*   **Rol 1:** Gerente (Acceso total).
