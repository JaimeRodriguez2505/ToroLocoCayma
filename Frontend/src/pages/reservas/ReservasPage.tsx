"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllReservas, updateReservaStatus } from "../../services/reservaService"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Calendar, Users, Phone, MessageSquare, CheckCircle, XCircle, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Helper para formatear fecha
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: es })
  } catch (e) {
    return dateString
  }
}

// Helper para color de estado
const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDIENTE":
      return "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-yellow-500/50"
    case "RESERVADO":
      return "bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50"
    case "CANCELADO":
      return "bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50"
    case "COMPLETADO":
      return "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 border-blue-500/50"
    default:
      return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30 border-gray-500/50"
  }
}

const ReservasPage = () => {
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const { data: reservas, isLoading, error } = useQuery({
    queryKey: ["reservas"],
    queryFn: getAllReservas,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) => updateReservaStatus(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] })
      toast.success("Estado de reserva actualizado")
    },
    onError: () => {
      toast.error("Error al actualizar estado")
    },
  })

  const handleStatusChange = (id: number, estado: string) => {
    updateStatusMutation.mutate({ id, estado })
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando reservas...</div>
  if (error) return <div className="p-8 text-center text-red-500">Error al cargar reservas</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white glow-text">Gestión de Reservas</h1>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle>Solicitudes de Reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-white">Cliente</TableHead>
                  <TableHead className="text-white">Fecha y Hora</TableHead>
                  <TableHead className="text-white">Detalles</TableHead>
                  <TableHead className="text-white">Estado</TableHead>
                  <TableHead className="text-white">Comprobante</TableHead>
                  <TableHead className="text-right text-white">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservas && reservas.length > 0 ? (
                  reservas.map((reserva) => (
                    <TableRow key={reserva.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="font-medium text-white">{reserva.nombre}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {reserva.telefono}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-white">
                          <Calendar className="h-4 w-4 text-toro-red" />
                          {formatDate(reserva.fecha_reserva)}
                        </div>
                        {reserva.hora_reserva && (
                            <div className="text-xs text-muted-foreground mt-1">
                                Hora: {reserva.hora_reserva}
                            </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-sm text-white">
                            <Users className="h-3 w-3" /> {reserva.cantidad_personas}
                          </div>
                          {reserva.comentarios && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground italic">
                              <MessageSquare className="h-3 w-3" /> "{reserva.comentarios}"
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(reserva.estado)} border`}>
                          {reserva.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {reserva.comprobante_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                            onClick={() => setSelectedImage(import.meta.env.VITE_API_URL + reserva.comprobante_url)}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Ver Pago
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin comprobante</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {reserva.estado === "PENDIENTE" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleStatusChange(reserva.id, "RESERVADO")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleStatusChange(reserva.id, "CANCELADO")}
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Rechazar
                              </Button>
                            </>
                          )}
                          {reserva.estado === "RESERVADO" && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleStatusChange(reserva.id, "COMPLETADO")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Completar
                            </Button>
                          )}
                           {(reserva.estado === "RESERVADO" || reserva.estado === "COMPLETADO") && (
                             <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                                onClick={() => handleStatusChange(reserva.id, "CANCELADO")}
                              >
                                Cancelar
                              </Button>
                           )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay reservas registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">Comprobante de Pago</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex justify-center">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Comprobante"
                className="max-h-[80vh] w-auto rounded-lg border border-white/10"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReservasPage
