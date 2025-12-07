import api from "../lib/api"

export interface GastoPersonal {
  gasto_id: number
  concepto: string
  monto: number
  fecha_gasto: string
  descripcion?: string
  categoria: 'alimentacion' | 'transporte' | 'materiales' | 'reparaciones' | 'servicios' | 'limpieza' | 'mantenimiento' | 'otros'
  comprobante_url?: string
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  id_usuario_solicitante: number
  id_usuario_revisor?: number
  fecha_revision?: string
  comentarios_revision?: string
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  es_reembolso: boolean
  created_at: string
  updated_at: string
  usuario_solicitante?: {
    id_user: number
    name: string
    email: string
  }
  usuario_revisor?: {
    id_user: number
    name: string
    email: string
  }
}

export interface GastoPersonalFormData {
  concepto: string
  monto: number
  fecha_gasto?: string
  descripcion?: string
  categoria: string
  comprobante_url?: string
  prioridad?: string
  es_reembolso?: boolean
}

export interface GastoPersonalFilters {
  estado?: string
  categoria?: string
  usuario_id?: number
  fecha_inicio?: string
  fecha_fin?: string
  concepto?: string
  page?: number
  limit?: number
}

export interface GastoPersonalStats {
  por_estado: Array<{
    estado: string
    cantidad: number
    total_monto: number
  }>
  por_categoria: Array<{
    categoria: string
    cantidad: number
    total_monto: number
  }>
  gastos_pendientes: number
}

export interface DailySummary {
  fecha: string
  gastos_del_dia: GastoPersonal[]
  resumen_por_categoria: Array<{
    categoria: string
    estado: string
    cantidad: number
    total_monto: number
  }>
  resumen_por_estado: Array<{
    estado: string
    cantidad: number
    total_monto: number
  }>
  total_aprobado: number
  gastos_pendientes: number
  gastos_pendientes_detalle: GastoPersonal[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const gastoPersonalService = {
  // Obtener todos los gastos
  getAll: async (filters: GastoPersonalFilters = {}): Promise<ApiResponse<GastoPersonal[]>> => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const response = await api.get(`/gastos-personal?${params.toString()}`)
    return response.data
  },

  // Obtener un gasto por ID
  getById: async (id: number): Promise<ApiResponse<GastoPersonal>> => {
    const response = await api.get(`/gastos-personal/${id}`)
    return response.data
  },

  // Crear un nuevo gasto
  create: async (data: GastoPersonalFormData): Promise<ApiResponse<GastoPersonal>> => {
    const response = await api.post('/gastos-personal', data)
    return response.data
  },

  // Actualizar un gasto
  update: async (id: number, data: Partial<GastoPersonalFormData>): Promise<ApiResponse<GastoPersonal>> => {
    const response = await api.put(`/gastos-personal/${id}`, data)
    return response.data
  },

  // Revisar un gasto (aprobar/rechazar)
  review: async (id: number, estado: 'aprobado' | 'rechazado', comentarios?: string): Promise<ApiResponse<GastoPersonal>> => {
    const response = await api.patch(`/gastos-personal/${id}/review`, {
      estado,
      comentarios_revision: comentarios
    })
    return response.data
  },

  // Eliminar un gasto
  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/gastos-personal/${id}`)
    return response.data
  },

  // Obtener estadísticas (solo administradores)
  getStats: async (filters: { fecha_inicio?: string; fecha_fin?: string } = {}): Promise<ApiResponse<GastoPersonalStats>> => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    
    const response = await api.get(`/gastos-personal/admin/stats?${params.toString()}`)
    return response.data
  },

  // Obtener resumen diario (solo administradores)
  getDailySummary: async (fecha: string): Promise<ApiResponse<DailySummary>> => {
    const response = await api.get(`/gastos-personal/admin/daily-summary/${fecha}`)
    return response.data
  },

  // Obtener gastos más frecuentes por categoría
  getFrequentExpenses: async (filters: { fecha_inicio?: string; fecha_fin?: string; limit?: number } = {}): Promise<ApiResponse<Array<{
    categoria: string;
    frecuencia: number;
    monto_promedio: number;
    monto_total: number;
  }>>> => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const response = await api.get(`/gastos-personal/admin/frecuentes?${params.toString()}`)
    return response.data
  },

  // Obtener ranking de empleados con más gastos
  getEmployeeRanking: async (filters: { fecha_inicio?: string; fecha_fin?: string; limit?: number } = {}) => {
    const allGastos = await gastoPersonalService.getAll(filters)

    const employeeStats = new Map<number, {
      id: number
      name: string
      email: string
      total_gastos: number
      cantidad_gastos: number
      monto_total: number
    }>()

    allGastos.data.forEach(gasto => {
      if (gasto.usuario_solicitante) {
        const userId = gasto.usuario_solicitante.id_user
        const current = employeeStats.get(userId)

        if (current) {
          current.cantidad_gastos++
          current.monto_total += gasto.monto
        } else {
          employeeStats.set(userId, {
            id: userId,
            name: gasto.usuario_solicitante.name,
            email: gasto.usuario_solicitante.email,
            total_gastos: 1,
            cantidad_gastos: 1,
            monto_total: gasto.monto
          })
        }
      }
    })

    return Array.from(employeeStats.values())
      .sort((a, b) => b.monto_total - a.monto_total)
      .slice(0, filters.limit || 10)
  },

  // Obtener gastos agrupados por día
  getExpensesByDay: async (filters: { fecha_inicio?: string; fecha_fin?: string } = {}) => {
    const allGastos = await gastoPersonalService.getAll(filters)

    const dayStats = new Map<string, {
      fecha: string
      cantidad: number
      monto_total: number
      por_estado: Record<string, number>
    }>()

    allGastos.data.forEach(gasto => {
      const fecha = gasto.fecha_gasto.split('T')[0]
      const current = dayStats.get(fecha)

      if (current) {
        current.cantidad++
        current.monto_total += gasto.monto
        current.por_estado[gasto.estado] = (current.por_estado[gasto.estado] || 0) + gasto.monto
      } else {
        dayStats.set(fecha, {
          fecha,
          cantidad: 1,
          monto_total: gasto.monto,
          por_estado: { [gasto.estado]: gasto.monto }
        })
      }
    })

    return Array.from(dayStats.values())
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  },

  // Obtener promedios y comparativas
  getExpenseAverages: async (filters: { fecha_inicio?: string; fecha_fin?: string } = {}) => {
    const allGastos = await gastoPersonalService.getAll({ ...filters, estado: 'aprobado' })

    const gastos = allGastos.data
    const totalMonto = gastos.reduce((sum, g) => sum + g.monto, 0)
    const cantidad = gastos.length

    // Agrupar por semana
    const weekStats = new Map<string, number>()
    gastos.forEach(gasto => {
      const date = new Date(gasto.fecha_gasto)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay() + 1) // Lunes
      const weekKey = weekStart.toISOString().split('T')[0]
      weekStats.set(weekKey, (weekStats.get(weekKey) || 0) + gasto.monto)
    })

    // Agrupar por mes
    const monthStats = new Map<string, number>()
    gastos.forEach(gasto => {
      const date = new Date(gasto.fecha_gasto)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthStats.set(monthKey, (monthStats.get(monthKey) || 0) + gasto.monto)
    })

    return {
      promedio_general: cantidad > 0 ? totalMonto / cantidad : 0,
      total_aprobado: totalMonto,
      cantidad_total: cantidad,
      promedio_semanal: weekStats.size > 0 ? Array.from(weekStats.values()).reduce((a, b) => a + b, 0) / weekStats.size : 0,
      promedio_mensual: monthStats.size > 0 ? Array.from(monthStats.values()).reduce((a, b) => a + b, 0) / monthStats.size : 0,
      por_semana: Array.from(weekStats.entries()).map(([semana, monto]) => ({ semana, monto })),
      por_mes: Array.from(monthStats.entries()).map(([mes, monto]) => ({ mes, monto }))
    }
  },

  // Detectar gastos inusuales
  getUnusualExpenses: async (filters: { fecha_inicio?: string; fecha_fin?: string } = {}) => {
    const allGastos = await gastoPersonalService.getAll({ ...filters, estado: 'aprobado' })

    const gastos = allGastos.data
    if (gastos.length === 0) return []

    // Calcular promedio y desviación estándar
    const montos = gastos.map(g => g.monto)
    const promedio = montos.reduce((a, b) => a + b, 0) / montos.length
    const varianza = montos.reduce((sum, monto) => sum + Math.pow(monto - promedio, 2), 0) / montos.length
    const desviacion = Math.sqrt(varianza)

    // Gastos que están 2 desviaciones estándar por encima del promedio
    const umbral = promedio + (2 * desviacion)

    return gastos
      .filter(g => g.monto > umbral)
      .sort((a, b) => b.monto - a.monto)
      .map(g => ({
        ...g,
        diferencia_promedio: g.monto - promedio,
        porcentaje_sobre_promedio: ((g.monto - promedio) / promedio) * 100
      }))
  }
}

export default gastoPersonalService
