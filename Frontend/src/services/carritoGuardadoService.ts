import api from "../lib/api"

// Interfaces para los carritos guardados
export interface CartItem {
  producto_id: number
  nombre: string
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
  precioOriginal?: string
  precioOriginalConIgv?: string
  imagen_url?: string
}

export interface CarritoGuardado {
  carrito_id: number
  numero_carrito: number
  nombre: string
  items: CartItem[]
  metodo_pago: string
  observaciones: string | null
  tipo_documento: string | null
  cliente_data: any | null
  barcode_search_results: any[]
  id_usuario: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  usuario?: {
    id_user: number
    name: string
    email: string
  }
}

export interface CarritoGuardadoFormData {
  numero_carrito: number
  items: CartItem[]
  metodo_pago: string
  observaciones?: string
  tipo_documento?: string
  cliente_data?: any
  barcode_search_results?: any[]
}

export interface CarritoGuardadoResponse {
  message: string
  carrito: CarritoGuardado
}

export type CarritosGuardadosResponse = CarritoGuardado[]

// Servicio para carritos guardados
export const carritoGuardadoService = {
  // Obtener todos los carritos guardados
  getAll: async (): Promise<CarritosGuardadosResponse> => {
    const response = await api.get('/carritos')
    return response.data
  },

  // Obtener un carrito específico por número
  getByNumber: async (numero: number): Promise<CarritoGuardado> => {
    const response = await api.get(`/carritos/${numero}`)
    return response.data
  },

  // Crear o actualizar un carrito
  saveOrUpdate: async (data: CarritoGuardadoFormData): Promise<CarritoGuardadoResponse> => {
    const response = await api.post('/carritos', data)
    return response.data
  },

  // Actualizar un carrito específico
  update: async (numero: number, data: CarritoGuardadoFormData): Promise<CarritoGuardadoResponse> => {
    const response = await api.put(`/carritos/${numero}`, data)
    return response.data
  },

  // Limpiar un carrito (marcarlo como vacío)
  clear: async (numero: number): Promise<CarritoGuardadoResponse> => {
    const response = await api.delete(`/carritos/${numero}/clear`)
    return response.data
  },

  // Eliminar un carrito completamente
  delete: async (numero: number): Promise<{ message: string }> => {
    const response = await api.delete(`/carritos/${numero}`)
    return response.data
  },

  // Inicializar los 25 carritos por defecto
  initializeDefaultCarts: async (): Promise<CarritosGuardadosResponse> => {
    const response = await api.post('/carritos/initialize')
    return response.data
  }
}

export default carritoGuardadoService
