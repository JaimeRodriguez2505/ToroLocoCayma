"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  ShoppingCart, 
  Package,
  Plus,
  Minus,
  X,
  QrCode,
  CreditCard
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Card, CardContent } from '../ui/card'

interface MobileSalesLayoutProps {
  // Props para productos
  products: any[]
  isLoadingProducts: boolean
  productSearchTerm: string
  setProductSearchTerm: (term: string) => void
  onAddToCart: (product: any) => void
  
  // Props para carrito
  cart: any[]
  onUpdateQuantity: (productId: number, newQuantity: number) => void
  onRemoveFromCart: (productId: number) => void
  
  // Props para configuración
  metodoPago: string
  setMetodoPago: (metodo: string) => void
  observaciones: string
  setObservaciones: (obs: string) => void
  
  // Props para acciones
  onCompleteSale: () => void
  onOpenBarcodeScanner: () => void
  
  // Estados
  total: number
  totalItems: number
  isProcessingSale: boolean
  selectedShortcutCart: number | null
}

export const MobileSalesLayout: React.FC<MobileSalesLayoutProps> = ({
  products = [],
  isLoadingProducts,
  productSearchTerm,
  setProductSearchTerm,
  onAddToCart,
  cart = [],
  onUpdateQuantity,
  onRemoveFromCart,
  metodoPago,
  setMetodoPago,
  observaciones,
  setObservaciones,
  onCompleteSale,
  onOpenBarcodeScanner,
  total,
  totalItems,
  isProcessingSale,
  selectedShortcutCart
}) => {
  const [activeTab, setActiveTab] = useState('products')

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(product =>
    product.nombre?.toLowerCase().includes(productSearchTerm.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 safe-top safe-bottom">
      {/* Header fijo con información de mesa */}
      <div className="bg-gradient-to-r from-toro-red to-red-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div 
            className="cursor-pointer tap-effect"
            onClick={() => {
              // TODO: Implementar modal de selección de mesa
              console.log('Abrir selector de mesa')
            }}
          >
            {selectedShortcutCart ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold">{selectedShortcutCart}</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Mesa {selectedShortcutCart}</h1>
                  <p className="text-xs text-white/80">{totalItems} productos</p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-lg font-bold">Nueva Venta</h1>
                <p className="text-xs text-white/80">Toca para seleccionar mesa</p>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-lg font-bold">S/ {total.toFixed(2)}</p>
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
              {totalItems} items
            </Badge>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 border-b sticky top-0 z-10 touch-friendly">
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Productos</span>
          </TabsTrigger>
          <TabsTrigger value="cart" className="flex items-center space-x-2 relative">
            <ShoppingCart className="h-4 w-4" />
            <span>Carrito</span>
            {totalItems > 0 && (
              <Badge className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0">
                {totalItems}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="checkout" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Pagar</span>
          </TabsTrigger>
        </TabsList>

        {/* Contenido de Productos */}
        <TabsContent value="products" className="flex-1 p-4 overflow-hidden">
          <div className="space-y-4 h-full flex flex-col">
            {/* Buscador optimizado para móvil */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="pl-10 pr-12 h-12 text-base bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl"
              />
              <Button
                onClick={onOpenBarcodeScanner}
                size="sm"
                variant="ghost"
                className="absolute right-2 top-2 h-8 w-8 p-0"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>

            {/* Grid de productos optimizado para touch */}
            <div className="flex-1 overflow-auto mobile-scroll">
              {isLoadingProducts ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid mobile-grid-2 gap-3">
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id_producto}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow tap-effect touch-friendly">
                        <CardContent className="p-3">
                          {/* Imagen del producto */}
                          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-2 overflow-hidden">
                            {product.imagen_url ? (
                              <img
                                src={product.imagen_url}
                                alt={product.nombre}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Información del producto */}
                          <div className="space-y-1">
                            <h3 className="font-medium text-sm line-clamp-2 text-gray-900 dark:text-gray-100">
                              {product.nombre}
                            </h3>
                            <p className="text-lg font-bold text-toro-red">
                              S/ {parseFloat(product.precio_unitario_con_igv || product.precio_unitario || '0').toFixed(2)}
                            </p>
                            {product.stock !== undefined && (
                              <p className="text-xs text-gray-500">
                                Stock: {product.stock}
                              </p>
                            )}
                          </div>
                          
                          {/* Botón para agregar */}
                          <Button
                            onClick={() => onAddToCart(product)}
                            className="w-full mt-2 bg-toro-red hover:bg-red-700 text-white h-10"
                            disabled={product.stock === 0}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {!isLoadingProducts && filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Contenido del Carrito */}
        <TabsContent value="cart" className="flex-1 p-4 overflow-hidden">
          <div className="h-full flex flex-col">
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">El carrito está vacío</p>
                  <p className="text-sm text-gray-400">Agrega productos desde la pestaña de productos</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-auto">
                {cart.map((item) => (
                  <Card key={item.producto_id} className="bg-white dark:bg-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        {/* Imagen miniatura */}
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0">
                          {item.imagen_url ? (
                            <img
                              src={item.imagen_url}
                              alt={item.nombre}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Información del producto */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                            {item.nombre}
                          </h3>
                          <p className="text-sm text-toro-red font-semibold">
                            S/ {parseFloat(item.precio_unitario_con_igv || item.precio_unitario || '0').toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Controles de cantidad */}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateQuantity(item.producto_id, Math.max(0, item.cantidad - 1))}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="w-8 text-center font-medium">
                            {item.cantidad}
                          </span>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateQuantity(item.producto_id, item.cantidad + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Botón eliminar */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveFromCart(item.producto_id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Subtotal */}
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Subtotal:</span>
                          <span className="font-semibold text-toro-red">
                            S/ {item.subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Contenido de Checkout */}
        <TabsContent value="checkout" className="flex-1 p-4 overflow-hidden">
          <div className="h-full flex flex-col space-y-4">
            {/* Resumen del total */}
            <Card className="bg-gradient-to-r from-toro-red to-red-600 text-white">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm opacity-90">Total a pagar</p>
                  <p className="text-3xl font-bold">S/ {total.toFixed(2)}</p>
                  <p className="text-xs opacity-80">{totalItems} productos</p>
                </div>
              </CardContent>
            </Card>

            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium mb-2">Método de pago</label>
              <div className="grid grid-cols-2 gap-2">
                {['efectivo', 'tarjeta', 'yape', 'plin'].map((metodo) => (
                  <Button
                    key={metodo}
                    variant={metodoPago === metodo ? 'default' : 'outline'}
                    onClick={() => setMetodoPago(metodo)}
                    className={`h-12 ${
                      metodoPago === metodo 
                        ? 'bg-toro-red text-white' 
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium mb-2">Observaciones (opcional)</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Comentarios adicionales..."
                className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800"
              />
            </div>

            {/* Botón de completar venta */}
            <div className="mt-auto">
              <Button
                onClick={onCompleteSale}
                disabled={cart.length === 0 || isProcessingSale}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg font-bold"
              >
                {isProcessingSale ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  'Completar Venta'
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
