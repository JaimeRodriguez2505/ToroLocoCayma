const express = require("express")
const http = require("http")
const cors = require("cors")
const morgan = require("morgan")

// Importación de rutas
const authRoutes = require("./routes/auth.routes")
const categoriaRoutes = require("./routes/categoria.routes")
const productoRoutes = require("./routes/producto.routes")
const companyRoutes = require("./routes/company.routes")
const ventaRoutes = require("./routes/venta.routes")
const codigo_barrasRoutes = require("./routes/codigo_barras.routes")
const userRoutes = require("./routes/users.routes")
const rucReniecRoutes = require("./routes/ruc.routes")
const reniecRoutes = require("./routes/reniec.routes")
const cierreCajaRoutes = require("./routes/cierre_caja.routes")
const auditLogRoutes = require("./routes/audit_log.routes")
const ofertasDelDiaRoutes = require("./routes/ofertasDelDia.routes")
const ecommerceRoutes = require("./routes/ecommerce.routes")
const marketingRoutes = require("./routes/marketing.routes")
const libroReclamacionesRoutes = require("./routes/libro_reclamaciones.routes");
const carritoGuardadoRoutes = require("./routes/carrito_guardado.routes");
const comandaRoutes = require("./routes/comanda.routes");
const gastoPersonalRoutes = require("./routes/gasto_personal.routes");
const schedulerRoutes = require("./routes/scheduler.routes");
const reservaRoutes = require("./routes/reserva.routes");
// Importación de configuración de base de datos
const { connectDB } = require("./config/database")

require("dotenv").config()

const app = express()

// Conexión a base de datos
connectDB()

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:4242',      // Frontend (React ERP)
    'http://localhost:4243',      // Landing (Next.js)
    'http://localhost:4244',      // Factura
    'http://127.0.0.1:4242',
    'http://127.0.0.1:4243',
    'http://127.0.0.1:4244',
    'http://localhost:5173',      // Frontend dev
    'http://127.0.0.1:5173',
  ],
  credentials: true
}))
app.use(express.json())
// Servir archivos estáticos desde la carpeta src/uploads
app.use("/uploads", express.static("src/uploads"))
app.use(morgan("dev")) // Para logs en desarrollo

// Rutas API
app.use("/api/carritos", carritoGuardadoRoutes);
app.use("/api/comandas", comandaRoutes);
app.use("/api/auth", authRoutes)
app.use("/api/categorias", categoriaRoutes)
app.use("/api/productos", productoRoutes)
app.use("/api/codigos-barras", codigo_barrasRoutes)
app.use("/api/companies", companyRoutes)
app.use("/api/cierre-caja", cierreCajaRoutes)
app.use("/api/ventas", ventaRoutes)
app.use("/api/users", userRoutes)
app.use("/api/ruc", rucReniecRoutes)
app.use("/api/dni", reniecRoutes)
app.use("/api/audit-logs", auditLogRoutes)

app.use("/api/ofertas-del-dia", ofertasDelDiaRoutes)
app.use("/api/ecommerce", ecommerceRoutes)
app.use("/api/marketing", marketingRoutes)
app.use("/api/libro-reclamaciones", libroReclamacionesRoutes);
app.use("/api/gastos-personal", gastoPersonalRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/scheduler", schedulerRoutes);

// Ruta básica para verificar que el servidor está funcionando
app.get("/", (req, res) => {
  res.json({ message: "API Backend con autenticación funcionando correctamente" })
})

const server = http.createServer(app)

module.exports = {
  app,
  server,
}
