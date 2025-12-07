import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import { Printer, Settings } from 'lucide-react'

export interface PrinterConfig {
  tipo: 'cocina' | 'recepcion'
  nombre: string
  ip?: string
  puerto?: number
  ancho: '58mm' | '80mm'
  habilitada: boolean
}

interface PrinterConfigDialogProps {
  isOpen: boolean
  onClose: () => void
}

const STORAGE_KEY = 'printer_configs'

const defaultPrinterConfig: PrinterConfig = {
  tipo: 'recepcion',
  nombre: 'Impresora Predeterminada',
  ancho: '80mm',
  habilitada: true
}

export const PrinterConfigDialog = ({ isOpen, onClose }: PrinterConfigDialogProps) => {
  const [cocinaConfig, setCocinaConfig] = useState<PrinterConfig>({
    ...defaultPrinterConfig,
    tipo: 'cocina',
    nombre: 'Impresora de Cocina'
  })

  const [recepcionConfig, setRecepcionConfig] = useState<PrinterConfig>({
    ...defaultPrinterConfig,
    tipo: 'recepcion',
    nombre: 'Impresora de Recepción'
  })

  // Cargar configuración desde localStorage
  useEffect(() => {
    if (isOpen) {
      loadConfigs()
    }
  }, [isOpen])

  const loadConfigs = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const configs = JSON.parse(stored)
        if (configs.cocina) {
          setCocinaConfig(configs.cocina)
        }
        if (configs.recepcion) {
          setRecepcionConfig(configs.recepcion)
        }
      }
    } catch (error) {
      console.error('Error al cargar configuración de impresoras:', error)
    }
  }

  const saveConfigs = () => {
    try {
      const configs = {
        cocina: cocinaConfig,
        recepcion: recepcionConfig
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
      toast.success('Configuración de impresoras guardada')
      onClose()
    } catch (error) {
      console.error('Error al guardar configuración:', error)
      toast.error('Error al guardar la configuración')
    }
  }

  const testPrinter = async (tipo: 'cocina' | 'recepcion') => {
    const config = tipo === 'cocina' ? cocinaConfig : recepcionConfig
    toast.info(`Enviando página de prueba a: ${config.nombre}`)

    // Aquí iría la lógica real de impresión de prueba
    setTimeout(() => {
      toast.success(`Prueba enviada a ${config.nombre}`)
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Impresoras
          </DialogTitle>
          <DialogDescription>
            Configure las impresoras para comandas (cocina) y documentos de venta (recepción)
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cocina" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cocina" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Cocina
            </TabsTrigger>
            <TabsTrigger value="recepcion" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Recepción
            </TabsTrigger>
          </TabsList>

          {/* Configuración Impresora de Cocina */}
          <TabsContent value="cocina" className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="cocina-enabled">Impresora Habilitada</Label>
                <input
                  id="cocina-enabled"
                  type="checkbox"
                  checked={cocinaConfig.habilitada}
                  onChange={(e) => setCocinaConfig({ ...cocinaConfig, habilitada: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cocina-name">Nombre de la Impresora</Label>
                <Input
                  id="cocina-name"
                  value={cocinaConfig.nombre}
                  onChange={(e) => setCocinaConfig({ ...cocinaConfig, nombre: e.target.value })}
                  placeholder="Ej: Impresora Cocina Principal"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cocina-width">Ancho de Papel</Label>
                <Select
                  value={cocinaConfig.ancho}
                  onValueChange={(value: '58mm' | '80mm') =>
                    setCocinaConfig({ ...cocinaConfig, ancho: value })
                  }
                >
                  <SelectTrigger id="cocina-width">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm (Pequeño)</SelectItem>
                    <SelectItem value="80mm">80mm (Estándar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cocina-ip">Dirección IP (Opcional)</Label>
                <Input
                  id="cocina-ip"
                  value={cocinaConfig.ip || ''}
                  onChange={(e) => setCocinaConfig({ ...cocinaConfig, ip: e.target.value })}
                  placeholder="Ej: 192.168.1.100"
                />
                <p className="text-xs text-gray-500">
                  Deja vacío para usar la impresora predeterminada del sistema
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cocina-port">Puerto (Opcional)</Label>
                <Input
                  id="cocina-port"
                  type="number"
                  value={cocinaConfig.puerto || ''}
                  onChange={(e) => setCocinaConfig({
                    ...cocinaConfig,
                    puerto: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Ej: 9100"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => testPrinter('cocina')}
                disabled={!cocinaConfig.habilitada}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Página de Prueba
              </Button>
            </div>
          </TabsContent>

          {/* Configuración Impresora de Recepción */}
          <TabsContent value="recepcion" className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="recepcion-enabled">Impresora Habilitada</Label>
                <input
                  id="recepcion-enabled"
                  type="checkbox"
                  checked={recepcionConfig.habilitada}
                  onChange={(e) => setRecepcionConfig({ ...recepcionConfig, habilitada: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="recepcion-name">Nombre de la Impresora</Label>
                <Input
                  id="recepcion-name"
                  value={recepcionConfig.nombre}
                  onChange={(e) => setRecepcionConfig({ ...recepcionConfig, nombre: e.target.value })}
                  placeholder="Ej: Impresora Recepción"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="recepcion-width">Ancho de Papel</Label>
                <Select
                  value={recepcionConfig.ancho}
                  onValueChange={(value: '58mm' | '80mm') =>
                    setRecepcionConfig({ ...recepcionConfig, ancho: value })
                  }
                >
                  <SelectTrigger id="recepcion-width">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm (Pequeño)</SelectItem>
                    <SelectItem value="80mm">80mm (Estándar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="recepcion-ip">Dirección IP (Opcional)</Label>
                <Input
                  id="recepcion-ip"
                  value={recepcionConfig.ip || ''}
                  onChange={(e) => setRecepcionConfig({ ...recepcionConfig, ip: e.target.value })}
                  placeholder="Ej: 192.168.1.101"
                />
                <p className="text-xs text-gray-500">
                  Deja vacío para usar la impresora predeterminada del sistema
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="recepcion-port">Puerto (Opcional)</Label>
                <Input
                  id="recepcion-port"
                  type="number"
                  value={recepcionConfig.puerto || ''}
                  onChange={(e) => setRecepcionConfig({
                    ...recepcionConfig,
                    puerto: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Ej: 9100"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => testPrinter('recepcion')}
                disabled={!recepcionConfig.habilitada}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Página de Prueba
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={saveConfigs}>
            Guardar Configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Función auxiliar para obtener la configuración de una impresora
export const getPrinterConfig = (tipo: 'cocina' | 'recepcion'): PrinterConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const configs = JSON.parse(stored)
      if (configs[tipo]) {
        return configs[tipo]
      }
    }
  } catch (error) {
    console.error('Error al cargar configuración de impresora:', error)
  }

  // Retornar configuración por defecto
  return {
    ...defaultPrinterConfig,
    tipo,
    nombre: tipo === 'cocina' ? 'Impresora de Cocina' : 'Impresora de Recepción'
  }
}

export default PrinterConfigDialog
