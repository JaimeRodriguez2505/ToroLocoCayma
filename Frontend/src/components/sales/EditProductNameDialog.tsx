import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface EditProductNameDialogProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  currentEditedName?: string
  onSave: (newName: string) => void
}

export const EditProductNameDialog = ({
  isOpen,
  onClose,
  productName,
  currentEditedName,
  onSave,
}: EditProductNameDialogProps) => {
  const [editedName, setEditedName] = useState(currentEditedName || productName)

  const handleSave = () => {
    const trimmedName = editedName.trim()
    if (trimmedName) {
      onSave(trimmedName)
      onClose()
    }
  }

  const handleReset = () => {
    setEditedName(productName)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Nombre del Producto</DialogTitle>
          <DialogDescription>
            El nombre editado aparecerá en la factura/boleta/ticket. El nombre original se mantiene en la base de datos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="original-name">Nombre Original</Label>
            <Input
              id="original-name"
              value={productName}
              disabled
              className="bg-gray-100 dark:bg-gray-800"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edited-name">Nombre para Factura</Label>
            <Input
              id="edited-name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Ingrese el nuevo nombre"
              maxLength={100}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                }
              }}
            />
            <p className="text-xs text-gray-500">
              {editedName.length}/100 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
          >
            Restaurar Original
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!editedName.trim()}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditProductNameDialog
