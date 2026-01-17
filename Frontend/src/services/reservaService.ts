import api from "../lib/api"

export interface Reserva {
  id: number
  nombre: string
  telefono: string
  fecha_reserva: string
  hora_reserva?: string
  cantidad_personas: string
  comentarios?: string
  estado: "PENDIENTE" | "RESERVADO" | "CANCELADO" | "COMPLETADO"
  comprobante_url?: string
  createdAt: string
  updatedAt: string
}

export const getAllReservas = async (): Promise<Reserva[]> => {
  const response = await api.get("/reservas")
  return response.data
}

export const updateReservaStatus = async (id: number, estado: string): Promise<Reserva> => {
  const response = await api.patch(`/reservas/${id}/status`, { estado })
  return response.data.reserva
}
