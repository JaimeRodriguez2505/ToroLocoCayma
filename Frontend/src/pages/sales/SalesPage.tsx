"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import {
  Plus,
  Search,
  ShoppingCart,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Loader2,
  Trash2,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { fetchSales, fetchSaleById, deleteSale } from "../../services/saleService"
import { fetchCompanyForSales } from "../../services/companyService"
import { sendInvoiceToSunat, prepareInvoiceData } from "../../services/invoiceService"
import { formatCurrency, formatDateTime } from "../../lib/utils"
import { motion } from "framer-motion"
import { toast } from "sonner"

import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { useBusinessHours } from "../../hooks/useBusinessHours"
import { useAuth } from "../../contexts/AuthContext"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"

const SalesPage = () => {
  useDocumentTitle("Ventas")

  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [resendingIds, setResendingIds] = useState<Set<number>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<any>(null)
  const itemsPerPage = 25

  const queryClient = useQueryClient()

  // Obtener el estado del horario laboral
  const { isWithinBusinessHours } = useBusinessHours()

  // Verificar si el usuario es gerente (rol 1)
  const isManager = user?.id_role === 1

  // Fetch sales
  const { data: sales, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: fetchSales,
  })

  // Fetch company data for SUNAT resend
  const { data: company } = useQuery({
    queryKey: ["company-for-sales"],
    queryFn: fetchCompanyForSales,
  })

  // Mutation para reenvío a SUNAT
  const resendToSunatMutation = useMutation({
    mutationFn: async ({ saleId, saleData }: { saleId: number; saleData: any }) => {
      if (!company) {
        throw new Error("No se encontraron datos de la empresa")
      }

      // USAR LOS DATOS YA GUARDADOS EN LA VENTA (serie y correlativo existentes)
      const tipoDocumento = saleData.tipo_documento === "1" ? "01" : "03"

      // Preparar datos de factura usando la serie y correlativo ya guardados
      const invoiceData = prepareInvoiceData(
        saleData,
        company,
        tipoDocumento,
        saleData.cliente_data || null,
        {
          // Usar los valores ya guardados en la BD
          facturaActual: saleData.correlativo || 1,
          boletaActual: saleData.correlativo || 1,
        },
        saleData.correlativo, // Usar el correlativo ya guardado
      )

      // IMPORTANTE: Forzar el uso de la serie y correlativo ya guardados
      invoiceData.serie = saleData.serie
      invoiceData.correlativo = String(saleData.correlativo).padStart(8, "0")

      // Enviar a SUNAT
      return await sendInvoiceToSunat(invoiceData, saleId)
    },
    onMutate: ({ saleId }) => {
      setResendingIds((prev) => new Set(prev).add(saleId))
    },
    onSuccess: (data) => {
      if (data.sunatResponse.success) {
        toast.success("Comprobante reenviado exitosamente a SUNAT")
        queryClient.invalidateQueries({ queryKey: ["sales"] })
      } else {
        toast.error(`Error al reenviar: ${data.sunatResponse.error || "Error desconocido"}`)
      }
    },
    onError: (error: any) => {
      toast.error(`Error al reenviar comprobante: ${error.message || "Error desconocido"}`)
    },
    onSettled: (_data, _error, variables) => {
      if (variables && variables.saleId) {
        setResendingIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(variables.saleId)
          return newSet
        })
      }
    },
  })

  // Mutation para eliminar ventas (solo para gerentes)
  const deleteSaleMutation = useMutation({
    mutationFn: async (saleId: number) => {
      return await deleteSale(saleId)
    },
    onMutate: (saleId) => {
      setDeletingIds((prev) => new Set(prev).add(saleId))
    },
    onSuccess: () => {
      toast.success("Venta eliminada exitosamente")
      queryClient.invalidateQueries({ queryKey: ["sales"] })
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar venta: ${error.message || "Error desconocido"}`)
    },
    onSettled: (_data, _error, saleId) => {
      if (saleId) {
        setDeletingIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(saleId)
          return newSet
        })
      }
    },
  })

  // Función para reenviar a SUNAT
  const handleResendToSunat = async (sale: any) => {
    try {
      // Obtener datos completos de la venta
      const fullSaleData = await fetchSaleById(sale.venta_id)

      // Preparar datos del cliente si existen
      let clienteData = null
      if (fullSaleData.cliente_nombre && fullSaleData.cliente_numero_documento) {
        clienteData = {
          tipoDocumento: fullSaleData.cliente_tipo_documento || (fullSaleData.tipo_documento === "1" ? "6" : "1"),
          numeroDocumento: fullSaleData.cliente_numero_documento,
          razonSocial: fullSaleData.tipo_documento === "1" ? fullSaleData.cliente_nombre : undefined,
          nombre: fullSaleData.tipo_documento === "3" ? fullSaleData.cliente_nombre : undefined,
          nombres: fullSaleData.tipo_documento === "3" ? fullSaleData.cliente_nombre : undefined,
          apellidoPaterno: "",
          apellidoMaterno: "",
        }
      }

      // Preparar datos de la venta con items
      const saleDataWithItems = {
        ...fullSaleData,
        cliente_data: clienteData,
        // USAR LA SERIE Y CORRELATIVO YA GUARDADOS EN LA BD
        serie: fullSaleData.serie,
        correlativo: fullSaleData.correlativo,
        items:
          fullSaleData.detalles?.map((detalle: any) => ({
            producto_id: detalle.producto_id,
            nombre: detalle.producto?.nombre || `Producto #${detalle.producto_id}`,
            precio_unitario: detalle.precio_unitario,
            precio_unitario_con_igv: detalle.precio_unitario_con_igv,
            cantidad: detalle.cantidad,
          })) || [],
      }

      await resendToSunatMutation.mutateAsync({
        saleId: sale.venta_id,
        saleData: saleDataWithItems,
      })
    } catch (error) {
      console.error("Error al preparar reenvío:", error)
      toast.error("Error al preparar los datos para el reenvío")
    }
  }

  // Función para verificar si una venta puede ser reenviada a SUNAT
  const canResendToSunat = (sale: any) => {
    return !sale.comprobante_emitido && (sale.tipo_documento === "1" || sale.tipo_documento === "3")
  }

  // Función para verificar si una venta puede ser eliminada (solo gerentes y ventas simples)
  const canDeleteSale = (sale: any) => {
    // Solo gerentes pueden eliminar ventas
    if (!isManager) return false
    
    // Solo se pueden eliminar ventas simples (sin tipo de documento y sin comprobante emitido)
    return !sale.tipo_documento && !sale.comprobante_emitido
  }

  // Función para eliminar una venta
  const handleDeleteSale = (sale: any) => {
    if (!canDeleteSale(sale)) {
      toast.error("Esta venta no se puede eliminar")
      return
    }

    setSaleToDelete(sale)
    setIsDeleteDialogOpen(true)
  }

  // Función para confirmar la eliminación
  const confirmDeleteSale = () => {
    if (saleToDelete) {
      deleteSaleMutation.mutate(saleToDelete.venta_id)
      setIsDeleteDialogOpen(false)
      setSaleToDelete(null)
    }
  }

  // Función para cancelar la eliminación
  const cancelDeleteSale = () => {
    setIsDeleteDialogOpen(false)
    setSaleToDelete(null)
  }

  // Filter sales based on search term and date filter
  const filteredSales = useMemo(() => {
    return (
      sales?.filter((sale) => {
        // Función auxiliar para buscar por serie y correlativo
        const matchesSerieCorrelativo = () => {
          if (!sale.serie || !sale.correlativo) return false;
          
          const fullNumber = `${sale.serie}-${String(sale.correlativo).padStart(6, "0")}`;
          const correlativoStr = String(sale.correlativo);
          
          // Buscar en serie-correlativo completo, solo serie, o solo correlativo
          return fullNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 sale.serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 correlativoStr.includes(searchTerm);
        };

        const matchesSearch =
          // Priorizar búsqueda por serie y correlativo si la venta tiene comprobante
          (sale.comprobante_emitido && matchesSerieCorrelativo()) ||
          // Si no encuentra en serie/correlativo, buscar en ID de venta
          sale.venta_id.toString().includes(searchTerm) ||
          // Búsqueda en otros campos
          (sale.observaciones && sale.observaciones.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (sale.cliente_nombre && sale.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (sale.cliente_numero_documento && sale.cliente_numero_documento.includes(searchTerm))

        // Solución mejorada para el filtrado por fecha
        let matchesDate = true
        if (dateFilter) {
          // Convertir la fecha de la venta a la zona horaria local
          const saleDate = new Date(sale.fecha)

          // Obtener solo la parte de la fecha (año, mes, día) sin la hora
          const saleDateOnly = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate())

          // Convertir la fecha del filtro a un objeto Date
          const filterDateParts = dateFilter.split("-")
          const filterDate = new Date(
            Number.parseInt(filterDateParts[0]), // año
            Number.parseInt(filterDateParts[1]) - 1, // mes (0-11)
            Number.parseInt(filterDateParts[2]), // día
          )

          // Comparar solo las fechas sin las horas
          matchesDate = saleDateOnly.getTime() === filterDate.getTime()
        }

        return matchesSearch && matchesDate
      }) || []
    )
  }, [sales, searchTerm, dateFilter])

  // Paginate sales
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredSales.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredSales, currentPage])

  // Calculate total pages
  const totalPages = Math.ceil((filteredSales?.length || 0) / itemsPerPage)

  const getPaymentMethodBadge = (method: string) => {
    // Capitalizar la primera letra del método de pago
    const formattedMethod = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()

    switch (method.toLowerCase()) {
      case "efectivo":
        return <Badge variant="success">{formattedMethod}</Badge>
      case "tarjeta":
        return <Badge variant="info">{formattedMethod}</Badge>
      case "transferencia":
        return (
          <Badge
            variant="secondary"
            className="bg-fire-100 text-fire-800 dark:bg-fire-900/30 dark:text-fire-400"
          >
            {formattedMethod}
          </Badge>
        )
      case "yape":
        return (
          <Badge className="bg-fire-100 text-fire-800 dark:bg-fire-900/30 dark:text-fire-400 border-fire-200 dark:border-fire-800/30">
            {formattedMethod}
          </Badge>
        )
      case "plin":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/30">
            {formattedMethod}
          </Badge>
        )
      default:
        return <Badge>{formattedMethod}</Badge>
    }
  }

  // Función para obtener el tipo de comprobante
  const getComprobanteType = (sale: any) => {
    // Si no tiene tipo de documento, es una venta simple (ticket)
    if (!sale.tipo_documento) {
      return (
        <Badge
          variant="secondary"
          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
        >
          Ticket
        </Badge>
      )
    }

    if (sale.tipo_documento === "1") {
      return <Badge variant="default">Factura</Badge>
    } else if (sale.tipo_documento === "3") {
      return <Badge variant="default">Boleta</Badge>
    }

    return <Badge variant="outline">Sin especificar</Badge>
  }

  // Función para formatear el número de comprobante (versión corregida)
  const formatComprobanteNumber = (sale: any) => {
    // Si no tiene tipo de documento, es un ticket simple, mostrar el ID de venta como número de ticket
    if (!sale.tipo_documento) {
      return `T-${String(sale.venta_id).padStart(8, "0")}`
    }

    if (!sale.comprobante_emitido || !sale.serie || !sale.correlativo) {
      return "-"
    }

    // Si la serie ya incluye el prefijo (F001, B001), usarla tal como está
    const serie = sale.serie
    const correlativo = String(sale.correlativo).padStart(6, "0")

    return `${serie}-${correlativo}`
  }

  // Función para formatear la información del cliente
  const formatClienteInfo = (sale: any) => {
    if (!sale.cliente_nombre) {
      return "-"
    }

    let docType = ""
    if (sale.cliente_tipo_documento === "1") {
      docType = "DNI"
    } else if (sale.cliente_tipo_documento === "6") {
      docType = "RUC"
    }

    if (docType && sale.cliente_numero_documento) {
      return `${sale.cliente_nombre} (${docType}: ${sale.cliente_numero_documento})`
    }

    return sale.cliente_nombre
  }

  // Función para calcular el total con descuento aplicado
  const calculateTotalWithDiscount = (sale: any) => {
    const baseTotal = Number.parseFloat(sale.total_con_igv)

    // Si la venta tiene descuento aplicado
    if (sale.es_descuento && sale.descuento) {
      const discount = Number.parseFloat(sale.descuento.toString())
      return baseTotal - discount
    }

    return baseTotal
  }

  // Función para calcular los totales de ventas
  const calculateSalesTotals = useMemo(() => {
    if (!filteredSales || filteredSales.length === 0) {
      return {
        totalGeneral: 0,
        totalDescuentos: 0,
        totalConDescuentos: 0,
        cantidadVentas: 0,
      }
    }

    let totalGeneral = 0
    let totalDescuentos = 0
    let totalConDescuentos = 0

    filteredSales.forEach((sale) => {
      const baseTotal = Number.parseFloat(sale.total_con_igv)
      totalGeneral += baseTotal

      if (sale.es_descuento && sale.descuento) {
        const discount = Number.parseFloat(sale.descuento.toString())
        totalDescuentos += discount
        totalConDescuentos += baseTotal - discount
      } else {
        totalConDescuentos += baseTotal
      }
    })

    return {
      totalGeneral,
      totalDescuentos,
      totalConDescuentos,
      cantidadVentas: filteredSales.length,
    }
  }, [filteredSales])

  // Función MEJORADA para obtener el estado de emisión del comprobante
  const getComprobanteEmissionStatus = (sale: any) => {
    // Si no tiene tipo de documento, es una venta simple (solo ticket)
    if (!sale.tipo_documento) {
      return (
        <Badge
          variant="secondary"
          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
        >
          Venta Simple
        </Badge>
      )
    }

    // Si tiene tipo de documento pero no está emitido, es un error de SUNAT
    if (!sale.comprobante_emitido) {
      return (
        <Badge
          variant="destructive"
          className="bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
        >
          Error SUNAT
        </Badge>
      )
    }

    // Si está emitido correctamente
    return (
      <Badge
        variant="default"
        className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
      >
        Emitido
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-3 lg:p-4">
      <motion.div
        className="max-w-7xl mx-auto space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="bg-card border border-border rounded-2xl p-6 shadow-sm dark:shadow-ember"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center">
                <ShoppingCart className="mr-3 h-7 w-7 text-primary" />
                Ventas
              </h1>
              <p className="text-muted-foreground text-base">Gestiona y visualiza el historial de ventas</p>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        asChild={isWithinBusinessHours}
                        className={`font-semibold ${!isWithinBusinessHours ? "opacity-60 cursor-not-allowed" : "dark:shadow-fire"}`}
                        disabled={!isWithinBusinessHours}
                        size="lg"
                      >
                        {isWithinBusinessHours ? (
                          <Link to="/sales/new" className="flex items-center">
                            <Plus className="mr-2 h-5 w-5" />
                            Nueva Venta
                          </Link>
                        ) : (
                          <span className="flex items-center">
                            <Clock className="mr-2 h-5 w-5" />
                            Nueva Venta
                          </span>
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!isWithinBusinessHours && (
                    <TooltipContent>
                      <p>No se pueden crear ventas fuera del horario laboral (8:00 AM - 8:00 PM)</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-heading font-bold text-foreground">
                Historial de Ventas
              </CardTitle>
              <CardDescription>Registro de todas las ventas realizadas</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por serie, correlativo, ID, cliente o observaciones..."
                    className="pl-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-auto flex items-center gap-3 bg-muted/30 border border-border rounded-xl px-4 py-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium w-auto"
                  />
                </div>
              </div>

              {/* Resumen de ventas */}
              {filteredSales && filteredSales.length > 0 && (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md dark:shadow-ember transition-all duration-200 text-center">
                    <div className="text-3xl font-heading font-bold text-primary mb-2">
                      {calculateSalesTotals.cantidadVentas}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {dateFilter ? "Ventas del día" : "Total de ventas"}
                    </div>
                  </div>
                  <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md dark:shadow-ember transition-all duration-200 text-center">
                    <div className="text-3xl font-heading font-bold text-foreground mb-2">
                      {formatCurrency(calculateSalesTotals.totalGeneral)}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">Total general</div>
                  </div>
                  <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md dark:shadow-ember transition-all duration-200 text-center">
                    <div className="text-3xl font-heading font-bold text-destructive mb-2">
                      -{formatCurrency(calculateSalesTotals.totalDescuentos)}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">Total descuentos</div>
                  </div>
                  <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md dark:shadow-ember transition-all duration-200 text-center">
                    <div className="text-3xl font-heading font-bold text-green-600 dark:text-green-400 mb-2">
                      {formatCurrency(calculateSalesTotals.totalConDescuentos)}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">Total final</div>
                  </div>
                </motion.div>
              )}

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                  </div>
                  <p className="mt-6 text-muted-foreground font-medium text-lg">Cargando ventas...</p>
                </div>
              ) : filteredSales && filteredSales.length > 0 ? (
                <>
                  <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="border-border bg-muted/80">
                          <TableHead className="font-semibold py-4 text-center w-20">ID</TableHead>
                          <TableHead className="font-semibold py-4 text-center w-32">Fecha</TableHead>
                          <TableHead className="font-semibold py-4 text-center min-w-48">Cliente</TableHead>
                          <TableHead className="font-semibold py-4 text-center w-28">Comprobante</TableHead>
                          <TableHead className="font-semibold py-4 text-center w-32">Número</TableHead>
                          <TableHead className="font-semibold py-4 text-center w-32">Estado</TableHead>
                          <TableHead className="font-semibold py-4 text-center w-32">Método de Pago</TableHead>
                          <TableHead className="font-semibold py-4 text-center w-32">Total</TableHead>
                          <TableHead className="font-semibold py-4 text-center w-28">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSales.map((sale) => (
                          <TableRow
                            key={sale.venta_id}
                            className="border-border hover:bg-muted/30 transition-all duration-200"
                          >
                            <TableCell className="font-bold text-primary py-4 text-center">
                              #{sale.venta_id}
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300 py-4 text-center text-sm">
                              {formatDateTime(sale.fecha)}
                            </TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300 py-4 font-medium">
                              {formatClienteInfo(sale)}
                            </TableCell>
                            <TableCell className="py-4 text-center">{getComprobanteType(sale)}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300 py-4 font-mono text-center text-sm">
                              {formatComprobanteNumber(sale)}
                            </TableCell>
                            <TableCell className="py-4 text-center">{getComprobanteEmissionStatus(sale)}</TableCell>
                            <TableCell className="py-4 text-center">
                              {getPaymentMethodBadge(sale.metodo_pago)}
                            </TableCell>
                            <TableCell className="font-medium py-4 text-right pr-6">
                              <div className="flex flex-col items-end">
                                {sale.es_descuento &&
                                sale.descuento &&
                                Number.parseFloat(sale.descuento.toString()) > 0 ? (
                                  <>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                      {formatCurrency(Number.parseFloat(sale.total_con_igv))}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                        {formatCurrency(calculateTotalWithDiscount(sale))}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 dark:from-emerald-900/20 dark:to-green-900/20 dark:text-emerald-400 dark:border-emerald-800 shadow-sm"
                                      >
                                        Desc.
                                      </Badge>
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-gray-900 dark:text-gray-100 font-bold">
                                    {formatCurrency(Number.parseFloat(sale.total_con_igv))}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex justify-center items-center gap-1 min-w-fit">
                                {/* Botón de ver detalles */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-fire-100 hover:to-ember-100 hover:text-fire-600 dark:hover:from-fire-900/30 dark:hover:to-ember-900/30 dark:hover:text-fire-400 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                      >
                                        <Link to={`/sales/${sale.venta_id}`}>
                                          <Eye className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ver detalles</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {/* Botón de reenvío a SUNAT */}
                                {canResendToSunat(sale) && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleResendToSunat(sale)}
                                          disabled={resendingIds.has(sale.venta_id)}
                                          className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-orange-100 hover:to-red-100 hover:text-orange-600 dark:hover:from-orange-900/30 dark:hover:to-red-900/30 dark:hover:text-orange-400 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {resendingIds.has(sale.venta_id) ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <RefreshCw className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{resendingIds.has(sale.venta_id) ? "Reenviando..." : "Reenviar a SUNAT"}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}

                                {/* Botón de eliminar venta (solo para gerentes y ventas simples) */}
                                {canDeleteSale(sale) && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteSale(sale)}
                                          disabled={deletingIds.has(sale.venta_id)}
                                          className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-red-100 hover:to-rose-100 hover:text-red-600 dark:hover:from-red-900/30 dark:hover:to-rose-900/30 dark:hover:text-red-400 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {deletingIds.has(sale.venta_id) ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{deletingIds.has(sale.venta_id) ? "Eliminando..." : "Eliminar venta"}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación moderna */}
                  {filteredSales && filteredSales.length > 0 && (
                    <motion.div
                      className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-border gap-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <div className="text-sm text-muted-foreground bg-muted/50 px-5 py-2.5 rounded-xl border border-border shadow-sm font-medium">
                        Mostrando{" "}
                        <span className="font-bold text-primary">
                          {(currentPage - 1) * itemsPerPage + 1}-
                          {Math.min(currentPage * itemsPerPage, filteredSales.length)}
                        </span>{" "}
                        de{" "}
                        <span className="font-bold text-primary">
                          {filteredSales.length}
                        </span>{" "}
                        ventas
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="h-10 px-4"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Anterior
                        </Button>

                        <div className="flex items-center gap-2">
                          {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                            const pageNum = idx + 1
                            const isActive = pageNum === currentPage
                            return (
                              <Button
                                key={pageNum}
                                variant={isActive ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`h-10 w-10 p-0 font-semibold ${
                                  isActive
                                    ? "shadow-lg dark:shadow-fire"
                                    : ""
                                }`}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="h-10 px-4"
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  className="flex flex-col items-center justify-center py-24 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-primary/10 p-12 rounded-full w-40 h-40 flex items-center justify-center mx-auto mb-8 shadow-md dark:shadow-ember">
                    <ShoppingCart className="h-20 w-20 text-primary" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-foreground mb-4">No hay ventas registradas</h3>
                  <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
                    {searchTerm || dateFilter
                      ? "No se encontraron ventas que coincidan con los criterios de búsqueda especificados"
                      : "Aún no se han registrado ventas. Comienza a registrar tus primeras transacciones"}
                  </p>
                  {(searchTerm || dateFilter) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("")
                        setDateFilter("")
                      }}
                      className="mt-8"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Dialog de confirmación para eliminar venta */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Eliminar Venta
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. ¿Está seguro de que desea continuar?
            </DialogDescription>
          </DialogHeader>
          
          {saleToDelete && (
            <div className="bg-muted/50 rounded-xl p-5 my-4 border border-border">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-medium">Venta ID:</span>
                  <span className="font-bold text-primary">
                    #{saleToDelete.venta_id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-medium">Fecha:</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatDateTime(saleToDelete.fecha)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-medium">Total:</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(Number.parseFloat(saleToDelete.total_con_igv))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-medium">Método de Pago:</span>
                  <span className="text-sm font-medium text-foreground capitalize">
                    {saleToDelete.metodo_pago}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Restauración de inventario
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 leading-relaxed">
                      Se restaurará el stock del producto, pero deberá ajustar manualmente los códigos de barras en la sección de productos para mantener la consistencia del inventario.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={cancelDeleteSale}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSale}
              disabled={deletingIds.has(saleToDelete?.venta_id)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingIds.has(saleToDelete?.venta_id) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Venta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SalesPage
