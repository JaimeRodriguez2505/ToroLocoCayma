import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

interface Table {
  id: string
  number: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  currentOrder?: {
    id: string
    startTime: string
    customerCount: number
  }
}

interface MobileTableSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectTable: (table: Table) => void
  tables: Table[]
  selectedTableId?: string
}

const statusConfig = {
  available: {
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle,
    label: 'Disponible'
  },
  occupied: {
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: Users,
    label: 'Ocupada'
  },
  reserved: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: Clock,
    label: 'Reservada'
  },
  cleaning: {
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: AlertCircle,
    label: 'Limpieza'
  }
}

export const MobileTableSelector: React.FC<MobileTableSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTable,
  tables,
  selectedTableId
}) => {
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied'>('all')

  const filteredTables = tables.filter(table => {
    if (filter === 'all') return true
    if (filter === 'available') return table.status === 'available'
    if (filter === 'occupied') return table.status === 'occupied'
    return true
  })

  const handleTableSelect = (table: Table) => {
    if (table.status === 'available' || table.status === 'occupied') {
      onSelectTable(table)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Seleccionar Mesa
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="whitespace-nowrap"
                >
                  Todas ({tables.length})
                </Button>
                <Button
                  variant={filter === 'available' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('available')}
                  className="whitespace-nowrap"
                >
                  Disponibles ({tables.filter(t => t.status === 'available').length})
                </Button>
                <Button
                  variant={filter === 'occupied' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('occupied')}
                  className="whitespace-nowrap"
                >
                  Ocupadas ({tables.filter(t => t.status === 'occupied').length})
                </Button>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredTables.map((table) => {
                  const config = statusConfig[table.status]
                  const Icon = config.icon
                  const isSelected = selectedTableId === table.id
                  const isSelectable = table.status === 'available' || table.status === 'occupied'

                  return (
                    <motion.div
                      key={table.id}
                      whileTap={isSelectable ? { scale: 0.95 } : undefined}
                      className={cn(
                        "relative p-4 rounded-xl border-2 transition-all duration-200",
                        config.bgColor,
                        config.borderColor,
                        isSelected && "ring-2 ring-fire-600 ring-offset-2",
                        isSelectable ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed opacity-60"
                      )}
                      onClick={() => handleTableSelect(table)}
                    >
                      {/* Status Indicator */}
                      <div className="flex items-center justify-between mb-2">
                        <div className={cn("w-3 h-3 rounded-full", config.color)} />
                        <Icon className={cn("h-4 w-4", config.textColor)} />
                      </div>

                      {/* Table Number */}
                      <div className="text-center mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          Mesa {table.number}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {table.capacity} personas
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex justify-center">
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", config.textColor, config.bgColor)}
                        >
                          {config.label}
                        </Badge>
                      </div>

                      {/* Order Info for Occupied Tables */}
                      {table.status === 'occupied' && table.currentOrder && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Orden: #{table.currentOrder.id.slice(-4)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {table.currentOrder.customerCount} clientes
                          </p>
                        </div>
                      )}

                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1">
                          <div className="bg-fire-600 text-white rounded-full p-1">
                            <CheckCircle className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {filteredTables.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay mesas disponibles con el filtro seleccionado
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full h-12"
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MobileTableSelector