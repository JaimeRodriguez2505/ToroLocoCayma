import api from '../lib/api';

export interface ComandaProducto {
  id: number;
  nombre: string;
  cantidad: number | string;
  precio: number | string;
  precioConIgv: number | string;
  codigo_barras: string;
}

export interface Comanda {
  comanda_id: number;
  numero_carrito: number;
  nombre: string;
  productos: ComandaProducto[];
  total: number | string;
  total_con_igv: number | string;
  estado: 'pendiente' | 'en_proceso' | 'listo' | 'entregado' | 'expirado';
  observaciones?: string;
  id_usuario?: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_inicio?: string;
  fecha_listo?: string;
  fecha_entregado?: string;
  fecha_expiracion?: string;
  is_active: boolean;
  es_delivery: boolean;
  usuario?: {
    id_user: number;
    name: string;
    email: string;
  };
}

export interface ComandaEstadisticas {
  pendiente: number;
  en_proceso: number;
  listo: number;
  entregado: number;
  total: number;
}

export interface CreateComandaData {
  numero_carrito?: number;
  es_delivery?: boolean;
  productos: ComandaProducto[];
  observaciones?: string;
  id_usuario?: number;
}

export interface UpdateEstadoData {
  estado: 'pendiente' | 'en_proceso' | 'listo' | 'entregado' | 'expirado';
}

class ComandasService {
  // Obtener todas las comandas
  async getAll(params?: {
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    limit?: number;
    offset?: number;
  }): Promise<Comanda[]> {
    const response = await api.get('/comandas', { params });
    return response.data;
  }

  // Obtener una comanda por ID
  async getById(id: number): Promise<Comanda> {
    const response = await api.get(`/comandas/${id}`);
    return response.data;
  }

  // Obtener comanda por número de carrito
  async getByCarrito(numeroCarrito: number): Promise<Comanda> {
    const response = await api.get(`/comandas/carrito/${numeroCarrito}`);
    return response.data;
  }

  // Crear o actualizar comanda
  async createOrUpdate(data: CreateComandaData): Promise<{ message: string; comanda: Comanda }> {
    const response = await api.post('/comandas', data);
    return response.data;
  }

  // Actualizar estado de comanda
  async updateEstado(id: number, data: UpdateEstadoData): Promise<{ message: string; comanda: Comanda }> {
    const response = await api.put(`/comandas/${id}/estado`, data);
    return response.data;
  }

  // Eliminar comanda
  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/comandas/${id}`);
    return response.data;
  }

  // Obtener estadísticas
  async getEstadisticas(params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<ComandaEstadisticas> {
    const response = await api.get('/comandas/estadisticas', { params });
    return response.data;
  }

  // Métodos de conveniencia para estados específicos
  async iniciarComanda(id: number): Promise<{ message: string; comanda: Comanda }> {
    return this.updateEstado(id, { estado: 'en_proceso' });
  }

  async marcarComandaLista(id: number): Promise<{ message: string; comanda: Comanda }> {
    return this.updateEstado(id, { estado: 'listo' });
  }

  async terminarComanda(id: number): Promise<{ message: string; comanda: Comanda }> {
    return this.updateEstado(id, { estado: 'entregado' });
  }
}

export default new ComandasService();