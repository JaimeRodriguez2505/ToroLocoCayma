import * as React from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  ShoppingCart, 
  CreditCard, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Table,
  Package,
  QrCode,
  Users,
  X,
  Check
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Card, CardContent } from '../ui/card'
import MobileTableSelector from './MobileTableSelector'

interface Product {
  id_producto: number
  nombre: string
  precio_unitario: string
  precio_unitario_con_igv: string
  categoria?: {
    nombre: string
  }
  imagen_url?: string | null
  stock?: number
}

interface CartItem {
  producto_id: number
  nombre: string
  precio_unitario: string
  precio_unitario_con_igv: string
  cantidad: number
  subtotal: number
  codigos_barras: string[]
  esPrecioMayorista: boolean
}

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

// Tipo mínimo para datos de cliente usados en el layout
interface ClienteDataMin {
  razonSocial?: string
  nombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  nombres?: string
  numeroDocumento?: string
  direccion?: string
}

interface ImprovedMobileSalesLayoutProps {
  // Props para productos
  products: Product[]
  isLoadingProducts: boolean
  productSearchTerm: string
  setProductSearchTerm: (term: string) => void
  onAddToCart: (product: Product) => void
  
  // Props para carrito
  cart: CartItem[]
  onUpdateQuantity: (productId: number, newQuantity: number) => void
  onRemoveFromCart: (productId: number) => void
  
  // Props para mesas
  tables: Table[]
  selectedTable?: Table
  onSelectTable: (table: Table) => void
  onSaveTable: () => void
  onCancelTableSelection: () => void
  
  // Props para configuración
  metodoPago: string
  setMetodoPago: (metodo: string) => void
  observaciones: string
  setObservaciones: (obs: string) => void
  autoPrintComanda: boolean
  setAutoPrintComanda: (val: boolean) => void
  
  // Props para acciones
  onCompleteSale: () => void
  onOpenBarcodeScanner: () => void
  onBack: () => void
  
  // Estados
  total: number
  totalItems: number
  isProcessingSale: boolean
  // NUEVOS PROPS PARA DOC Y EFECTIVO
  tipoDocumento: string
  setTipoDocumento: (doc: string) => void
  montoRecibido: string
  setMontoRecibido: (val: string) => void
  // Nuevos props para usuario y cliente
  userName?: string | null
  clienteData?: ClienteDataMin | null
  onOpenClienteDialog: () => void
}

export const ImprovedMobileSalesLayout: React.FC<ImprovedMobileSalesLayoutProps> = ({
  products = [],
  isLoadingProducts,
  productSearchTerm,
  setProductSearchTerm,
  onAddToCart,
  cart = [],
  onUpdateQuantity,
  onRemoveFromCart,
  tables = [],
  selectedTable,
  onSelectTable,
  onSaveTable,
  onCancelTableSelection,
  metodoPago,
  setMetodoPago,
  observaciones,
  setObservaciones,
  autoPrintComanda,
  setAutoPrintComanda,
  // onCompleteSale, // ya no se usa en mobile: se reemplazó por onSaveTable
  onOpenBarcodeScanner,
  onBack,
  total,
  totalItems,
  isProcessingSale,
  // nuevos props
  tipoDocumento,
  setTipoDocumento,
  montoRecibido,
  setMontoRecibido,
  // Nuevos props para usuario y cliente
  userName,
  clienteData,
  onOpenClienteDialog,
}) => {
  const [activeTab, setActiveTab] = useState('products')
  const [showTableSelector, setShowTableSelector] = useState(false)

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(product =>
    product.nombre?.toLowerCase().includes(productSearchTerm.toLowerCase())
  )

  const handleTableSelect = (table: Table) => {
    onSelectTable(table)
    setShowTableSelector(false)
  }

  // Helper para mostrar nombre del cliente
  const getClienteNombre = () => {
    if (!clienteData) return 'CLIENTE GENERAL'
    if (tipoDocumento === '01') return clienteData.razonSocial || 'CLIENTE'
    return (
      clienteData.nombre || `${clienteData.apellidoPaterno || ''} ${clienteData.apellidoMaterno || ''} ${clienteData.nombres || ''}`.trim() || 'CLIENTE'
    )
  }

  // Helper para mostrar número de documento
  const getClienteNumeroDoc = () => {
    return clienteData?.numeroDocumento || '—'
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header fijo con información de mesa */}
      <div className="bg-gradient-to-r from-fire-600 to-ember-600 text-white p-4 shadow-lg fire-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/20 p-2 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div 
              className="cursor-pointer tap-effect flex items-center space-x-2"
              onClick={() => setShowTableSelector(true)}
            >
              {selectedTable ? (
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">Mesa {selectedTable.number}</h1>
                    <p className="text-xs text-white/80">{totalItems} productos</p>
                    {userName && (
                      <p className="text-[10px] text-white/80">Vendedor: {userName}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">Seleccionar Mesa</h1>
                    <p className="text-xs text-white/80">Toca para elegir</p>
                    {userName && (
                      <p className="text-[10px] text-white/80">Vendedor: {userName}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold">S/ {total.toFixed(2)}</p>
            <p className="text-xs text-white/80">{totalItems} items</p>
          </div>
        </div>

        {/* Acciones de mesa y opción de imprimir comanda (solo si hay mesa seleccionada) */}
        {selectedTable && (
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={onSaveTable}
                disabled={cart.length === 0}
                className="h-10 flex-1 btn-ember"
              >
                <Check className="h-4 w-4 mr-2" />
                Guardar en Mesa {selectedTable.number}
              </Button>
              <Button
                variant="outline"
                onClick={onCancelTableSelection}
                className="h-10 flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>

            <label className="flex items-center gap-2 text-white/90">
              <input
                type="checkbox"
                checked={autoPrintComanda}
                onChange={(e) => setAutoPrintComanda(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-xs">Imprimir comanda automáticamente</span>
            </label>
          </div>
        )}
      </div>

      {/* Tabs de navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 border-b">
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Productos</span>
          </TabsTrigger>
          <TabsTrigger value="cart" className="flex items-center space-x-2 relative">
            <ShoppingCart className="h-4 w-4" />
            <span>Carrito</span>
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-fire-600">
                {totalItems}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="checkout" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Pagar</span>
          </TabsTrigger>
        </TabsList>

        {/* Contenido de productos */}
        <TabsContent value="products" className="flex-1 p-4 overflow-hidden pb-24">
          <div className="flex flex-col h-full">
            {/* Barra de búsqueda */}
            <div className="flex space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar productos..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={onOpenBarcodeScanner}
                className="h-12 px-3"
              >
                <QrCode className="h-5 w-5" />
              </Button>
            </div>

            {/* Grid de productos */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingProducts ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
                      <div className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg mb-3" />
                      <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2" />
                      <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id_producto}
                      whileTap={{ scale: 0.95 }}
                      className="bg-fire-500 hover:bg-fire-600 text-white fire-glow transition-all duration-300 rounded-xl p-4 shadow-sm border border-fire-400 touch-manipulation"
                      onClick={() => onAddToCart(product)}
                    >
                      <div className="aspect-square bg-charcoal-200 dark:bg-charcoal-800 rounded-lg mb-3 flex items-center justify-center charcoal-texture">
                        {product.imagen_url ? (
                          <img 
                            src={product.imagen_url} 
                            alt={product.nombre}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-charcoal-400" />
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-white mb-1 text-sm leading-tight">
                        {product.nombre}
                      </h3>
                      
                      <p className="text-fire-100 font-bold text-lg mb-3">
                        S/ {parseFloat(product.precio_unitario_con_igv).toFixed(2)}
                      </p>
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        className="w-full btn-ember active:scale-95 active:opacity-80"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {!isLoadingProducts && filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No se encontraron productos
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Contenido del carrito */}
        <TabsContent value="cart" className="flex-1 p-4 overflow-hidden pb-24">
          <div className="flex flex-col h-full">
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    El carrito está vacío
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Agrega productos desde la pestaña de productos
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3">
                {cart.map((item) => (
                  <motion.div
                    key={item.producto_id}
                    layout
                    className="bg-charcoal-50 dark:bg-charcoal-900 rounded-xl p-4 shadow-sm border border-charcoal-200 dark:border-charcoal-700 charcoal-texture"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-charcoal-900 dark:text-charcoal-100 mb-1">
                          {item.nombre}
                        </h3>
                        <p className="text-ember-600 font-bold">
                          S/ {parseFloat(item.precio_unitario_con_igv).toFixed(2)} c/u
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity(item.producto_id, Math.max(0, item.cantidad - 1));
                            }}
                            className="h-8 w-8 p-0 active:scale-95 active:bg-gray-200 dark:active:bg-gray-600"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="font-bold text-lg min-w-[2rem] text-center">
                            {item.cantidad}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity(item.producto_id, item.cantidad + 1);
                            }}
                            className="h-8 w-8 p-0 active:scale-95 active:bg-gray-200 dark:active:bg-gray-600"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFromCart(item.producto_id);
                            }}
                            className="h-8 w-8 p-0 text-ember-600 hover:text-ember-800 hover:bg-ember-50 active:scale-95 active:bg-ember-100"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-right font-bold text-lg">
                        Subtotal: S/ {item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Contenido de checkout */}
        <TabsContent value="checkout" className="flex-1 p-4 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4">
              {/* Tipo de Documento */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Tipo de Documento</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Ticket', value: '' },
                      { label: 'Boleta', value: '03' },
                      { label: 'Factura', value: '01' },
                    ].map((doc) => (
                      <Button
                        key={doc.value}
                        variant={tipoDocumento === doc.value ? 'default' : 'outline'}
                        onClick={() => {
                          setTipoDocumento(doc.value)
                          if (doc.value === '01' || doc.value === '03') {
                            onOpenClienteDialog()
                          }
                        }}
                        className="h-12"
                      >
                        {doc.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cliente */}
              {(tipoDocumento === '01' || tipoDocumento === '03') && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold mb-1">Cliente</h3>
                        <p className="font-medium leading-tight">{getClienteNombre()}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {tipoDocumento === '01' ? 'RUC' : 'DNI'}: <span className="text-gray-900 dark:text-gray-100 font-medium">{getClienteNumeroDoc()}</span>
                        </p>
                      </div>
                      <Button variant="outline" onClick={onOpenClienteDialog} className="h-10">
                        Buscar/Cambiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Método de pago */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Método de Pago</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'].map((metodo) => (
                      <Button
                        key={metodo}
                        variant={metodoPago === metodo ? 'default' : 'outline'}
                        onClick={() => setMetodoPago(metodo)}
                        className="h-12 capitalize"
                      >
                        {metodo}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monto recibido (solo efectivo) */}
              {metodoPago === 'efectivo' && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Monto Recibido</h3>
                    <div className="space-y-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="Ingrese monto recibido"
                        className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                        value={montoRecibido}
                        onChange={(e) => setMontoRecibido(e.target.value)}
                      />
                      {montoRecibido && !isNaN(parseFloat(montoRecibido)) && (
                        parseFloat(montoRecibido) >= total ? (
                          <div className="flex justify-between text-emerald-600 font-semibold">
                            <span>Vuelto</span>
                            <span>S/ {(Math.max(0, parseFloat(montoRecibido) - total)).toFixed(2)}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-red-600 font-semibold">
                            <span>Falta</span>
                            <span>S/ {(Math.max(0, total - parseFloat(montoRecibido))).toFixed(2)}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Observaciones */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Observaciones</h3>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas adicionales..."
                    className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800"
                  />
                </CardContent>
              </Card>

              {/* Resumen */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Resumen</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Productos ({totalItems})</span>
                      <span>S/ {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>S/ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Botón de guardar mesa */}
            <div className="pt-4">
              <Button
                onClick={onSaveTable}
                disabled={cart.length === 0 || isProcessingSale}
                className="w-full h-14 text-lg font-semibold btn-fire"
              >
                {isProcessingSale ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    {selectedTable ? `Guardar Mesa ${selectedTable.number}` : 'Guardar Mesa'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Barra de acciones inferior fija para navegación rápida */}
      {(activeTab === 'products' || activeTab === 'cart') && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 pb-[max(0px,env(safe-area-inset-bottom))] pt-3 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setActiveTab('cart')}
              className="h-12 flex-1"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Carrito</span>
                {totalItems > 0 && (
                  <Badge className="ml-1 bg-fire-600">{totalItems}</Badge>
                )}
              </div>
            </Button>
            <Button
              onClick={() => setActiveTab('checkout')}
              disabled={totalItems === 0}
              className="h-12 flex-[2] btn-fire text-base font-semibold"
            >
              Cobrar • S/ {total.toFixed(2)}
            </Button>
          </div>
        </div>
      )}

      {/* Botón flotante de acceso rápido al selector de mesas */}
      <div className={`fixed left-4 z-50 ${activeTab === 'products' || activeTab === 'cart' ? 'bottom-24' : 'bottom-6'}`}>
        <Button
          onClick={() => setShowTableSelector(true)}
          className="h-12 px-4 shadow-lg shadow-black/20 btn-ember rounded-full"
        >
          <Users className="h-5 w-5 mr-2" />
          {selectedTable ? `Mesa ${selectedTable.number}` : 'Mesas'}
        </Button>
      </div>

      {/* Modal de selección de mesa */}
      <MobileTableSelector
        isOpen={showTableSelector}
        onClose={() => setShowTableSelector(false)}
        onSelectTable={handleTableSelect}
        tables={tables}
        selectedTableId={selectedTable?.id}
      />
    </div>
  )
}

export default ImprovedMobileSalesLayout