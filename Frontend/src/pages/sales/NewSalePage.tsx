"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Loader2, Search, Barcode, AlertTriangle, X, Receipt, CreditCard, Package, PauseCircle, ListOrdered, RefreshCw, FileBarChart, FileSpreadsheet, QrCode, Keyboard, Clock, CheckCircle2, FileCheck, Percent, Settings, Calculator, User, Eye, Printer, Trash, Smartphone, Truck, Zap, ChefHat, BookOpen } from 'lucide-react'

// UI Components
import { Button } from "../../components/ui/button"
import { DigitalMenu } from "../../components/sales/DigitalMenu"
import { Switch } from "../../components/ui/switch"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Textarea } from "../../components/ui/textarea"
import { Badge } from "../../components/ui/badge"
import { Checkbox } from "../../components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"

// Services
import { fetchProducts } from "../../services/productService"
import { fetchCategories } from "../../services/categoryService"
import { createSale, generateSaleTicket } from "../../services/saleService"
import { fetchCompanyForSales } from "../../services/companyService"
import { buscarProductoPorCodigoBarras, obtenerCodigosBarras } from "../../services/codigoBarrasService"
import {
  sendInvoiceToSunat,
  prepareInvoiceData,
  getInvoicePdfFromSunatResponse,
  convertHtmlToPdf,
  consultarRuc,
  consultarDni,
  type ClienteConsultaResponse,
  getLastCorrelativo,
} from "../../services/invoiceService"
import { API_URL } from "../../config/api"

// Hooks and Contexts
import { useAuth } from "../../contexts/AuthContext"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { useIsMobileOrTablet } from "../../hooks/useDeviceType"
import TicketViewer from "../../components/ticket-viewer"

// Utils
import { formatCurrency } from "../../lib/utils"
import { setupThermalPrinterAutoDetection, configureThermalPrinterSettings } from "../../utils/openDocument"
import moment from "moment-timezone"

// Modales
import {
  ClienteDialog,
  BarcodeScannerDialog,
  ShortcutsDialog,
  SunatAlertDialog,
  InvoiceDialog,
  SaleSuccessDialog,
  CartNamingDialog,
  DiscountDialog,
  SavedCartsDialog,
  BarcodeSelectionDialog,
} from "../../utils/salesDialogs"
import { ImprovedMobileSalesLayout } from "../../components/mobile/ImprovedMobileSalesLayout"
import {
  MobileSaleSuccessModal
} from "../../components/sales/MobileModals"
import { carritoGuardadoService, CarritoGuardado } from "../../services/carritoGuardadoService"
import comandasService from "../../services/comandasService"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { VisuallyHidden } from "../../components/ui/visually-hidden"

// Nuevos componentes para mejoras
import EditProductNameDialog from "../../components/sales/EditProductNameDialog"
import PrinterConfigDialog from "../../components/settings/PrinterConfigDialog"
import DividirMesaDialog from "../../components/sales/DividirMesaDialog"
import { imprimirComandaDirecta } from "../../utils/printerUtils"
import { Edit2, Scissors, Settings as SettingsIcon } from 'lucide-react'

// Componente optimizado para el símbolo de Sol peruano
const SolPeruano = ({ className = "" }: { className?: string }) => (
  <span className={`font-semibold text-gray-700 dark:text-gray-300 select-none ${className}`}>S/</span>
)

// Interfaces TypeScript optimizadas
interface CartItem {
  producto_id: number
  nombre: string
  nombreEditado?: string // Nombre personalizado para facturación
  precio_unitario: string
  precio_unitario_con_igv: string
  precio_mayoritario?: string | null
  precio_mayoritario_con_igv?: string | null
  precio_oferta?: string | null
  precio_oferta_con_igv?: string | null
  es_oferta?: boolean
  cantidad: number
  subtotal: number
  codigos_barras: string[]
  codigosMaximos?: Record<string, number>
  esPrecioMayorista: boolean
  esPrecioVariable?: boolean
  precioVariable?: string
  precioVariableConIgv?: string
  // Precios originales para restaurar cuando se desactive precio variable
  precioOriginal?: string
  precioOriginalConIgv?: string
  imagen_url?: string // Para mostrar la imagen en el carrito
}

interface SavedCart {
  id: string
  name: string
  items: CartItem[]
  metodoPago: string
  observaciones: string
  timestamp: number
  barcodeSearchResults: any[]
  tipoDocumento?: string
  clienteData?: ClienteConsultaResponse | null
}

export interface SaleItem {
  codigo_barras: string
  cantidad: number
  es_mayorista?: boolean
}

interface DocumentosSeries {
  facturaActual: number
  boletaActual: number
}

interface SaleFormData {
  id_cajero: number
  metodo_pago: string
  observaciones: string | null
  fecha?: string
  items: {
    codigo_barras: string
    cantidad: number
    es_mayorista?: boolean
    precio_personalizado?: string
    precio_personalizado_con_igv?: string
  }[]
  comprobante?: {
    tipo_documento: string
    cliente_tipo_documento: string
    cliente_numero_documento: string
    cliente_nombre: string
    cliente_direccion?: string
  }
  yape_celular?: string
  yape_codigo?: string
  plin_celular?: string
  plin_codigo?: string
  es_descuento?: boolean
  descuento?: number
}

// Componente principal modernizado
const NewSalePage = () => {
  useDocumentTitle("Nueva Venta")
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isMobileOrTablet = useIsMobileOrTablet()

  // Estados principales del carrito y venta
  const [cart, setCart] = useState<CartItem[]>([])
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [observaciones, setObservaciones] = useState("")
  
  // Estados para comanda e impresión
  const [generarComandaEImprimir, setGenerarComandaEImprimir] = useState(false)
  const [mostrarVistaPreviaComanda, setMostrarVistaPreviaComanda] = useState(false)
  const [comandaParaImprimir] = useState<any>(null)  // Estados para facturación electrónica
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
  const [isInvoiceSending, setIsInvoiceSending] = useState(false)
  const [invoiceResult, setInvoiceResult] = useState<any>(null)
  const [currentSale, setCurrentSale] = useState<any>(null)
  const [showSunatAlert, setShowSunatAlert] = useState(false)
  const [showSaleSuccessDialog, setShowSaleSuccessDialog] = useState(false)

  // Estados para códigos de barras
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false)
  const [isDigitalMenuMode, setIsDigitalMenuMode] = useState(true) // Default to Digital Menu for better UX
  
  // Estados para la versión móvil (comentados hasta implementación completa)
  // const [isMobileProductSearchOpen, setIsMobileProductSearchOpen] = useState(false)
  // const [isMobilePaymentModalOpen, setIsMobilePaymentModalOpen] = useState(false)
  // const [isMobileTableSelectOpen, setIsMobileTableSelectOpen] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [barcodeSearchResults, setBarcodeSearchResults] = useState<any[]>([])
  const [barcodeSearchResult, setBarcodeSearchResult] = useState<any>(null)
  const [isBarcodeSearching, setIsBarcodeSearching] = useState(false)
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false)
  const [isBarcodeScannerActive, setIsBarcodeScannerActive] = useState(true)
  const [scannedBarcode, setScannedBarcode] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanTime, setLastScanTime] = useState(0)

  // Estados para carritos guardados (legacy - mantenido para compatibilidad)
  const [savedCarts, setSavedCarts] = useState<SavedCart[]>([])
  const [isSavedCartsDialogOpen, setIsSavedCartsDialogOpen] = useState(false)
  const [newCartName, setNewCartName] = useState("")
  const [isNamingCartDialogOpen, setIsNamingCartDialogOpen] = useState(false)
  
  // Estados para carritos específicos del backend
  const [backendCarts, setBackendCarts] = useState<CarritoGuardado[]>([])
  const [isLoadingCarts, setIsLoadingCarts] = useState(false)
  const [isCartSaveDialogOpen, setIsCartSaveDialogOpen] = useState(false)
  const [isCartLoadDialogOpen, setIsCartLoadDialogOpen] = useState(false)
  const [isCartDeleteDialogOpen, setIsCartDeleteDialogOpen] = useState(false)
  const [selectedCartNumber, setSelectedCartNumber] = useState<number | null>(null)
  const [selectedShortcutCart, setSelectedShortcutCart] = useState<number | null>(null)
  const [deleteComandaToo, setDeleteComandaToo] = useState<boolean>(false)
  const [marcarComandaEntregada, setMarcarComandaEntregada] = useState<boolean>(false)
  const [needsStockRefresh, setNeedsStockRefresh] = useState(false)

  // Estados para documentos y cliente
  const [tipoDocumento, setTipoDocumento] = useState<string>("")
  const [isClienteDialogOpen, setIsClienteDialogOpen] = useState(false)
  const [documentoCliente, setDocumentoCliente] = useState("")
  const [isConsultandoCliente, setIsConsultandoCliente] = useState(false)
  const [clienteData, setClienteData] = useState<ClienteConsultaResponse | null>(null)

  // Estados para métodos de pago digitales
  const [yapeCelular, setYapeCelular] = useState<string>("")
  const [yapeCodigo, setYapeCodigo] = useState<string>("")
  const [plinCelular, setPlinCelular] = useState<string>("")
  const [plinCodigo, setPlinCodigo] = useState<string>("")
  const [montoRecibido, setMontoRecibido] = useState<string>("")

  // Estados para series y correlativos
  const [documentosSeries, setDocumentosSeries] = useState<DocumentosSeries>({
    facturaActual: 1,
    boletaActual: 1,
  })

  // Estados para UI y modal
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false)
  const [precioMayoristaMode, setPrecioMayoristaMode] = useState<boolean>(false)
  const [pendingSaleData, setPendingSaleData] = useState<SaleFormData | null>(null)

  // Estados para selección de códigos de barras
  const [isBarcodeSelectionDialogOpen, setIsBarcodeSelectionDialogOpen] = useState(false)
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<any>(null)
  const [availableBarcodes, setAvailableBarcodes] = useState<any[]>([])
  const [isLoadingBarcodesSelection, setIsLoadingBarcodesSelection] = useState(false)

  // Estados para descuentos
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("fixed")
  const [discountValue, setDiscountValue] = useState("")
  const [saleDiscount, setSaleDiscount] = useState<{
    isDiscount: boolean
    type: "percentage" | "fixed"
    value: number
    amount: number
  }>({
    isDiscount: false,
    type: "percentage",
    value: 0,
    amount: 0,
  })  // Estados para búsqueda de productos
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [productSearchResults, setProductSearchResults] = useState<any[]>([])
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false)
  const [isLoadingProductSearch, setIsLoadingProductSearch] = useState(false)

  // Estados para vista de imagen del carrito
  const [isCartImageViewOpen, setIsCartImageViewOpen] = useState(false)
  const [selectedCartImageUrl, setSelectedCartImageUrl] = useState<string>("")

  // Estados para nuevas funcionalidades (edición, división, impresoras)
  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = useState(false)
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)
  const [isPrinterConfigOpen, setIsPrinterConfigOpen] = useState(false)
  const [isDividirMesaOpen, setIsDividirMesaOpen] = useState(false)
  const [mesaADividir, setMesaADividir] = useState<number | null>(null)

  // Referencias
  const lastProductRef = useRef<any>(null)
  const productSearchRef = useRef<HTMLDivElement>(null)
  const productSearchInputRef = useRef<HTMLInputElement>(null)

  // Queries para datos
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })

  const { data: company } = useQuery({
    queryKey: ["company-for-sales"],
    queryFn: fetchCompanyForSales,
  })  // ================================
  // FUNCIONES DE BÚSQUEDA Y PRODUCTOS
  // ================================

  // Función optimizada para buscar productos por nombre o código de barras
  const searchProducts = async (searchTerm: string) => {
    if (!searchTerm.trim() || !products) {
      setProductSearchResults([])
      setIsProductSearchOpen(false)
      return
    }

    setIsLoadingProductSearch(true)

    try {
      // Búsqueda por nombre (búsqueda rápida local)
      let filteredByName = products.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
        product.stock > 0
      ).slice(0, 10)

      // Ajustar precios de oferta en los resultados por nombre
      filteredByName = filteredByName.map(product => {
        if (product.es_oferta && product.precio_oferta_con_igv && product.precio_oferta_con_igv !== "0.00") {
          return {
            ...product,
            precio_unitario_con_igv: product.precio_oferta_con_igv,
            precio_unitario: product.precio_oferta || "0.00",
            _esOfertaVisual: true // flag opcional para UI
          } as typeof product
        }
        return product
      })

      // Búsqueda adicional por código de barras si el término parece ser alfanumérico
      if (/^[a-zA-Z0-9]+$/.test(searchTerm.trim()) && searchTerm.length >= 3) {
        let filteredByBarcode = products.filter(product => {
          const productAny = product as any
          return productAny.codigos_barras &&
            Array.isArray(productAny.codigos_barras) &&
            productAny.codigos_barras.some((codigoBarras: any) =>
              codigoBarras.codigo_barras && 
              typeof codigoBarras.codigo_barras === 'string' &&
              codigoBarras.codigo_barras.toLowerCase().includes(searchTerm.toLowerCase())
            ) && product.stock > 0
        }).slice(0, 5)

        // Ajustar precios de oferta en los resultados por código de barras
        filteredByBarcode = filteredByBarcode.map(product => {
          if (product.es_oferta && product.precio_oferta_con_igv && product.precio_oferta_con_igv !== "0.00") {
            return {
              ...product,
              precio_unitario_con_igv: product.precio_oferta_con_igv,
              precio_unitario: product.precio_oferta || "0.00",
              _esOfertaVisual: true
            } as typeof product
          }
          return product
        })

        // Combinar resultados sin duplicados
        const combinedResults = [...filteredByName]
        filteredByBarcode.forEach(product => {
          if (!combinedResults.find(p => p.id_producto === product.id_producto)) {
            combinedResults.push(product)
          }
        })

        setProductSearchResults(combinedResults.slice(0, 10))
      } else {
        setProductSearchResults(filteredByName)
      }

      setIsProductSearchOpen(true)
    } catch (error) {
      console.error("Error en búsqueda de productos:", error)
      setProductSearchResults([])
      toast.error("Error al buscar productos")
    } finally {
      setIsLoadingProductSearch(false)
    }
  }

  // Función para obtener la URL de la imagen del producto
  const getProductImageUrl = (product: any) => {
    if (!product?.imagen_url) return null

    // Si la imagen ya es una URL completa
    if (product.imagen_url.startsWith('http')) {
      return product.imagen_url
    }

    const baseUrl = API_URL.replace('/api', '')

    // Si la imagen ya incluye la ruta /uploads/
    if (product.imagen_url.includes('/uploads/')) {
      return `${baseUrl}${product.imagen_url}`
    }

    // Extraer solo el nombre del archivo y construir la ruta
    const filename = product.imagen_url.split('\\').pop() || product.imagen_url.split('/').pop() || product.imagen_url
    return `${baseUrl}/uploads/productos/${filename}`
  }

  // Función para obtener códigos de barras de un producto
  const getProductBarcodes = async (product: any) => {
    try {
      setIsLoadingBarcodesSelection(true)
      const response = await obtenerCodigosBarras(product.id_producto)

      if (response?.codigos_barras?.length > 0) {
        return response.codigos_barras
      }

      // Crear código temporal si no tiene códigos de barras
      return [{
        id: null,
        codigo: product.sku || `TEMP-${product.id_producto}`,
        cantidad: product.stock || 1,
        fecha_ingreso: new Date().toISOString()
      }]
    } catch (error) {
      console.error("Error al obtener códigos de barras:", error)
      toast.error("Error al obtener códigos de barras del producto")
      return []
    } finally {
      setIsLoadingBarcodesSelection(false)
    }
  }

  const [ticketHtml, setTicketHtml] = useState<string>("")
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)

  const [showSaleSuccessAfterTicket, setShowSaleSuccessAfterTicket] = useState(false)

  // Función para seleccionar un código de barras específico
  const selectBarcode = (selectedBarcode: any) => {
    const product = selectedProductForBarcode

    const searchResult = {
      producto: product,
      codigo_barras: {
        codigo: selectedBarcode.codigo,
        cantidad: selectedBarcode.cantidad,
        id: selectedBarcode.id
      }
    }

    setBarcodeSearchResults(prev => {
      const exists = prev.find(result =>
        result.producto.id_producto === product.id_producto &&
        result.codigo_barras.codigo === selectedBarcode.codigo
      )

      if (exists) {
        toast.info(`${product.nombre} con código ${selectedBarcode.codigo} ya está en la lista`)
        return prev
      }

      return [searchResult, ...prev]
    })

    toast.success(`${product.nombre} agregado con código ${selectedBarcode.codigo}`)

    // Cerrar diálogos
    setIsBarcodeSelectionDialogOpen(false)
    setSelectedProductForBarcode(null)
    setAvailableBarcodes([])
    setIsProductSearchOpen(false)
    setProductSearchTerm("")
    setProductSearchResults([])
  }
  // Función para agregar producto desde búsqueda - agregar directamente al carrito
  const addProductFromSearch = async (product: any) => {
    try {
      // Obtener códigos de barras del producto
      const barcodes = await getProductBarcodes(product)

      if (barcodes.length === 0) {
        toast.error("No se pudieron obtener códigos de barras para este producto")
        return
      }

      // Usar el primer código de barras disponible (por lo general será uno temporal/generado)
      const selectedBarcode = barcodes[0]

      // Crear el resultado simulando la respuesta de búsqueda por código de barras
      const searchResult = {
        producto: product,
        codigo_barras: {
          codigo: selectedBarcode.codigo,
          cantidad: selectedBarcode.cantidad,
          id: selectedBarcode.id
        }
      }

      // Agregar directamente al carrito usando la función existente
      await addProductDirectlyToCart(searchResult, precioMayoristaMode)

      // Cerrar el dropdown de búsqueda
      setIsProductSearchOpen(false)
      setProductSearchTerm("")
      setProductSearchResults([])

      // Mantener el foco en el campo de búsqueda después de agregar un producto
      setTimeout(() => {
        if (productSearchInputRef.current) {
          productSearchInputRef.current.focus()
        }
      }, 150)

    } catch (error) {
      console.error("Error al agregar producto desde búsqueda:", error)
      toast.error("Error al agregar el producto al carrito")
    }
  }

  // Función para obtener precio según modo (unitario/mayorista)
  const getDisplayPrice = (product: any) => {
    if (precioMayoristaMode && product.precio_mayoritario && product.precio_mayoritario !== "0.00") {
      return formatCurrency(Number.parseFloat(product.precio_mayoritario_con_igv))
    }
    return formatCurrency(Number.parseFloat(product.precio_unitario_con_igv))
  }

  // ============================
  // FUNCIONES DE PRECIO VARIABLE
  // ============================

  // Función para verificar permisos de precio variable
  const canModifyPrice = (): boolean => {
    return user?.id_role === 1 || user?.id_role === 2 // Gerente o Administrador
  }

  // Función para activar/desactivar precio variable en un item del carrito
  const toggleItemVariablePrice = (index: number) => {
    if (!canModifyPrice()) {
      toast.error("No tiene permisos para modificar precios. Solo Gerentes y Administradores pueden hacerlo.")
      return
    }
    const updatedCart = [...cart]
    const item = updatedCart[index]

    if (!item.esPrecioVariable) {
      // Activar precio variable - guardar precios originales
      item.precioOriginal = item.precio_unitario
      item.precioOriginalConIgv = item.precio_unitario_con_igv
      item.esPrecioVariable = true

      setCart(updatedCart)

      // Evitar que el input de precio robe el foco - esperar un momento antes de permitir que se enfoque
      setTimeout(() => {
        if (productSearchInputRef.current) {
          productSearchInputRef.current.focus()
        }
      }, 100)

    } else {
      // Desactivar precio variable - restaurar precios originales
      item.precio_unitario = item.precioOriginal || item.precio_unitario
      item.precio_unitario_con_igv = item.precioOriginalConIgv || item.precio_unitario_con_igv
      item.esPrecioVariable = false
      item.precioVariable = undefined
      item.precioVariableConIgv = undefined
      item.precioOriginal = undefined
      item.precioOriginalConIgv = undefined

      // Recalcular subtotal
      item.subtotal = Number.parseFloat(item.precio_unitario_con_igv) * item.cantidad

      setCart(updatedCart)
      toast.success(`Precio original restaurado para ${item.nombre}`)
    }
  }

  // FUNCIONES DE DESCUENTOS
  // ============================

  // Función para verificar permisos de descuento
  const canApplyDiscount = (): boolean => {
    return user?.id_role === 1 || user?.id_role === 2 // Gerente o Administrador
  }

  // Función para aplicar descuento global
  const applyDiscount = () => {
    if (!canApplyDiscount()) {
      toast.error("No tiene permisos para aplicar descuentos. Solo Gerentes y Administradores pueden hacerlo.")
      return
    }

    if (cart.length === 0) {
      toast.error("No hay productos en el carrito para aplicar descuento")
      return
    }

    // Verificar productos en oferta
    const offerProducts = cart.filter(item => item.es_oferta)
    if (offerProducts.length > 0) {
      const offerProductNames = offerProducts.map(item => item.nombre).join(', ')
      toast.warning(`Advertencia: La venta contiene productos en oferta: ${offerProductNames}. El descuento se aplicará sobre el precio total.`)
    }

    // Validar valor del descuento
    if (!discountValue || isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
      toast.error("Por favor ingrese un valor de descuento válido")
      return
    }

    const value = Number(discountValue)
    let discountAmount = 0

    if (discountType === "percentage") {
      if (value > 100) {
        toast.error("El porcentaje de descuento no puede ser mayor a 100%")
        return
      }
      // Calcular porcentaje sobre la base (pre-IGV) con el mismo método de redondeo que la factura
      const linesForCalc = cart.map(item => {
        const qty = Number(item.cantidad) || 0
        const unitPriceWithTax = Number.parseFloat(item.precio_unitario_con_igv) || 0
        const unitPriceBase = Number(((unitPriceWithTax / 1.18)).toFixed(2))
        const lineBase = Number((unitPriceBase * qty).toFixed(2))
        return lineBase
      })
      const subtotalBaseCalc = linesForCalc.reduce((s, v) => s + v, 0)
      const discountBaseCalc = Number(((subtotalBaseCalc * (value / 100))).toFixed(2))
      // Guardar monto con IGV para la venta; el facturador lo convertirá a base
      discountAmount = Number((discountBaseCalc * 1.18).toFixed(2))
    } else {
      if (value > total) {
        toast.error("El descuento no puede ser mayor al total de la venta")
        return
      }
      discountAmount = value
    }

    setSaleDiscount({
      isDiscount: true,
      type: discountType,
      value: value,
      amount: discountAmount,
    })

    setIsDiscountDialogOpen(false)
    setDiscountValue("")

    toast.success(
      `Descuento de ${discountType === "percentage" ? `${value}%` : formatCurrency(value)} aplicado correctamente`,
    )
  }

  // Función para remover descuento
  const removeDiscount = () => {
    if (!canApplyDiscount()) {
      toast.error("No tiene permisos para remover descuentos")
      return
    }

    setSaleDiscount({ isDiscount: false, type: "percentage", value: 0, amount: 0 })
    toast.info("Descuento removido")
  }

  // Función para abrir diálogo de descuento
  const openDiscountDialog = () => {
    if (!canApplyDiscount()) {
      toast.error("No tiene permisos para aplicar descuentos. Solo Gerentes y Administradores pueden hacerlo.")
      return
    }

    if (cart.length === 0) {
      toast.error("No hay productos en el carrito para aplicar descuento")
      return
    }

    setIsDiscountDialogOpen(true)
  }

  // Función para aplicar descuento rápido de 1 sol
  const applyQuickDiscount1Sol = () => {
    if (!canApplyDiscount() || cart.length === 0) {
      toast.error("No se puede aplicar descuento")
      return
    }

    if (total < 1) {
      toast.error("El total debe ser mayor o igual a 1 sol para aplicar este descuento")
      return
    }

    setSaleDiscount({
      isDiscount: true,
      type: "fixed",
      value: 1,
      amount: 1,
    })

    toast.success("Descuento de 1 sol aplicado")
  }

  // Función para aplicar descuento rápido de 2 soles
  const applyQuickDiscount2Soles = () => {
    if (!canApplyDiscount() || cart.length === 0) {
      toast.error("No se puede aplicar descuento")
      return
    }

    if (total < 2) {
      toast.error("El total debe ser mayor o igual a 2 soles para aplicar este descuento")
      return
    }

    setSaleDiscount({
      isDiscount: true,
      type: "fixed",
      value: 2,
      amount: 2,
    })

    toast.success("Descuento de 2 soles aplicado")
  }
  // ============================
  // FUNCIONES DE ROLES Y PERMISOS
  // ============================

  const canEmitWithoutSunat = (): boolean => {
    const userRole = typeof user?.role === 'object' && user?.role?.name
      ? user.role.name
      : typeof user?.role === 'string'
        ? user.role
        : user?.id_role === 1
          ? 'Gerente'
          : null
    return userRole === "Gerente"
  }
  // ============================
  // MUTACIONES Y QUERIES
  // ============================
  const createSaleMutation = useMutation({
    mutationFn: createSale, onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      toast.success("Venta registrada exitosamente")

      setCurrentSale(data.venta)

      // Manejar comandas después de la venta
      if (selectedShortcutCart) {
        // Si hay carrito seleccionado, marcar comanda como entregada si está habilitado
        if (marcarComandaEntregada) {
          try {
            const comanda = await comandasService.getByCarrito(selectedShortcutCart)
            if (comanda && comanda.estado !== 'entregado') {
              await comandasService.terminarComanda(comanda.comanda_id)
              toast.info(`Comanda ${comanda.comanda_id} marcada como entregada`)
            }
          } catch (comandaError) {
            console.log("No se encontró comanda asociada o ya fue eliminada")
          }
        }
        
        setSelectedShortcutCart(null)
        // Recargar la lista de carritos para reflejar el cambio
        await loadBackendCarts()
      } else {
        // Si no hay carrito seleccionado, generar comanda de delivery automática SIEMPRE
        if (cart.length > 0) {
          try {
            // Crear comanda de delivery
            const comandaData = {
              es_delivery: true, // Indica que es delivery
              productos: cart.map((item: CartItem) => ({
                id: item.producto_id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: parseFloat(item.precio_unitario),
                precioConIgv: parseFloat(item.precio_unitario_con_igv),
                codigo_barras: Array.isArray(item.codigos_barras) ? item.codigos_barras[0] || "" : item.codigos_barras || ""
              })),
              total: saleDiscount.isDiscount ? totalWithDiscount : total,
              total_con_igv: saleDiscount.isDiscount ? totalWithDiscount : total,
              observaciones: observaciones ? `Venta rápida - Delivery | ${observaciones}` : "Venta rápida - Delivery",
              id_usuario: user?.id || 1
            }

            const comandaResult = await comandasService.createOrUpdate(comandaData)
            toast.info(`Comanda de delivery ${comandaResult.comanda.comanda_id} generada automáticamente`)
          } catch (comandaError) {
            console.error("Error al generar comanda de delivery:", comandaError)
            toast.error("Error al generar comanda de delivery")
          }
        }
      }

      // Dentro de createSaleMutation.onSuccess:
      if (tipoDocumento === "" || canEmitWithoutSunat()) {
        if (tipoDocumento === "") {
          await printTicketDirectly(data.venta.venta_id)
          setShowSaleSuccessAfterTicket(true)
        } else {
          setShowSaleSuccessDialog(true)
        }
        return
      }
      // Si hay comprobante, se maneja con el flujo de SUNAT (handleCloseInvoiceDialog)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al registrar la venta")
    },
  })  // ============================
  // EFECTOS Y HOOKS
  // ============================

  // Efecto para enfocar automáticamente en el buscador al cargar la página
  useEffect(() => {
    const focusSearchInput = () => {
      const searchInput = document.querySelector('input[placeholder="Buscar productos por nombre o código de barras..."]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    }

    // Ejecutar después de que el componente se haya renderizado completamente
    const timer = setTimeout(focusSearchInput, 100)

    return () => clearTimeout(timer)
  }, [])

  // Efecto para marcar automáticamente el checkbox cuando se selecciona un carrito
  useEffect(() => {
    if (selectedShortcutCart) {
      setMarcarComandaEntregada(true)
    } else {
      setMarcarComandaEntregada(false)
    }
  }, [selectedShortcutCart]) // Solo se ejecuta una vez al montar el componente

  // Efecto para inicializar configuración de impresoras térmicas
  useEffect(() => {
    // Configurar detección automática de impresoras térmicas
    setupThermalPrinterAutoDetection()

    // Configurar preferencias de impresión térmica
    configureThermalPrinterSettings({
      forceDirectPrint: true,
      preferredWidth: '80mm',
      autoDetectPrinter: true,
      silentMode: true
    })
  }, [])

  // Efecto para cargar series de documentos
  useEffect(() => {
    const seriesGuardadas = localStorage.getItem("documentosSeries")
    if (seriesGuardadas) {
      try {
        setDocumentosSeries(JSON.parse(seriesGuardadas))
      } catch (e) {
        console.error("Error al cargar series de documentos:", e)
      }
    }
  }, [])

  // Efecto para guardar series en localStorage
  useEffect(() => {
    localStorage.setItem("documentosSeries", JSON.stringify(documentosSeries))
  }, [documentosSeries])

  // Efecto para guardar carritos en localStorage
  useEffect(() => {
    localStorage.setItem("tikTrendySavedCarts", JSON.stringify(savedCarts))
  }, [savedCarts])

  // Función para cargar carritos del backend
  const loadBackendCarts = async () => {
    try {
      setIsLoadingCarts(true)
      const response = await carritoGuardadoService.getAll()
      setBackendCarts(response)
      console.log('Carritos cargados:', response.length)
    } catch (error) {
      console.error("Error al cargar carritos:", error)
      toast.error("Error al cargar carritos guardados")
    } finally {
      setIsLoadingCarts(false)
    }
  }

  // Función para obtener un carrito específico del backend
  const getBackendCart = (numero: number): CarritoGuardado | null => {
    return backendCarts.find(cart => cart.numero_carrito === numero) || null
  }

  // Efecto para cargar carritos al montar el componente
  useEffect(() => {
    loadBackendCarts()
  }, [])

  // Refresco periódico y al volver al foco para mantener ocupación de mesas actualizada en móvil
  useEffect(() => {
    let intervalId: number | undefined

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        loadBackendCarts()
      }
    }

    if (isMobileOrTablet) {
      intervalId = window.setInterval(() => {
        loadBackendCarts()
      }, 5000)
      window.addEventListener('focus', handleVisibilityOrFocus)
      document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId)
      window.removeEventListener('focus', handleVisibilityOrFocus)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
    }
  }, [isMobileOrTablet])

  // Efecto para refrescar stock automáticamente después de cargar carrito
  useEffect(() => {
    if (needsStockRefresh && cart.length > 0) {
      // Ejecutar el refresh con un pequeño delay para asegurar que el estado esté actualizado
      const timer = setTimeout(async () => {
        try {
          await refreshAllCartItemsStock()
          setNeedsStockRefresh(false) // Limpiar la bandera después del refresh
          toast.info("Stock actualizado automáticamente", { duration: 2000 })
        } catch (error) {
          console.error("Error en refresh automático:", error)
          setNeedsStockRefresh(false) // Limpiar la bandera incluso si hay error
        }
      }, 500) // 500ms es suficiente para que se actualice el estado

      return () => clearTimeout(timer)
    }
  }, [needsStockRefresh, cart.length])

  // Efecto para manejar escáner de códigos de barras
  useEffect(() => {
    let barcodeBuffer = ""
    let lastKeyTime = 0
    let lastProcessedBarcode = ""
    let lastProcessedTime = 0
    const SCAN_TIMEOUT = 50
    const DUPLICATE_SCAN_TIMEOUT = 500 // Reducido para permitir escaneo más rápido

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isBarcodeScannerActive) return

      // No procesar escáner si estamos en un input, textarea o select
      if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement) {
        return
      }

      // No procesar si hay combinaciones de teclas especiales (atajos)
      if (e.altKey || e.ctrlKey || e.metaKey) {
        return
      }

      const currentTime = Date.now()

      // Reiniciar buffer si pasó mucho tiempo
      if (currentTime - lastKeyTime > SCAN_TIMEOUT && barcodeBuffer !== "") {
        if (currentTime - lastKeyTime > 500) {
          barcodeBuffer = ""
        }
      }

      lastKeyTime = currentTime

      // Ignorar teclas de control excepto Enter
      const controlKeys = ["Shift", "Tab", "CapsLock", "Escape"]
      if (controlKeys.includes(e.key)) {
        return
      }

      // Procesar código escaneado al presionar Enter
      if (e.key === "Enter" && barcodeBuffer.length > 3) {
        e.preventDefault()

        const scanDuration = currentTime - lastScanTime

        // Prevenir procesamiento de códigos duplicados
        if (barcodeBuffer === lastProcessedBarcode &&
          currentTime - lastProcessedTime < DUPLICATE_SCAN_TIMEOUT) {
          console.log(`Código duplicado ignorado: ${barcodeBuffer}`)
          barcodeBuffer = ""
          return
        }

        if ((scanDuration < 1000 || lastScanTime === 0) && !isProcessingBarcode) {
          setIsScanning(true)
          setScannedBarcode(barcodeBuffer)

          // Actualizar información del último código procesado
          lastProcessedBarcode = barcodeBuffer
          lastProcessedTime = currentTime

          // Verificar si el campo de búsqueda está enfocado
          const activeElement = document.activeElement
          const isSearchFieldFocused = activeElement &&
            activeElement.getAttribute('placeholder')?.includes('Buscar productos')

          if (isSearchFieldFocused) {
            // Si está en el campo de búsqueda, usar la función inteligente
            handleSearchOrBarcode(barcodeBuffer)
          } else {
            // Si no está en el campo de búsqueda, usar el manejo normal de escáner
            handleScannedBarcode(barcodeBuffer)
          }

          setLastScanTime(currentTime)
          setTimeout(() => setIsScanning(false), 1500)
        }

        barcodeBuffer = ""
      } else {
        barcodeBuffer += e.key
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isBarcodeScannerActive, isProcessingBarcode])  // Efecto para atajos de teclado
  useEffect(() => {
    let altShiftPressed = false
    let altShiftTimer: NodeJS.Timeout | null = null
    const handleKeyDown = (e: KeyboardEvent) => {
      // Verificar atajos directos independientemente del enfoque
      if (e.altKey && e.shiftKey) {
        // Métodos de pago - siempre procesar estos atajos
        if (e.key.toLowerCase() === 'y') {
          e.preventDefault()
          setMetodoPago('yape')
          return
        }
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault()
          setMetodoPago('plin')
          return
        }
        if (e.key.toLowerCase() === 't') {
          e.preventDefault()
          setMetodoPago('tarjeta')
          return
        }
        if (e.key.toLowerCase() === 'e') {
          e.preventDefault()
          setMetodoPago('efectivo')
          return
        }
      }

      // Detectar cuando se presiona Alt + Shift juntos
      if (e.altKey && e.shiftKey && (e.key === 'Alt' || e.key === 'Shift')) {
        altShiftPressed = true

        // Limpiar timer anterior si existe
        if (altShiftTimer) {
          clearTimeout(altShiftTimer)
        }

        // Esperar un poco para capturar la siguiente tecla
        altShiftTimer = setTimeout(() => {
          altShiftPressed = false
        }, 500)

        return
      }      // Si se detectó Alt + Shift y ahora viene una tecla numérica o específica
      if (altShiftPressed && e.altKey && e.shiftKey) {
        // Mapear códigos de teclas numéricas (más confiable que e.key)
        const documentTypeShortcuts: Record<string, { type: string, label: string }> = {
          "Digit1": { type: "", label: "Sin comprobante" },
          "Numpad1": { type: "", label: "Sin comprobante" },
          "1": { type: "", label: "Sin comprobante" },
          "Digit2": { type: "03", label: "Boleta" },
          "Numpad2": { type: "03", label: "Boleta" },
          "2": { type: "03", label: "Boleta" },
          "Digit3": { type: "01", label: "Factura" },
          "Numpad3": { type: "01", label: "Factura" },
          "3": { type: "01", label: "Factura" }
        }

        // Buscar por code primero, luego por key
        const shortcut = documentTypeShortcuts[e.code] || documentTypeShortcuts[e.key]
        if (shortcut) {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()

          setTipoDocumento(shortcut.type)
          toast.info(`Tipo de documento: ${shortcut.label}`)

          altShiftPressed = false
          if (altShiftTimer) {
            clearTimeout(altShiftTimer)
            altShiftTimer = null
          }
          return
        }
      }

      // Atajos directos usando códigos de tecla (fallback)
      if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const directShortcuts: Record<string, { type: string, label: string }> = {
          "Digit1": { type: "", label: "Sin comprobante" },
          "Numpad1": { type: "", label: "Sin comprobante" },
          "Digit2": { type: "03", label: "Boleta" },
          "Numpad2": { type: "03", label: "Boleta" },
          "Digit3": { type: "01", label: "Factura" },
          "Numpad3": { type: "01", label: "Factura" }
        }

        const directShortcut = directShortcuts[e.code]
        if (directShortcut) {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
          setTipoDocumento(directShortcut.type)
          toast.info(`Tipo de documento: ${directShortcut.label}`)
          return
        }
      }

      // Verificar si la tecla es F8 (registrar venta) - debe funcionar en cualquier contexto
      if (e.key === "F8") {
        e.preventDefault()
        if (cart.length > 0) {
          handleSubmit()
        } else {
          toast.error("Agregue productos al carrito antes de registrar la venta")
        }
        return
      }

      // Verificar si la tecla es F4 (guardar carrito) - debe funcionar en cualquier contexto
      if (e.key === "F4") {
        e.preventDefault()
        if (cart.length > 0) {
          saveCurrentCart()
        } else {
          toast.error("No hay productos en el carrito para guardar")
        }
        return
      }

      // Permitir atajos con Ctrl incluso cuando hay inputs enfocados
      if (e.ctrlKey && !e.altKey && !e.shiftKey) {
        if (e.key === "d" || e.key === "D") {
          e.preventDefault()
          // Ctrl + D: Abrir diálogo de descuento
          openDiscountDialog()
          return
        } else if (e.key === "1") {
          e.preventDefault()
          applyQuickDiscount1Sol()
          return
        } else if (e.key === "2") {
          e.preventDefault()
          applyQuickDiscount2Soles()
          return
        }
      }

      // Permitir Alt+Shift+D para remover descuento incluso cuando hay inputs enfocados
      if (e.altKey && e.shiftKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault()
        if (saleDiscount.isDiscount) {
          removeDiscount()
        } else {
          toast.info("No hay descuento aplicado para remover")
        }
        return
      }

      // No capturar otros atajos si estamos en inputs
      if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement) {
        return
      }      // Atajos con teclas de función (F1-F12)
      const functionKeyActions = {
        "F1": () => setIsShortcutsDialogOpen(true),
        "F2": () => {
          setIsBarcodeScannerActive(!isBarcodeScannerActive)
          toast.info(`Escáner ${!isBarcodeScannerActive ? "activado" : "desactivado"}`)
        },
        "F3": () => openBarcodeScanner(),
        "F5": () => savedCarts.length > 0 ? setIsSavedCartsDialogOpen(true) : toast.info("No hay carritos guardados"),
        "F6": () => startNewCart(),
        "F7": () => tipoDocumento !== "" ? setIsClienteDialogOpen(true) : toast.info("Seleccione primero un tipo de documento"),
        "F9": () => {
          if (cart.length > 0 || metodoPago !== "efectivo" || observaciones !== "" || tipoDocumento !== "") {
            if (window.confirm("¿Está seguro que desea reiniciar para una nueva venta? Se perderán los datos actuales.")) {
              resetForNewSale()
            }
          } else {
            toast.info("La venta ya está lista para nuevos productos")
          }
        }
      }

      if (functionKeyActions[e.key as keyof typeof functionKeyActions]) {
        e.preventDefault()
        functionKeyActions[e.key as keyof typeof functionKeyActions]()
        return
      }

      // Atajos con Alt + Shift para métodos de pago y funciones
      if (e.altKey && e.shiftKey) {
        const paymentMethods = {
          "e": "efectivo", "E": "efectivo",
          "t": "tarjeta", "T": "tarjeta",
          "r": "transferencia", "R": "transferencia",
          "d": "pedidosya", "D": "pedidosya",
          "a": "rappi", "A": "rappi",
          "u": "uber_eats", "U": "uber_eats",
          "y": "yape", "Y": "yape",
          "p": "plin", "P": "plin"
        }

        if (paymentMethods[e.key as keyof typeof paymentMethods]) {
          e.preventDefault()
          const method = paymentMethods[e.key as keyof typeof paymentMethods]
          setMetodoPago(method)
          toast.info(`Método de pago: ${method.charAt(0).toUpperCase() + method.slice(1)}`)
          return
        }

        // Agregar último producto al carrito
        if ((e.key === "a" || e.key === "A") && lastProductRef.current) {
          e.preventDefault()
          const productToAdd = products?.find((p) => p.id_producto === lastProductRef.current.producto.id_producto)
          if (productToAdd) {
            addToCart(productToAdd, {
              codigo: lastProductRef.current.codigo_barras.codigo,
              cantidad: lastProductRef.current.codigo_barras.cantidad || 1,
            })
          } else {
            toast.error("No hay un producto seleccionado para agregar")
          }
          return
        }

        // Cambiar modo de precio
        if (e.key === "m" || e.key === "M") {
          e.preventDefault()
          setPrecioMayoristaMode(!precioMayoristaMode)
          toast.info(`Modo de precio cambiado a: ${!precioMayoristaMode ? "Mayorista" : "Unitario"}`)
          return
        }
      }
    }

    // Agregar el listener con captura y pasivo para que se ejecute antes que otros
    window.addEventListener("keydown", handleKeyDown, { capture: true })
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true })
  }, [isBarcodeScannerActive, cart.length, savedCarts.length, tipoDocumento, precioMayoristaMode, saleDiscount.isDiscount, setMetodoPago])

  // Efecto para cerrar dropdown de búsqueda al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(event.target as Node)) {
        setIsProductSearchOpen(false)
      }
    }

    if (isProductSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProductSearchOpen])

  // Efecto para manejar mensajes de vista previa PDF y enfocar botón tras regresar
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'CONVERT_TO_PDF') {
        try {
          const pdfBlob = await convertHtmlToPdf(event.data.html)
          const url = URL.createObjectURL(pdfBlob)
          const a = document.createElement('a')
          a.href = url

          const fileName = event.data.fileName ||
            `${tipoDocumento === "01" ? "Factura" : "Boleta"}_${Date.now()}`
          a.download = `${fileName}.pdf`

          // Guardar estado para regresar el foco tras descargar PDF
          window.localStorage.setItem('pdfViewed', 'true');

          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)

          toast.success('PDF descargado correctamente')

          // Forzar enfoque del botón "Nueva Venta" tras descargar PDF
          const focusNuevaVentaBtn = () => {
            // Estrategia completa: intentar con todos los selectores posibles
            let nuevaVentaBtn: HTMLButtonElement | null = null;

            // Intentos secuenciales con diferentes selectores
            const selectors = [
              '#nuevaVentaBtn',
              '#nuevaVentaSuccessBtn',
              '.dialog-success-nueva-venta-btn',
              '.focus-ring-button',
              'button:contains("Nueva Venta")'
            ];

            // Intentar cada selector
            for (const selector of selectors) {
              if (selector.includes(':contains')) {
                // Búsqueda especial por texto
                const buttons = Array.from(document.querySelectorAll('button'));
                nuevaVentaBtn = buttons.find(btn =>
                  btn.textContent?.toLowerCase().includes('nueva venta')
                ) as HTMLButtonElement;
              } else {
                // Búsqueda normal por selector
                nuevaVentaBtn = document.querySelector(selector) as HTMLButtonElement;
              }

              // Si encontramos un botón, salir del bucle
              if (nuevaVentaBtn) break;
            }

            if (nuevaVentaBtn) {
              // Asegurar visibilidad
              nuevaVentaBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

              // Enfocar con fuerza
              try {
                nuevaVentaBtn.focus({ preventScroll: false });
                // Efecto visual
                nuevaVentaBtn.classList.add('focus-ring-pulse');
                setTimeout(() => nuevaVentaBtn.classList.remove('focus-ring-pulse'), 2000);
              } catch (e) {
                // Error al enfocar botón Nueva Venta
              }
            } else {
              // No se encontró el botón "Nueva Venta" para enfocar
            }
          };

          // Ejecutar varias veces para asegurar que funcione en todos los navegadores
          const delays = [100, 300, 500, 1000, 1500, 2000];
          delays.forEach(delay => setTimeout(focusNuevaVentaBtn, delay));

        } catch (error) {
          toast.error('Error al generar PDF para descarga')
        }
      }
    };

    // Escuchar mensajes para conversión a PDF
    window.addEventListener('message', handleMessage);

    // Escuchar eventos de foco para restaurarlo cuando vuelve del PDF
    const handleFocus = () => {
      // Cuando la ventana recupera el foco (tras ver un PDF), enfocar el botón
      if (isInvoiceDialogOpen || showSaleSuccessDialog) {
        const focusNuevaVentaBtn = () => {
          // Buscar en ambos diálogos
          const btnToFocus = document.getElementById('nuevaVentaBtn') ||
            document.getElementById('nuevaVentaSuccessBtn') ||
            document.querySelector('.dialog-success-nueva-venta-btn');

          if (btnToFocus instanceof HTMLButtonElement) {
            btnToFocus.focus();
            // Log eliminado

            // Efecto visual
            btnToFocus.classList.add('focus-ring-pulse');
            setTimeout(() => btnToFocus.classList.remove('focus-ring-pulse'), 2000);
          }
        };

        // Ejecutar múltiples veces para asegurar que funcione
        setTimeout(focusNuevaVentaBtn, 100);
        setTimeout(focusNuevaVentaBtn, 300);
        setTimeout(focusNuevaVentaBtn, 500);
      }
    };

    // Escuchar eventos de enfoque de la ventana
    window.addEventListener('focus', handleFocus);

    // Escuchar cambios de visibilidad del documento
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' &&
        (isInvoiceDialogOpen || showSaleSuccessDialog)) {
        // Marcar flag para indicar que se debe enfocar al volver
        window.localStorage.setItem('pdfViewed', 'true');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tipoDocumento, isInvoiceDialogOpen, showSaleSuccessDialog]);

  // Enfoque automático del input de búsqueda al montar el componente
  useEffect(() => {
    // Enfocar el input de búsqueda de productos al cargar la página
    const timer = setTimeout(() => {
      if (productSearchInputRef.current) {
        productSearchInputRef.current.focus()
      }
    }, 300) // Pequeño delay para asegurar que el componente esté completamente renderizado

    return () => clearTimeout(timer)
  }, []) // Solo se ejecuta al montar el componente
  // ============================
  // CÁLCULOS Y TOTALES
  // ============================

  const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0)
  // Construir líneas con base (pre-IGV) y aplicar descuento proporcional por línea (como en backend/SUNAT)
  const lines = cart.map((item, idx) => {
    const qty = Number(item.cantidad) || 0
    const unitPriceWithTax = Number.parseFloat(item.precio_unitario_con_igv) || 0
    const unitPriceBase = Number(((unitPriceWithTax / 1.18)).toFixed(2))
    const lineBase = Number((unitPriceBase * qty).toFixed(2))
    return {
      idx,
      qty,
      unitPriceBase,
      lineBase, // mtoValorVenta
      tipAfeIgv: 10 as const
    }
  })

  const sumGravadaBase = lines
    .filter(l => l.tipAfeIgv === 10)
    .reduce((s, l) => s + l.lineBase, 0)

  // Descuento global en base (pre-IGV) — igual que se envía al facturador
  const subtotalBase = lines.reduce((s, l) => s + l.lineBase, 0)
  const discountBase = saleDiscount.isDiscount
    ? (saleDiscount.type === 'percentage'
      ? Number(((subtotalBase * (saleDiscount.value / 100))).toFixed(2))
      : Number((((saleDiscount.amount || 0) / 1.18)).toFixed(2)))
    : 0

  const distributed = new Map<number, number>()
  let acc = 0
  const gravadas = lines.filter(l => l.tipAfeIgv === 10)
  gravadas.forEach((l, i) => {
    if (discountBase > 0 && sumGravadaBase > 0) {
      if (i < gravadas.length - 1) {
        const prop = l.lineBase / sumGravadaBase
        // Sesgo hacia abajo (floor a 2 decimales) para emular diferencias de rounding en PHP y evitar sobre-redondeo
        const d = Math.floor((discountBase * prop) * 100) / 100
        distributed.set(l.idx, d)
        acc += d
      } else {
        const d = Number((discountBase - acc).toFixed(2))
        distributed.set(l.idx, d)
        acc += d
      }
    } else {
      distributed.set(l.idx, 0)
    }
  })

  const adjustedLines = lines.map(l => {
    const d = distributed.get(l.idx) || 0
    const newBase = Number(Math.max(0, l.lineBase - d).toFixed(2))
    const igvLine = l.tipAfeIgv === 10 ? Number((newBase * 0.18).toFixed(2)) : 0
    return {
      ...l,
      newBase,
      igvLine
    }
  })

  const subtotal = Number(adjustedLines.reduce((s, l) => s + l.newBase, 0).toFixed(2))
  const igv = Number(adjustedLines.reduce((s, l) => s + l.igvLine, 0).toFixed(2))
  const total = Number((subtotal + igv).toFixed(2))
  const totalWithDiscount = total
  // ============================
  // FUNCIONES DE UTILIDADES
  // ============================
  // Función para calcular cantidad reservada excluyendo el carrito actual
  const getReservedQuantityExcludingCurrent = (codigo: string, currentProductId: number): number => {
    let reservedQuantity = 0

    // Solo sumar cantidades en carritos guardados (no en el carrito actual)
    for (const savedCart of savedCarts) {
      for (const item of savedCart.items) {
        if (item.producto_id === currentProductId && item.codigos_barras.includes(codigo)) {
          reservedQuantity += item.cantidad
        }
      }
    }

    return reservedQuantity
  }
  // Función para obtener información detallada de disponibilidad para un item del carrito
  const getCartItemAvailabilityInfo = (item: CartItem) => {
    const barcodeInfo = item.codigos_barras.map(codigo => {
      const stockOriginal = item.codigosMaximos?.[codigo] || 1
      // Solo contar reservas de OTROS carritos, no del carrito actual
      const reservedInOtherCarts = getReservedQuantityExcludingCurrent(codigo, item.producto_id)
      const availableForThisItem = Math.max(0, stockOriginal - reservedInOtherCarts)

      return {
        codigo,
        stockOriginal,
        reservedInOtherCarts,
        availableForThisItem
      }
    })

    const totalAvailable = barcodeInfo.reduce((sum, info) => sum + info.availableForThisItem, 0)
    const totalReservedInOtherCarts = barcodeInfo.reduce((sum, info) => sum + info.reservedInOtherCarts, 0)

    return {
      barcodeInfo,
      totalAvailable,
      totalReservedInOtherCarts,
      currentQuantity: item.cantidad,
      canIncrease: item.cantidad < totalAvailable
    }
  }

  // Función para calcular vuelto
  const calcularVuelto = (): number => {
    if (metodoPago !== "efectivo" || !montoRecibido || isNaN(Number.parseFloat(montoRecibido))) {
      return 0
    }

    const montoRecibidoNum = Number.parseFloat(montoRecibido)
    return Math.max(0, montoRecibidoNum - totalWithDiscount)
  }

  // Función para abrir vista de imagen del carrito
  const openCartImageView = (imageUrl: string) => {
    setSelectedCartImageUrl(imageUrl)
    setIsCartImageViewOpen(true)
  }
  // ============================
  // FUNCIONES DE CARRITO
  // ============================
  // Función optimizada para agregar productos al carrito
  const addToCart = async (product: any, barcodeData?: any, usarPrecioMayorista = false) => {
    try {
      // Si no hay datos de código de barras, intentamos obtener uno automáticamente
      let barcodeToUse = barcodeData?.codigo || null
      let maxQuantityAvailable = barcodeData?.cantidad || 1
      
      // Si no hay código de barras, intentamos usar el primero disponible
      if (!barcodeToUse) {
        const barcodesResponse = await getProductBarcodes(product);
        if (barcodesResponse && barcodesResponse.length > 0) {
          barcodeToUse = barcodesResponse[0].codigo;
          maxQuantityAvailable = barcodesResponse[0].cantidad || 1;
        }
      }

      if (!barcodeToUse) {
        toast.error(`No hay códigos de barras disponibles para ${product.nombre}`)
        return
      }

      // Validar precio mayorista
      if (usarPrecioMayorista && (!product.precio_mayoritario || product.precio_mayoritario === "0.00")) {
        toast.warning(`${product.nombre} no tiene precio mayorista definido. Se usará precio unitario.`)
        usarPrecioMayorista = false
      }

      // Buscar item existente en carrito PRIMERO
      const existingItemIndex = cart.findIndex(
        (item) => item.producto_id === product.id_producto && item.esPrecioMayorista === usarPrecioMayorista,
      )

      // Verificar disponibilidad real - solo contar carritos guardados, no el actual
      const reservedInOtherCarts = getReservedQuantityExcludingCurrent(barcodeToUse, product.id_producto)
      const realAvailableQuantity = maxQuantityAvailable - reservedInOtherCarts

      if (realAvailableQuantity <= 0) {
        toast.error(`No hay unidades disponibles de ${product.nombre} con el código ${barcodeToUse}`)
        return
      }

      if (existingItemIndex >= 0) {
        // Actualizar item existente
        const updatedCart = [...cart]
        const currentItem = updatedCart[existingItemIndex]

        if (currentItem.codigos_barras.includes(barcodeToUse)) {
          // Si el código ya está en el carrito, solo incrementamos la cantidad
          const availabilityInfo = getCartItemAvailabilityInfo(currentItem)

          if (currentItem.cantidad >= availabilityInfo.totalAvailable) {
            toast.warning(`No hay suficiente stock disponible para ${product.nombre}. Máximo disponible: ${availabilityInfo.totalAvailable}`)
            return
          }

          currentItem.cantidad += 1
          toast.success(`Se agregó una unidad más de ${product.nombre}`)
        } else {
          // Agregar nuevo código de barras al item existente
          currentItem.codigos_barras.push(barcodeToUse)
          currentItem.cantidad += 1

          // Asegurarse de tener el registro de cantidad máxima para este código
          if (!currentItem.codigosMaximos) currentItem.codigosMaximos = {}
          currentItem.codigosMaximos[barcodeToUse] = maxQuantityAvailable

          toast.success(`Se agregó ${product.nombre} con nuevo código de barras`)
        }

        // Recalcular subtotal
        currentItem.subtotal = Number.parseFloat(currentItem.precio_unitario_con_igv) * currentItem.cantidad

        setCart(updatedCart)

        // Solo mostrar mensaje de reservas si realmente hay reservas en otros carritos
        const message = reservedInOtherCarts > 0
          ? `${product.nombre} agregado. Hay ${reservedInOtherCarts} unidades reservadas en otros carritos.`
          : `${product.nombre} (+1)`

        toast[reservedInOtherCarts > 0 ? 'warning' : 'success'](message, {
          duration: reservedInOtherCarts > 0 ? 3000 : 1500
        })
      } else {
        // Crear nuevo item en carrito
        const { precioUnitario, precioUnitarioConIgv, esOferta } = calculateItemPricing(product, usarPrecioMayorista)

        const newItem = {
          producto_id: product.id_producto,
          nombre: product.nombre,
          precio_unitario: precioUnitario,
          precio_unitario_con_igv: precioUnitarioConIgv,
          precio_mayoritario: product.precio_mayoritario,
          precio_mayoritario_con_igv: product.precio_mayoritario_con_igv,
          precio_oferta: product.precio_oferta,
          precio_oferta_con_igv: product.precio_oferta_con_igv,
          es_oferta: esOferta,
          cantidad: 1,
          subtotal: Number.parseFloat(precioUnitarioConIgv),
          codigos_barras: [barcodeToUse],
          esPrecioMayorista: usarPrecioMayorista,
          codigosMaximos: { [barcodeToUse]: maxQuantityAvailable },
          esPrecioVariable: false,
          precioVariable: undefined,
          precioVariableConIgv: undefined,
          precioOriginal: undefined,
          precioOriginalConIgv: undefined,
          imagen_url: product.imagen_url || undefined,
        }

        // agregar el nuevo producto al INICIO del carrito
        setCart([newItem, ...cart])

        // Mensaje informativo
        let mensaje = `${product.nombre} agregado al carrito`
        if (esOferta) mensaje += " (precio oferta aplicado)"
        else if (usarPrecioMayorista) mensaje += " (precio mayorista)"

        // Solo mostrar mensaje de reservas si realmente hay reservas en otros carritos
        if (reservedInOtherCarts > 0) mensaje += `. Hay ${reservedInOtherCarts} unidades reservadas en otros carritos.`
        else mensaje = `${product.nombre} agregado` // Mensaje más corto para escaneo rápido

        toast[reservedInOtherCarts > 0 ? 'warning' : 'success'](mensaje, {
          duration: reservedInOtherCarts > 0 ? 3000 : 1500
        })
      }
    } catch (error) {
      console.error("Error al agregar al carrito:", error)
      toast.error(`Error al agregar ${product.nombre} al carrito. Verifica que el producto tenga códigos de barras.`)
    }
  }

  // Función auxiliar para calcular precios de items
  const calculateItemPricing = (product: any, usarPrecioMayorista: boolean) => {
    let precioUnitario, precioUnitarioConIgv, esOferta = false

    if (usarPrecioMayorista && product.precio_mayoritario) {
      // Precio mayorista (sin oferta)
      precioUnitario = product.precio_mayoritario
      precioUnitarioConIgv = product.precio_mayoritario_con_igv
    } else if (product.es_oferta && product.precio_oferta && product.precio_oferta !== "0.00") {
      // Precio de oferta
      precioUnitario = product.precio_oferta
      precioUnitarioConIgv = product.precio_oferta_con_igv || (Number.parseFloat(product.precio_oferta) * 1.18).toFixed(2)
      esOferta = true
    } else {
      // Precio normal
      precioUnitario = product.precio_unitario
      precioUnitarioConIgv = product.precio_unitario_con_igv
    }

    return { precioUnitario, precioUnitarioConIgv, esOferta }
  }

  // Función para cambiar entre precio unitario y mayorista globalmente
  const togglePrecioMayoristaGlobal = () => {
    const nuevoModo = !precioMayoristaMode
    setPrecioMayoristaMode(nuevoModo)

    if (cart.length === 0) {
      toast.info(`Modo cambiado a: ${nuevoModo ? 'Mayorista' : 'Unitario'}`)
      return
    }

    // Actualizar todos los items del carrito
    const updatedCart = cart.map(item => {
      const product = products?.find(p => p.id_producto === item.producto_id)
      if (!product) return item

      // Calcular nuevos precios según el modo
      const { precioUnitario, precioUnitarioConIgv } = calculateItemPricing(product, nuevoModo)

      return {
        ...item,
        precio_unitario: precioUnitario,
        precio_unitario_con_igv: precioUnitarioConIgv,
        esPrecioMayorista: nuevoModo,
        subtotal: Number.parseFloat(precioUnitarioConIgv) * item.cantidad
      }
    })

    setCart(updatedCart)
    toast.success(`Precios actualizados a modo: ${nuevoModo ? 'Mayorista' : 'Unitario'}`)
  }

  // Modificar la función updateCartItemQuantity para permitir aumentar hasta el máximo disponible
  const updateCartItemQuantity = async (index: number, quantity: number) => {
    if (quantity < 1) return

    try {
      const updatedCart = [...cart]
      const currentItem = updatedCart[index]
      const availabilityInfo = getCartItemAvailabilityInfo(currentItem)

      // Si estamos aumentando la cantidad
      if (quantity > currentItem.cantidad) {
        // Verificar que no exceda la cantidad máxima disponible
        if (quantity > availabilityInfo.totalAvailable) {
          toast.error(
            `Solo hay ${availabilityInfo.totalAvailable} unidades disponibles para este producto${availabilityInfo.totalReservedInOtherCarts > 0
              ? ` (${availabilityInfo.totalReservedInOtherCarts} reservadas en otros carritos)`
              : ''
            }`,
            { duration: 4000 }
          )
          return
        }
      }

      // Actualizar la cantidad
      currentItem.cantidad = quantity

      // Recalcular subtotal
      currentItem.subtotal = Number.parseFloat(currentItem.precio_unitario_con_igv) * currentItem.cantidad

      setCart(updatedCart)

      // Mostrar información útil si se está acercando al límite
      if (quantity === availabilityInfo.totalAvailable && availabilityInfo.totalReservedInOtherCarts > 0) {
        toast.warning(
          `Has alcanzado el límite disponible. Hay ${availabilityInfo.totalReservedInOtherCarts} unidades reservadas en otros carritos.`,
          { duration: 3000 }
        )
      }
    } catch (error) {
      console.error("Error al actualizar cantidad:", error)
      toast.error("Error al actualizar la cantidad.")
    }
  }

  const removeFromCart = (index: number) => {
    const itemToRemove = cart[index]
    setCart(cart.filter((_, i) => i !== index))
    toast.info(`${itemToRemove.nombre} eliminado del carrito`, {
      duration: 2000,
    })
  }

  // ============================
  // FUNCIONES DE EDICIÓN DE NOMBRES
  // ============================

  const editarNombreProducto = (index: number, nuevoNombre: string) => {
    const updatedCart = [...cart]
    const nombreTrimmed = nuevoNombre.trim()

    if (nombreTrimmed && nombreTrimmed !== updatedCart[index].nombre) {
      updatedCart[index].nombreEditado = nombreTrimmed
      toast.success('Nombre actualizado para facturación')
    } else if (nombreTrimmed === updatedCart[index].nombre) {
      // Si es igual al original, eliminar el campo nombreEditado
      delete updatedCart[index].nombreEditado
      toast.info('Nombre restaurado al original')
    }

    setCart(updatedCart)
  }

  const abrirDialogoEditarNombre = (index: number) => {
    setEditingProductIndex(index)
    setIsEditNameDialogOpen(true)
  }

  // ============================
  // FUNCIONES DE DIVISIÓN DE MESAS
  // ============================

  const dividirMesa = async (itemsSeleccionados: number[], mesaDestino: number) => {
    if (!selectedShortcutCart) {
      toast.error('No hay mesa seleccionada')
      return
    }

    try {
      // Obtener items a mover y items que quedan
      const itemsAMover = cart.filter(item => itemsSeleccionados.includes(item.producto_id))
      const itemsQueQuedan = cart.filter(item => !itemsSeleccionados.includes(item.producto_id))

      if (itemsAMover.length === 0 || itemsQueQuedan.length === 0) {
        toast.error('División inválida')
        return
      }

      // Guardar items que quedan en mesa origen
      await carritoGuardadoService.saveOrUpdate({
        numero_carrito: selectedShortcutCart,
        items: itemsQueQuedan,
        metodo_pago: metodoPago,
        observaciones: observaciones || '',
        tipo_documento: tipoDocumento || undefined,
        cliente_data: clienteData || undefined,
      })

      // Guardar items a mover en mesa destino
      await carritoGuardadoService.saveOrUpdate({
        numero_carrito: mesaDestino,
        items: itemsAMover,
        metodo_pago: 'efectivo', // Default para nueva mesa
        observaciones: `División de Mesa ${selectedShortcutCart}`,
      })

      // Actualizar carrito actual con los items que quedan
      setCart(itemsQueQuedan)

      // Recargar carritos
      await loadBackendCarts()

      toast.success(`Mesa dividida exitosamente. Productos movidos a Mesa ${mesaDestino}`)
    } catch (error: any) {
      console.error('Error al dividir mesa:', error)
      toast.error(error.message || 'Error al dividir la mesa')
      throw error
    }
  }

  const abrirDialogoDividirMesa = () => {
    if (!selectedShortcutCart || cart.length < 2) {
      toast.error('Necesitas al menos 2 productos en la mesa para dividirla')
      return
    }
    setMesaADividir(selectedShortcutCart)
    setIsDividirMesaOpen(true)
  }

  // ============================
  // FUNCIONES DE FORMULARIO Y MANEJO DE VENTAS
  // ============================

  // Función principal de envío del formulario optimizada
  const handleSubmit = () => {
    // Validaciones básicas
    if (cart.length === 0) {
      toast.error("Debe agregar al menos un producto al carrito")
      return
    }

    // Preparar datos de venta con descuentos
    const saleData: SaleFormData = {
      id_cajero: user?.id || 1,
      metodo_pago: metodoPago,
      observaciones: observaciones,
      fecha: moment().tz("America/Lima").format("YYYY-MM-DD HH:mm:ss"),
      items: cart.map((item) => ({
        codigo_barras: item.codigos_barras[0],
        cantidad: item.cantidad,
        es_mayorista: item.esPrecioMayorista,
        // Si el item tiene precio variable, enviarlo como precio_unitario_con_igv
        ...(item.esPrecioVariable && item.precioVariableConIgv && {
          precio_unitario_con_igv: item.precioVariableConIgv
        })
      })),
      // Incluir el número de carrito si está seleccionado
      ...(selectedShortcutCart && { numero_carrito: selectedShortcutCart }),
      es_descuento: saleDiscount.isDiscount,
      descuento: saleDiscount.isDiscount ? saleDiscount.amount : undefined,
    }

    // Validar factura requiere datos de cliente
    if (tipoDocumento === "01" && !clienteData) {
      toast.error("Para emitir una factura debe ingresar los datos del cliente con RUC")
      setIsClienteDialogOpen(true)
      return
    }

    // Agregar información de comprobante
    if (tipoDocumento && (tipoDocumento === "01" || tipoDocumento === "03")) {
      saleData.comprobante = prepareComprobanteData()
    }

    // Agregar información de métodos de pago electrónicos
    if (metodoPago === "yape") {
      saleData.yape_celular = yapeCelular
      saleData.yape_codigo = yapeCodigo
    }

    if (metodoPago === "plin") {
      saleData.plin_celular = plinCelular
      saleData.plin_codigo = plinCodigo
    }

    // Guardar datos para procesamiento
    setPendingSaleData(saleData)
    setShowSunatAlert(true)
  }

  // Función auxiliar para preparar datos de comprobante
  const prepareComprobanteData = () => {
    const clienteNombre = clienteData
      ? tipoDocumento === "01"
        ? clienteData.razonSocial
        : clienteData.nombre || `${clienteData.apellidoPaterno || ""} ${clienteData.apellidoMaterno || ""} ${clienteData.nombres || ""}`
      : "CLIENTE GENERAL"

    const clienteNumeroDocumento = clienteData ? clienteData.numeroDocumento : "00000000"

    return {
      tipo_documento: tipoDocumento === "01" ? "1" : "3",
      cliente_tipo_documento: tipoDocumento === "01" ? "6" : "1",
      cliente_numero_documento: clienteNumeroDocumento,
      cliente_nombre: clienteNombre || "CLIENTE GENERAL",
      cliente_direccion: clienteData?.direccion || "",
    }
  }
  // ============================
  // FUNCIONES DE CONSULTA DE CLIENTES
  // ============================

  // Función optimizada para consultar cliente por RUC o DNI
  const consultarCliente = async () => {
    if (!documentoCliente) {
      toast.error(`Debe ingresar un ${tipoDocumento === "01" ? "RUC" : "DNI"}`)
      return
    }

    try {
      setIsConsultandoCliente(true)
      let resultado: ClienteConsultaResponse

      if (tipoDocumento === "01") {
        // Validar y consultar RUC
        if (documentoCliente.length !== 11) {
          toast.error("El RUC debe tener 11 dígitos")
          return
        }
        resultado = await consultarRuc(documentoCliente)
      } else {
        // Validar y consultar DNI
        if (documentoCliente.length !== 8) {
          toast.error("El DNI debe tener 8 dígitos")
          return
        }
        resultado = await consultarDni(documentoCliente)
      }

      setClienteData(resultado)
      setIsClienteDialogOpen(false)
      toast.success(`Datos de ${tipoDocumento === "01" ? "empresa" : "cliente"} obtenidos correctamente`)
    } catch (error: any) {
      console.error(`Error al consultar ${tipoDocumento === "01" ? "RUC" : "DNI"}:`, error)
      toast.error(
        error.message ||
        `No se pudo obtener información del ${tipoDocumento === "01" ? "RUC" : "DNI"}. Verifique el número ingresado.`,
      )
    } finally {
      setIsConsultandoCliente(false)
    }
  }

  // Función para limpiar datos del cliente
  const limpiarDatosCliente = () => {
    setClienteData(null)
    setDocumentoCliente("")
    toast.info("Datos del cliente limpiados")
  }
  // ============================
  // FUNCIONES DE INTEGRACIÓN CON SUNAT
  // ============================

  // Función principal para envío a SUNAT optimizada
  const handleSendToSunat = async () => {
    if (!pendingSaleData || !company) {
      toast.error("No hay datos de venta o empresa disponibles")
      return
    }

    try {
      setIsInvoiceSending(true)
      setShowSunatAlert(false)
      setIsInvoiceDialogOpen(true)

      // Guardar venta en base de datos PRIMERO
      const savedSaleResult = await createSale(pendingSaleData)
      setCurrentSale(savedSaleResult.venta)
      queryClient.invalidateQueries({ queryKey: ["sales"] })

      // Preparar datos de factura con descuentos preservados
      const saleWithItems = prepareSaleWithItems(savedSaleResult.venta)

      // Verificar si ya tiene datos de comprobante
      if (hasComprobanteData(savedSaleResult.venta)) {
        return
      }

      // Obtener nuevo correlativo y procesar envío
      await processSunatSubmission(saleWithItems, savedSaleResult.venta.venta_id)
    } catch (error) {
      console.error("Error al enviar factura:", error)
      handleSunatError(error)
    } finally {
      setIsInvoiceSending(false)
      setPendingSaleData(null)
    }
  }

  // Función auxiliar para preparar venta con items
  const prepareSaleWithItems = (venta: any) => ({
    ...venta,
    es_descuento: pendingSaleData?.es_descuento,
    descuento: pendingSaleData?.descuento,
    items: cart.map((item) => ({
      producto_id: item.producto_id,
      nombre: item.nombreEditado || item.nombre, // Usar nombre editado si existe
      precio_unitario: item.precio_unitario,
      precio_unitario_con_igv: item.precio_unitario_con_igv,
      cantidad: item.cantidad,
    })),
  })

  // Función auxiliar para verificar datos de comprobante
  const hasComprobanteData = (venta: any) =>
    venta.tipo_documento && venta.serie && venta.correlativo

  // Función auxiliar para procesar envío a SUNAT
  const processSunatSubmission = async (
    saleWithItems: any,
    ventaId: number
  ) => {
    const nuevoCorrelativo = await getNewCorrelativo()
    const invoiceData = prepareInvoiceData(
      saleWithItems,
      company,
      tipoDocumento,
      clienteData,
      {
        facturaActual: documentosSeries.facturaActual,
        boletaActual: documentosSeries.boletaActual,
      },
      nuevoCorrelativo,
    )

    // Enviar a SUNAT pasando el ventaId
    const result = await sendInvoiceToSunat(invoiceData, ventaId)
    setInvoiceResult(result)

    // Procesar resultado
    await handleSunatResult(result, nuevoCorrelativo, invoiceData)
  }

  // Función auxiliar para obtener nuevo correlativo
  const getNewCorrelativo = async (): Promise<number> => {
    try {
      return await getLastCorrelativo(tipoDocumento)
    } catch (error) {
      return tipoDocumento === "01"
        ? documentosSeries.facturaActual
        : documentosSeries.boletaActual
    }
  }

  // Función auxiliar para manejar resultado de SUNAT
  const handleSunatResult = async (result: any, correlativo: number, invoiceData: any) => {
    if (result.sunatResponse.success) {
      // Actualizar series locales
      updateLocalSeries(correlativo)

      toast.success(`${tipoDocumento === "01" ? "Factura" : "Boleta"} enviada correctamente a SUNAT`)

      // Generar vista previa del documento
      await generateDocumentPreview(invoiceData, result)
    } else {
      const errorMessage = extractSunatErrorMessage(result)
      toast.error(`Error al enviar a SUNAT: ${errorMessage}`)
    }
  }

  // Función auxiliar para actualizar series locales
  const updateLocalSeries = (correlativo: number) => {
    const newCorrelativo = correlativo + 1
    if (tipoDocumento === "01") {
      setDocumentosSeries(prev => ({ ...prev, facturaActual: newCorrelativo }))
    } else {
      setDocumentosSeries(prev => ({ ...prev, boletaActual: newCorrelativo }))
    }
  }

  // Función auxiliar para extraer mensaje de error de SUNAT
  const extractSunatErrorMessage = (result: any): string => {
    const error = result.sunatResponse.error
    if (typeof error === "object" && error?.message) {
      return error.message
    }
    return error || "Error desconocido"
  }  // Función auxiliar para generar vista previa del documento y enviarlo a imprimir

  const generateDocumentPreview = async (invoiceData: any, result: any) => {
    try {
      const previewResponse = await getInvoicePdfFromSunatResponse(invoiceData, result)

      if (typeof previewResponse === "string") {
        // Si es HTML, mostrar en el modal TicketViewer
        setTicketHtml(previewResponse)
        setIsTicketModalOpen(true)
        setPdfBlob(null)
      } else {
        // Si es PDF, mostrar en el modal TicketViewer
        setPdfBlob(previewResponse)
        setIsTicketModalOpen(true)
        setTicketHtml("")
      }

      toast.success(`${tipoDocumento === "01" ? "Factura" : "Boleta"} generada correctamente`, {
        duration: 3000,
        icon: '🖨️'
      })

    } catch (previewError: any) {
      console.error("Error al generar vista previa del documento enviado:", previewError)
      toast.warning("Documento enviado a SUNAT correctamente, pero no se pudo mostrar la vista previa")
    }
  }

  // Función auxiliar para manejar errores de SUNAT
  const handleSunatError = (error: any) => {
    const errorMessage = error.message || "Error al enviar factura a SUNAT"
    toast.error(errorMessage)
    setInvoiceResult({
      sunatResponse: {
        success: false,
        error: errorMessage,
      },
    })
  }
  // ============================
  // EFECTOS Y FUNCIONES AUXILIARES
  // ============================
  // ============================
  // EFECTOS Y FUNCIONES AUXILIARES
  // ============================

  // Función para resetear el formulario y limpiar el estado del modal del ticket
  const resetForNewSale = () => {
    // Limpiar carrito y estados relacionados
    setCart([])
    setProductSearchTerm("")
    setProductSearchResults([])
    setIsProductSearchOpen(false)
    setBarcodeSearchResults([])
    setBarcodeSearchResult(null)

    // Limpiar formulario de venta
    setMetodoPago("efectivo")
    setObservaciones("")
    setTipoDocumento("")

    // Limpiar datos de cliente
    setClienteData(null)
    setDocumentoCliente("")

    // Limpiar métodos de pago digitales
    setYapeCelular("")
    setYapeCodigo("")
    setPlinCelular("")
    setPlinCodigo("")
    setMontoRecibido("")

    // Limpiar descuentos
    setSaleDiscount({
      isDiscount: false,
      type: "percentage",
      value: 0,
      amount: 0,
    })

    // Limpiar estados de facturación
    setCurrentSale(null)
    setInvoiceResult(null)
    setPendingSaleData(null)

    // Resetear modo de precio si estaba en mayorista
    setPrecioMayoristaMode(false)

    // Mostrar mensaje de éxito
    toast.success("Listo para nueva venta", {
      icon: "🛒",
      duration: 2000,
    })

    // Enfocar en el campo de búsqueda de productos para agilizar el proceso
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder*="Buscar productos"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    }, 100)
  }  // Función para manejar el cierre del diálogo de factura y reiniciar para nueva venta
  const handleCloseInvoiceDialog = async () => {
    // Marca para identificar que venimos del diálogo de factura
    window.localStorage.setItem('ventaCompletada', 'true');

    // Manejar comandas después de la venta (boleta/factura)
    if (selectedShortcutCart) {
      // Si hay carrito seleccionado, marcar comanda como entregada si está habilitado
      if (marcarComandaEntregada) {
        try {
          const comanda = await comandasService.getByCarrito(selectedShortcutCart)
          if (comanda && comanda.estado !== 'entregado') {
            await comandasService.terminarComanda(comanda.comanda_id)
            toast.info(`Comanda ${comanda.comanda_id} marcada como entregada`)
          }
        } catch (comandaError) {
          console.log("No se encontró comanda asociada o ya fue eliminada")
        }
      }
      
      setSelectedShortcutCart(null)
      // Recargar la lista de carritos para reflejar el cambio
      await loadBackendCarts()
    } else {
      // Si no hay carrito seleccionado, generar comanda de delivery automática SIEMPRE
      if (cart.length > 0) {
        try {
          // Crear comanda de delivery
          const comandaData = {
            es_delivery: true, // Indica que es delivery
            productos: cart.map((item: CartItem) => ({
              id: item.producto_id,
              nombre: item.nombre,
              cantidad: item.cantidad,
              precio: parseFloat(item.precio_unitario),
              precioConIgv: parseFloat(item.precio_unitario_con_igv),
              codigo_barras: Array.isArray(item.codigos_barras) ? item.codigos_barras[0] || "" : item.codigos_barras || ""
            })),
            total: saleDiscount.isDiscount ? totalWithDiscount : total,
            total_con_igv: saleDiscount.isDiscount ? totalWithDiscount : total,
            observaciones: observaciones ? `Venta rápida - Delivery | ${observaciones}` : "Venta rápida - Delivery",
            id_usuario: user?.id || 1
          }

          const comandaResult = await comandasService.createOrUpdate(comandaData)
          toast.info(`Comanda de delivery ${comandaResult.comanda.comanda_id} generada automáticamente`)
        } catch (comandaError) {
          console.error("Error al generar comanda de delivery:", comandaError)
          toast.error("Error al generar comanda de delivery")
        }
      }
    }

    // Cerrar el diálogo de factura
    setIsInvoiceDialogOpen(false);

    // Crear una función reutilizable para enfocar el botón
    const focusNuevaVentaBtn = () => {
      // Estrategia completa: intentar con todos los selectores posibles
      let btnTarget: HTMLButtonElement | null = null;

      // Intentos secuenciales con diferentes selectores
      const selectors = [
        '#nuevaVentaSuccessBtn',
        '.dialog-success-nueva-venta-btn',
        '.focus-ring-button'
      ];

      // Intentar cada selector
      for (const selector of selectors) {
        btnTarget = document.querySelector(selector) as HTMLButtonElement;
        if (btnTarget) break;
      }

      // Si no encontramos con selectores específicos, buscar por texto
      if (!btnTarget) {
        const allButtons = Array.from(document.querySelectorAll('button'));
        btnTarget = allButtons.find(btn =>
          btn.textContent?.toLowerCase().includes('nueva venta')
        ) as HTMLButtonElement;
      }

      if (btnTarget) {
        // Hacer visible el botón (scroll) si es necesario
        btnTarget.scrollIntoView({ behavior: 'auto', block: 'center' });

        try {
          // Enfocar con opciones
          btnTarget.focus({ preventScroll: false });
          // Log eliminado

          // Efecto visual para resaltar el botón
          btnTarget.classList.add('focus-ring-pulse');
          setTimeout(() => btnTarget.classList.remove('focus-ring-pulse'), 2000);
        } catch (e) {
          console.error('Error al enfocar botón Nueva Venta:', e);
        }
      } else {
        console.warn('No se pudo encontrar el botón Nueva Venta en handleCloseInvoiceDialog');
      }
    };

    // Usar setTimeout para evitar conflictos con el cierre del modal
    setTimeout(() => {
      // Mostrar el modal de éxito en lugar del window.confirm
      setShowSaleSuccessDialog(true);

      // Estrategia de múltiples intentos con diferentes retrasos
      // Incluye retrasos más largos para asegurar que el diálogo esté completamente renderizado
      const delays = [100, 300, 500, 800, 1200, 2000];
      delays.forEach(delay => setTimeout(focusNuevaVentaBtn, delay));

      // Adicionalmente, agregar un MutationObserver para detectar cambios en el DOM
      // y asegurar que el botón reciba el foco cuando aparezca
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Si se agregaron nodos, intentar enfocar el botón
            setTimeout(focusNuevaVentaBtn, 50);
          }
        }
      });

      // Observar cambios en el body para detectar cuando se agrega el diálogo
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Dejar de observar después de un tiempo razonable
      setTimeout(() => observer.disconnect(), 3000);
    }, 100);
  }
  // Función para iniciar nueva venta directamente (sin mostrar opciones)
  const handleStartNewSale = () => {
    setIsInvoiceDialogOpen(false)
    setTimeout(() => {
      resetForNewSale()
    }, 100)
  }
  // Función para ver detalles de venta
  const handleViewSaleDetails = () => {
    setIsInvoiceDialogOpen(false)
    if (currentSale) {
      navigate(`/sales/${currentSale?.venta_id}`)
    }
  }

  // Función para manejar nueva venta desde el diálogo de éxito
  const handleNewSaleFromSuccess = () => {
    setShowSaleSuccessDialog(false)
    setTimeout(() => {
      resetForNewSale()
    }, 100)
  }
  // Función para ver detalles desde el diálogo de éxito
  const handleViewSaleDetailsFromSuccess = () => {
    setShowSaleSuccessDialog(false)
    if (currentSale) {
      navigate(`/sales/${currentSale?.venta_id}`)
    }
  }  // Función para mostrar ticket desde el diálogo de éxito
  const handleShowTicketFromSuccess = async () => {
    if (currentSale) {
      await printTicketDirectly(currentSale.venta_id)
    }
  }

  // ============================
  // FUNCIONES PARA VERSIÓN MÓVIL
  // ============================
  
  // Función para agregar producto en versión móvil
  const handleMobileAddToCart = (product: any) => {
    addToCart(product, null, precioMayoristaMode)
  }

  // Función para actualizar cantidad en versión móvil
  const handleMobileUpdateQuantity = (productId: number, newQuantity: number) => {
    const cartIndex = cart.findIndex(item => item.producto_id === productId)
    if (cartIndex !== -1) {
      if (newQuantity === 0) {
        removeFromCart(cartIndex)
      } else {
        const newCart = [...cart]
        newCart[cartIndex].cantidad = newQuantity
        newCart[cartIndex].subtotal = newQuantity * parseFloat(newCart[cartIndex].precio_unitario_con_igv || newCart[cartIndex].precio_unitario || '0')
        setCart(newCart)
      }
    }
  }

  // Función para remover del carrito en versión móvil
  const handleMobileRemoveFromCart = (productId: number) => {
    const cartIndex = cart.findIndex(item => item.producto_id === productId)
    if (cartIndex !== -1) {
      removeFromCart(cartIndex)
    }
  }

  // Función para abrir el scanner de códigos de barras en móvil
  const handleMobileOpenBarcodeScanner = () => {
    setIsBarcodeDialogOpen(true)
  }

  // NUEVO: Selección de mesa en móvil con carga desde backend (paridad con escritorio)
  const handleMobileSelectTable = async (table: any) => {
    try {
      const numero = Number(table.number)

      // Si ya está seleccionada, deseleccionar
      if (selectedShortcutCart === numero) {
        setSelectedShortcutCart(null)
        toast.info(`Mesa ${numero} deseleccionada`)
        return
      }

      const existingCart = getBackendCart(numero)

      // Si el carrito actual tiene productos, confirmar reemplazo
      if (cart.length > 0) {
        const shouldReplace = window.confirm(
          `Tienes ${cart.length} productos en el carrito actual.\n\n¿Deseas reemplazarlos por el contenido de la Mesa ${numero}?`
        )
        if (!shouldReplace) {
          setSelectedShortcutCart(numero)
          toast.success(`Mesa ${numero} seleccionada`)
          return
        }
      }

      // Si hay carrito guardado en backend, cargarlo
      if (existingCart && existingCart.items.length > 0) {
        const loaded = await loadBackendCart(numero, false)
        if (loaded) {
          setSelectedShortcutCart(numero)
          toast.success(`Mesa ${numero} cargada y seleccionada`)
        } else {
          setSelectedShortcutCart(numero)
        }
      } else {
        // Si no hay carrito guardado, limpiar estado y seleccionar
        clearCurrentCartState()
        setSelectedShortcutCart(numero)
        toast.success(`Mesa ${numero} seleccionada. Agregue productos y use "Guardar en la Mesa ${numero}"`)
      }
    } catch (e) {
      console.error("Error al seleccionar mesa en móvil:", e)
      toast.error("No se pudo seleccionar la mesa")
    }
  }

  // Función para manejar el cierre del diálogo de éxito de venta
  // Esta función se ejecuta SIEMPRE que se cierre el diálogo, ya sea con X o botones
  const handleCloseSaleSuccessDialog = () => {
    setShowSaleSuccessDialog(false)
    // Siempre resetear para nueva venta cuando se cierre el diálogo
    // Esto asegura que la mesa se limpie visualmente en tiempo real
    setTimeout(() => {
      resetForNewSale()
    }, 100)
  }

  // Función mejorada para manejar el cierre del diálogo de factura
  // Asegura que siempre se resetee el estado después de una venta exitosa
  const handleCloseInvoiceDialogSafe = () => {
    // Marcar que la venta está completada para limpiar estado en tiempo real
    const ventaCompletada = currentSale !== null
    
    // Ejecutar el comportamiento original (incluye mostrar SaleSuccessDialog)
    handleCloseInvoiceDialog()
    
    // Si había una venta completada y se cerró directamente sin pasar por SaleSuccessDialog,
    // asegurar que se limpie el estado después de un delay
    if (ventaCompletada) {
      setTimeout(() => {
        // Solo limpiar si NO se está mostrando el SaleSuccessDialog
        // (que ya tiene su propia lógica de limpieza)
        if (!showSaleSuccessDialog) {
          resetForNewSale()
        }
      }, 300)
    }
  }
  // ============================
  // FUNCIONES DE BÚSQUEDA Y ESCÁNER DE CÓDIGOS DE BARRAS
  // ============================
  // Función optimizada para búsqueda manual de códigos de barras
  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) {
      toast.error("Por favor ingrese un código de barras")
      return
    }

    if (isProcessingBarcode) return

    try {
      setIsProcessingBarcode(true)
      setIsBarcodeSearching(true)

      // Verificar si el código ya está en resultados
      const existingResult = barcodeSearchResults.find((item) => item.codigo_barras.codigo === barcodeInput.trim())

      if (existingResult) {
        setBarcodeSearchResult(existingResult)
        lastProductRef.current = existingResult

        // Agregar directamente al carrito
        await addProductDirectlyToCart(existingResult, precioMayoristaMode)

        // Cerrar el modal después de agregar
        setIsBarcodeDialogOpen(false)
        setBarcodeInput("")
        return
      }

      // Buscar producto por código de barras
      const result = await buscarProductoPorCodigoBarras(barcodeInput.trim())

      if (!result?.producto) {
        toast.error("No se encontró ningún producto con ese código de barras")
        setBarcodeSearchResult(null)
        return
      }

      // Procesar resultado exitoso y agregar al carrito
      setBarcodeSearchResult(result)
      lastProductRef.current = result

      // Agregar directamente al carrito
      await addProductDirectlyToCart(result, precioMayoristaMode)

      // Cerrar el modal después de agregar
      setIsBarcodeDialogOpen(false)
      setBarcodeInput("")

    } catch (error) {
      console.error("Error al buscar producto por código de barras:", error)
      toast.error("No se encontró ningún producto con ese código de barras")
      setBarcodeSearchResult(null)
    } finally {
      setIsBarcodeSearching(false)
      setTimeout(() => setIsProcessingBarcode(false), 300)
    }
  }
  // Función optimizada para manejar códigos escaneados
  const handleScannedBarcode = async (barcode: string, usarPrecioMayorista = false) => {
    if (isProcessingBarcode) {
      console.log(`Código de barras ignorado - ya procesando: ${barcode}`)
      return
    }

    try {
      setIsProcessingBarcode(true)

      const trimmedBarcode = barcode.trim()
      console.log(`Procesando código de barras: ${trimmedBarcode}`)

      // Toast más discreto para escaneo rápido
      toast.info(`Buscando: ${trimmedBarcode}`, {
        duration: 1000, // Más corto
        id: "barcode-scanning",
      })

      // Verificar cache de resultados
      const existingResult = barcodeSearchResults.find((item) => item.codigo_barras.codigo === trimmedBarcode)

      if (existingResult) {
        console.log(`Código encontrado en cache: ${trimmedBarcode}`)
        await addProductDirectlyToCart(existingResult, usarPrecioMayorista)
        return
      }

      // Buscar en API
      const result = await buscarProductoPorCodigoBarras(trimmedBarcode)

      if (!result?.producto) {
        toast.error(`No se encontró ningún producto con el código: ${trimmedBarcode}`, {
          id: "barcode-error",
        })
        return
      }

      console.log(`Producto encontrado: ${result.producto.nombre}`)
      await addProductDirectlyToCart(result, usarPrecioMayorista)
    } catch (error) {
      console.error("Error al buscar producto por código de barras:", error)
      toast.error(`No se encontró ningún producto con el código: ${barcode}`, {
        id: "barcode-error",
      })
    } finally {
      // Reducir tiempo de espera para permitir escaneo más rápido
      setTimeout(() => {
        setIsProcessingBarcode(false)
        console.log(`Liberando flag de procesamiento para código: ${barcode}`)
      }, 200) // Reducido de 500ms a 200ms para escaneo más rápido
    }
  }
  // Función para agregar producto directamente al carrito desde escaneo
  const addProductDirectlyToCart = async (result: any, usarPrecioMayorista: boolean) => {
    lastProductRef.current = result

    const productToAdd = products?.find((p) => p.id_producto === result.producto.id_producto)

    if (productToAdd) {
      // Verificar stock
      if (productToAdd.stock <= 0) {
        toast.error(`El producto ${result.producto.nombre} no tiene stock disponible`)
        return
      }

      // Verificar si el producto ya está siendo procesado para evitar duplicados rápidos
      // Reducir tiempo de cooldown para permitir escaneo rápido
      const now = Date.now()
      const lastAddKey = `${result.producto.id_producto}-${result.codigo_barras.codigo}`
      const lastAddTime = window.sessionStorage.getItem(`lastAdd-${lastAddKey}`)

      // Reducir cooldown a 300ms para permitir escaneo más rápido
      if (lastAddTime && now - parseInt(lastAddTime) < 300) {
        console.log(`Producto ${productToAdd.nombre} ignorado - agregado recientemente (${now - parseInt(lastAddTime)}ms)`)
        return
      }

      // Marcar como procesado
      window.sessionStorage.setItem(`lastAdd-${lastAddKey}`, now.toString())

      await addToCart(
        productToAdd,
        {
          codigo: result.codigo_barras.codigo,
          cantidad: result.codigo_barras.cantidad || 1,
        },
        usarPrecioMayorista || precioMayoristaMode,
      )

      // Toast más corto para escaneo rápido
      toast.success(`${result.producto.nombre} agregado`, {
        id: "barcode-success",
        duration: 1500, // Más corto para escaneo rápido
      })

      // Agregar a cache si no existe
      const existingIndex = barcodeSearchResults.findIndex((item) =>
        item.producto.id_producto === result.producto.id_producto &&
        item.codigo_barras.codigo === result.codigo_barras.codigo,
      )

      if (existingIndex === -1) {
        setBarcodeSearchResults((prev) => [...prev, result])
      }

      // Enfocar el buscador principal después de agregar el producto
      setTimeout(() => {
        if (productSearchInputRef.current) {
          productSearchInputRef.current.focus()
        }
      }, 200)
    } else {
      toast.warning("Producto encontrado pero no está disponible en el catálogo actual")
      // También enfocar el buscador en caso de error
      setTimeout(() => {
        if (productSearchInputRef.current) {
          productSearchInputRef.current.focus()
        }
      }, 200)
    }
  }

  // Función para abrir diálogo de escáner
  const openBarcodeScanner = () => {
    setIsBarcodeDialogOpen(true)
    setBarcodeInput("")
    setBarcodeSearchResult(null)
  }

  // ============================
  // FUNCIONES DE ACTUALIZACIÓN DE STOCK
  // ============================

  // Función para refrescar datos de stock de un item del carrito
  const refreshCartItemStock = async (item: CartItem) => {
    try {
      const response = await obtenerCodigosBarras(item.producto_id)

      if (response?.codigos_barras?.length > 0) {
        // Actualizar codigosMaximos con datos frescos del backend
        const updatedCodigosMaximos: Record<string, number> = {}

        for (const codigoBarras of response.codigos_barras) {
          if (item.codigos_barras.includes(codigoBarras.codigo)) {
            updatedCodigosMaximos[codigoBarras.codigo] = codigoBarras.cantidad
          }
        }

        return updatedCodigosMaximos
      }
    } catch (error) {
      console.error("Error al refrescar stock del producto:", error)
    }

    return item.codigosMaximos || {}
  }

  // Función para refrescar stock de todos los items del carrito
  const refreshAllCartItemsStock = async () => {
    if (cart.length === 0) return

    try {
      const updatedCart = [...cart]
      let hasUpdates = false

      for (let i = 0; i < updatedCart.length; i++) {
        const item = updatedCart[i]
        const freshCodigosMaximos = await refreshCartItemStock(item)

        // Solo actualizar si hay cambios
        if (JSON.stringify(freshCodigosMaximos) !== JSON.stringify(item.codigosMaximos)) {
          updatedCart[i] = { ...item, codigosMaximos: freshCodigosMaximos }
          hasUpdates = true
        }
      }

      if (hasUpdates) {
        setCart(updatedCart)
        toast.success("Stock actualizado con datos del inventario", { duration: 3000 })
      }
    } catch (error) {
      console.error("Error al refrescar stock del carrito:", error)
      toast.error("Error al actualizar el stock del carrito")
    }
  }

  // ============================
  // FUNCIONES DE MANEJO DE CARRITOS GUARDADOS
  // ============================

  // Función para guardar carrito actual
  const saveCurrentCart = () => {
    if (cart.length === 0) {
      toast.error("No hay productos en el carrito para guardar")
      return
    }
    setIsNamingCartDialogOpen(true)
  }

  // Función para manejar clic en atajo de carrito específico
  const handleSpecificCartClick = async (cartNumber: number) => {
    const existingCart = getBackendCart(cartNumber)
    
    // Si el carrito ya está seleccionado, deseleccionarlo
    if (selectedShortcutCart === cartNumber) {
      setSelectedShortcutCart(null)
      toast.info(`Mesa ${cartNumber} deseleccionada`)
      return
    }
    
    // Si el carrito actual tiene productos, preguntar si quiere guardar y cambiar
    if (cart.length > 0) {
      setSelectedCartNumber(cartNumber)
      setIsCartSaveDialogOpen(true)
      return
    }
    
    // Si el carrito actual está vacío, proceder con el cambio
    if (existingCart && existingCart.items.length > 0) {
      // Si el carrito tiene productos, cargarlo automáticamente (reemplazar contenido)
      const loaded = await loadBackendCart(cartNumber, false)
      if (loaded) {
        setSelectedShortcutCart(cartNumber)
        toast.success(`Mesa ${cartNumber} cargada y seleccionada`)
      }
    } else {
      // Si el carrito está vacío, limpiar carrito actual y seleccionar
      clearCurrentCartState()
      setSelectedShortcutCart(cartNumber)
      toast.success(`Mesa ${cartNumber} seleccionada. Agregue productos y use "Guardar en la Mesa ${cartNumber}"`)
    }
  }

  // Función para manejar clic derecho en atajo de carrito (eliminar)
  const handleSpecificCartRightClick = (e: React.MouseEvent, cartNumber: number) => {
    e.preventDefault()
    const existingCart = getBackendCart(cartNumber)
    
    if (existingCart && existingCart.items.length > 0) {
      // Solo permitir eliminar carritos que tienen productos
      setSelectedCartNumber(cartNumber)
      setIsCartDeleteDialogOpen(true)
    } else {
      toast.info(`Carrito ${cartNumber} está vacío, no se puede eliminar`)
    }
  }


  // Función para guardar en el atajo seleccionado
  const saveToSelectedShortcut = async () => {
    if (selectedShortcutCart !== null) {
      const ok = await saveCartToBackend(selectedShortcutCart)
      setSelectedShortcutCart(null)
      if (ok) {
        // Redirigir a "Nueva Venta" con recarga completa de la página
        window.location.href = "/sales/new"
      }
    }
  }

  // Función para eliminar un carrito
  const deleteCart = async (cartNumber: number) => {
    try {
      await carritoGuardadoService.delete(cartNumber)
      
      // Eliminar comanda asociada si se solicita
      if (deleteComandaToo) {
        try {
          const comanda = await comandasService.getByCarrito(cartNumber)
          if (comanda) {
            await comandasService.delete(comanda.comanda_id)
            toast.info(`Comanda ${comanda.comanda_id} también eliminada`)
          }
        } catch (comandaError) {
          console.log("No se encontró comanda asociada o ya fue eliminada")
        }
      }
      
      await loadBackendCarts() // Recargar la lista de carritos
      toast.success(`Carrito ${cartNumber} eliminado correctamente`)
      setIsCartDeleteDialogOpen(false)
      setSelectedCartNumber(null)
      setDeleteComandaToo(false) // Resetear el estado
    } catch (error) {
      console.error("Error al eliminar carrito:", error)
      toast.error("Error al eliminar carrito")
    }
  }

  // Función para confirmar eliminación
  const confirmDeleteCart = () => {
    if (selectedCartNumber !== null) {
      deleteCart(selectedCartNumber)
    }
  }

  // Función para cancelar eliminación
  const cancelDeleteCart = () => {
    setIsCartDeleteDialogOpen(false)
    setSelectedCartNumber(null)
    setDeleteComandaToo(false)
  }

  // Función para guardar carrito en el backend
  const saveCartToBackend = async (cartNumber: number) => {
    try {
      const cartData = {
        numero_carrito: cartNumber,
        items: [...cart],
        metodo_pago: metodoPago,
        observaciones: observaciones,
        tipo_documento: tipoDocumento,
        cliente_data: clienteData,
        barcode_search_results: [...barcodeSearchResults]
      }

      const response = await carritoGuardadoService.saveOrUpdate(cartData)
      
      // Generar o actualizar comanda usando el backend
      const comandaData = {
        numero_carrito: cartNumber,
        productos: cart.map(item => ({
          id: item.producto_id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: parseFloat(item.precio_unitario),
          precioConIgv: parseFloat(item.precio_unitario_con_igv),
          codigo_barras: item.codigos_barras?.[0] || ''
        })),
        observaciones: observaciones,
        id_usuario: user?.id
      }
      
      const comandaResponse = await comandasService.createOrUpdate(comandaData)
      
      // Si está marcado para generar comanda e imprimir
      if (generarComandaEImprimir) {
        try {
          // Crear datos de la comanda para impresión directa
          const comandaParaImprimirData = {
            numero_carrito: cartNumber,
            productos: cart.map(item => ({
              id: item.producto_id,
              nombre: item.nombreEditado || item.nombre, // Usar nombre editado si existe
              nombreEditado: item.nombreEditado,
              cantidad: item.cantidad,
              precio: parseFloat(item.precio_unitario),
              precioConIgv: parseFloat(item.precio_unitario_con_igv),
              codigo_barras: item.codigos_barras?.[0] || ''
            })),
            total: cart.reduce((sum, item) => sum + (item.cantidad * parseFloat(item.precio_unitario)), 0),
            total_con_igv: cart.reduce((sum, item) => sum + (item.cantidad * parseFloat(item.precio_unitario_con_igv)), 0),
            observaciones: observaciones || '',
            id_usuario: user?.id,
            fecha_creacion: new Date().toISOString(),
            es_delivery: false
          }

          // Imprimir DIRECTAMENTE sin preview
          await imprimirComandaDirecta(comandaParaImprimirData)
          toast.success('Comanda enviada a cocina automáticamente')
        } catch (printError) {
          console.error('Error al imprimir comanda:', printError)
          toast.error('Mesa guardada, pero hubo un error al imprimir la comanda')
        }
      }
      
      // Recargar la lista de carritos del backend
      await loadBackendCarts()
      
      // Limpiar estado actual
      clearCurrentCartState()
      
      toast.success(response.message || `Carrito ${cartNumber} guardado correctamente`)
      toast.info(`Comanda ${comandaResponse.comanda.comanda_id} ${comandaResponse.message.toLowerCase()}`)
      
      if (generarComandaEImprimir) {
        toast.info("Vista previa de comanda generada")
      }
      // Indicar éxito
      return true
    } catch (error) {
      console.error("Error al guardar carrito:", error)
      toast.error("Error al guardar carrito")
      // Indicar fallo
      return false
    }
  }

  // Función para cargar carrito específico del backend
  const loadBackendCart = async (cartNumber: number, showToast: boolean = true) => {
    try {
      const backendCart = getBackendCart(cartNumber)
      
      if (!backendCart || backendCart.items.length === 0) {
        if (showToast) {
          toast.error(`No hay carrito guardado en la posición ${cartNumber}`)
        }
        return false
      }

      // Cargar datos del carrito específico
      setCart(backendCart.items)
      setMetodoPago(backendCart.metodo_pago)
      setObservaciones(backendCart.observaciones || "")

      // Cargar datos adicionales si existen
      if (backendCart.tipo_documento) {
        setTipoDocumento(backendCart.tipo_documento)
      }

      if (backendCart.cliente_data) {
        setClienteData(backendCart.cliente_data)
      }

      setBarcodeSearchResults(backendCart.barcode_search_results || [])
      
      // Activar refresh de stock con un pequeño delay para evitar conflictos
      setTimeout(() => {
        setNeedsStockRefresh(true)
      }, 100)

      if (showToast) {
        toast.success(`Carrito ${cartNumber} cargado correctamente`)
      }
      return true
    } catch (error) {
      console.error("Error al cargar carrito:", error)
      if (showToast) {
        toast.error("Error al cargar carrito")
      }
      return false
    }
  }

  // Función para confirmar reemplazo de carrito
  const confirmReplaceCart = async () => {
    if (selectedCartNumber !== null) {
      const existingCart = getBackendCart(selectedCartNumber)
      
      if (existingCart && existingCart.items.length > 0) {
        // Si el carrito tiene productos, cargarlo automáticamente (reemplazar contenido)
        const loaded = await loadBackendCart(selectedCartNumber, false)
        if (loaded) {
          setSelectedShortcutCart(selectedCartNumber)
          toast.success(`Mesa ${selectedCartNumber} cargada y seleccionada`)
        }
      } else {
        // Si el carrito está vacío, limpiar carrito actual y seleccionar
        clearCurrentCartState()
        setSelectedShortcutCart(selectedCartNumber)
        toast.success(`Mesa ${selectedCartNumber} seleccionada. Agregue productos y use "Guardar en la Mesa ${selectedCartNumber}"`)
      }
    }
    setIsCartSaveDialogOpen(false)
    setSelectedCartNumber(null)
  }

  // Función para cancelar reemplazo de carrito
  const cancelReplaceCart = () => {
    setIsCartSaveDialogOpen(false)
    setSelectedCartNumber(null)
  }

  // Función para confirmar carga de carrito
  const confirmLoadCart = async () => {
    if (selectedCartNumber !== null) {
      const loaded = await loadBackendCart(selectedCartNumber, false)
      if (loaded) {
        // También seleccionar el carrito después de cargarlo
        setSelectedShortcutCart(selectedCartNumber)
        toast.success(`Mesa ${selectedCartNumber} cargada y seleccionada`)
      }
    }
    setIsCartLoadDialogOpen(false)
    setSelectedCartNumber(null)
  }

  // Función para cancelar carga de carrito
  const cancelLoadCart = () => {
    setIsCartLoadDialogOpen(false)
    setSelectedCartNumber(null)
  }

  // Función optimizada para confirmar guardado de carrito
  const confirmSaveCart = () => {
    const cartName = newCartName.trim() || `Cliente ${savedCarts.length + 1}`

    const newSavedCart: SavedCart = {
      id: moment().tz("America/Lima").valueOf().toString(),
      name: cartName,
      items: [...cart],
      metodoPago,
      observaciones,
      timestamp: moment().tz("America/Lima").valueOf(),
      barcodeSearchResults: [...barcodeSearchResults],
      tipoDocumento,
      clienteData,
    }

    setSavedCarts([...savedCarts, newSavedCart])

    // Limpiar estado actual
    clearCurrentCartState()

    setIsNamingCartDialogOpen(false)
    setNewCartName("")
    toast.success(`Carrito "${cartName}" guardado correctamente`)
  }

  // Función auxiliar para limpiar estado del carrito actual
  const clearCurrentCartState = () => {
    setCart([])
    setMetodoPago("efectivo")
    setObservaciones("")
    setBarcodeSearchResults([])
    setTipoDocumento("")
    setClienteData(null)
    setYapeCelular("")
    setYapeCodigo("")
    setPlinCelular("")
    setPlinCodigo("")
    setMontoRecibido("")
  }

  // Función optimizada para cargar carrito guardado
  const loadSavedCart = (savedCart: SavedCart) => {
    // Confirmar si hay carrito actual
    if (cart.length > 0) {
      if (window.confirm("¿Desea guardar el carrito actual antes de cargar otro?")) {
        saveCurrentCart()
        return
      }
    }

    // Cargar datos del carrito
    setCart(savedCart.items)
    setMetodoPago(savedCart.metodoPago)
    setObservaciones(savedCart.observaciones)

    // Cargar datos adicionales si existen
    if (savedCart.tipoDocumento) {
      setTipoDocumento(savedCart.tipoDocumento)
    }

    if (savedCart.clienteData) {
      setClienteData(savedCart.clienteData)
    }

    // NO cargar catálogo de productos obsoleto
    // Los barcodeSearchResults se mantienen vacíos para forzar búsquedas actualizadas
    setBarcodeSearchResults([])
    // Si había productos en el catálogo, informar al usuario
    if (savedCart.barcodeSearchResults?.length > 0) {
      toast.info("Carrito cargado. El catálogo se actualizará con las búsquedas.")
    }

    // Eliminar carrito guardado y cerrar diálogo
    setSavedCarts(savedCarts.filter((c) => c.id !== savedCart.id))
    setIsSavedCartsDialogOpen(false)
    toast.success(`Carrito "${savedCart.name}" cargado correctamente`)

    // Marcar que se necesita refrescar el stock después de cargar
    setNeedsStockRefresh(true)
  }

  // Función para eliminar carrito guardado
  const deleteSavedCart = (id: string, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar el carrito "${name}"?`)) {
      setSavedCarts(savedCarts.filter((c) => c.id !== id))
      toast.info(`Carrito "${name}" eliminado`)
    }
  }

  // Función para iniciar nuevo carrito
  const startNewCart = () => {
    if (cart.length > 0) {
      if (window.confirm("¿Desea guardar el carrito actual antes de crear uno nuevo?")) {
        saveCurrentCart()
        return
      }
    }
    clearCurrentCartState()
    toast.info("Nuevo carrito iniciado")
  }

  // ============================
  // FUNCIONES AUXILIARES DE UI
  // ============================

  // Función para renderizar íconos de métodos de pago

  const renderPaymentMethodIcon = () => {
    switch (metodoPago) {
      case "efectivo":
        return <SolPeruano className="h-4 w-4 mr-2 text-green-500" />
      case "tarjeta":
        return <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
      case "transferencia":
        return <Receipt className="h-4 w-4 mr-2 text-fire-500" />
      case "pedidosya":
        return <Truck className="h-4 w-4 mr-2 text-orange-500" />
      case "rappi":
        return <Zap className="h-4 w-4 mr-2 text-ember-500" />
      case "uber_eats":
        return <Smartphone className="h-4 w-4 mr-2 text-green-500" />
      case "yape":
        return <QrCode className="h-4 w-4 mr-2 payment-method-icon-yape" />
      case "plin":
        return <QrCode className="h-4 w-4 mr-2 payment-method-icon-plin" />
      default:
        return <SolPeruano className="h-4 w-4 mr-2 text-green-500" />
    }
  }

  // Modificar la función para cambiar el tipo de precio de un ítem en el carrito
  const toggleItemPriceType = (index: number) => {
    const updatedCart = [...cart]
    const item = updatedCart[index]

    // Verificar si el producto tiene precio mayorista
    if (!item.precio_mayoritario || item.precio_mayoritario === "0.00") {
      toast.warning(`Este producto no tiene precio mayorista definido`)
      return
    }

    // Cambiar el tipo de precio
    item.esPrecioMayorista = !item.esPrecioMayorista

    // Actualizar el precio según el tipo
    if (item.esPrecioMayorista) {
      // Cambiar a precio mayorista (no aplica oferta)
      item.precio_unitario = item.precio_mayoritario!
      item.precio_unitario_con_igv = item.precio_mayoritario_con_igv!
      item.es_oferta = false
    } else {
      // Cambiar a precio unitario, verificar si aplica oferta
      const originalProduct = products?.find((p) => p.id_producto === item.producto_id)
      if (originalProduct) {
        if (originalProduct.es_oferta && originalProduct.precio_oferta && originalProduct.precio_oferta !== "0.00") {
          // Aplicar precio de oferta
          item.precio_unitario = originalProduct.precio_oferta
          item.precio_unitario_con_igv =
            originalProduct.precio_oferta_con_igv ||
            (Number.parseFloat(originalProduct.precio_oferta) * 1.18).toFixed(2)
          item.es_oferta = true
        } else {
          // Precio normal
          item.precio_unitario = originalProduct.precio_unitario
          item.precio_unitario_con_igv = originalProduct.precio_unitario_con_igv
          item.es_oferta = false
        }
      }
    }

    // Recalcular el subtotal del ítem
    item.subtotal = Number.parseFloat(item.precio_unitario_con_igv) * item.cantidad

    // Actualizar el carrito
    setCart(updatedCart)

    let tipoPrecionMensaje = item.esPrecioMayorista ? "mayorista" : "unitario"
    if (!item.esPrecioMayorista && item.es_oferta) {
      tipoPrecionMensaje = "oferta"
    }

    toast.success(`Precio cambiado a ${tipoPrecionMensaje} para ${item.nombre}`)
  }

  // Función inteligente para manejar búsqueda por nombre o código de barras escaneado
  const handleSearchOrBarcode = async (searchValue: string) => {
    // Prevenir procesamiento si ya se está procesando un código de barras
    if (isProcessingBarcode) {
      console.log(`Búsqueda ignorada - ya procesando código de barras: ${searchValue}`)
      return
    }

    // Detectar si parece ser un código de barras escaneado (alfanumérico, sin espacios, longitud típica)
    const isLikelyBarcode = /^[a-zA-Z0-9]+$/.test(searchValue) && searchValue.length >= 6

    if (isLikelyBarcode) {
      // Tratar como código de barras - buscar producto y agregar directamente al carrito
      try {
        console.log(`Procesando como código de barras desde búsqueda: ${searchValue}`)
        await handleScannedBarcode(searchValue)
        setProductSearchTerm('')
        setIsProductSearchOpen(false)
      } catch (error) {
        // Si falla como código de barras, intentar búsqueda normal
        console.log(`Falló como código de barras, intentando búsqueda normal: ${searchValue}`)
        performNormalSearch(searchValue)
      }
    } else {
      // Tratar como búsqueda de texto normal
      console.log(`Procesando como búsqueda de texto: ${searchValue}`)
      performNormalSearch(searchValue)
    }
  }

  // Función auxiliar para realizar búsqueda normal y seleccionar primer resultado
  const performNormalSearch = async (searchValue: string) => {
    await searchProducts(searchValue)

    // Si hay resultados, seleccionar automáticamente el primero
    if (productSearchResults.length > 0) {
      const firstResult = productSearchResults[0]
      await addProductFromSearch(firstResult)
    } else {
      toast.info(`No se encontraron productos que coincidan con "${searchValue}"`)
      setProductSearchTerm('')
      setIsProductSearchOpen(false)
      // Mantener el foco en el buscador incluso cuando no hay resultados
      setTimeout(() => {
        if (productSearchInputRef.current) {
          productSearchInputRef.current.focus()
        }
      }, 150)
    }
  }  // Función para imprimir ticket directamente en impresora térmica
  const printTicketDirectly = async (ventaId: number) => {
    try {
      const result = await generateSaleTicket(ventaId)
      setTicketHtml(result.html)
      setIsTicketModalOpen(true)
      // Ya no imprimas directo aquí, deja que el usuario lo haga desde el modal
    } catch (error: any) {
      console.error("Error al generar e imprimir ticket:", error)
      toast.error("Error al generar el ticket para impresión")
    }
  }

  // Función para imprimir pre-cuenta de la mesa actual
  const printPreCuenta = () => {
    if (cart.length === 0) {
      toast.error("No hay productos en la mesa para imprimir")
      return
    }

    // Calcular totales
    const subtotal = cart.reduce((sum, item) => sum + (item.cantidad * parseFloat(item.precio_unitario)), 0)
    const igv = subtotal * 0.18
    const total = subtotal + igv
    const totalWithDiscount = saleDiscount.isDiscount ? total - saleDiscount.amount : total

    // Generar HTML de la pre-cuenta
    const preCuentaHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Pre-Cuenta - Mesa ${selectedShortcutCart || 'Actual'}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 10px;
            background: white;
            color: black;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 14px;
            color: #666;
          }
          .mesa-info {
            background: #f0f0f0;
            padding: 8px;
            margin: 10px 0;
            border-radius: 4px;
            text-align: center;
            font-weight: bold;
          }
          .items {
            margin: 15px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            padding: 3px 0;
            border-bottom: 1px dotted #ccc;
          }
          .item-name {
            flex: 1;
            font-weight: bold;
          }
          .item-qty {
            margin: 0 10px;
            color: #666;
          }
          .item-price {
            font-weight: bold;
            min-width: 60px;
            text-align: right;
          }
          .totals {
            border-top: 2px solid #000;
            margin-top: 15px;
            padding-top: 10px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .total-final {
            font-size: 14px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #666;
          }
          .observaciones {
            margin: 10px 0;
            padding: 8px;
            background: #f9f9f9;
            border-left: 3px solid #007bff;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">PRE-CUENTA</div>
          <div class="subtitle">Restaurante Toro Loco Cayma</div>
        </div>

        <div class="mesa-info">
          🍽️ MESA ${selectedShortcutCart || 'ACTUAL'} - ${new Date().toLocaleString('es-PE', {
            timeZone: 'America/Lima',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        <div class="items">
          ${cart.map(item => `
            <div class="item">
              <div class="item-name">${item.nombre}</div>
              <div class="item-qty">x${item.cantidad}</div>
              <div class="item-price">S/ ${(item.cantidad * parseFloat(item.precio_unitario)).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        ${observaciones ? `
          <div class="observaciones">
            <strong>Observaciones:</strong> ${observaciones}
          </div>
        ` : ''}

        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>S/ ${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-line">
            <span>IGV (18%):</span>
            <span>S/ ${igv.toFixed(2)}</span>
          </div>
          ${saleDiscount.isDiscount ? `
            <div class="total-line" style="color: #dc3545;">
              <span>Descuento:</span>
              <span>-S/ ${saleDiscount.amount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-line total-final">
            <span>TOTAL:</span>
            <span>S/ ${totalWithDiscount.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Gracias por su visita</p>
          <p>Este es un resumen de su pedido</p>
        </div>
      </body>
      </html>
    `

    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(preCuentaHtml)
      printWindow.document.close()
      printWindow.focus()
      
      // Esperar a que se cargue el contenido y luego imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    } else {
      toast.error("No se pudo abrir la ventana de impresión. Verifique que los pop-ups estén habilitados.")
    }
  }


  // Función para imprimir comanda
  const imprimirComanda = () => {
    if (!comandaParaImprimir) {
      toast.error("No hay comanda para imprimir")
      return
    }

    // Generar HTML de la comanda
    const comandaHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comanda - Mesa ${comandaParaImprimir.numero_carrito}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.4;
            margin: 0;
            padding: 15px;
            background: white;
            color: black;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 16px;
            color: #666;
          }
          .mesa-info {
            background: #f0f0f0;
            padding: 10px;
            margin: 15px 0;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
          }
          .items {
            margin: 20px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
          }
          .item-name {
            flex: 1;
            font-weight: bold;
          }
          .item-qty {
            margin: 0 15px;
            color: #666;
            font-weight: bold;
          }
          .item-price {
            font-weight: bold;
            min-width: 80px;
            text-align: right;
          }
          .totals {
            border-top: 2px solid #000;
            margin-top: 20px;
            padding-top: 15px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 16px;
          }
          .total-final {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 15px;
          }
          .footer {
            text-align: center;
            margin-top: 25px;
            font-size: 12px;
            color: #666;
          }
          .observaciones {
            margin: 15px 0;
            padding: 10px;
            background: #f9f9f9;
            border-left: 4px solid #007bff;
            font-style: italic;
          }
          .delivery-badge {
            background: #ff6b35;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">🍽️ COMANDA DE COCINA</div>
          <div class="subtitle">Restaurante Toro Loco Cayma</div>
        </div>

        <div class="mesa-info">
          ${comandaParaImprimir.es_delivery ? 
            '<div class="delivery-badge">🚚 DELIVERY</div>' : 
            `🏠 MESA ${comandaParaImprimir.numero_carrito}`
          }
          <div>${new Date().toLocaleString('es-PE', {
            timeZone: 'America/Lima',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>

        <div class="items">
          <h3 style="margin-bottom: 15px; text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 5px;">📋 PEDIDO</h3>
          ${comandaParaImprimir.productos.map((item: any) => `
            <div class="item">
              <div class="item-name">${item.nombre}</div>
              <div class="item-qty">${item.cantidad}x</div>
              <div class="item-price">S/ ${(item.cantidad * item.precioConIgv).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        ${comandaParaImprimir.observaciones ? `
          <div class="observaciones">
            <strong>📝 Observaciones:</strong> ${comandaParaImprimir.observaciones}
          </div>
        ` : ''}

        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>S/ ${comandaParaImprimir.total.toFixed(2)}</span>
          </div>
          <div class="total-line">
            <span>IGV (18%):</span>
            <span>S/ ${(comandaParaImprimir.total * 0.18).toFixed(2)}</span>
          </div>
          ${saleDiscount.isDiscount ? `
            <div class="total-line" style="color: #dc3545;">
              <span>Descuento:</span>
              <span>-S/ ${saleDiscount.amount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-line total-final">
            <span>TOTAL:</span>
            <span>S/ ${comandaParaImprimir.total_con_igv.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>👨‍🍳 Para la cocina - Toro Loco Cayma</p>
          <p>Comanda generada automáticamente</p>
        </div>
      </body>
      </html>
    `

    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(comandaHtml)
      printWindow.document.close()
      printWindow.focus()
      
      // Esperar a que se cargue el contenido y luego imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    } else {
      toast.error("No se pudo abrir la ventana de impresión. Verifique que los pop-ups estén habilitados.")
    }
  }

  // Función para limpiar todo el estado (como nueva venta pero sin recargar página)
  const clearCurrentCart = () => {
    if (cart.length === 0 && !selectedShortcutCart && observaciones === "" && metodoPago === "efectivo" && !marcarComandaEntregada) {
      toast.info("La aplicación ya está en estado inicial")
      return
    }

    // Mostrar confirmación antes de limpiar
    const confirmClear = window.confirm(
      `¿Está seguro de que desea reiniciar completamente la venta?\n\nSe limpiará:\n• Mesa actual (${cart.length} productos)\n• Mesa seleccionada (${selectedShortcutCart || 'ninguna'})\n• Configuración de venta\n• Observaciones\n\nEsta acción no se puede deshacer.`
    )

    if (confirmClear) {
      // Reset completo del estado principal
      setCart([])
      setSelectedShortcutCart(null)
      setMetodoPago("efectivo")
      setObservaciones("")
      setTipoDocumento("")
      setMontoRecibido("")
      setSaleDiscount({ isDiscount: false, type: "fixed", value: 0, amount: 0 })
      setMarcarComandaEntregada(false)
      setBarcodeSearchResults([])
      setIsClienteDialogOpen(false)
      setIsInvoiceDialogOpen(false)
      
      // Mostrar mensaje de confirmación
      toast.success("Aplicación reiniciada completamente")
      
      // Enfocar el campo de búsqueda para facilitar el siguiente pedido
      setTimeout(() => {
        if (productSearchInputRef?.current) {
          productSearchInputRef.current.focus()
        }
      }, 100)
    }
  }

  // ============================
  // RENDERIZADO PRINCIPAL
  // ============================

  // Switch entre versión móvil/tablet y desktop
  if (isMobileOrTablet) {
    // Crear datos de mesas basadas en carritos del backend (ocupada si tiene productos)
    type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'
    type MobileTable = { id: string; number: string; capacity: number; status: TableStatus }

    const mobileTables: MobileTable[] = Array.from({ length: 15 }, (_, i) => {
      const numero = i + 1
      const backendCart = getBackendCart(numero)
      const hasProducts = (backendCart?.items?.length ?? 0) > 0
      return {
        id: String(numero),
        number: String(numero),
        capacity: 4,
        status: (hasProducts ? 'occupied' : 'available'),
      }
    })

    const selectedTable: MobileTable | undefined = selectedShortcutCart ? {
      id: String(selectedShortcutCart),
      number: String(selectedShortcutCart),
      capacity: 4,
      status: ((getBackendCart(selectedShortcutCart)?.items?.length ?? 0) > 0 ? 'occupied' : 'available'),
    } : undefined

    return (
      <>
        <ImprovedMobileSalesLayout
          products={products || []}
          isLoadingProducts={isLoadingProducts}
          productSearchTerm={productSearchTerm}
          setProductSearchTerm={setProductSearchTerm}
          onAddToCart={handleMobileAddToCart}
          cart={cart}
          onUpdateQuantity={handleMobileUpdateQuantity}
          onRemoveFromCart={handleMobileRemoveFromCart}
          tables={mobileTables}
          selectedTable={selectedTable}
          onSelectTable={handleMobileSelectTable}
          onSaveTable={saveToSelectedShortcut}
          onCancelTableSelection={() => setSelectedShortcutCart(null)}
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
          observaciones={observaciones}
          setObservaciones={setObservaciones}
          autoPrintComanda={generarComandaEImprimir}
          setAutoPrintComanda={setGenerarComandaEImprimir}
          onOpenBarcodeScanner={handleMobileOpenBarcodeScanner}
          onBack={() => window.history.back()}
          total={total}
          totalItems={totalItems}
          isProcessingSale={createSaleMutation.isPending}
          tipoDocumento={tipoDocumento}
          setTipoDocumento={setTipoDocumento}
          montoRecibido={montoRecibido}
          setMontoRecibido={setMontoRecibido}
          userName={user?.name ?? null}
          clienteData={clienteData}
          onOpenClienteDialog={() => setIsClienteDialogOpen(true)}
        />

        {/* Modales para versión móvil */}
        {showSaleSuccessDialog && (
          <MobileSaleSuccessModal
            isOpen={showSaleSuccessDialog}
            onClose={handleCloseSaleSuccessDialog}
            onNewSale={handleNewSaleFromSuccess}
            saleId={currentSale?.venta_id || ""}
            total={total}
          />
        )}

        {/* Mantener los diálogos existentes que son comunes */}
        <BarcodeScannerDialog
          isOpen={isBarcodeDialogOpen}
          onClose={() => setIsBarcodeDialogOpen(false)}
          barcodeInput={barcodeInput}
          setBarcodeInput={setBarcodeInput}
          isBarcodeSearching={isBarcodeSearching}
          barcodeSearchResult={barcodeSearchResult}
          onSearch={handleBarcodeSearch}
          onAddToCart={(product, barcodeData) => {
            const productToAdd = products?.find((p) => p.id_producto === product.id_producto)
            if (productToAdd) {
              addToCart(productToAdd, barcodeData, precioMayoristaMode)
            }
          }}
          isProcessingBarcode={isProcessingBarcode}
        />

        <ClienteDialog
          isOpen={isClienteDialogOpen}
          onClose={() => setIsClienteDialogOpen(false)}
          tipoDocumento={tipoDocumento}
          documentoCliente={documentoCliente}
          setDocumentoCliente={setDocumentoCliente}
          isConsultandoCliente={isConsultandoCliente}
          setIsConsultandoCliente={setIsConsultandoCliente}
          clienteData={clienteData}
          setClienteData={setClienteData}
          onConsultar={consultarCliente}
          onLimpiar={limpiarDatosCliente}
        />

        <InvoiceDialog
          isOpen={isInvoiceDialogOpen}
          onClose={handleCloseInvoiceDialogSafe}
          tipoDocumento={tipoDocumento}
          isInvoiceSending={isInvoiceSending}
          invoiceResult={invoiceResult}
          onNewSale={handleStartNewSale}
          onViewDetails={handleViewSaleDetails}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden toro-theme ruby-neon-bg-subtle">
      {/* Header compacto con gradiente corporativo - Rediseñado para mejor contraste */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-toro-red to-red-600 dark:from-[#1a1310] dark:to-[#1f1613] shadow-lg border-b border-slate-300/30 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Sección izquierda */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/sales")}
                className="text-white hover:bg-white/10 h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="bg-white/10 rounded-lg p-1.5 sm:p-2">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 ruby-neon-icon" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold text-white dark:text-white">Nueva Venta</h1>
                  <p className="text-white/90 dark:text-white/70 text-xs sm:text-sm font-medium">Sistema Toro Loco Cayma POS</p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-base font-bold text-white dark:text-white">Nueva Venta</h1>
                </div>
              </div>

              {/* Indicador de escáner activo */}
              {isBarcodeScannerActive && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`flex items-center px-3 py-1.5 rounded-lg ${isScanning
                    ? "bg-emerald-500/20 dark:bg-emerald-500/20 border border-emerald-400/30 dark:border-emerald-400/30"
                    : "bg-blue-500/20 dark:bg-blue-500/20 border border-blue-400/30 dark:border-blue-400/30"
                    }`}
                >
                  <Barcode className={`h-4 w-4 mr-2 ${isScanning ? "text-emerald-900 dark:text-emerald-300" : "text-blue-900 dark:text-blue-300"}`} />
                  <div>
                    <p className={`text-sm font-medium ${isScanning ? "text-emerald-900 dark:text-emerald-200" : "text-blue-900 dark:text-blue-200"}`}>
                      {isScanning ? "¡Código escaneado!" : "Escáner activo"}
                    </p>
                    {isScanning && (
                      <p className="text-xs text-gray-800 dark:text-white/60 font-mono">
                        {scannedBarcode}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sección derecha */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Badge variant="secondary" className="bg-white/10 dark:bg-white/10 text-white dark:text-white border-white/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 text-xs hidden sm:flex">
                <Clock className="h-3 w-3 mr-1" />
                {new Date().toLocaleDateString()}
              </Badge>
              <Badge variant="secondary" className="bg-white/10 dark:bg-white/10 text-white dark:text-white border-white/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 text-xs">
                <Package className="h-3 w-3 mr-1" />
                {totalItems}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsShortcutsDialogOpen(true)}
                className="text-white dark:text-white/80 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 h-8 hidden sm:flex"
              >
                <Keyboard className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden md:inline">Atajos</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsBarcodeScannerActive(!isBarcodeScannerActive)}
                className={`text-white dark:text-white/80 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 h-8 ${isBarcodeScannerActive ? 'bg-white/10' : ''}`}
              >
                <Barcode className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline font-medium">{isBarcodeScannerActive ? 'ON' : 'OFF'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de acciones rápidas - Rediseñada */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
          <div className="space-y-4">
            {/* Mesa seleccionada - Diseño mejorado */}
            {selectedShortcutCart && (
              <div className="bg-gradient-to-r from-toro-red/10 via-red-500/5 to-red-600/10 dark:from-toro-red/10 dark:via-red-500/5 dark:to-red-600/10 border border-red-200/50 dark:border-red-700/50 rounded-xl p-3 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {/* Información de la mesa */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-toro-red to-red-600 rounded-lg shadow-sm">
                      <span className="text-white font-bold text-lg">{selectedShortcutCart}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        Mesa {selectedShortcutCart} Seleccionada
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {cart.length > 0 ? `${cart.length} productos en el carrito` : 'Carrito vacío'}
                      </p>
                    </div>
                  </div>

                  {/* Acciones de la mesa */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={saveToSelectedShortcut}
                      disabled={cart.length === 0}
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 h-10 px-6"
                    >
                      <PauseCircle className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Guardar en Mesa {selectedShortcutCart}</span>
                      <span className="sm:hidden">Guardar Mesa {selectedShortcutCart}</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCartNumber(selectedShortcutCart)
                        setIsCartDeleteDialogOpen(true)
                      }}
                      className="border-red-300 hover:border-red-400 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 h-10 px-4"
                      title="Eliminar mesa guardada"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Eliminar Mesa</span>
                      <span className="sm:hidden">Eliminar</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setSelectedShortcutCart(null)}
                      className="border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-800 h-10 px-4"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>

                {/* Checkbox para imprimir comanda */}
                <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-blue-700/50">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={generarComandaEImprimir}
                      onChange={(e) => setGenerarComandaEImprimir(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 bg-white border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                      Imprimir comanda automáticamente
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Botones de acción - Organizados en grupos */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Grupo 1: Gestión de carritos */}
              <div className="flex flex-wrap items-center gap-2">
                {!selectedShortcutCart && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveCurrentCart}
                    disabled={cart.length === 0}
                    className="bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 hover:text-emerald-800 h-9 px-4 shadow-sm"
                  >
                    <PauseCircle className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Guardar Carrito</span>
                    <span className="sm:hidden">Guardar</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSavedCartsDialogOpen(true)}
                  disabled={savedCarts.length === 0}
                  className="bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-800 h-9 px-4 shadow-sm"
                >
                  <ListOrdered className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Mesas Guardadas</span>
                  <span className="sm:hidden">Mesas</span>
                  {savedCarts.length > 0 && (
                    <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {savedCarts.length}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    startNewCart();
                    setTimeout(() => {
                      if (productSearchInputRef?.current) {
                        productSearchInputRef.current.focus();
                      }
                    }, 100);
                  }}
                  className="bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-800 h-9 px-4 shadow-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nueva Venta</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>

                {/* Botón de precio mayorista/unitario - SIEMPRE VISIBLE */}
                <Button
                  variant={precioMayoristaMode ? "default" : "outline"}
                  size="sm"
                  onClick={togglePrecioMayoristaGlobal}
                  className={precioMayoristaMode
                    ? "bg-amber-600 hover:bg-amber-700 text-white h-9 px-4 shadow-sm"
                    : "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 hover:text-amber-800 h-9 px-4 shadow-sm"}
                  title="Cambiar entre precio unitario y mayorista (afecta productos nuevos y existentes)"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">{precioMayoristaMode ? "Mayorista ✓" : "Unitario"}</span>
                  <span className="md:hidden">{precioMayoristaMode ? "May ✓" : "Unit"}</span>
                </Button>

                {/* Botón de configuración de impresoras - SIEMPRE VISIBLE */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPrinterConfigOpen(true)}
                  className="bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-800 h-9 px-4 shadow-sm"
                  title="Configurar impresoras de cocina y recepción"
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Impresoras</span>
                  <span className="md:hidden">Config</span>
                </Button>
              </div>

              {/* Grupo 2: Acciones del carrito (solo si hay productos) */}
              {cart.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshAllCartItemsStock}
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800 h-9 px-4 shadow-sm"
                    title="Actualizar disponibilidad de productos en el carrito"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Actualizar Stock</span>
                    <span className="sm:hidden">Stock</span>
                  </Button>

                  {/* Botón de dividir mesa - Solo visible cuando hay mesa seleccionada con 2+ productos */}
                  {selectedShortcutCart && cart.length >= 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={abrirDialogoDividirMesa}
                      className="bg-fire-50 hover:bg-fire-100 border-fire-200 text-fire-700 hover:text-fire-800 h-9 px-4 shadow-sm"
                      title="Dividir mesa en múltiples pagos"
                    >
                      <Scissors className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Dividir Mesa</span>
                      <span className="sm:hidden">Dividir</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCurrentCart}
                    className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800 h-9 px-4 shadow-sm"
                    title="Reiniciar completamente la aplicación"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Reset Completo</span>
                    <span className="sm:hidden">Reset</span>
                  </Button>
                </div>
              )}

              {/* Grupo 3: Descuentos rápidos (solo si hay productos) */}
              {canApplyDiscount() && cart.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyQuickDiscount1Sol}
                    className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700 hover:text-yellow-800 h-9 px-4 shadow-sm"
                  >
                    <span className="font-bold mr-1">S/</span> -1
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyQuickDiscount2Soles}
                    className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 hover:text-orange-800 h-9 px-4 shadow-sm"
                  >
                    <span className="font-bold mr-1">S/</span> -2
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de iconos de carritos rápidos */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-medium text-foreground">
              Mesas Rápidas (1-15)
            </h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-start tablet-mesas-grid">
              {isLoadingCarts ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-toro-red"></div>
                  <span className="text-xs text-muted-foreground">Cargando carritos...</span>
                </div>
              ) : (
                Array.from({ length: 15 }, (_, i) => i + 1).map((cartNumber) => {
                  const backendCart = getBackendCart(cartNumber)
                  const hasProducts = (backendCart?.items?.length ?? 0) > 0
                  const isActive = cart.length > 0
                  
                  return (
                    <Button
                      key={cartNumber}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSpecificCartClick(cartNumber)}
                      onContextMenu={(e) => handleSpecificCartRightClick(e, cartNumber)}
                      className={`h-8 w-8 sm:h-10 sm:w-10 p-0 transition-all duration-200 hover:scale-105 ${
                        selectedShortcutCart === cartNumber
                          ? 'ruby-neon-border'
                          : hasProducts
                          ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300'
                          : 'bg-muted hover:bg-muted/80 border-border hover:border-border/80'
                      } ${!isActive && !hasProducts && selectedShortcutCart !== cartNumber ? 'opacity-50' : ''}`}
                      title={
                        hasProducts
                          ? `Cargar Mesa ${cartNumber} (${backendCart?.items?.length ?? 0} productos)\nClic derecho para eliminar`
                          : cart.length > 0
                          ? `Seleccionar Mesa ${cartNumber}`
                          : `Seleccionar Mesa ${cartNumber}`
                      }
                    >
                      <span className={`text-xs sm:text-sm font-bold ${
                        selectedShortcutCart === cartNumber
                          ? 'ruby-neon-glow'
                          : hasProducts 
                          ? 'text-emerald-600' 
                          : 'text-muted-foreground'
                      }`}>
                        {cartNumber}
                      </span>
                    </Button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal optimizado para móvil */}
      <div className="sales-layout-mobile lg:max-w-7xl lg:mx-auto lg:px-4 xl:px-6 lg:py-4 xl:py-6">
        <div className="sales-content-mobile lg:grid lg:grid-cols-3 lg:gap-4 xl:gap-6 lg:h-full">

          {/* Panel principal: Productos y carrito */}
          <div className="sales-products-panel lg:col-span-2 lg:order-1">
              <Card className="sales-card-mobile h-full ruby-neon-card backdrop-blur-sm shadow-xl border border-white/10 dark:border-black/10 rounded-xl">
              <CardHeader className="pb-3 sm:pb-4 border-b border-border/60 shadow-sm">
                <div className="sales-cart-header-container">
                  <div className="sales-cart-header-title">
                    <div className="ruby-neon-bg rounded-xl p-2 sm:p-2.5 shadow-md border border-white/10 dark:border-black/10">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-black dark:text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg ruby-neon-text font-semibold">Mesa de Compras</CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-0.5">
                        {totalItems === 0
                          ? "No hay productos en la mesa"
                          : `${totalItems} producto${totalItems !== 1 ? "s" : ""} agregado${totalItems !== 1 ? "s" : ""}`}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Controles de acción en el header */}
                  <div className="sales-cart-actions">
                    <Button
                      variant={precioMayoristaMode ? "success" : "outline"}
                      onClick={() => setPrecioMayoristaMode(!precioMayoristaMode)}
                      size="sm"
                    >
                      <SolPeruano className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">{precioMayoristaMode ? "Mayorista" : "Unitario"}</span>
                      <span className="sm:hidden">{precioMayoristaMode ? "May" : "Uni"}</span>
                    </Button>

                    <Button
                      variant={isDigitalMenuMode ? "default" : "outline"}
                      onClick={() => setIsDigitalMenuMode(!isDigitalMenuMode)}
                      size="sm"
                      className={isDigitalMenuMode ? "bg-primary text-primary-foreground" : ""}
                    >
                      <BookOpen className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Carta Digital</span>
                      <span className="sm:hidden">Carta</span>
                    </Button>

                    <Button
                      variant="fire"
                      onClick={openBarcodeScanner}
                      size="sm"
                    >
                      <Barcode className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Escanear</span>
                    </Button>

                    <Button
                      variant="ember"
                      onClick={printPreCuenta}
                      disabled={cart.length === 0}
                      size="sm"
                      title="Imprimir pre-cuenta de la mesa actual"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Pre-Cuenta</span>
                      <span className="sm:hidden">Pre</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className={`p-0 lg:p-0 h-[calc(100vh-280px)] lg:h-[calc(100vh-240px)] overflow-hidden ${isDigitalMenuMode ? '' : 'p-3 sm:p-4 lg:p-4'}`}>
                {isDigitalMenuMode ? (
                  <DigitalMenu 
                    products={products || []}
                    categories={categories || []}
                    onAddToCart={(p) => {
                      addToCart(p, { codigo: p.sku || 'SIN_CODIGO', cantidad: 1 }, precioMayoristaMode)
                      toast.success(`${p.nombre} agregado`, { duration: 1500 })
                    }} 
                    className="h-full border-0 rounded-none bg-transparent shadow-none"
                  />
                ) : (
                  <div className="p-3 sm:p-4 lg:p-4 h-full overflow-y-auto">
                    {/* Buscador de productos */}
                    <div className="mb-3 sm:mb-4">
                      <div className="relative" ref={productSearchRef}>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <Input
                            ref={productSearchInputRef}
                            type="text"
                            placeholder="Buscar productos..."
                            value={productSearchTerm}
                            onChange={(e) => {
                              setProductSearchTerm(e.target.value)
                              searchProducts(e.target.value)
                            }}
                            onFocus={() => {
                              if (productSearchTerm.trim()) {
                                setIsProductSearchOpen(true)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && productSearchTerm.trim()) {
                                e.preventDefault()
                                // Si hay resultados, agregar el primero
                                if (productSearchResults.length > 0) {
                                  addProductFromSearch(productSearchResults[0])
                                } else {
                                  handleSearchOrBarcode(productSearchTerm.trim())
                                }
                              } else if (e.key === 'ArrowDown' && productSearchResults.length > 0) {
                                e.preventDefault()
                                // Enfocar el primer resultado
                                const firstResult = document.querySelector('[data-product-result="0"]') as HTMLElement
                                if (firstResult) {
                                  firstResult.focus()
                                }
                              } else if (e.key === 'Tab' && productSearchResults.length > 0) {
                                e.preventDefault()
                                // Tab también va al primer resultado
                                const firstResult = document.querySelector('[data-product-result="0"]') as HTMLElement
                                if (firstResult) {
                                  firstResult.focus()
                                }
                              }
                            }}
                            className="pl-10 bg-white/90 dark:bg-neutral-800/90"
                            inputSize="md"
                          />
                          {isLoadingProductSearch && (
                            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                              <Loader2 className="h-4 w-4 text-fire-500 animate-spin" />
                            </div>
                          )}
                        </div>
                        {/* Dropdown de resultados modernizado y compacto */}
                        <AnimatePresence>
                          {isProductSearchOpen && productSearchResults.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="dropdown-results"
                            >
                              <div className="dropdown-results-wrapper">
                                <div className="dropdown-results-list">
                                  {productSearchResults.map((product, index) => (
                                    <motion.div
                                      key={product.id_producto}
                                      whileHover={{ scale: 1.01, x: 2 }}
                                      whileTap={{ scale: 0.99 }}
                                      className="dropdown-item hover:bg-gradient-to-r hover:from-ember-50 hover:to-fire-50 dark:hover:from-slate-700 dark:hover:to-slate-600 group"
                                      tabIndex={0}
                                      data-product-result={index}
                                      onClick={() => addProductFromSearch(product)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault()
                                          addProductFromSearch(product)
                                        } else if (e.key === 'ArrowDown') {
                                          e.preventDefault()
                                          const nextResult = document.querySelector(`[data-product-result="${index + 1}"]`) as HTMLElement
                                          if (nextResult) {
                                            nextResult.focus()
                                          }
                                        } else if (e.key === 'ArrowUp') {
                                          e.preventDefault()
                                          if (index === 0) {
                                            // Volver al input de búsqueda
                                            productSearchInputRef.current?.focus()
                                          } else {
                                            const prevResult = document.querySelector(`[data-product-result="${index - 1}"]`) as HTMLElement
                                            if (prevResult) {
                                              prevResult.focus()
                                            }
                                          }
                                        } else if (e.key === 'Tab') {
                                          e.preventDefault()
                                          const nextResult = document.querySelector(`[data-product-result="${index + 1}"]`) as HTMLElement
                                          if (nextResult) {
                                            nextResult.focus()
                                          } else {
                                            // Si es el último resultado, volver al input de búsqueda
                                            productSearchInputRef.current?.focus()
                                          }
                                        }
                                      }}
                                    >
                                      {/* Imagen del producto */}
                                      <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shadow-md border border-ember-200/50 dark:border-ember-700/30 bg-gradient-to-br from-ember-100 to-fire-100 dark:from-ember-900/30 dark:to-fire-900/30">
                                        {getProductImageUrl(product) ? (
                                          <img
                                            src={getProductImageUrl(product)! || "/placeholder.svg"}
                                            alt={product.nombre}
                                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                            loading="lazy"
                                            onError={(e) => {
                                              // Si la imagen falla al cargar, mostrar el ícono por defecto
                                              const target = e.target as HTMLImageElement
                                              target.style.display = 'none'
                                              const parent = target.parentElement
                                              if (parent && !parent.querySelector('.fallback-icon')) {
                                                const fallbackDiv = document.createElement('div')
                                                fallbackDiv.className = 'fallback-icon w-full h-full flex items-center justify-center'
                                                fallbackDiv.innerHTML = '<svg class="h-6 w-6 text-fire-600 dark:text-fire-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>'
                                                parent.appendChild(fallbackDiv)
                                              }
                                            }}
                                            onLoad={(e) => {
                                              // Asegurar que la imagen se muestre correctamente cuando carga
                                              const target = e.target as HTMLImageElement
                                              target.style.display = 'block'
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Package className="h-6 w-6 text-fire-600 dark:text-fire-400" />
                                          </div>
                                        )}
                                      </div>

                                      {/* Información principal del producto */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-tight truncate">
                                              {product.nombre}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                {product.sku || 'Sin código'}
                                              </span>
                                              <Badge
                                                variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                                                className="text-[10px] px-1.5 py-0.5 h-auto"
                                              >
                                                {product.stock} stock
                                              </Badge>
                                            </div>
                                          </div>

                                          {/* Solo precio, sin botón */}
                                          <div className="flex flex-col items-end gap-1 ml-2">
                                            <div className="text-sm font-bold text-fire-600 dark:text-fire-400">
                                              {getDisplayPrice(product)}
                                            </div>
                                            <div className="flex gap-1">
                                              {precioMayoristaMode && product.precio_mayoritario && product.precio_mayoritario !== "0.00" && (
                                                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/50">
                                                  Mayorista
                                                </Badge>
                                              )}
                                              {product.es_oferta && (
                                                <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700/50">
                                                  Oferta
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>

                                {/* Footer del dropdown */}
                                <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    {productSearchResults.length} producto{productSearchResults.length !== 1 ? 's' : ''} encontrado{productSearchResults.length !== 1 ? 's' : ''} • Presiona Enter para agregar
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                  </div>
                </div>                {/* Contenido del carrito - Diseño compacto de una fila por producto */}
                <div className="space-y-4">
                  <AnimatePresence>
                    {cart.length > 0 ? (
                      <div className="space-y-3">                        {/* Header de la tabla más sutil - Solo visible en desktop */}
                        <div className="hidden md:block bg-gradient-to-r from-slate-50/80 via-blue-50/30 to-ember-50/20 dark:from-slate-800/30 dark:via-blue-900/15 dark:to-ember-900/10 border border-slate-200/40 dark:border-slate-700/40 rounded-xl px-4 py-2.5 shadow-sm">
                          <div className="grid grid-cols-12 gap-3 items-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                            <div className="col-span-4">Producto</div>
                            <div className="col-span-2 text-center">Cantidad</div>
                            <div className="col-span-2 text-right">Precio Unit.</div>
                            <div className="col-span-2 text-right">Subtotal</div>
                            <div className="col-span-2 text-center">Acciones</div>
                          </div>
                        </div>

                        {/* Lista de productos en el carrito */}
                        <div className="space-y-2">
                          {cart.map((item, index) => (
                            <motion.div
                              key={`${item.producto_id}-${index}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                              transition={{ duration: 0.2 }}
                              className="group bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-ember-200 dark:hover:border-ember-600/50 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200 mobile-product-card"
                            >
                              {/* Vista Desktop - Tabla tradicional */}
                              <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                                {/* Columna 1: Información del producto (4 columnas) */}
                                <div className="col-span-4">
                                  <div className="flex items-start space-x-2">
                                    {/* Imagen del producto con vista previa */}
                                    <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center relative group">
                                      {item.imagen_url ? (
                                        <>
                                          <img
                                            src={getProductImageUrl(item) || "/placeholder.svg"}
                                            alt={item.nombre}
                                            className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-110"
                                            loading="lazy"
                                          />
                                          <div
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                                            onClick={() => openCartImageView(getProductImageUrl(item) || "/placeholder.svg")}
                                            title="Ver imagen completa"
                                          >
                                            <Eye
                                              className="cursor-pointer text-blue-500 hover:text-blue-700"
                                              onClick={() => {
                                                setSelectedCartImageUrl(item.imagen_url ?? "")
                                                setIsCartImageViewOpen(true)
                                              }}
                                            />
                                          </div>
                                        </>
                                      ) : (
                                        <Package className="h-6 w-6 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate">
                                          {item.nombreEditado || item.nombre}
                                        </h4>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => abrirDialogoEditarNombre(index)}
                                          className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                          title="Editar nombre para factura"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      {item.nombreEditado && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400 italic truncate">
                                          Original: {item.nombre}
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-1 mt-1">
                                        {item.esPrecioMayorista && (
                                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/50">
                                            Mayorista
                                          </Badge>
                                        )}
                                        {item.es_oferta && (
                                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700/50">
                                            Oferta
                                          </Badge>
                                        )}
                                      </div>
                                      {/* Información de disponibilidad */}
                                      {(() => {
                                        const availabilityInfo = getCartItemAvailabilityInfo(item)
                                        return (
                                          <div className="mt-1.5 space-y-1">
                                            {availabilityInfo.barcodeInfo.length > 1 ? (
                                              <div className="text-xs">
                                                <div className="flex items-center space-x-1">
                                                  <Package className="h-3 w-3 text-blue-500" />
                                                  <span className="text-slate-600 dark:text-slate-400">
                                                    Disponible: {availabilityInfo.totalAvailable} unidades
                                                  </span>
                                                  {availabilityInfo.totalReservedInOtherCarts > 0 && (
                                                    <span className="text-amber-600 dark:text-amber-400">
                                                      ({availabilityInfo.totalReservedInOtherCarts} reservadas)
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 ml-4">
                                                  {availabilityInfo.barcodeInfo.map((info) => (
                                                    <div key={info.codigo} className="truncate">
                                                      {info.codigo}: {info.availableForThisItem} disponibles
                                                      {info.reservedInOtherCarts > 0 && ` (${info.reservedInOtherCarts} reservadas)`}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex items-center space-x-1 text-xs">
                                                <Package className="h-3 w-3 text-blue-500" />
                                                <span className="text-slate-600 dark:text-slate-400">
                                                  Disponible: {availabilityInfo.totalAvailable}
                                                </span>
                                                {availabilityInfo.totalReservedInOtherCarts > 0 && (
                                                  <span className="text-amber-600 dark:text-amber-400">
                                                    ({availabilityInfo.totalReservedInOtherCarts} reservadas)
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })()}
                                    </div>
                                  </div>
                                </div>                                {/* Columna 2: Cantidad (2 columnas) */}
                                <div className="col-span-2 flex justify-center">
                                  {(() => {
                                    const availabilityInfo = getCartItemAvailabilityInfo(item)
                                    return (
                                      <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50 p-0.5">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => updateCartItemQuantity(index, Math.max(1, item.cantidad - 1))}
                                          className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-400"
                                          disabled={item.cantidad <= 1}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>                        <Input
                                          type="number"
                                          min="1"
                                          max={availabilityInfo.totalAvailable}
                                          value={item.cantidad}
                                          onChange={(e) => {
                                            const newQuantity = Math.max(1, Number.parseInt(e.target.value) || 1)
                                            updateCartItemQuantity(index, newQuantity)
                                          }}
                                          className="w-16 h-6 text-center text-sm font-bold border-0 bg-transparent focus:ring-0 focus:outline-none text-slate-900 dark:text-slate-100"
                                          title={`Máximo disponible: ${availabilityInfo.totalAvailable}`}
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => updateCartItemQuantity(index, item.cantidad + 1)}
                                          className={`h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-400 ${!availabilityInfo.canIncrease ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                          disabled={!availabilityInfo.canIncrease}
                                          title={
                                            availabilityInfo.canIncrease
                                              ? 'Aumentar cantidad'
                                              : `Límite alcanzado (${availabilityInfo.totalAvailable} disponibles)`
                                          }
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )
                                  })()}
                                </div>                                {/* Columna 3: Precio unitario (2 columnas) */}
                                <div className="col-span-2 text-right">
                                  <div className="flex flex-col items-end">
                                    {item.esPrecioVariable ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          min="0.50"
                                          step="0.50"
                                          value={item.precio_unitario_con_igv}
                                          onChange={e => {
                                            const value = e.target.value
                                            // Validar y actualizar el precio personalizado
                                            const updatedCart = [...cart]
                                            const itemToUpdate = updatedCart[index]
                                            // Solo permitir números positivos
                                            if (/^\d*(\.\d{0,2})?$/.test(value) && Number(value) > 0) {
                                              itemToUpdate.precio_unitario_con_igv = value
                                              // Calcular precio sin IGV
                                              itemToUpdate.precio_unitario = (Number(value) / 1.18).toFixed(2)
                                              itemToUpdate.precioVariableConIgv = value
                                              itemToUpdate.precioVariable = (Number(value) / 1.18).toFixed(2)
                                              // Recalcular subtotal
                                              itemToUpdate.subtotal = Number(value) * itemToUpdate.cantidad
                                              setCart(updatedCart)
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            // Solo controlar las teclas de flecha si el input está enfocado
                                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              const currentValue = Number.parseFloat(item.precio_unitario_con_igv) || 0
                                              
                                              // Redondear al múltiplo de 0.50 más cercano antes de aplicar incremento
                                              const roundedCurrent = Math.round(currentValue / 0.50) * 0.50
                                              const increment = e.key === 'ArrowUp' ? 0.50 : -0.50
                                              const newValue = Math.max(0.50, roundedCurrent + increment) // Mínimo 0.50 para mantener múltiplos
                                              const formattedValue = newValue.toFixed(2)
                                              
                                              // Actualizar el carrito con el nuevo valor
                                              const updatedCart = [...cart]
                                              const itemToUpdate = updatedCart[index]
                                              itemToUpdate.precio_unitario_con_igv = formattedValue
                                              itemToUpdate.precio_unitario = (newValue / 1.18).toFixed(2)
                                              itemToUpdate.precioVariableConIgv = formattedValue
                                              itemToUpdate.precioVariable = (newValue / 1.18).toFixed(2)
                                              itemToUpdate.subtotal = newValue * itemToUpdate.cantidad
                                              setCart(updatedCart)
                                            }
                                          }}
                                          onWheel={(e) => {
                                            // Siempre prevenir el scroll cuando el input esté enfocado
                                            if (document.activeElement === e.currentTarget) {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              
                                              // Controlar el scroll del mouse para incrementos de 0.50
                                              const currentValue = Number.parseFloat(item.precio_unitario_con_igv) || 0
                                              
                                              // Redondear al múltiplo de 0.50 más cercano antes de aplicar incremento
                                              const roundedCurrent = Math.round(currentValue / 0.50) * 0.50
                                              const increment = e.deltaY < 0 ? 0.50 : -0.50 // Scroll arriba aumenta, scroll abajo disminuye
                                              const newValue = Math.max(0.50, roundedCurrent + increment) // Mínimo 0.50 para mantener múltiplos
                                              const formattedValue = newValue.toFixed(2)
                                              
                                              // Actualizar el carrito con el nuevo valor
                                              const updatedCart = [...cart]
                                              const itemToUpdate = updatedCart[index]
                                              itemToUpdate.precio_unitario_con_igv = formattedValue
                                              itemToUpdate.precio_unitario = (newValue / 1.18).toFixed(2)
                                              itemToUpdate.precioVariableConIgv = formattedValue
                                              itemToUpdate.precioVariable = (newValue / 1.18).toFixed(2)
                                              itemToUpdate.subtotal = newValue * itemToUpdate.cantidad
                                              setCart(updatedCart)
                                            }
                                          }}
                                          onBlur={() => {
                                            // Enfocar el buscador principal cuando se termine de editar el precio
                                            if (productSearchInputRef.current) {
                                              productSearchInputRef.current.focus()
                                            }
                                          }}
                                          className="w-20 h-7 text-right text-sm font-bold border-orange-300 focus:border-orange-500 focus:ring-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-200 dark:focus:border-orange-400 dark:focus:ring-orange-400 px-2"
                                          style={{ minWidth: 0 }}
                                        />
                                      </div>
                                    ) : (
                                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {formatCurrency(Number.parseFloat(item.precio_unitario_con_igv))}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Columna 4: Subtotal (2 columns) */}
                                <div className="col-span-2 text-right">
                                  <span className="text-sm font-bold text-fire-600 dark:text-fire-400">
                                    {formatCurrency(item.subtotal)}
                                  </span>
                                </div>

                                {/* Columna 5: Acciones (2 columns) */}
                                <div className="col-span-2 flex justify-center items-center space-x-1">
                                  {/* Switch para precio variable */}
                                  {canModifyPrice() && (
                                    <div className="flex items-center">
                                      <Switch
                                        checked={item.esPrecioVariable}
                                        onCheckedChange={() => toggleItemVariablePrice(index)}
                                        className={
                                          item.esPrecioVariable
                                            ? "border-orange-300 data-[state=checked]:from-orange-400 data-[state=checked]:to-orange-600"
                                            : "border-slate-300"
                                        }
                                        title={item.esPrecioVariable ? "Desactivar precio personalizado" : "Activar precio personalizado"}
                                      />
                                    </div>
                                  )}

                                  {/* Botón para cambiar entre precio unitario y mayorista */}
                                  {item.precio_mayoritario && item.precio_mayoritario !== "0.00" && !item.esPrecioVariable && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => toggleItemPriceType(index)} className={`h-7 w-7 p-0 transition-all duration-200 ${item.esPrecioMayorista
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600/50 dark:hover:bg-emerald-900/50 dark:hover:border-emerald-600/70"
                                        : "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 dark:hover:border-emerald-600"
                                        }`}
                                      title={`Cambiar a precio ${item.esPrecioMayorista ? "unitario" : "mayorista"}`}
                                    >
                                      <SolPeruano className="h-3 w-3" />
                                    </Button>
                                  )}

                                  {/* Botón eliminar */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFromCart(index)}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-70 group-hover:opacity-100 transition-all duration-200"
                                    title="Eliminar producto"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              {/* Vista Móvil/Tablet - Tarjetas táctiles */}
                              <div className="md:hidden">
                                {/* Header del producto */}
                                <div className="flex items-start space-x-3 mb-3">
                                  {/* Imagen del producto */}
                                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center relative group">
                                    {item.imagen_url ? (
                                      <>
                                        <img
                                          src={getProductImageUrl(item) || "/placeholder.svg"}
                                          alt={item.nombre}
                                          className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-110"
                                          loading="lazy"
                                        />
                                        <div
                                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                                          onClick={() => openCartImageView(getProductImageUrl(item) || "/placeholder.svg")}
                                          title="Ver imagen completa"
                                        >
                                          <Eye className="h-4 w-4 text-white" />
                                        </div>
                                      </>
                                    ) : (
                                      <Package className="h-8 w-8 text-slate-400" />
                                    )}
                                  </div>
                                  
                                  {/* Información del producto */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate">
                                        {item.nombreEditado || item.nombre}
                                      </h4>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => abrirDialogoEditarNombre(index)}
                                        className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex-shrink-0"
                                        title="Editar nombre para factura"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                    {item.nombreEditado && (
                                      <div className="text-xs text-slate-500 dark:text-slate-400 italic truncate mb-1">
                                        Original: {item.nombre}
                                      </div>
                                    )}

                                    {/* Badges */}
                                    <div className="flex items-center space-x-2 mb-2">
                                      {item.esPrecioMayorista && (
                                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/50">
                                          Mayorista
                                        </Badge>
                                      )}
                                      {item.es_oferta && (
                                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700/50">
                                          Oferta
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Precio y subtotal */}
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex flex-col">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                          Precio: {item.esPrecioVariable ? (
                                            <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                              {formatCurrency(Number.parseFloat(item.precio_unitario_con_igv))}
                                            </span>
                                          ) : (
                                            <span className="font-semibold">
                                              {formatCurrency(Number.parseFloat(item.precio_unitario_con_igv))}
                                            </span>
                                          )}
                                        </span>
                                        <span className="text-lg font-bold text-fire-600 dark:text-fire-400">
                                          Subtotal: {formatCurrency(item.subtotal)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Controles táctiles */}
                                <div className="space-y-3">
                                  {/* Control de cantidad */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cantidad:</span>
                                    <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50 p-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => updateCartItemQuantity(index, Math.max(1, item.cantidad - 1))}
                                        className="mobile-touch-button hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-400"
                                        disabled={item.cantidad <= 1}
                                      >
                                        <Minus className="h-5 w-5" />
                                      </Button>
                                      <Input
                                        type="number"
                                        min="1"
                                        max={getCartItemAvailabilityInfo(item).totalAvailable}
                                        value={item.cantidad}
                                        onChange={(e) => {
                                          const newQuantity = Math.max(1, Number.parseInt(e.target.value) || 1)
                                          updateCartItemQuantity(index, newQuantity)
                                        }}
                                        className="mobile-touch-input w-20 text-center text-base font-bold border-0 bg-transparent focus:ring-0 focus:outline-none text-slate-900 dark:text-slate-100"
                                        title={`Máximo disponible: ${getCartItemAvailabilityInfo(item).totalAvailable}`}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => updateCartItemQuantity(index, item.cantidad + 1)}
                                        className={`mobile-touch-button hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-400 ${!getCartItemAvailabilityInfo(item).canIncrease ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={!getCartItemAvailabilityInfo(item).canIncrease}
                                        title={
                                          getCartItemAvailabilityInfo(item).canIncrease
                                            ? 'Aumentar cantidad'
                                            : `Límite alcanzado (${getCartItemAvailabilityInfo(item).totalAvailable} disponibles)`
                                        }
                                      >
                                        <Plus className="h-5 w-5" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Control de precio (si es variable) */}
                                  {item.esPrecioVariable && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio personalizado:</span>
                                      <Input
                                        type="number"
                                        min="0.50"
                                        step="0.50"
                                        value={item.precio_unitario_con_igv}
                                        onChange={e => {
                                          const value = e.target.value
                                          const updatedCart = [...cart]
                                          const itemToUpdate = updatedCart[index]
                                          if (/^\d*(\.\d{0,2})?$/.test(value) && Number(value) > 0) {
                                            itemToUpdate.precio_unitario_con_igv = value
                                            itemToUpdate.precio_unitario = (Number(value) / 1.18).toFixed(2)
                                            itemToUpdate.precioVariableConIgv = value
                                            itemToUpdate.precioVariable = (Number(value) / 1.18).toFixed(2)
                                            itemToUpdate.subtotal = Number(value) * itemToUpdate.cantidad
                                            setCart(updatedCart)
                                          }
                                        }}
                                        className="mobile-touch-input w-28 text-right text-base font-bold border-orange-300 focus:border-orange-500 focus:ring-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-200 dark:focus:border-orange-400 dark:focus:ring-orange-400"
                                      />
                                    </div>
                                  )}

                                  {/* Botones de acción */}
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center space-x-2">
                                      {/* Switch para precio variable */}
                                      {canModifyPrice() && (
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs text-slate-600 dark:text-slate-400">Precio variable:</span>
                                          <Switch
                                            checked={item.esPrecioVariable}
                                            onCheckedChange={() => toggleItemVariablePrice(index)}
                                            className={`mobile-touch-switch ${
                                              item.esPrecioVariable
                                                ? "border-orange-300 data-[state=checked]:from-orange-400 data-[state=checked]:to-orange-600"
                                                : "border-slate-300"
                                            }`}
                                            title={item.esPrecioVariable ? "Desactivar precio personalizado" : "Activar precio personalizado"}
                                          />
                                        </div>
                                      )}

                                      {/* Botón para cambiar entre precio unitario y mayorista */}
                                      {item.precio_mayoritario && item.precio_mayoritario !== "0.00" && !item.esPrecioVariable && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => toggleItemPriceType(index)}
                                          className={`mobile-touch-button px-4 text-sm transition-all duration-200 ${item.esPrecioMayorista
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600/50 dark:hover:bg-emerald-900/50 dark:hover:border-emerald-600/70"
                                            : "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 dark:hover:border-emerald-600"
                                            }`}
                                          title={`Cambiar a precio ${item.esPrecioMayorista ? "unitario" : "mayorista"}`}
                                        >
                                          <SolPeruano className="h-4 w-4 mr-2" />
                                          {item.esPrecioMayorista ? "Mayorista" : "Unitario"}
                                        </Button>
                                      )}
                                    </div>

                                    {/* Botón eliminar */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeFromCart(index)}
                                      className="mobile-touch-button px-4 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 border-red-200 hover:border-red-300"
                                      title="Eliminar producto"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>                        {/* Resumen del carrito - Más compacto */}
                        <div className="bg-gradient-to-br from-slate-50/80 via-blue-50/40 to-ember-50/20 dark:from-slate-800/40 dark:via-blue-900/15 dark:to-ember-900/10 border border-slate-200/40 dark:border-slate-700/40 rounded-xl p-4 shadow-sm">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                <Calculator className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                                Resumen de Venta
                              </h3>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/50">
                                {totalItems} items
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="space-y-1.5">
                                <div className="flex justify-between">
                                  <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600 dark:text-slate-400">IGV (18%):</span>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(igv)}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-center">
                                <div className="text-center p-2 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/40 dark:border-slate-700/40">
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total a Pagar</div>
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(totalWithDiscount)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {saleDiscount.isDiscount && (
                              <div className="bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200/60 dark:border-yellow-800/40 rounded-lg p-2 mt-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-yellow-700 dark:text-yellow-400 font-medium">Descuento aplicado:</span>
                                  <span className="text-yellow-800 dark:text-yellow-300 font-bold">
                                    -{formatCurrency(saleDiscount.amount)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>                        </div>

                        {/* Botones de descuento - Diseño corporativo */}
                        {canApplyDiscount() && (
                          <div className="space-y-3">
                            {saleDiscount.isDiscount && (
                              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200/60 dark:border-yellow-700/50 rounded-lg p-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded-lg p-1.5">
                                      <Percent className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div>
                                      <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                                        Descuento aplicado
                                      </span>
                                      <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                        {saleDiscount.type === "percentage"
                                          ? `${saleDiscount.value}% de descuento`
                                          : `${formatCurrency(saleDiscount.value)} de descuento`}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={removeDiscount}
                                    className="h-8 w-8 p-0 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            <Button
                              variant="outline"
                              onClick={openDiscountDialog}
                              disabled={cart.length === 0}
                              className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700/50 text-yellow-700 dark:text-yellow-300 hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30 font-semibold h-10 shadow-sm"
                            >
                              <Percent className="h-4 w-4 mr-2" />
                              {saleDiscount.isDiscount ? "Modificar Descuento" : "Aplicar Descuento Global"}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-gradient-to-r from-fire-500 to-ember-600 rounded-full p-6 mb-6">
                          <ShoppingCart className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Carrito vacío
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                          Escanea un código de barras o busca productos por nombre para agregarlos al carrito de compras
                        </p>
                        <Button
                          onClick={openBarcodeScanner}
                          className="bg-gradient-to-r from-fire-600 to-ember-600 hover:from-fire-700 hover:to-ember-700 text-white shadow-lg"
                        >
                          <Barcode className="h-4 w-4 mr-2" />
                          Escanear Código de Barras
                        </Button>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
              </CardContent>
            </Card>          </div>

          {/* Panel lateral: Carrito y acciones - OPTIMIZADO */}
          <div className="sales-cart-panel lg:col-span-1 lg:order-2 mt-4 sm:mt-3 lg:mt-0 px-2 sm:px-0">
            <Card className="sales-actions-card h-full ruby-neon-card backdrop-blur-xl shadow-2xl flex flex-col">
              {/* Header compacto con TOTAL PROMINENTE */}
              <CardHeader className="pb-3 border-b-2 border-border bg-gradient-to-br from-toro-red/5 via-red-500/5 to-red-600/5 dark:from-toro-red/5 dark:via-red-500/5 dark:to-red-600/5 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-toro-red/5 to-red-500/5 dark:from-toro-red/5 dark:to-red-500/5"></div>
                <div className="relative z-10 space-y-3">
                  {/* Título compacto */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="ruby-neon-bg rounded-lg p-1.5 shadow-md border border-white/10 dark:border-black/10">
                        <Settings className="h-4 w-4 text-black dark:text-white" />
                      </div>
                      <CardTitle className="text-sm font-bold ruby-neon-text tracking-tight">
                        Venta
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50">
                      {cart.length} items
                    </Badge>
                  </div>

                  {/* TOTAL A PAGAR - POSICIÓN PROMINENTE */}
                  <div className="bg-gradient-to-br from-ember-600 to-fire-700 dark:from-ember-700 dark:to-fire-800 rounded-xl p-3 shadow-lg border border-ember-400/30 dark:border-ember-500/30">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-xs font-medium text-fire-100 dark:text-fire-200 mb-0.5">Total a Pagar</p>
                        <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {formatCurrency(saleDiscount.isDiscount ? totalWithDiscount : total)}
                        </p>
                      </div>
                      {saleDiscount.isDiscount && (
                        <div className="text-right">
                          <p className="text-xs line-through text-fire-200 dark:text-fire-300">{formatCurrency(total)}</p>
                          <p className="text-xs font-bold text-emerald-300 dark:text-emerald-200">-{formatCurrency(saleDiscount.amount)}</p>
                        </div>
                      )}
                    </div>

                    {/* Desglose compacto */}
                    <div className="mt-2 pt-2 border-t border-white/20 flex justify-between text-xs text-fire-100 dark:text-fire-200">
                      <span>Subtotal: {formatCurrency(subtotal)}</span>
                      <span>IGV: {formatCurrency(igv)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-2 sm:p-3 space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {/* Sección 1: Tipo de Comprobante - COMPACTO */}
                <div className="bg-white/50 dark:bg-slate-900/30 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <FileBarChart className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Comprobante</h3>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                      {tipoDocumento === "" ? "Sin Doc." : tipoDocumento === "01" ? "Factura" : "Boleta"}
                    </span>
                  </div>
                  <Tabs
                    value={tipoDocumento}
                    onValueChange={(value) => {
                      setTipoDocumento(value)
                      if (value === "") {
                        limpiarDatosCliente()
                      } else if (value !== "01") {
                        if (clienteData && clienteData.tipoDocumento === "6") {
                          limpiarDatosCliente()
                        }
                      }
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3 h-8 p-0.5 bg-slate-100 dark:bg-slate-800">
                      <TabsTrigger value="" className="text-[10px] px-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                        <X className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Sin</span>
                      </TabsTrigger>
                      <TabsTrigger value="03" title="Boleta" className="text-[10px] px-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                        <FileSpreadsheet className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Boleta</span>
                      </TabsTrigger>
                      <TabsTrigger value="01" title="Factura" className="text-[10px] px-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                        <FileBarChart className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Fact.</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Sección 2: Información del Cliente - COMPACTO */}
                <div className="bg-white/50 dark:bg-slate-900/30 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {tipoDocumento === "" ? "Cliente" : tipoDocumento === "01" ? "Empresa" : "Cliente"}
                      </h3>
                    </div>
                    {tipoDocumento !== "" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsClienteDialogOpen(true)}
                        className="h-6 px-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Search className="h-3 w-3 mr-1" />
                        {clienteData ? "Cambiar" : "Buscar"}
                      </Button>
                    )}
                  </div>

                  {tipoDocumento === "" ? (
                    <div className="py-2 text-center">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Sin comprobante</p>
                    </div>
                  ) : clienteData ? (
                    <div className="bg-emerald-50/80 dark:bg-emerald-900/20 rounded p-1.5 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-emerald-900 dark:text-emerald-100 truncate">
                            {tipoDocumento === "01"
                              ? clienteData.razonSocial
                              : `${clienteData.nombres} ${clienteData.apellidoPaterno}`}
                          </p>
                          <p className="text-[9px] text-emerald-700 dark:text-emerald-300">
                            {tipoDocumento === "01" ? "RUC" : "DNI"}: {clienteData.numeroDocumento}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={limpiarDatosCliente}
                          className="h-5 w-5 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-1.5 text-center">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 mb-1">
                        {tipoDocumento === "01" ? "RUC requerido" : "DNI opcional"}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsClienteDialogOpen(true)}
                        className="h-6 px-2 text-[10px]"
                      >
                        <Search className="h-3 w-3 mr-1" />
                        Buscar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Sección 3: Método de Pago - COMPACTO */}
                <div className="bg-white/50 dark:bg-slate-900/30 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-ember-600 dark:text-ember-400" />
                      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Método Pago</h3>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                      {renderPaymentMethodIcon()}
                      <span className="capitalize">{metodoPago}</span>
                    </div>
                  </div>
                  <Select value={metodoPago} onValueChange={setMetodoPago}>
                    <SelectTrigger className="h-8 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">
                        <div className="flex items-center py-0.5">
                          <SolPeruano className="h-4 w-4 mr-2 text-green-500" />
                          <span className="font-medium">Efectivo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="tarjeta">
                        <div className="flex items-center py-0.5">
                          <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="font-medium">Tarjeta</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="transferencia">
                        <div className="flex items-center py-0.5">
                          <Receipt className="h-4 w-4 mr-2 text-fire-500" />
                          <span className="font-medium">Transferencia</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pedidosya">
                        <div className="flex items-center py-0.5">
                          <Truck className="h-4 w-4 mr-2 text-orange-500" />
                          <span className="font-medium">PedidosYa</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="rappi">
                        <div className="flex items-center py-0.5">
                          <Zap className="h-4 w-4 mr-2 text-ember-500" />
                          <span className="font-medium">Rappi</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="uber_eats">
                        <div className="flex items-center py-0.5">
                          <Smartphone className="h-4 w-4 mr-2 text-green-500" />
                          <span className="font-medium">Uber Eats</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="yape">
                        <div className="flex items-center py-0.5">
                          <QrCode className="h-4 w-4 mr-2 text-fire-600" />
                          <span className="font-medium">Yape</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="plin">
                        <div className="flex items-center py-0.5">
                          <QrCode className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="font-medium">Plin</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sección 4: Configuración de Efectivo - ULTRA COMPACTO */}
                {metodoPago === "efectivo" && (
                  <div className="bg-white/50 dark:bg-slate-900/30 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <SolPeruano className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Efectivo</h3>
                      </div>
                    </div>

                    {/* Billetes frecuentes en 2 filas compactas */}
                    <div className="grid grid-cols-5 gap-1 mb-1.5">
                      {[200, 100, 50, 20, 10].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setMontoRecibido(amount.toString())}
                          className="px-1 py-1.5 text-[10px] font-bold bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded shadow-sm hover:scale-105 active:scale-95 transition-transform"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>

                    {/* Campo de entrada y vuelto en una sola fila */}
                    <div className="flex gap-1.5">
                      <Input
                        type="number"
                        placeholder="Recibido"
                        value={montoRecibido}
                        onChange={(e) => setMontoRecibido(e.target.value)}
                        className="h-8 text-xs flex-1 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <div className="h-8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 flex items-center min-w-[80px]">
                        {montoRecibido && !isNaN(Number.parseFloat(montoRecibido)) ? (
                          Number.parseFloat(montoRecibido) >= totalWithDiscount ? (
                            <div className="flex items-center text-emerald-600 dark:text-emerald-400 w-full">
                              <CheckCircle2 className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="font-bold text-[10px] truncate">
                                {formatCurrency(calcularVuelto())}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="font-bold text-[10px]">Falta</span>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-400 text-[10px]">Vuelto</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sección 5: Observaciones - COMPACTO */}
                <div className="bg-white/50 dark:bg-slate-900/30 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notas</h3>
                  </div>
                  <Textarea
                    placeholder="Observaciones adicionales..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="min-h-[45px] resize-none text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                {/* Vuelto destacado para efectivo (solo si aplica) */}
                {metodoPago === "efectivo" && montoRecibido && !isNaN(Number.parseFloat(montoRecibido)) && Number.parseFloat(montoRecibido) >= (saleDiscount.isDiscount ? totalWithDiscount : total) && (
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg p-2 shadow-lg">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-semibold">Vuelto</span>
                      </div>
                      <span className="text-lg font-black">
                        {formatCurrency(calcularVuelto())}
                      </span>
                    </div>
                  </div>
                )}

                {/* Checkbox para marcar comanda como entregada - COMPACTO */}
                {selectedShortcutCart && (
                  <div className="bg-orange-50/80 dark:bg-orange-900/20 rounded-lg p-2 border border-orange-200/60 dark:border-orange-700/60">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        id="marcar-comanda-entregada"
                        checked={marcarComandaEntregada}
                        onCheckedChange={(checked) => setMarcarComandaEntregada(checked as boolean)}
                        className="shrink-0"
                      />
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                        Marcar comanda como entregada
                      </span>
                    </label>
                  </div>
                )}

              </CardContent>

              {/* Footer fijo con botón de registro - OPTIMIZADO */}
              <div className="p-2 sm:p-3 border-t border-border bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 shrink-0">
                <Button
                  className={`
                    w-full h-11 rounded-lg font-bold text-sm shadow-lg text-white
                    transition-all duration-200
                    ${cart.length === 0
                      ? "bg-gradient-to-r from-slate-400 to-slate-500 cursor-not-allowed"
                      : createSaleMutation.isPending
                        ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 animate-pulse"
                        : metodoPago === "efectivo" && montoRecibido !== "" && !isNaN(Number.parseFloat(montoRecibido)) && Number.parseFloat(montoRecibido) < (saleDiscount.isDiscount ? totalWithDiscount : total)
                          ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                          : "bg-gradient-to-r from-fire-600 to-ember-700 hover:from-fire-700 hover:to-ember-800 active:scale-[0.98]"
                    }
                    disabled:opacity-60 disabled:cursor-not-allowed
                  `}
                  onClick={handleSubmit}
                  disabled={
                    cart.length === 0 ||
                    createSaleMutation.isPending ||
                    (metodoPago === "efectivo" &&
                      montoRecibido !== "" &&
                      !isNaN(Number.parseFloat(montoRecibido)) &&
                      Number.parseFloat(montoRecibido) < (saleDiscount.isDiscount ? totalWithDiscount : total))
                  }
                >
                  <div className="flex items-center justify-center gap-2">
                    {createSaleMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : cart.length === 0 ? (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        <span>Agregar Productos</span>
                      </>
                    ) : metodoPago === "efectivo" && montoRecibido !== "" && !isNaN(Number.parseFloat(montoRecibido)) && Number.parseFloat(montoRecibido) < (saleDiscount.isDiscount ? totalWithDiscount : total) ? (
                      <>
                        <AlertTriangle className="h-4 w-4" />
                        <span>Monto Insuficiente</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-4 w-4" />
                        <span>REGISTRAR VENTA</span>
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </Card>
          </div>

          {/* Cierre del grid */}
        </div>

        {/* Cierre del contenedor principal */}
      </div>

      {/* Diálogos y modales */}
      <ShortcutsDialog
        isOpen={isShortcutsDialogOpen}
        onClose={() => setIsShortcutsDialogOpen(false)}
      />

      <TicketViewer
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false)
          if (showSaleSuccessAfterTicket) {
            setShowSaleSuccessDialog(true)
            setShowSaleSuccessAfterTicket(false)
          }
        }}
        htmlContent={ticketHtml}
        pdfBlob={pdfBlob}
        title={tipoDocumento === "01" ? "Factura Electrónica" : tipoDocumento === "03" ? "Boleta Electrónica" : "Ticket de Venta"}
        documentType={tipoDocumento === "01" ? "Factura Electrónica" : tipoDocumento === "03" ? "Boleta Electrónica" : "Ticket de Venta"}
        fileName={`documento-${Date.now()}`}
      />


      <SunatAlertDialog
        isOpen={showSunatAlert}
        onClose={() => setShowSunatAlert(false)}
        tipoDocumento={tipoDocumento}
        pendingSaleData={pendingSaleData}
        onConfirm={handleSendToSunat}
        onDirectSave={(data) => createSaleMutation.mutate(data)}
      />

      <InvoiceDialog
        isOpen={isInvoiceDialogOpen}
        onClose={handleCloseInvoiceDialogSafe}
        tipoDocumento={tipoDocumento}
        isInvoiceSending={isInvoiceSending}
        invoiceResult={invoiceResult}
        onNewSale={handleStartNewSale}
        onViewDetails={handleViewSaleDetails}
      />

      <ClienteDialog
        isOpen={isClienteDialogOpen}
        onClose={() => setIsClienteDialogOpen(false)}
        tipoDocumento={tipoDocumento}
        documentoCliente={documentoCliente}
        setDocumentoCliente={setDocumentoCliente}
        isConsultandoCliente={isConsultandoCliente}
        setIsConsultandoCliente={setIsConsultandoCliente}
        clienteData={clienteData}
        setClienteData={setClienteData}
        onConsultar={consultarCliente}
        onLimpiar={limpiarDatosCliente}
      />

      <BarcodeScannerDialog
        isOpen={isBarcodeDialogOpen}
        onClose={() => setIsBarcodeDialogOpen(false)}
        barcodeInput={barcodeInput}
        setBarcodeInput={setBarcodeInput}
        isBarcodeSearching={isBarcodeSearching}
        barcodeSearchResult={barcodeSearchResult}
        onSearch={handleBarcodeSearch}
        onAddToCart={(product, barcodeData) => {
          const productToAdd = products?.find((p) => p.id_producto === product.id_producto)
          if (productToAdd) {
            addToCart(productToAdd, barcodeData, precioMayoristaMode)
          }
        }}
        isProcessingBarcode={isProcessingBarcode}
      />

      <CartNamingDialog
        isOpen={isNamingCartDialogOpen}
        onClose={() => setIsNamingCartDialogOpen(false)}
        cartName={newCartName}
        setCartName={setNewCartName}
        savedCartsLength={savedCarts.length}
        onConfirm={confirmSaveCart}
      />

      <DiscountDialog
        isOpen={isDiscountDialogOpen}
        onClose={() => {
          setIsDiscountDialogOpen(false)
          setDiscountValue("")
        }}
        discountType={discountType}
        setDiscountType={setDiscountType}
        discountValue={discountValue}
        setDiscountValue={setDiscountValue}
        onApply={applyDiscount}
        total={total}
        cart={cart}
        canApplyDiscount={canApplyDiscount}
      />

      <SavedCartsDialog
        isOpen={isSavedCartsDialogOpen}
        onClose={() => setIsSavedCartsDialogOpen(false)}
        savedCarts={savedCarts}
        onLoadCart={loadSavedCart}
        onDeleteCart={deleteSavedCart}
      />

      {/* Diálogo de confirmación para reemplazar carrito */}
      <Dialog open={isCartSaveDialogOpen} onOpenChange={setIsCartSaveDialogOpen}>
        <DialogContent className="sm:max-w-md mx-3 my-3 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 shadow-xl backdrop-blur-sm">
          <VisuallyHidden>
            <DialogTitle>Seleccionar Mesa {selectedCartNumber}</DialogTitle>
            <DialogDescription>
              ¿Desea limpiar la mesa actual y seleccionar esta mesa?
            </DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <PauseCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Seleccionar Mesa {selectedCartNumber}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Desea limpiar la mesa actual y seleccionar esta mesa?
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Mesa actual:</strong> {cart.length} productos
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Mesa guardada:</strong> {getBackendCart(selectedCartNumber || 0)?.items?.length ?? 0} productos
              </p>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Se limpiará el carrito actual y se seleccionará el carrito {selectedCartNumber}
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={cancelReplaceCart}
              className="h-9 text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmReplaceCart}
              className="h-9 text-sm bg-amber-600 hover:bg-amber-700 text-white"
            >
              Seleccionar Carrito
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para cargar carrito */}
      <Dialog open={isCartLoadDialogOpen} onOpenChange={setIsCartLoadDialogOpen}>
        <DialogContent className="sm:max-w-md mx-3 my-3 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 shadow-xl backdrop-blur-sm">
          <VisuallyHidden>
            <DialogTitle>Cargar Mesa {selectedCartNumber}</DialogTitle>
            <DialogDescription>
              Deseas ingresar a la mesa {selectedCartNumber}
            </DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Cargar Mesa {selectedCartNumber}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deseas ingresar a la mesa {selectedCartNumber}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Mesa actual:</strong> {cart.length} productos
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Mesa a cargar:</strong> {getBackendCart(selectedCartNumber || 0)?.items?.length ?? 0} productos
              </p>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Se perderán los productos actuales llenados
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={cancelLoadCart}
              className="h-9 text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmLoadCart}
              className="h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white"
            >
              Cargar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BarcodeSelectionDialog
        isOpen={isBarcodeSelectionDialogOpen}
        onClose={() => {
          setIsBarcodeSelectionDialogOpen(false)
          setSelectedProductForBarcode(null)
          setAvailableBarcodes([])
        }}
        selectedProductForBarcode={selectedProductForBarcode}
        availableBarcodes={availableBarcodes}
        isLoadingBarcodesSelection={isLoadingBarcodesSelection}
        onSelectBarcode={selectBarcode}
      />

      <Dialog open={isCartImageViewOpen} onOpenChange={setIsCartImageViewOpen}>
        <DialogContent className="max-w-md mx-auto bg-white dark:bg-gray-900 shadow-xl">
          <VisuallyHidden>
            <DialogTitle>Imagen del producto</DialogTitle>
            <DialogDescription>
              Visualización de la imagen del producto seleccionado
            </DialogDescription>
          </VisuallyHidden>
          <img
            src={selectedCartImageUrl}
            alt="Imagen del producto"
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>

      <SaleSuccessDialog
        isOpen={showSaleSuccessDialog}
        onClose={handleCloseSaleSuccessDialog}
        onNewSale={handleNewSaleFromSuccess}
        onViewDetails={handleViewSaleDetailsFromSuccess}
        onShowTicket={handleShowTicketFromSuccess}
        saleId={currentSale?.venta_id || ""}
        tipoDocumento={tipoDocumento} />

      {/* Diálogo de confirmación para eliminar carrito */}
      <Dialog open={isCartDeleteDialogOpen} onOpenChange={setIsCartDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md mx-3 my-3 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 shadow-xl backdrop-blur-sm">
          <VisuallyHidden>
            <DialogTitle>Eliminar Mesa {selectedCartNumber}</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar esta mesa?
            </DialogDescription>
          </VisuallyHidden>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <X className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Eliminar Mesa {selectedCartNumber}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Está seguro de que desea eliminar esta mesa?
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">
                <strong>Mesa a eliminar:</strong> {getBackendCart(selectedCartNumber || 0)?.items?.length ?? 0} productos
              </p>
            </div>
            
            {/* Opción para eliminar comanda asociada */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="delete-comanda"
                  checked={deleteComandaToo}
                  onCheckedChange={(checked) => setDeleteComandaToo(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="delete-comanda" className="text-sm font-medium text-blue-700 dark:text-blue-300 cursor-pointer">
                    También eliminar comanda asociada
                  </label>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Si este carrito tiene una comanda activa, también será eliminada
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esta acción no se puede deshacer. El carrito será eliminado permanentemente.
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={cancelDeleteCart}
              className="h-9 text-sm border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteCart}
              className="h-9 text-sm bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Vista Previa de Comanda */}
      <Dialog open={mostrarVistaPreviaComanda} onOpenChange={setMostrarVistaPreviaComanda}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold text-gray-800">
              <ChefHat className="h-6 w-6 mr-2 text-orange-500" />
              Vista Previa de Comanda - Mesa {comandaParaImprimir?.numero_carrito}
            </DialogTitle>
            <DialogDescription>
              Revisa la comanda antes de imprimirla para la cocina
            </DialogDescription>
          </DialogHeader>
          
          {comandaParaImprimir && (
            <div className="space-y-6">
              {/* Información de la Mesa */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-orange-800">
                      {comandaParaImprimir.es_delivery ? '🚚 DELIVERY' : `🏠 MESA ${comandaParaImprimir.numero_carrito}`}
                    </h3>
                    <p className="text-sm text-orange-600">
                      {new Date(comandaParaImprimir.fecha_creacion).toLocaleString('es-PE', {
                        timeZone: 'America/Lima',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-800">
                      S/ {Number(comandaParaImprimir.total_con_igv).toFixed(2)}
                    </p>
                    <p className="text-sm text-orange-600">Total</p>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-500" />
                  Productos ({comandaParaImprimir.productos.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {comandaParaImprimir.productos.map((producto: any, index: number) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-2 py-1 rounded">
                          {producto.cantidad}x
                        </span>
                        <span className="font-medium text-gray-800">{producto.nombre}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        S/ {(producto.cantidad * Number(producto.precioConIgv)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              {comandaParaImprimir.observaciones && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-sm text-yellow-800 mb-2 flex items-center">
                    <FileCheck className="h-4 w-4 mr-1" />
                    Observaciones
                  </h4>
                  <p className="text-sm text-yellow-700">{comandaParaImprimir.observaciones}</p>
                </div>
              )}

              {/* Totales */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>S/ {Number(comandaParaImprimir.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IGV (18%):</span>
                    <span>S/ {(Number(comandaParaImprimir.total) * 0.18).toFixed(2)}</span>
                  </div>
                  {saleDiscount.isDiscount && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Descuento:</span>
                      <span>-S/ {saleDiscount.amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>TOTAL:</span>
                    <span>S/ {Number(comandaParaImprimir.total_con_igv).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setMostrarVistaPreviaComanda(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={imprimirComanda}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Comanda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de edición de nombre de producto */}
      {editingProductIndex !== null && (
        <EditProductNameDialog
          isOpen={isEditNameDialogOpen}
          onClose={() => {
            setIsEditNameDialogOpen(false)
            setEditingProductIndex(null)
          }}
          productName={cart[editingProductIndex]?.nombre || ''}
          currentEditedName={cart[editingProductIndex]?.nombreEditado}
          onSave={(newName) => editarNombreProducto(editingProductIndex, newName)}
        />
      )}

      {/* Diálogo de configuración de impresoras */}
      <PrinterConfigDialog
        isOpen={isPrinterConfigOpen}
        onClose={() => setIsPrinterConfigOpen(false)}
      />

      {/* Diálogo de división de mesas */}
      {mesaADividir && (
        <DividirMesaDialog
          isOpen={isDividirMesaOpen}
          onClose={() => {
            setIsDividirMesaOpen(false)
            setMesaADividir(null)
          }}
          mesaOrigen={backendCarts.find(c => c.numero_carrito === mesaADividir)!}
          mesasDisponibles={backendCarts}
          onDividir={dividirMesa}
        />
      )}
    </div>
  )
}

export default NewSalePage
