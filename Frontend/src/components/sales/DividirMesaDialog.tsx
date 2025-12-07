import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner'
import { Scissors, Table, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

interface CartItem {
  producto_id: number
  nombre: string
  nombreEditado?: string
  precio_unitario_con_igv: string
  cantidad: number
  subtotal: number
}

interface CarritoGuardado {
  numero_carrito: number
  nombre: string
  items: CartItem[]
}

interface DividirMesaDialogProps {
  isOpen: boolean
  onClose: () => void
  mesaOrigen: CarritoGuardado
  mesasDisponibles: CarritoGuardado[]
  onDividir: (itemsSeleccionados: number[], mesaDestino: number) => Promise<void>
}

export const DividirMesaDialog = ({
  isOpen,
  onClose,
  mesaOrigen,
  mesasDisponibles,
  onDividir,
}: DividirMesaDialogProps) => {
  const [itemsSeleccionados, setItemsSeleccionados] = useState<Set<number>>(new Set())
  const [mesaDestino, setMesaDestino] = useState<string>('')
  const [isDividing, setIsDividing] = useState(false)

  // Filtrar solo mesas vacías (sin items o con items vacíos)
  const mesasVacias = mesasDisponibles.filter(
    mesa => mesa.numero_carrito !== mesaOrigen.numero_carrito &&
    (!mesa.items || mesa.items.length === 0)
  )

  const toggleItem = (productoId: number) => {
    const newSelection = new Set(itemsSeleccionados)
    if (newSelection.has(productoId)) {
      newSelection.delete(productoId)
    } else {
      newSelection.add(productoId)
    }
    setItemsSeleccionados(newSelection)
  }

  const selectAll = () => {
    if (itemsSeleccionados.size === mesaOrigen.items.length) {
      setItemsSeleccionados(new Set())
    } else {
      setItemsSeleccionados(new Set(mesaOrigen.items.map(item => item.producto_id)))
    }
  }

  // Calcular totales
  const totalSeleccionado = mesaOrigen.items
    .filter(item => itemsSeleccionados.has(item.producto_id))
    .reduce((sum, item) => sum + item.subtotal, 0)

  const totalRestante = mesaOrigen.items
    .filter(item => !itemsSeleccionados.has(item.producto_id))
    .reduce((sum, item) => sum + item.subtotal, 0)

  const handleDividir = async () => {
    if (itemsSeleccionados.size === 0) {
      toast.error('Debes seleccionar al menos un producto')
      return
    }

    if (!mesaDestino) {
      toast.error('Debes seleccionar una mesa destino')
      return
    }

    if (itemsSeleccionados.size === mesaOrigen.items.length) {
      toast.error('No puedes mover todos los productos. Deja al menos uno en la mesa origen.')
      return
    }

    try {
      setIsDividing(true)
      await onDividir(Array.from(itemsSeleccionados), parseInt(mesaDestino))
      toast.success(`Mesa ${mesaOrigen.numero_carrito} dividida exitosamente`)
      onClose()
      // Limpiar selección
      setItemsSeleccionados(new Set())
      setMesaDestino('')
    } catch (error: any) {
      console.error('Error al dividir mesa:', error)
      toast.error(error.message || 'Error al dividir la mesa')
    } finally {
      setIsDividing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Dividir Mesa {mesaOrigen.numero_carrito}
          </DialogTitle>
          <DialogDescription>
            Selecciona los productos que deseas mover a otra mesa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de mesa destino */}
          <div className="grid gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Label htmlFor="mesa-destino" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Mesa Destino
            </Label>
            <Select value={mesaDestino} onValueChange={setMesaDestino}>
              <SelectTrigger id="mesa-destino">
                <SelectValue placeholder="Selecciona una mesa vacía" />
              </SelectTrigger>
              <SelectContent>
                {mesasVacias.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No hay mesas vacías disponibles</div>
                ) : (
                  mesasVacias.map(mesa => (
                    <SelectItem key={mesa.numero_carrito} value={mesa.numero_carrito.toString()}>
                      Mesa {mesa.numero_carrito}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {mesasVacias.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Primero debes liberar una mesa para poder dividir
              </p>
            )}
          </div>

          {/* Lista de productos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Productos a Mover</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAll}
              >
                {itemsSeleccionados.size === mesaOrigen.items.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </Button>
            </div>

            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {mesaOrigen.items.map((item) => {
                const isSelected = itemsSeleccionados.has(item.producto_id)
                const displayName = item.nombreEditado || item.nombre

                return (
                  <div
                    key={item.producto_id}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    onClick={() => toggleItem(item.producto_id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItem(item.producto_id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{displayName}</p>
                      <p className="text-sm text-gray-500">
                        {item.cantidad} x {formatCurrency(parseFloat(item.precio_unitario_con_igv))}
                      </p>
                    </div>
                    <div className="text-right font-semibold">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Resumen de división */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Mesa {mesaDestino || '?'} (Nueva)
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalSeleccionado)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {itemsSeleccionados.size} producto(s)
              </p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Mesa {mesaOrigen.numero_carrito} (Actual)
              </p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(totalRestante)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {mesaOrigen.items.length - itemsSeleccionados.size} producto(s)
              </p>
            </div>
          </div>

          {/* Advertencias */}
          {itemsSeleccionados.size === mesaOrigen.items.length && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                No puedes mover todos los productos. Deja al menos uno en la mesa origen.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDividing}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleDividir}
            disabled={
              isDividing ||
              itemsSeleccionados.size === 0 ||
              !mesaDestino ||
              itemsSeleccionados.size === mesaOrigen.items.length ||
              mesasVacias.length === 0
            }
          >
            {isDividing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Dividiendo...
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4 mr-2" />
                Dividir Mesa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DividirMesaDialog
