"use client"

import { useState, useEffect } from "react"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { 
  ClipboardList, 
  RefreshCw, 
  Trash2, 
  Play, 
  CheckCircle, 
  Clock, 
  ChefHat, 
  Package, 
  Truck,
  XCircle,
  Filter,
  Search,
  Timer,
  AlertTriangle,
  Eye,
  MoreVertical,
  MapPin,
  Users,
  Calendar,
  TrendingUp,
  Settings
} from "lucide-react"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu"
import { Separator } from "../../components/ui/separator"
import comandasService, { Comanda, ComandaEstadisticas } from "../../services/comandasService"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { useTheme } from "../../lib/theme"

const ComandasPage = () => {
  useDocumentTitle("Comandas")
  const { theme } = useTheme()
  
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEstado, setFilterEstado] = useState<string>("todos")
  const [filterTipo, setFilterTipo] = useState<string>("todos")
  const [fechaInicio, setFechaInicio] = useState<string>("")
  const [fechaFin, setFechaFin] = useState<string>("")
  const [comandaToDelete, setComandaToDelete] = useState<number | null>(null)
  const [estadisticas, setEstadisticas] = useState<ComandaEstadisticas>({
    pendiente: 0,
    en_proceso: 0,
    listo: 0,
    entregado: 0,
    total: 0
  })
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'chef' | 'kanban' | 'grid'>('chef')
  const [showFilters, setShowFilters] = useState(true)

  // Funciones auxiliares mejoradas para modo oscuro
  const getEstadoBadge = (estado: string) => {
    const estadoConfig = {
      pendiente: {
        color: theme === 'dark'
          ? "bg-toro-red/10 text-toro-red border-toro-red/40"
          : "bg-toro-red/10 text-toro-red border-toro-red/30",
        icon: Clock,
        label: "Pendiente"
      },
      en_proceso: {
        color: theme === 'dark'
          ? "bg-toro-red/15 text-toro-red border-toro-red/40"
          : "bg-toro-red/15 text-toro-red border-toro-red/30",
        icon: ChefHat,
        label: "En Proceso"
      },
      listo: {
        color: theme === 'dark'
          ? "bg-neutral-800 text-neutral-100 border-neutral-700"
          : "bg-neutral-100 text-neutral-800 border-neutral-200",
        icon: Package,
        label: "Listo"
      },
      entregado: {
        color: theme === 'dark'
          ? "bg-neutral-900/40 text-neutral-300 border-neutral-700"
          : "bg-neutral-100 text-neutral-700 border-neutral-200",
        icon: CheckCircle,
        label: "Entregado"
      },
      expirado: {
        color: theme === 'dark'
          ? "bg-toro-red/20 text-toro-red border-toro-red/50"
          : "bg-toro-red/15 text-toro-red border-toro-red/40",
        icon: XCircle,
        label: "Expirado"
      }
    }
    
    const config = estadoConfig[estado as keyof typeof estadoConfig] || estadoConfig.pendiente
    const IconComponent = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-2 font-bold border-2 px-3 py-1.5 text-sm shadow-lg`}>
        <IconComponent className="w-4 h-4" />
        {config.label}
      </Badge>
    )
  }

  const getTipoComandaBadge = (comanda: Comanda) => {
    const base = theme === 'dark'
      ? 'bg-toro-red/10 text-toro-red border-toro-red/40'
      : 'bg-toro-red/10 text-toro-red border-toro-red/30'

    if (comanda.es_delivery) {
      return (
        <Badge className={`${base} flex items-center gap-2 font-bold border-2 px-3 py-1.5 text-sm`}>
          <Truck className="w-4 h-4" />
          Delivery #{comanda.numero_carrito}
        </Badge>
      )
    }

    return (
      <Badge className={`${base} flex items-center gap-2 font-bold border-2 px-3 py-1.5 text-sm`}>
        <MapPin className="w-4 h-4" />
        Mesa {comanda.numero_carrito}
      </Badge>
    )
  }

  const getTiempoTranscurrido = (fechaCreacion: string) => {
    const ahora = new Date()
    const creacion = new Date(fechaCreacion)
    const diffMs = ahora.getTime() - creacion.getTime()
    const diffMinutos = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutos < 60) {
      return `${diffMinutos}m`
    }
    
    const diffHoras = Math.floor(diffMinutos / 60)
    const minutosRestantes = diffMinutos % 60
    return `${diffHoras}h ${minutosRestantes}m`
  }

  const getTiempoExpiracion = (comanda: Comanda) => {
    if (!comanda.es_delivery || !comanda.fecha_expiracion) return null
    
    const ahora = new Date()
    const expiracion = new Date(comanda.fecha_expiracion)
    const diffMs = expiracion.getTime() - ahora.getTime()
    const diffMinutos = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutos <= 0) return { 
      texto: "¡EXPIRADA!", 
      color: theme === 'dark' ? "text-red-300" : "text-red-600", 
      urgente: true 
    }
    if (diffMinutos <= 5) return { 
      texto: `${diffMinutos}m restantes`, 
      color: theme === 'dark' ? "text-red-300" : "text-red-600", 
      urgente: true 
    }
    if (diffMinutos <= 15) return { 
      texto: `${diffMinutos}m restantes`, 
      color: theme === 'dark' ? "text-orange-300" : "text-orange-600", 
      urgente: false 
    }
    
    return { 
      texto: `${diffMinutos}m restantes`, 
      color: theme === 'dark' ? "text-green-300" : "text-green-600", 
      urgente: false 
    }
  }

  // Cargar comandas del backend
  const loadComandas = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      
      const [comandasData, stats] = await Promise.all([
        comandasService.getAll(),
        comandasService.getEstadisticas()
      ])
      
      setComandas(comandasData)
      setEstadisticas(stats)
    } catch (error) {
      console.error("Error al cargar comandas:", error)
      if (showLoading) toast.error("Error al cargar comandas")
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    loadComandas()
    
    // Actualizar cada 3 segundos para el chef
    const interval = setInterval(() => {
      loadComandas(false)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  // Filtrar comandas
  const filteredComandas = comandas.filter(comanda => {
    const matchesSearch = comanda.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comanda.numero_carrito.toString().includes(searchTerm) ||
                         comanda.comanda_id.toString().includes(searchTerm)
    
    const matchesEstado = filterEstado === "todos" || comanda.estado === filterEstado
    const matchesTipo = filterTipo === "todos" || 
                       (filterTipo === "mesa" && !comanda.es_delivery) ||
                       (filterTipo === "delivery" && comanda.es_delivery)
    
    let matchesFecha = true
    if (fechaInicio || fechaFin) {
      const fechaComanda = new Date(comanda.fecha_creacion).toISOString().split('T')[0]
      if (fechaInicio && fechaComanda < fechaInicio) matchesFecha = false
      if (fechaFin && fechaComanda > fechaFin) matchesFecha = false
    }
    
    return matchesSearch && matchesEstado && matchesTipo && matchesFecha
  })

  // Comandas activas y orden por urgencia (para vista Chef)
  const activeComandas = filteredComandas.filter(c => c.estado !== 'entregado' && c.estado !== 'expirado')
  const getMinutesSince = (dateStr: string) => {
    const now = new Date()
    const d = new Date(dateStr)
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60))
  }
  const getMinutesToExpiration = (c: Comanda) => {
    if (!c.es_delivery || !c.fecha_expiracion) return null
    const now = new Date()
    const exp = new Date(c.fecha_expiracion)
    return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60))
  }
  const estadoWeight: Record<Comanda['estado'], number> = { pendiente: 3, en_proceso: 2, listo: 1, entregado: 0, expirado: 0 }
  const sortedActiveComandas = [...activeComandas].sort((a, b) => {
    const w = estadoWeight[a.estado] - estadoWeight[b.estado]
    if (w !== 0) return w * -1
    const aExp = getMinutesToExpiration(a)
    const bExp = getMinutesToExpiration(b)
    if (aExp !== null && bExp !== null && aExp !== bExp) return aExp - bExp
    return getMinutesSince(b.fecha_creacion) - getMinutesSince(a.fecha_creacion)
  })
  const activeCounts = {
    total: activeComandas.length,
    mesas: activeComandas.filter(c => !c.es_delivery).length,
    delivery: activeComandas.filter(c => c.es_delivery).length,
  }

  // Actualizar estado de comanda
  const updateComandaEstado = async (id: number, estado: 'pendiente' | 'en_proceso' | 'listo' | 'entregado') => {
    try {
      await comandasService.updateEstado(id, { estado })
      toast.success(`Comanda marcada como ${estado}`)
      loadComandas(false)
    } catch (error) {
      console.error("Error al actualizar estado:", error)
      toast.error("Error al actualizar el estado")
    }
  }

  // Eliminar comanda
  const deleteComanda = async (id: number) => {
    try {
      await comandasService.delete(id)
      toast.success("Comanda eliminada exitosamente")
      setComandaToDelete(null)
      loadComandas(false)
    } catch (error) {
      console.error("Error al eliminar comanda:", error)
      toast.error("Error al eliminar la comanda")
    }
  }

  // Tarjeta compacta para vista Chef (densa)
  const ChefCard = ({ comanda }: { comanda: Comanda }) => {
    const tiempoExpiracion = getTiempoExpiracion(comanda)
    const tiempoTranscurrido = getTiempoTranscurrido(comanda.fecha_creacion)
    const nextEstado = comanda.estado === 'pendiente' ? 'en_proceso' : comanda.estado === 'en_proceso' ? 'listo' : 'entregado'
    const EstadoIcon = comanda.estado === 'pendiente' ? Play : comanda.estado === 'en_proceso' ? CheckCircle : Package
    const minutos = parseInt(tiempoTranscurrido.replace(/[hm]/g, ''))
    const esUrgente = minutos > 30 || tiempoExpiracion?.urgente
    
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Card className={`
          ${theme === 'dark' 
            ? 'border-gray-700/50 bg-gradient-to-b from-gray-900 to-gray-800' 
            : 'border-gray-200 bg-white'}
          ${comanda.es_delivery 
            ? (theme === 'dark' 
                ? 'bg-gradient-to-b from-red-950/40 to-red-900/30 border-red-700/50' 
                : 'bg-gradient-to-b from-red-50 to-red-100/80 border-red-200/80') 
            : ''}
          ${esUrgente 
            ? 'ring-2 ring-red-500/60 shadow-lg shadow-red-500/10' 
            : 'shadow-md hover:shadow-lg'}
          transition-all duration-300 p-4 rounded-xl overflow-hidden
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {comanda.es_delivery ? (
                <div className="bg-toro-red/20 p-1.5 rounded-lg">
                  <Truck className="h-4 w-4 text-toro-red" />
                </div>
              ) : (
                <div className="bg-blue-500/20 p-1.5 rounded-lg">
                  <MapPin className="h-4 w-4 text-blue-500" />
                </div>
              )}
              <div>
                <span className="font-bold text-sm">{comanda.es_delivery ? `Delivery #${comanda.numero_carrito}` : `Mesa ${comanda.numero_carrito}`}</span>
                {comanda.es_delivery && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-toro-red to-red-600 text-white shadow-sm">
                    DELIVERY
                  </span>
                )}
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => updateComandaEstado(comanda.comanda_id, nextEstado as any)} 
              className={`
                rounded-full p-2 h-8 w-8 
                ${theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' 
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-sm'}
              `}
            >
              <EstadoIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-full
              ${theme === 'dark' 
                ? 'bg-gray-800/80 text-gray-300' 
                : 'bg-gray-100 text-gray-600'}
            `}>
              <Timer className="h-3 w-3" />
              <span>{tiempoTranscurrido}</span>
            </div>
            
            {tiempoExpiracion && (
              <div className={`
                px-2 py-1 rounded-full font-medium
                ${tiempoExpiracion.urgente
                  ? (theme === 'dark' ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-600')
                  : (theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-600')}
              `}>
                {tiempoExpiracion.texto}
              </div>
            )}
            
            <div className={`
              px-2 py-1 rounded-full font-medium
              ${theme === 'dark' ? 'bg-gray-800/80 text-white' : 'bg-gray-100 text-gray-700'}
            `}>
              {comanda.productos.length} prod
            </div>
          </div>
          
          <div className={`
            mt-3 rounded-lg 
            ${theme === 'dark' 
              ? (comanda.es_delivery ? 'bg-red-950/50' : 'bg-gray-800/80') 
              : (comanda.es_delivery ? 'bg-red-100/80' : 'bg-gray-50')} 
            p-3 max-h-40 overflow-auto border
            ${theme === 'dark'
              ? (comanda.es_delivery ? 'border-red-900/50' : 'border-gray-700/50')
              : (comanda.es_delivery ? 'border-red-200/50' : 'border-gray-200/50')}
          `}>
            {comanda.productos.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs mb-2 last:mb-0">
                <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  <span className={`
                    min-w-[24px] text-center font-bold px-1.5 py-0.5 rounded
                    ${theme === 'dark' 
                      ? 'bg-gray-700/80 text-white' 
                      : 'bg-gray-200 text-gray-900'}
                  `}>
                    {p.cantidad}x
                  </span>
                  <span className="truncate max-w-[12rem] font-medium">{p.nombre}</span>
                </div>
                <span className={`
                  ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} 
                  font-medium px-1.5 py-0.5 rounded
                  ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}
                `}>
                  S/ {Number(p.precioConIgv).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    )
  }

  // Componente de tarjeta de comanda MEJORADO para el chef
  const ComandaCard = ({ comanda }: { comanda: Comanda }) => {
    const tiempoExpiracion = getTiempoExpiracion(comanda)
    const tiempoTranscurrido = getTiempoTranscurrido(comanda.fecha_creacion)
    
    // Determinar urgencia por tiempo
    const minutos = parseInt(tiempoTranscurrido.replace(/[hm]/g, ''))
    const esUrgente = minutos > 30 || tiempoExpiracion?.urgente
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className="group"
      >
        <Card className={`
          relative overflow-hidden transition-all duration-300 cursor-pointer
          ${theme === 'dark' 
            ? `bg-gray-900/90 border-gray-700/50 hover:bg-gray-800/90 hover:border-gray-600/80 shadow-xl` 
            : `bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-lg`
          }
          ${tiempoExpiracion?.urgente ? 
            (theme === 'dark' ? 'border-red-500/70 shadow-red-500/20' : 'border-red-300 shadow-red-100') : ''
          }
          ${comanda.estado === 'listo' ? 
            (theme === 'dark' ? 'border-green-500/70 shadow-green-500/20' : 'border-green-300 shadow-green-100') : ''
          }
          ${comanda.estado === 'en_proceso' ? 
            (theme === 'dark' ? 'border-blue-500/70 shadow-blue-500/20' : 'border-blue-300 shadow-blue-100') : ''
          }
          ${esUrgente ? 'ring-2 ring-red-500/50' : ''}
        `}>
          
          {/* Banner de urgencia */}
          {esUrgente && (
            <div className={`absolute top-0 left-0 right-0 h-2 ${
              theme === 'dark' ? 'bg-red-500/80' : 'bg-red-500'
            } animate-pulse`} />
          )}
          
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex flex-col gap-3">
                {getTipoComandaBadge(comanda)}
                {getEstadoBadge(comanda.estado)}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost" 
                    size="sm" 
                    className={`h-8 w-8 p-0 ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-700/50 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : ''}
                >
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedComanda(comanda)
                      setIsDetailDialogOpen(true)
                    }}
                    className={theme === 'dark' ? 'hover:bg-gray-700' : ''}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                  
                  {comanda.estado === 'pendiente' && (
                    <DropdownMenuItem 
                      onClick={() => updateComandaEstado(comanda.comanda_id, 'en_proceso')}
                      className={theme === 'dark' ? 'hover:bg-gray-700' : ''}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar
                    </DropdownMenuItem>
                  )}
                  
                  {comanda.estado === 'en_proceso' && (
                    <DropdownMenuItem 
                      onClick={() => updateComandaEstado(comanda.comanda_id, 'listo')}
                      className={theme === 'dark' ? 'hover:bg-gray-700' : ''}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar listo
                    </DropdownMenuItem>
                  )}
                  
                  {comanda.estado === 'listo' && (
                    <DropdownMenuItem 
                      onClick={() => updateComandaEstado(comanda.comanda_id, 'entregado')}
                      className={theme === 'dark' ? 'hover:bg-gray-700' : ''}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Entregar
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem 
                    className={`${theme === 'dark' ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600'}`}
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="space-y-3">
              <h3 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {comanda.nombre}
              </h3>
              
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <Timer className="h-4 w-4" />
                  <span className={esUrgente ? (theme === 'dark' ? 'text-red-300' : 'text-red-600') : ''}>
                    {tiempoTranscurrido}
                  </span>
                </div>

                {tiempoExpiracion && (
                  <div className={`flex items-center gap-2 text-sm font-bold ${tiempoExpiracion.color}`}>
                    <AlertTriangle className="h-4 w-4" />
                    {tiempoExpiracion.texto}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className="font-bold text-lg">{comanda.productos.length}</span> productos
              </div>

              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-green-300' : 'text-green-600'
                }`}>
                  S/ {Number(comanda.total_con_igv).toFixed(2)}
                </p>
              </div>

              {comanda.observaciones && (
                <div className={`text-sm border-t pt-3 ${
                  theme === 'dark' 
                    ? 'text-yellow-300 border-gray-700 bg-yellow-900/20 p-2 rounded' 
                    : 'text-orange-600 border-gray-200 bg-orange-50 p-2 rounded'
                }`}>
                  <p className="font-medium">📝 Observaciones:</p>
                  <p className="break-words">{comanda.observaciones}</p>
                </div>
              )}

              {comanda.usuario && (
                <div className={`text-xs flex items-center gap-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Users className="h-3 w-3" />
                  <span className="font-medium">{comanda.usuario.name}</span>
                </div>
              )}
            </div>
          </CardContent>
          
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className={`
              ${theme === 'dark' 
                ? 'bg-gray-900 border-gray-700' 
                : 'bg-white border-gray-200'}
              rounded-xl
            `}>
              <DialogHeader>
                <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  Confirmar eliminación
                </DialogTitle>
                <DialogDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                  ¿Estás seguro que deseas eliminar esta comanda? Esta acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                  className={theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : ''}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    deleteComanda(comanda.comanda_id)
                    setShowDeleteDialog(false)
                  }}
                  className="bg-gradient-to-r from-toro-red to-red-600"
                >
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-toro-red" />
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            Cargando comandas...
              </p>
            </div>
          </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 to-gray-100'
    }`}>
      <div className="flex flex-row-reverse h-screen">
        {/* Panel lateral de filtros - derecha */}
        {showFilters && (
        <div className={`w-64 flex-shrink-0 p-6 border-l transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-[#0b0b0c] border-toro-red/20 backdrop-blur-sm' 
            : 'bg-white border-toro-red/10'
        }`}>
          <div className="space-y-6">
            {/* Header del panel */}
                    <div className="space-y-2">
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                🍽️ Comandas
              </h2>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Panel de Control para el Chef
              </p>
      </div>

            <Separator className={theme === 'dark' ? 'bg-toro-red/30' : 'bg-toro-red/20'} />

            {/* Estadísticas compactas */}
          <div className="space-y-3">
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <TrendingUp className="h-5 w-5" />
                Estado Actual
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <Card className={`p-3 ${
                  theme === 'dark' 
                    ? 'bg-toro-red/10 border-toro-red/30' 
                    : 'bg-toro-red/5 border-toro-red/20'
                }`}>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      theme === 'dark' ? 'text-toro-red' : 'text-toro-red'
                    }`}>
                      {estadisticas.pendiente}
                    </p>
                    <p className={`text-xs text-toro-red`}>
                      Pendientes
                    </p>
                </div>
                </Card>
                
                <Card className={`p-3 ${
                  theme === 'dark' 
                    ? 'bg-blue-900/20 border-blue-700/50' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
                    }`}>
                      {estadisticas.en_proceso}
                    </p>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
                    }`}>
                      En Proceso
                    </p>
                </div>
                </Card>
                
                <Card className={`p-3 ${
                  theme === 'dark' 
                    ? 'bg-green-900/20 border-green-700/50' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      theme === 'dark' ? 'text-green-300' : 'text-green-600'
                    }`}>
                      {estadisticas.listo}
                    </p>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-green-400' : 'text-green-700'
                    }`}>
                      Listos
                    </p>
                </div>
                </Card>
                
                <Card className={`p-3 ${
                  theme === 'dark' 
                    ? 'bg-gray-800/50 border-gray-600/50' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {estadisticas.total}
                    </p>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      Total
                    </p>
                </div>
                </Card>
          </div>
        </div>

            <Separator className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} />

            {/* Filtros */}
          <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <Filter className="h-5 w-5" />
                Filtros
              </h3>
              
              <div className="space-y-3">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                  }`} />
              <Input
                    placeholder="Buscar comanda..."
                value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300'
                    }`}
              />
            </div>
            
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className={theme === 'dark' 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                  }>
                    <SelectValue placeholder="Estado" />
                </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-600' : ''}>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="listo">Listo</SelectItem>
                  <SelectItem value="entregado">Entregado</SelectItem>
                    <SelectItem value="expirado">Expirado</SelectItem>
                </SelectContent>
              </Select>

                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className={theme === 'dark' 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                  }>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-600' : ''}>
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    <SelectItem value="mesa">Mesa</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
                
            <div className="space-y-2">
                  <label className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Rango de fechas
                  </label>
                  <div className="space-y-2">
              <Input
                type="date"
                value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className={theme === 'dark' 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                      }
                    />
              <Input
                type="date"
                value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className={theme === 'dark' 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                      }
              />
            </div>
                </div>
              </div>
            </div>
            
            <Separator className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} />

            {/* Controles */}
            <div className="space-y-3">
              <Button
                onClick={() => loadComandas()}
                className="w-full bg-toro-red hover:bg-toro-red/90 text-white font-semibold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'chef' | 'kanban' | 'grid')}>
                <SelectTrigger className={theme === 'dark' 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
                }>
                  <Settings className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-600' : ''}>
                  <SelectItem value="chef">Vista Chef</SelectItem>
                  <SelectItem value="kanban">Vista Kanban</SelectItem>
                  <SelectItem value="grid">Vista Cuadrícula</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        )}

        {/* Área principal de comandas */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-2xl font-bold`}>Comandas activas</h2>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{activeCounts.total} activas · {activeCounts.mesas} mesas · {activeCounts.delivery} delivery</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowFilters(v => !v)} className={theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : ''}>
                <Filter className="h-4 w-4 mr-2" />{showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </Button>
              <Button onClick={() => loadComandas()} className="bg-toro-red hover:bg-toro-red/90 text-white"><RefreshCw className="h-4 w-4 mr-2" />Actualizar</Button>
            </div>
          </div>

          {/* Vista Chef / Kanban / Grid */}
          {viewMode === 'chef' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {sortedActiveComandas.length === 0 ? (
                <div className="col-span-full">
                  <div className={`rounded-xl border p-8 text-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <ClipboardList className={`h-12 w-12 mx-auto mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>No hay comandas activas</p>
                  </div>
                </div>
              ) : (
                sortedActiveComandas.map((comanda) => (
                  <ChefCard key={comanda.comanda_id} comanda={comanda} />
                ))
              )}
            </div>
          ) : viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 h-fit">
              {/* Columna Pendientes */}
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-toro-red/10 border border-toro-red/30' 
                    : 'bg-toro-red/5 border border-toro-red/20'
                }`}>
                  <Clock className="h-6 w-6 text-toro-red" />
                  <h3 className={`font-bold text-lg ${
                    theme === 'dark' ? 'text-toro-red' : 'text-toro-red'
                  }`}>
                    Pendientes
                  </h3>
                  <Badge className={`${
                    theme === 'dark' 
                      ? 'bg-toro-red text-white' 
                      : 'bg-toro-red text-white'
                  } font-bold`}>
                    {filteredComandas.filter(c => c.estado === 'pendiente').length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {filteredComandas.filter(c => c.estado === 'pendiente').map((comanda) => (
                    <ComandaCard key={comanda.comanda_id} comanda={comanda} />
                  ))}
        </div>
      </div>

              {/* Columna En Proceso */}
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-neutral-900/40 border border-neutral-700/60' 
                    : 'bg-neutral-50 border border-neutral-200'
                }`}>
                  <ChefHat className="h-6 w-6 text-neutral-500" />
                  <h3 className={`font-bold text-lg ${
                    theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
                  }`}>
                    En Proceso
                  </h3>
                  <Badge className={`${
                    theme === 'dark' 
                      ? 'bg-neutral-700 text-neutral-100' 
                      : 'bg-neutral-300 text-neutral-800'
                  } font-bold`}>
                    {filteredComandas.filter(c => c.estado === 'en_proceso').length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {filteredComandas.filter(c => c.estado === 'en_proceso').map((comanda) => (
                    <ComandaCard key={comanda.comanda_id} comanda={comanda} />
                  ))}
                </div>
              </div>

              {/* Columna Listos */}
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-emerald-900/20 border border-emerald-700/50' 
                    : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  <Package className="h-6 w-6 text-emerald-600" />
                  <h3 className={`font-bold text-lg ${
                    theme === 'dark' ? 'text-green-300' : 'text-green-800'
                  }`}>
                    Listos
                  </h3>
                  <Badge className={`${
                    theme === 'dark' 
                      ? 'bg-emerald-700 text-emerald-100' 
                      : 'bg-emerald-200 text-emerald-800'
                  } font-bold`}>
                    {filteredComandas.filter(c => c.estado === 'listo').length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {filteredComandas.filter(c => c.estado === 'listo').map((comanda) => (
                    <ComandaCard key={comanda.comanda_id} comanda={comanda} />
                  ))}
                </div>
              </div>

              {/* Columna Entregados/Expirados */}
              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-neutral-900/30 border border-neutral-700/60' 
                    : 'bg-neutral-50 border border-neutral-200'
                }`}>
                  <CheckCircle className="h-6 w-6 text-neutral-500" />
                  <h3 className={`font-bold text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                  }`}>
                    Completados
                  </h3>
                  <Badge className={`${
                    theme === 'dark' 
                      ? 'bg-gray-600 text-gray-100' 
                      : 'bg-gray-200 text-gray-800'
                  } font-bold`}>
                    {filteredComandas.filter(c => c.estado === 'entregado' || c.estado === 'expirado').length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {filteredComandas.filter(c => c.estado === 'entregado' || c.estado === 'expirado').map((comanda) => (
                    <ComandaCard key={comanda.comanda_id} comanda={comanda} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredComandas.length === 0 ? (
                <div className="col-span-full">
                  <div className={`rounded-xl shadow-sm border p-12 text-center ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <ClipboardList className={`h-16 w-16 mx-auto mb-4 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <h3 className={`text-xl font-semibold mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      No hay comandas
                    </h3>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                      {searchTerm || filterEstado !== "todos" || filterTipo !== "todos"
                        ? "No se encontraron comandas con los filtros aplicados"
                        : "Las comandas aparecerán aquí cuando se guarden mesas"
                      }
                    </p>
                  </div>
                </div>
              ) : (
                filteredComandas.map((comanda) => (
                  <ComandaCard key={comanda.comanda_id} comanda={comanda} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className={`max-w-3xl ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              Detalles de la Comanda
            </DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Información completa de la comanda seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedComanda && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Número
                  </label>
                  <p className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {selectedComanda.numero_carrito}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Estado
                  </label>
                  <div className="mt-1">{getEstadoBadge(selectedComanda.estado)}</div>
                </div>
                <div>
                  <label className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Tipo
                  </label>
                  <div className="mt-1">{getTipoComandaBadge(selectedComanda)}</div>
                </div>
                <div>
                  <label className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Total
                  </label>
                  <p className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-green-300' : 'text-green-600'
                  }`}>
                    S/ {Number(selectedComanda.total_con_igv).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div>
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Productos
                </label>
                <div className="mt-2 space-y-2">
                  {selectedComanda.productos.map((producto, index) => (
                    <div key={index} className={`flex justify-between items-center p-3 rounded ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                        {producto.nombre}
                      </span>
                      <span className={`font-semibold ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {producto.cantidad} x S/ {Number(producto.precioConIgv).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedComanda.observaciones && (
                <div>
                  <label className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Observaciones
                  </label>
                  <p className={`mt-1 p-3 rounded ${
                    theme === 'dark' 
                      ? 'text-yellow-300 bg-yellow-900/20' 
                      : 'text-orange-600 bg-orange-50'
                  }`}>
                    {selectedComanda.observaciones}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar */}
      <Dialog open={comandaToDelete !== null} onOpenChange={() => setComandaToDelete(null)}>
        <DialogContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              ¿Estás seguro de que deseas eliminar esta comanda? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setComandaToDelete(null)}
              className={theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => comandaToDelete && deleteComanda(comandaToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ComandasPage