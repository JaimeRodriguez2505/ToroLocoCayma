"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Search, 
  QrCode, 
  CheckCircle
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

// Modal base optimizado para móvil
interface MobileModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
}

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ 
          opacity: 0, 
          y: 100,
          scale: 0.95 
        }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: 1 
        }}
        exit={{ 
          opacity: 0, 
          y: 100,
          scale: 0.95 
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className={`relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full ${sizeClasses[size]} mx-4 sm:mx-auto`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-60px)]">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// Modal de búsqueda de productos mejorado para móvil
interface MobileProductSearchModalProps {
  isOpen: boolean
  onClose: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  products: any[]
  onSelectProduct: (product: any) => void
  isLoading: boolean
}

export const MobileProductSearchModal: React.FC<MobileProductSearchModalProps> = ({
  isOpen,
  onClose,
  searchTerm,
  onSearchChange,
  products,
  onSelectProduct,
  isLoading
}) => {
  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="Buscar Productos" size="full">
      <div className="p-4 space-y-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 text-base"
            autoFocus
          />
        </div>

        {/* Resultados */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            products.map((product) => (
              <Card
                key={product.id_producto}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  onSelectProduct(product)
                  onClose()
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0">
                      {product.imagen_url ? (
                        <img
                          src={product.imagen_url}
                          alt={product.nombre}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <QrCode className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{product.nombre}</h3>
                      <p className="text-ember-600 font-semibold">
                        S/ {parseFloat(product.precio_unitario_con_igv || '0').toFixed(2)}
                      </p>
                      {product.stock !== undefined && (
                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {!isLoading && products.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        )}
      </div>
    </MobileModal>
  )
}

// Modal de método de pago optimizado para móvil
interface MobilePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  metodoPago: string
  onMetodoPagoChange: (metodo: string) => void
  total: number
  onConfirm: () => void
}

export const MobilePaymentModal: React.FC<MobilePaymentModalProps> = ({
  isOpen,
  onClose,
  metodoPago,
  onMetodoPagoChange,
  total,
  onConfirm
}) => {
  const metodosPago = [
    { id: 'efectivo', name: 'Efectivo', icon: '💵' },
    { id: 'tarjeta', name: 'Tarjeta', icon: '💳' },
    { id: 'yape', name: 'Yape', icon: '📱' },
    { id: 'plin', name: 'Plin', icon: '💫' }
  ]

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="Método de Pago">
      <div className="p-4 space-y-4">
        {/* Total */}
        <Card className="bg-gradient-to-r from-fire-600 to-ember-600 text-white">
          <CardContent className="p-4 text-center">
            <p className="text-sm opacity-90">Total a pagar</p>
            <p className="text-2xl font-bold">S/ {total.toFixed(2)}</p>
          </CardContent>
        </Card>

        {/* Métodos de pago */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Selecciona el método de pago
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {metodosPago.map((metodo) => (
              <Button
                key={metodo.id}
                variant={metodoPago === metodo.id ? 'default' : 'outline'}
                onClick={() => onMetodoPagoChange(metodo.id)}
                className={`h-16 flex flex-col items-center justify-center space-y-1 ${
                  metodoPago === metodo.id 
                    ? 'bg-fire-600 text-white' 
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                <span className="text-xl">{metodo.icon}</span>
                <span className="text-sm">{metodo.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Botón confirmar */}
        <Button
          onClick={onConfirm}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          Confirmar Pago
        </Button>
      </div>
    </MobileModal>
  )
}

// Modal de éxito de venta optimizado para móvil
interface MobileSaleSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  onNewSale: () => void
  saleId: string | number
  total: number
}

export const MobileSaleSuccessModal: React.FC<MobileSaleSuccessModalProps> = ({
  isOpen,
  onClose,
  onNewSale,
  saleId,
  total
}) => {
  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="¡Venta Completada!">
      <div className="p-6 text-center space-y-6">
        {/* Icono de éxito */}
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>

        {/* Información de la venta */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ¡Venta registrada exitosamente!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Venta #{saleId}
          </p>
          <p className="text-2xl font-bold text-ember-600 mt-2">
            S/ {total.toFixed(2)}
          </p>
        </div>

        {/* Acciones */}
        <div className="space-y-3">
          <Button
            onClick={onNewSale}
            className="btn-fire w-full h-12 font-semibold"
          >
            Nueva Venta
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-12"
          >
            Continuar
          </Button>
        </div>
      </div>
    </MobileModal>
  )
}

// Modal de selección de mesa optimizado para móvil
interface MobileTableSelectModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTable: number | null
  onSelectTable: (table: number) => void
  tables: Array<{ number: number; occupied: boolean; items?: number }>
}

export const MobileTableSelectModal: React.FC<MobileTableSelectModalProps> = ({
  isOpen,
  onClose,
  selectedTable,
  onSelectTable,
  tables
}) => {
  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="Seleccionar Mesa">
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {tables.map((table) => (
            <Button
              key={table.number}
              variant={selectedTable === table.number ? 'default' : 'outline'}
              onClick={() => {
                onSelectTable(table.number)
                onClose()
              }}
              className={`h-20 flex flex-col items-center justify-center space-y-1 relative ${
                table.occupied 
                  ? 'bg-red-100 border-red-300 text-red-700' 
                  : selectedTable === table.number
                    ? 'bg-fire-600 text-white'
                    : 'bg-white dark:bg-gray-800'
              }`}
            >
              <span className="text-lg font-bold">Mesa</span>
              <span className="text-xl font-bold">{table.number}</span>
              {table.occupied && table.items && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs">
                  {table.items}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </MobileModal>
  )
}
