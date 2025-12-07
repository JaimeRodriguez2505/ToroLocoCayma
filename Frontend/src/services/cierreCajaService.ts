import api from "../lib/api"

export interface CierreCajaPayload {
  fecha_apertura: string;
  fecha_cierre: string;
  cajero_id: number;
  saldo_efectivo: number;
  total_efectivo: number;
  total_tarjeta: number;
  total_transferencia: number;
  total_yape?: number;
  total_plin?: number;
  total_pedidosya?: number;
  total_rappi?: number;
  total_uber_eats?: number;
  cantidad_ventas: number;
  estado: string;
  observaciones?: string;
}

export interface CierreCajaResponse {
  id_cierre: number;
  fecha_apertura: string;
  fecha_cierre: string;
  cajero_id: number;
  saldo_efectivo: number;
  total_efectivo: number;
  total_tarjeta: number;
  total_transferencia: number;
  total_yape: number;
  total_plin: number;
  total_pedidosya: number;
  total_rappi: number;
  total_uber_eats: number;
  cantidad_ventas: number;
  total_gastos_aprobados: number;
  saldo_final_esperado: number;
  discrepancia: number;
  estado: string;
  observaciones?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface CierreCajaAlert {
  tipo: 'discrepancia' | 'info' | 'warning';
  mensaje: string;
  severidad: 'baja' | 'media' | 'alta' | 'info';
}

export interface UpdateCierreCajaPayload {
  saldo_efectivo?: number; // Changed from monto_total to saldo_efectivo
  total_efectivo?: number;
  total_tarjeta?: number;
  total_transferencia?: number;
  cantidad_ventas?: number;
  estado?: string;
  observaciones?: string;
}

export async function registrarCierreCaja(data: CierreCajaPayload): Promise<{
  message: string;
  cierre: CierreCajaResponse;
  alertas: CierreCajaAlert[];
}> {
  const response = await api.post("/cierre-caja", data)
  return response.data
}

export async function actualizarCierreCaja(id: number, data: UpdateCierreCajaPayload) {
  const response = await api.put(`/api/cierre-caja/${id}`, data)
  return response.data
}

export async function obtenerCierreCajaPorFecha(fecha_apertura: string) {
  // Se asume que el backend acepta el query param ?fecha_apertura=YYYY-MM-DD
  const response = await api.get(`/cierre-caja?fecha_apertura=${fecha_apertura}`);
  return response.data;
}

export async function obtenerCierresCajaPorRango(fechaInicio: string, fechaFin: string) {
  const response = await api.get(`/cierre-caja/rango-fechas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  return response.data;
}

export async function obtenerTodosLosCierresCaja() {
  const response = await api.get("/cierre-caja");
  return response.data;
}
