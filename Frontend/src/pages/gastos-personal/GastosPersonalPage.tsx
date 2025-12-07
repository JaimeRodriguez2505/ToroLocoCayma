import { useState, useEffect } from "react"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Textarea } from "../../components/ui/textarea"
import { Label } from "../../components/ui/label"
import { Switch } from "../../components/ui/switch"
import { toast } from "sonner"
import { useAuth } from "../../contexts/AuthContext"
import gastoPersonalService, { GastoPersonal, GastoPersonalFormData, GastoPersonalFilters, DailySummary } from "../../services/gastoPersonalService"
import {
  Plus,
  Eye,
  Edit,
  Trash,
  Check,
  X,
  Clock,
  Receipt,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  SlidersHorizontal,
  AlertCircle,
  FileText,
  TrendingUp,
  BarChart3
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"

type ExtendedGastoPersonalFilters = GastoPersonalFilters & { prioridad?: string }

const GastosPersonalPage = () => {
  useDocumentTitle("Gastos de Personal")

  const { user } = useAuth()
  const [gastos, setGastos] = useState<GastoPersonal[]>([])
  const [loading, setLoading] = useState(false)
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filters, setFilters] = useState<ExtendedGastoPersonalFilters>({
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedGasto, setSelectedGasto] = useState<GastoPersonal | null>(null)

  // Estados para formularios
  const [formData, setFormData] = useState<GastoPersonalFormData>({
    concepto: "",
    monto: 0,
    fecha_gasto: new Date().toISOString().split("T")[0],
    categoria: "otros",
    prioridad: "media",
    es_reembolso: true
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [reviewData, setReviewData] = useState({
    estado: "aprobado" as "aprobado" | "rechazado",
    comentarios: ""
  })

  const isAdmin = user?.id_role === 1 || user?.id_role === 2

  useEffect(() => {
    loadGastos()
  }, [filters])

  useEffect(() => {
    if (isAdmin) {
      loadDailySummary()
    }
  }, [isAdmin, selectedDate])

  const loadDailySummary = async () => {
    if (!isAdmin) return

    try {
      setLoadingDashboard(true)
      const response = await gastoPersonalService.getDailySummary(selectedDate)
      if (response.success) {
        setDailySummary(response.data)
      }
    } catch (error) {
      console.error("Error al cargar resumen diario:", error)
    } finally {
      setLoadingDashboard(false)
    }
  }

  const loadGastos = async () => {
    try {
      setLoading(true)
      const response = await gastoPersonalService.getAll(filters)
      if (response.success) {
        setGastos(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      }
    } catch (error) {
      console.error("Error al cargar gastos:", error)
      toast.error("Error al cargar los gastos")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGasto = async () => {
    const { isValid, errors } = validateForm()
    if (!isValid) {
      toast.error(Object.values(errors)[0])
      return
    }

    const payload: GastoPersonalFormData = {
      ...formData,
      concepto: formData.concepto.trim(),
      descripcion: formData.descripcion?.trim() ? formData.descripcion.trim() : undefined,
      comprobante_url: formData.comprobante_url?.trim() ? formData.comprobante_url.trim() : undefined,
      fecha_gasto: formData.fecha_gasto
    }

    try {
      setFormSubmitting(true)
      const response = await gastoPersonalService.create(payload)
      if (response.success) {
        toast.success("Gasto creado exitosamente")
        setShowCreateModal(false)
        resetForm()
        loadGastos()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear el gasto")
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleUpdateGasto = async () => {
    if (!selectedGasto) return

    const { isValid, errors } = validateForm()
    if (!isValid) {
      toast.error(Object.values(errors)[0])
      return
    }

    const payload: Partial<GastoPersonalFormData> = {
      ...formData,
      concepto: formData.concepto.trim(),
      descripcion: formData.descripcion?.trim() ? formData.descripcion.trim() : undefined,
      comprobante_url: formData.comprobante_url?.trim() ? formData.comprobante_url.trim() : undefined,
      fecha_gasto: formData.fecha_gasto
    }

    try {
      const response = await gastoPersonalService.update(selectedGasto.gasto_id, payload)
      if (response.success) {
        toast.success("Gasto actualizado exitosamente")
        setShowEditModal(false)
        resetForm()
        loadGastos()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar el gasto")
    }
  }

  const handleReviewGasto = async () => {
    if (!selectedGasto) return

    try {
      const response = await gastoPersonalService.review(
        selectedGasto.gasto_id,
        reviewData.estado,
        reviewData.comentarios
      )
      if (response.success) {
        toast.success(`Gasto ${reviewData.estado} exitosamente`)
        setShowReviewModal(false)
        setReviewData({ estado: "aprobado", comentarios: "" })
        loadGastos()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al revisar el gasto")
    }
  }

  const handleDeleteGasto = async (gastoId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este gasto?")) return

    try {
      const response = await gastoPersonalService.delete(gastoId)
      if (response.success) {
        toast.success("Gasto eliminado exitosamente")
        loadGastos()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar el gasto")
    }
  }

  const resetForm = () => {
    setFormData({
      concepto: "",
      monto: 0,
      fecha_gasto: new Date().toISOString().split("T")[0],
      categoria: "otros",
      prioridad: "media",
      es_reembolso: true
    })
    setFormErrors({})
    setFormSubmitting(false)
    setSelectedGasto(null)
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (gasto: GastoPersonal) => {
    setFormErrors({})
    setSelectedGasto(gasto)
    setFormData({
      concepto: gasto.concepto,
      monto: gasto.monto,
      fecha_gasto: gasto.fecha_gasto.split('T')[0],
      descripcion: gasto.descripcion || "",
      categoria: gasto.categoria,
      comprobante_url: gasto.comprobante_url || "",
      prioridad: gasto.prioridad,
      es_reembolso: gasto.es_reembolso
    })
    setShowEditModal(true)
  }

  const openReviewModal = (gasto: GastoPersonal) => {
    setSelectedGasto(gasto)
    setShowReviewModal(true)
  }

  const isValidUrl = (value: string) => {
    try {
      const url = new URL(value)
      return url.protocol === "http:" || url.protocol === "https:"
    } catch {
      return false
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.concepto || !formData.concepto.trim()) {
      errors.concepto = "Ingresa un concepto descriptivo."
    }

    if (!formData.monto || Number.isNaN(Number(formData.monto)) || Number(formData.monto) <= 0) {
      errors.monto = "El monto debe ser mayor a cero."
    }

    if (!formData.fecha_gasto) {
      errors.fecha_gasto = "Selecciona la fecha del gasto."
    } else if (new Date(formData.fecha_gasto) > new Date()) {
      errors.fecha_gasto = "La fecha no puede ser futura."
    }

    if (!formData.categoria) {
      errors.categoria = "Elige una categoría."
    }

    if (formData.comprobante_url && !isValidUrl(formData.comprobante_url)) {
      errors.comprobante_url = "Ingresa una URL de comprobante válida."
    }

    setFormErrors(errors)
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
      case 'aprobado':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>
      case 'rechazado':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getCategoriaText = (categoria: string) => {
    const categorias = {
      'alimentacion': 'Alimentación',
      'transporte': 'Transporte',
      'materiales': 'Materiales',
      'reparaciones': 'Reparaciones',
      'servicios': 'Servicios',
      'limpieza': 'Limpieza',
      'mantenimiento': 'Mantenimiento',
      'otros': 'Otros'
    }
    return categorias[categoria as keyof typeof categorias] || categoria
  }

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'baja':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Baja</Badge>
      case 'media':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Media</Badge>
      case 'alta':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Alta</Badge>
      case 'urgente':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Urgente</Badge>
      default:
        return <Badge variant="outline">{prioridad}</Badge>
    }
  }

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'alimentacion': return '🍽️'
      case 'transporte': return '🚗'
      case 'materiales': return '📦'
      case 'reparaciones': return '🔧'
      case 'servicios': return '⚙️'
      case 'limpieza': return '🧹'
      case 'mantenimiento': return '🛠️'
      default: return '📋'
    }
  }

  const clearAllFilters = () => {
    setFilters({
      page: 1,
      limit: 20
    })
  }

  const hasActiveFilters = () => {
    return filters.concepto || filters.estado || filters.categoria || filters.prioridad || filters.fecha_inicio || filters.fecha_fin
  }

  return (
    <div className="space-y-6 p-4 md:p-6 relative z-10">
      {/* Header mejorado */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-30">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-toro-red to-red-600 rounded-xl">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gastos de Personal</h1>
              <p className="text-muted-foreground">
                Gestión inteligente de gastos y reembolsos
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          size="lg"
          className="bg-gradient-to-r from-toro-red to-red-600 hover:from-toro-red/90 hover:to-red-600/90 shadow-lg hover:shadow-xl transition-all relative z-30"
          style={{ zIndex: 30 }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Registrar Gasto
        </Button>
      </div>

      {/* Dashboard Diario - Mejorado */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-toro-red/5 via-red-50/50 to-orange-50/30 border-toro-red/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-toro-red/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-toro-red" />
                  </div>
                  <h3 className="text-xl font-bold">Resumen Diario</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-picker" className="text-sm font-medium">Fecha:</Label>
                  <Input
                    id="date-picker"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto shadow-sm"
                  />
                </div>
              </div>

              {loadingDashboard ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-toro-red mx-auto" />
                  <p className="mt-2 text-sm text-muted-foreground">Cargando resumen...</p>
                </div>
              ) : dailySummary ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Aprobado</p>
                        <p className="text-2xl font-bold text-green-600">S/ {Number(dailySummary.total_aprobado).toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Pendientes</p>
                        <p className="text-2xl font-bold text-yellow-600">{dailySummary.gastos_pendientes}</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Gastos</p>
                        <p className="text-2xl font-bold text-blue-600">{dailySummary.gastos_del_dia.length}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Receipt className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Categorías Activas</p>
                        <p className="text-2xl font-bold text-fire-600">
                          {new Set(dailySummary.gastos_del_dia.map(g => g.categoria)).size}
                        </p>
                      </div>
                      <div className="p-3 bg-fire-50 rounded-lg">
                        <FileText className="w-6 h-6 text-fire-600" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No hay datos para mostrar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filtros Mejorados */}
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Filtros básicos siempre visibles */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por concepto o descripción..."
                  value={filters.concepto || ""}
                  onChange={(e) => setFilters({ ...filters, concepto: e.target.value, page: 1 })}
                  className="pl-10 h-11 shadow-sm"
                />
              </div>

              <div className="flex gap-3">
                <Select
                  value={filters.estado || "all"}
                  onValueChange={(value) => setFilters({ ...filters, estado: value === "all" ? undefined : value, page: 1 })}
                >
                  <SelectTrigger className="w-full lg:w-48 h-11 shadow-sm">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        Pendiente
                      </div>
                    </SelectItem>
                    <SelectItem value="aprobado">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Aprobado
                      </div>
                    </SelectItem>
                    <SelectItem value="rechazado">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        Rechazado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`h-11 ${showAdvancedFilters ? 'bg-toro-red text-white hover:bg-toro-red/90' : ''}`}
                >
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filtros
                  {hasActiveFilters() && (
                    <Badge className="ml-2 bg-white text-toro-red hover:bg-white" variant="secondary">
                      {[filters.concepto, filters.estado, filters.categoria, filters.prioridad].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Filtros avanzados (colapsables) */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          Categoría
                        </Label>
                        <Select
                          value={filters.categoria || "all"}
                          onValueChange={(value) => setFilters({ ...filters, categoria: value === "all" ? undefined : value, page: 1 })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Todas las categorías" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las categorías</SelectItem>
                            <SelectItem value="alimentacion">🍽️ Alimentación</SelectItem>
                            <SelectItem value="transporte">🚗 Transporte</SelectItem>
                            <SelectItem value="materiales">📦 Materiales</SelectItem>
                            <SelectItem value="reparaciones">🔧 Reparaciones</SelectItem>
                            <SelectItem value="servicios">⚙️ Servicios</SelectItem>
                            <SelectItem value="limpieza">🧹 Limpieza</SelectItem>
                            <SelectItem value="mantenimiento">🛠️ Mantenimiento</SelectItem>
                            <SelectItem value="otros">📋 Otros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Prioridad
                        </Label>
                        <Select
                          value={filters.prioridad || "all"}
                          onValueChange={(value) => setFilters({ ...filters, prioridad: value === "all" ? undefined : value, page: 1 })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Todas las prioridades" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las prioridades</SelectItem>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Rango de fechas
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={filters.fecha_inicio || ""}
                            onChange={(e) => setFilters({ ...filters, fecha_inicio: e.target.value, page: 1 })}
                            className="h-11"
                            placeholder="Desde"
                          />
                          <Input
                            type="date"
                            value={filters.fecha_fin || ""}
                            onChange={(e) => setFilters({ ...filters, fecha_fin: e.target.value, page: 1 })}
                            className="h-11"
                            placeholder="Hasta"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        {pagination.total} resultado{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
                      </p>
                      {hasActiveFilters() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="text-toro-red hover:text-toro-red/90 hover:bg-toro-red/10"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Lista de gastos */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-toro-red mx-auto" />
            <p className="mt-3 text-muted-foreground">Cargando gastos...</p>
          </div>
        ) : gastos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-semibold mb-2">No hay gastos registrados</h3>
              <p className="text-muted-foreground mb-6">
                {hasActiveFilters()
                  ? "No se encontraron gastos con los filtros aplicados"
                  : "Comienza registrando tu primer gasto"
                }
              </p>
              {hasActiveFilters() && (
                <Button variant="outline" onClick={clearAllFilters}>
                  Limpiar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          gastos.map((gasto, index) => (
            <motion.div
              key={gasto.gasto_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-all border-l-4" style={{
                borderLeftColor: gasto.estado === 'aprobado' ? '#10b981' : gasto.estado === 'rechazado' ? '#ef4444' : '#eab308'
              }}>
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3 flex-wrap">
                        <span className="text-3xl">{getCategoriaIcon(gasto.categoria)}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{gasto.concepto}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getEstadoBadge(gasto.estado)}
                            {getPrioridadBadge(gasto.prioridad)}
                            {gasto.es_reembolso && (
                              <Badge variant="outline" className="bg-ember-50 text-ember-700 border-ember-300">
                                <DollarSign className="w-3 h-3 mr-1" />
                                Reembolso
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-700">S/ {Number(gasto.monto).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-700">{format(new Date(gasto.fecha_gasto), "dd/MM/yyyy", { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-fire-50 px-3 py-2 rounded-lg">
                          <User className="w-4 h-4 text-fire-600" />
                          <span className="text-fire-700 truncate">{gasto.usuario_solicitante?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg">
                          <Receipt className="w-4 h-4 text-orange-600" />
                          <span className="text-orange-700">{getCategoriaText(gasto.categoria)}</span>
                        </div>
                      </div>

                      {gasto.descripcion && (
                        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border-l-2 border-muted-foreground/30">
                          {gasto.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="flex lg:flex-col items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGasto(gasto)
                          setShowViewModal(true)
                        }}
                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>

                      {gasto.id_usuario_solicitante === user?.id && gasto.estado === 'pendiente' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(gasto)}
                            className="hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteGasto(gasto.gasto_id)}
                            className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                          >
                            <Trash className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </>
                      )}

                      {isAdmin && gasto.estado === 'pendiente' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewModal(gasto)}
                          className="hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Revisar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Paginación mejorada */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
            className="shadow-sm"
          >
            Anterior
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: pageNum })}
                  className={pagination.page === pageNum ? "bg-toro-red hover:bg-toro-red/90" : "shadow-sm"}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
            className="shadow-sm"
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Modal Crear Gasto - NUEVO DISEÑO MEJORADO */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-toro-red to-red-600 text-white p-6 rounded-t-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Plus className="w-6 h-6" />
                </div>
                Registrar Nuevo Gasto
              </DialogTitle>
              <DialogDescription className="text-white/90 mt-2">
                Completa todos los campos requeridos para enviar el gasto a revisión
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* Sección 1: Información Principal */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 bg-gradient-to-br from-blue-50 to-ember-50 p-5 rounded-xl border-2 border-blue-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-blue-900">Información Principal</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="concepto" className="text-sm font-semibold flex items-center gap-2">
                    Concepto del Gasto <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="concepto"
                    autoFocus
                    value={formData.concepto}
                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                    placeholder="Ej: Compra de insumos para cocina"
                    className={`h-12 ${formErrors.concepto ? "border-red-500 focus-visible:ring-red-500" : "border-blue-300"}`}
                  />
                  {formErrors.concepto && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.concepto}
                    </p>
                  )}
                  <p className="text-xs text-blue-700">Describe brevemente en qué se gastó el dinero</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monto" className="text-sm font-semibold flex items-center gap-2">
                      Monto (S/) <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                      <Input
                        id="monto"
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={formData.monto ? formData.monto : ""}
                        onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                        className={`pl-10 h-12 text-lg font-semibold ${formErrors.monto ? "border-red-500" : "border-green-300"}`}
                        placeholder="0.00"
                      />
                    </div>
                    {formErrors.monto && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.monto}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha_gasto" className="text-sm font-semibold flex items-center gap-2">
                      Fecha del Gasto <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
                      <Input
                        id="fecha_gasto"
                        type="date"
                        value={formData.fecha_gasto || ""}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setFormData({ ...formData, fecha_gasto: e.target.value })}
                        className={`pl-10 h-12 ${formErrors.fecha_gasto ? "border-red-500" : "border-blue-300"}`}
                      />
                    </div>
                    {formErrors.fecha_gasto && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.fecha_gasto}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sección 2: Clasificación */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4 bg-gradient-to-br from-fire-50 to-ember-50 p-5 rounded-xl border-2 border-fire-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-fire-600 rounded-lg">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-fire-900">Clasificación</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-sm font-semibold flex items-center gap-2">
                    Categoría <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger className={`h-12 ${formErrors.categoria ? "border-red-500" : "border-fire-300"}`}>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alimentacion">🍽️ Alimentación</SelectItem>
                      <SelectItem value="transporte">🚗 Transporte</SelectItem>
                      <SelectItem value="materiales">📦 Materiales</SelectItem>
                      <SelectItem value="reparaciones">🔧 Reparaciones</SelectItem>
                      <SelectItem value="servicios">⚙️ Servicios</SelectItem>
                      <SelectItem value="limpieza">🧹 Limpieza</SelectItem>
                      <SelectItem value="mantenimiento">🛠️ Mantenimiento</SelectItem>
                      <SelectItem value="otros">📋 Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioridad" className="text-sm font-semibold">Prioridad</Label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                  >
                    <SelectTrigger className="h-12 border-fire-300">
                      <SelectValue placeholder="Selecciona prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">🟢 Baja</SelectItem>
                      <SelectItem value="media">🔵 Media</SelectItem>
                      <SelectItem value="alta">🟠 Alta</SelectItem>
                      <SelectItem value="urgente">🔴 Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border-2 border-fire-300 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-ember-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-ember-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-fire-900">¿Solicitar reembolso?</p>
                      <p className="text-xs text-fire-700">Activa si esperas recuperar este monto</p>
                    </div>
                  </div>
                  <Switch
                    checked={Boolean(formData.es_reembolso)}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_reembolso: checked })}
                    className="data-[state=checked]:bg-ember-600"
                  />
                </div>
              </div>
            </motion.div>

            {/* Sección 3: Detalles Adicionales */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4 bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border-2 border-amber-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-amber-600 rounded-lg">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-amber-900">Detalles Adicionales</h3>
                <Badge variant="outline" className="ml-auto">Opcional</Badge>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="descripcion" className="text-sm font-semibold">Descripción Detallada</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion || ""}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Añade contexto adicional: proveedores, motivos específicos, personas involucradas..."
                    rows={4}
                    className="border-amber-300 resize-none"
                  />
                  <p className="text-xs text-amber-700">Información útil para auditorías y reportes</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comprobante_url" className="text-sm font-semibold">URL del Comprobante</Label>
                  <Input
                    id="comprobante_url"
                    value={formData.comprobante_url || ""}
                    onChange={(e) => setFormData({ ...formData, comprobante_url: e.target.value })}
                    placeholder="https://drive.google.com/... o enlace a foto"
                    className={formErrors.comprobante_url ? "border-red-500" : "border-amber-300"}
                  />
                  {formErrors.comprobante_url && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.comprobante_url}
                    </p>
                  )}
                  <p className="text-xs text-amber-700">Enlace al comprobante escaneado o fotografiado</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer fijo */}
          <div className="sticky bottom-0 bg-white border-t-2 p-6 rounded-b-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600 font-bold">*</span> Campos obligatorios
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={formSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateGasto}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-toro-red to-red-600 hover:from-toro-red/90 hover:to-red-600/90 shadow-lg"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Guardar Gasto
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Gasto */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
            <DialogDescription>
              Modifica los datos del gasto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-concepto">Concepto *</Label>
              <Input
                id="edit-concepto"
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                placeholder="Ej: Alimentación del día..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-monto">Monto (S/) *</Label>
                <Input
                  id="edit-monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit-fecha_gasto">Fecha del Gasto</Label>
                <Input
                  id="edit-fecha_gasto"
                  type="date"
                  value={formData.fecha_gasto || ""}
                  onChange={(e) => setFormData({ ...formData, fecha_gasto: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-categoria">Categoría *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alimentacion">Alimentación</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="materiales">Materiales</SelectItem>
                    <SelectItem value="reparaciones">Reparaciones</SelectItem>
                    <SelectItem value="servicios">Servicios</SelectItem>
                    <SelectItem value="limpieza">Limpieza</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-prioridad">Prioridad</Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Textarea
                id="edit-descripcion"
                value={formData.descripcion || ""}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada del gasto..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-comprobante_url">URL del Comprobante</Label>
              <Input
                id="edit-comprobante_url"
                value={formData.comprobante_url || ""}
                onChange={(e) => setFormData({ ...formData, comprobante_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateGasto} className="bg-toro-red hover:bg-toro-red/90">
                Actualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Gasto */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del Gasto</DialogTitle>
          </DialogHeader>
          {selectedGasto && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <div className="mt-1">{getEstadoBadge(selectedGasto.estado)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Prioridad</Label>
                  <div className="mt-1">{getPrioridadBadge(selectedGasto.prioridad)}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Concepto</Label>
                <p className="mt-1">{selectedGasto.concepto}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Monto</Label>
                  <p className="mt-1 text-lg font-semibold">S/ {Number(selectedGasto.monto).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Categoría</Label>
                  <p className="mt-1">{getCategoriaText(selectedGasto.categoria)}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Fecha del Gasto</Label>
                <p className="mt-1">{format(new Date(selectedGasto.fecha_gasto), "dd/MM/yyyy", { locale: es })}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Solicitante</Label>
                <p className="mt-1">{selectedGasto.usuario_solicitante?.name}</p>
              </div>

              {selectedGasto.descripcion && (
                <div>
                  <Label className="text-sm font-medium">Descripción</Label>
                  <p className="mt-1">{selectedGasto.descripcion}</p>
                </div>
              )}

              {selectedGasto.comprobante_url && (
                <div>
                  <Label className="text-sm font-medium">Comprobante</Label>
                  <a
                    href={selectedGasto.comprobante_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-blue-600 hover:underline block"
                  >
                    Ver comprobante
                  </a>
                </div>
              )}

              {selectedGasto.usuario_revisor && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Revisado por</Label>
                  <p className="mt-1">{selectedGasto.usuario_revisor.name}</p>

                  {selectedGasto.fecha_revision && (
                    <>
                      <Label className="text-sm font-medium">Fecha de revisión</Label>
                      <p className="mt-1">{format(new Date(selectedGasto.fecha_revision), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                    </>
                  )}

                  {selectedGasto.comentarios_revision && (
                    <>
                      <Label className="text-sm font-medium">Comentarios</Label>
                      <p className="mt-1">{selectedGasto.comentarios_revision}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Revisar Gasto */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revisar Gasto</DialogTitle>
            <DialogDescription>
              Aprobar o rechazar el gasto seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedGasto && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium">{selectedGasto.concepto}</h4>
                <p className="text-sm text-muted-foreground">
                  S/ {Number(selectedGasto.monto).toFixed(2)} - {getCategoriaText(selectedGasto.categoria)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Solicitado por: {selectedGasto.usuario_solicitante?.name}
                </p>
              </div>

              <div>
                <Label htmlFor="estado">Decisión *</Label>
                <Select
                  value={reviewData.estado}
                  onValueChange={(value: "aprobado" | "rechazado") => setReviewData({ ...reviewData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobado">Aprobar</SelectItem>
                    <SelectItem value="rechazado">Rechazar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comentarios">Comentarios</Label>
                <Textarea
                  id="comentarios"
                  value={reviewData.comentarios}
                  onChange={(e) => setReviewData({ ...reviewData, comentarios: e.target.value })}
                  placeholder="Comentarios sobre la decisión..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleReviewGasto}
                  className={reviewData.estado === 'aprobado' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {reviewData.estado === 'aprobado' ? <Check className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
                  {reviewData.estado === 'aprobado' ? 'Aprobar' : 'Rechazar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GastosPersonalPage
