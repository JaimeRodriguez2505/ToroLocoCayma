import * as React from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Check,
  Trash2
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
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
  products: Product[]
  isLoadingProducts: boolean
  productSearchTerm: string
  setProductSearchTerm: (term: string) => void
  onAddToCart: (product: Product) => void

  cart: CartItem[]
  onUpdateQuantity: (productId: number, newQuantity: number) => void
  onRemoveFromCart: (productId: number) => void

  tables: Table[]
  selectedTable?: Table
  onSelectTable: (table: Table) => void
  onSaveTable: () => void
  onCancelTableSelection: () => void

  metodoPago: string
  setMetodoPago: (metodo: string) => void
  observaciones: string
  setObservaciones: (obs: string) => void
  autoPrintComanda: boolean
  setAutoPrintComanda: (val: boolean) => void

  onOpenBarcodeScanner: () => void
  onBack: () => void

  total: number
  totalItems: number
  isProcessingSale: boolean

  tipoDocumento: string
  setTipoDocumento: (doc: string) => void
  montoRecibido: string
  setMontoRecibido: (val: string) => void

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
  onOpenBarcodeScanner,
  onBack,
  total,
  totalItems,
  isProcessingSale,
  tipoDocumento,
  setTipoDocumento,
  montoRecibido,
  setMontoRecibido,
  userName,
  clienteData,
  onOpenClienteDialog,
}) => {
  const [activeTab, setActiveTab] = useState('products')
  const [showTableSelector, setShowTableSelector] = useState(false)

  const filteredProducts = products.filter(product =>
    product.nombre?.toLowerCase().includes(productSearchTerm.toLowerCase())
  )

  const handleTableSelect = (table: Table) => {
    onSelectTable(table)
    setShowTableSelector(false)
  }

  const getClienteNombre = () => {
    if (!clienteData) return 'CLIENTE GENERAL'
    if (tipoDocumento === '01') return clienteData.razonSocial || 'CLIENTE'
    return (
      clienteData.nombre || `${clienteData.apellidoPaterno || ''} ${clienteData.apellidoMaterno || ''} ${clienteData.nombres || ''}`.trim() || 'CLIENTE'
    )
  }

  const getClienteNumeroDoc = () => {
    return clienteData?.numeroDocumento || '—'
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header 2026 - Limpio y minimalista */}
      <div className="bg-card border-b-2 border-border p-4 shadow-sm dark:shadow-ember">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div
              className="cursor-pointer flex items-center gap-3 tap-target"
              onClick={() => setShowTableSelector(true)}
            >
              {selectedTable ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center border-2 border-primary">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Mesa {selectedTable.number}</h1>
                    <p className="text-sm text-muted-foreground">{totalItems} productos</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center border-2 border-border">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Seleccionar Mesa</h1>
                    <p className="text-sm text-muted-foreground">Toca para elegir</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-primary">S/ {total.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">{totalItems} items</p>
          </div>
        </div>

        {/* Acciones de mesa */}
        {selectedTable && cart.length > 0 && (
          <div className="flex flex-col gap-2 pt-3 border-t border-border">
            <div className="flex gap-2">
              <Button
                onClick={onSaveTable}
                className="h-12 flex-1 font-semibold"
                variant="default"
              >
                <Check className="h-5 w-5 mr-2" />
                Guardar Mesa {selectedTable.number}
              </Button>
              <Button
                variant="outline"
                onClick={onCancelTableSelection}
                className="h-12 px-4"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={autoPrintComanda}
                onChange={(e) => setAutoPrintComanda(e.target.checked)}
                className="w-5 h-5 rounded border-border"
              />
              <span>Imprimir comanda automáticamente</span>
            </label>
          </div>
        )}

        {userName && (
          <p className="text-xs text-muted-foreground mt-2">Vendedor: {userName}</p>
        )}
      </div>

      {/* Tabs 2026 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 bg-muted m-0 rounded-none h-14 border-b border-border">
          <TabsTrigger value="products" className="flex items-center gap-2 h-full text-base">
            <Package className="h-5 w-5" />
            <span className="hidden sm:inline">Productos</span>
          </TabsTrigger>
          <TabsTrigger value="cart" className="flex items-center gap-2 h-full text-base relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden sm:inline">Carrito</span>
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-6 w-6 p-0 text-xs flex items-center justify-center bg-primary">
                {totalItems}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="checkout" className="flex items-center gap-2 h-full text-base">
            <CreditCard className="h-5 w-5" />
            <span className="hidden sm:inline">Pagar</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: Productos */}
        <TabsContent value="products" className="flex-1 p-4 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col pb-28">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Buscar productos..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenBarcodeScanner}
              className="h-14 w-14"
            >
              <QrCode className="h-6 w-6" />
            </Button>
          </div>

          {/* Grid de productos - MÁS GRANDE Y TÁCTIL */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="bg-muted h-32 animate-pulse" />
                    <CardContent className="p-4">
                      <div className="bg-muted h-4 rounded mb-2 animate-pulse" />
                      <div className="bg-muted h-4 rounded w-2/3 animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id_producto}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Card
                      className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all active:bg-accent"
                      onClick={() => onAddToCart(product)}
                    >
                      <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                        {product.imagen_url ? (
                          <img
                            src={product.imagen_url}
                            alt={product.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-12 w-12 text-muted-foreground" />
                        )}
                        {product.stock !== undefined && product.stock <= 5 && (
                          <Badge className="absolute top-2 right-2 bg-destructive">
                            Stock: {product.stock}
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2">
                          {product.nombre}
                        </h3>

                        <p className="text-primary font-bold text-xl mb-3">
                          S/ {parseFloat(product.precio_unitario_con_igv).toFixed(2)}
                        </p>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                          className="w-full h-10"
                          size="sm"
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
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">
                  No se encontraron productos
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Intenta con otra búsqueda
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: Carrito */}
        <TabsContent value="cart" className="flex-1 p-4 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col pb-28">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Carrito vacío
                </h3>
                <p className="text-muted-foreground">
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-3">
                          <h3 className="font-semibold text-base leading-tight mb-1">
                            {item.nombre}
                          </h3>
                          <p className="text-primary font-bold text-lg">
                            S/ {parseFloat(item.precio_unitario_con_igv).toFixed(2)} c/u
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveFromCart(item.producto_id)}
                          className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUpdateQuantity(item.producto_id, Math.max(0, item.cantidad - 1))}
                            className="h-12 w-12"
                          >
                            <Minus className="h-5 w-5" />
                          </Button>

                          <span className="font-bold text-2xl min-w-[3rem] text-center">
                            {item.cantidad}
                          </span>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUpdateQuantity(item.producto_id, item.cantidad + 1)}
                            className="h-12 w-12"
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
                          <p className="font-bold text-2xl text-primary">
                            S/ {item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: Pagar */}
        <TabsContent value="checkout" className="flex-1 p-4 overflow-y-auto m-0 pb-6">
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Tipo de Documento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tipo de Documento</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
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
                    className="h-14 text-base font-semibold"
                  >
                    {doc.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Cliente */}
            {(tipoDocumento === '01' || tipoDocumento === '03') && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-base leading-tight mb-1">{getClienteNombre()}</p>
                      <p className="text-sm text-muted-foreground">
                        {tipoDocumento === '01' ? 'RUC' : 'DNI'}: {getClienteNumeroDoc()}
                      </p>
                    </div>
                    <Button variant="outline" onClick={onOpenClienteDialog} className="h-10">
                      Cambiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Método de pago */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Método de Pago</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'].map((metodo) => (
                  <Button
                    key={metodo}
                    variant={metodoPago === metodo ? 'default' : 'outline'}
                    onClick={() => setMetodoPago(metodo)}
                    className="h-14 text-base font-semibold capitalize"
                  >
                    {metodo}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Monto recibido (solo efectivo) */}
            {metodoPago === 'efectivo' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Monto Recibido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="S/ 0.00"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    inputSize="lg"
                    className="text-xl font-bold"
                  />
                  {montoRecibido && !isNaN(parseFloat(montoRecibido)) && (
                    <div className="p-4 rounded-xl bg-muted">
                      {parseFloat(montoRecibido) >= total ? (
                        <div className="flex justify-between items-center">
                          <span className="text-base font-semibold">Vuelto</span>
                          <span className="text-2xl font-bold text-emerald-600">
                            S/ {(Math.max(0, parseFloat(montoRecibido) - total)).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-base font-semibold">Falta</span>
                          <span className="text-2xl font-bold text-destructive">
                            S/ {(Math.max(0, total - parseFloat(montoRecibido))).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Observaciones */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Observaciones (opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Sin cebolla, término medio..."
                  className="w-full h-24 p-4 border-2 border-border rounded-xl resize-none bg-background text-base focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 dark:focus:shadow-primary-glow transition-all"
                />
              </CardContent>
            </Card>

            {/* Resumen Total */}
            <Card className="border-2 border-primary dark:shadow-fire">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Productos ({totalItems})</span>
                  <span className="font-semibold">S/ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-2xl pt-3 border-t-2 border-border">
                  <span>Total</span>
                  <span className="text-primary">S/ {total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Botón de guardar */}
            <Button
              onClick={onSaveTable}
              disabled={cart.length === 0 || isProcessingSale || !selectedTable}
              className="w-full h-16 text-xl font-bold"
              size="lg"
            >
              {isProcessingSale ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="h-6 w-6 mr-2" />
                  {selectedTable ? `Guardar Mesa ${selectedTable.number}` : 'Selecciona una mesa primero'}
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Barra inferior fija - REDISEÑADA */}
      {(activeTab === 'products' || activeTab === 'cart') && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t-2 border-border shadow-lg dark:shadow-fire">
          <div className="px-4 pb-safe pt-4 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setActiveTab('cart')}
              className="h-14 flex-1 relative"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              <span className="font-semibold">Carrito</span>
              {totalItems > 0 && (
                <Badge className="ml-2 bg-primary h-6 min-w-[1.5rem] px-2">
                  {totalItems}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab('checkout')}
              disabled={totalItems === 0}
              className="h-14 flex-[2] text-lg font-bold"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Cobrar • S/ {total.toFixed(2)}
            </Button>
          </div>
        </div>
      )}

      {/* Botón flotante de mesas - REDISEÑADO */}
      <AnimatePresence>
        {(activeTab === 'products' || activeTab === 'cart') && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed right-4 bottom-24 z-50"
          >
            <Button
              onClick={() => setShowTableSelector(true)}
              size="lg"
              className="h-14 px-6 shadow-2xl dark:shadow-fire-lg rounded-2xl font-bold"
            >
              <Users className="h-5 w-5 mr-2" />
              {selectedTable ? `Mesa ${selectedTable.number}` : 'Mesas'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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
