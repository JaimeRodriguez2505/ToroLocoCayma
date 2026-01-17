"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Tags,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  fetchCategories,
  createCategory,
  createCategoryWithImage,
  deleteCategory,
} from "../../services/categoryService"
import { Input } from "../../components/ui/input"
import { motion } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { useBusinessHours } from "../../hooks/useBusinessHours"
import { useAuth } from "../../contexts/AuthContext"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"

const categorySchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

const CategoriesPage = () => {
  // Añadir el hook para cambiar el título del documento
  useDocumentTitle("Categorías")

  const [searchTerm, setSearchTerm] = useState("")
  // Estado para el tipo de orden
  const [sortType, setSortType] = useState("id_desc") // id_desc, id_asc, name_asc, name_desc
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // Añadir estos estados al inicio del componente, justo después de los otros estados
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)
  // Estado para la imagen de la categoría y preview
  const [categoryImage, setCategoryImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Estados para la vista de imagen
  const [isImageViewOpen, setIsImageViewOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("")

  const queryClient = useQueryClient()

  // Función para abrir la vista de imagen
  const openImageView = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    setIsImageViewOpen(true)
  }

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (data instanceof FormData) {
        return createCategoryWithImage(data)
      }
      return createCategory(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Categoría creada exitosamente")
      setIsDialogOpen(false)
      form.reset()
      setCategoryImage(null)
      setImagePreview(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al crear la categoría")
    },
  })

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Categoría eliminada exitosamente")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al eliminar la categoría")
    },
  })

  // Form for creating a new category
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  })

  const onSubmit = (data: CategoryFormValues) => {
    // Si hay imagen, usar FormData y createCategoryWithImage
    if (categoryImage) {
      const formData = new FormData()
      formData.append("nombre", data.nombre)
      if (data.descripcion) formData.append("descripcion", data.descripcion)
      formData.append("imagen_categoria", categoryImage) // <- nombre correcto para Multer
      createMutation.mutate(formData as any)
    } else {
      createMutation.mutate(data)
    }
  }

  // Ordenar categorías según el tipo de orden seleccionado
  const sortedCategories = (categories?.slice() || []).sort((a, b) => {
    if (sortType === "id_desc") return b.id_categoria - a.id_categoria
    if (sortType === "id_asc") return a.id_categoria - b.id_categoria
    if (sortType === "name_asc") return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
    if (sortType === "name_desc") return b.nombre.localeCompare(a.nombre, "es", { sensitivity: "base" })
    return 0
  })

  // Filter categories based on search term
  const filteredCategories = sortedCategories.filter(
    (category) =>
      category.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.descripcion && category.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Calcular índices para paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredCategories?.slice(indexOfFirstItem, indexOfLastItem) || []

  // Calcular el total de páginas
  const totalPages = filteredCategories ? Math.ceil(filteredCategories.length / itemsPerPage) : 0

  // Función para cambiar de página
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Modificar la función handleDeleteCategory para usar nuestro nuevo modal personalizado en vez de window.confirm
  const handleDeleteCategory = (id: number) => {
    setDeletingCategoryId(id)
    setShowDeleteDialog(true)
  }

  // Añadir este nuevo manejador para confirmar la eliminación
  const confirmDelete = () => {
    if (deletingCategoryId) {
      deleteMutation.mutate(deletingCategoryId, {
        onError: (error: any) => {
          // Verificar si es un error de permisos (403)
          if (error.message.includes("No tienes permiso")) {
            toast.error("No puedes eliminar categorías fuera del horario laboral (8:00 AM - 8:00 PM)")
          } else {
            toast.error(error.message || "Error al eliminar la categoría")
          }
          setShowDeleteDialog(false)
          setDeletingCategoryId(null)
        },
      })
    }
  }
  const { isWithinBusinessHours } = useBusinessHours()
  const { user } = useAuth()

  // Función para limpiar imagen
  const clearImage = () => {
    setCategoryImage(null)
    setImagePreview(null)
    const fileInput = document.getElementById("category-image-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  // Manejar cambio de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 5MB.")
        return
      }
      // Validar tipo
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        toast.error("Tipo de archivo no válido. Solo JPG, PNG y WebP.")
        return
      }
      setCategoryImage(file)
      // Crear preview
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-3 lg:p-4">
      <motion.div
        className="max-w-7xl mx-auto space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {" "}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm dark:shadow-ember"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
              <Tags className="h-8 w-8 text-primary" />
              Categorías
            </h1>
            <p className="text-muted-foreground text-base mt-2">Gestiona las categorías de tus productos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        className="font-semibold dark:shadow-fire"
                        size="lg"
                        onClick={() => setIsDialogOpen(true)}
                        disabled={user?.id_role === 2 && !isWithinBusinessHours}
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Nueva Categoría
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {user?.id_role === 2 && !isWithinBusinessHours && (
                    <TooltipContent className="max-w-xs">
                      <p>No puedes crear categorías fuera del horario laboral (8:00 AM - 8:00 PM)</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </DialogTrigger>{" "}
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-heading font-bold flex items-center gap-2">
                  <Tags className="h-5 w-5 text-primary" />
                  Crear Nueva Categoría
                </DialogTitle>
                <DialogDescription>
                  Completa el formulario para crear una nueva categoría
                </DialogDescription>
              </DialogHeader>
              <div className="p-6 space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nombre de la categoría" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Descripción (opcional)" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Imagen de la categoría estilo productos */}
                    <div className="space-y-4">
                      <FormLabel className="text-sm font-semibold text-foreground">Imagen de la Categoría</FormLabel>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="category-image-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {imagePreview ? (
                              <div className="relative">
                                <img
                                  src={imagePreview || "/placeholder.svg"}
                                  alt="Preview"
                                  className="h-20 w-20 object-cover rounded-lg shadow-md"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    clearImage()
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Tags className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                  <span className="font-semibold">Click para subir</span> o arrastra y suelta
                                </p>
                                <p className="text-xs text-muted-foreground">PNG, JPG o WebP (MAX. 5MB)</p>
                              </>
                            )}
                          </div>
                          <input
                            id="category-image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                    </div>
                  </form>
                </Form>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={createMutation.isPending}
                  className="dark:shadow-fire"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Categoría"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>{" "}
        <motion.div
          className="bg-card border border-border rounded-2xl shadow-sm dark:shadow-ember"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground">Lista de Categorías</h2>
                <p className="text-muted-foreground text-sm mt-2">
                  Administra las categorías para organizar tus productos
                </p>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-3 py-2 bg-muted/30 rounded-lg border border-border">
                  <Tags className="h-4 w-4" />
                  <span>{filteredCategories?.length || 0} categorías</span>
                </div>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                  className="rounded-xl border border-border px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                >
                  <option value="id_desc">Más recientes</option>
                  <option value="id_asc">Más antiguas</option>
                  <option value="name_asc">Nombre A-Z</option>
                  <option value="name_desc">Nombre Z-A</option>
                </select>
              </div>
            </div>
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar categorías por nombre o descripción..."
                className="pl-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>{" "}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-spin mx-auto"></div>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">Cargando categorías...</p>
                </div>
              </div>
            ) : filteredCategories && filteredCategories.length > 0 ? (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/80">
                      <TableHead className="w-16 text-center font-semibold">
                        Imagen
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Nombre
                      </TableHead>
                      <TableHead className="text-center font-semibold hidden md:table-cell">
                        Descripción
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((category, index) => (
                      <motion.tr
                        key={category.id_categoria}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 * index }}
                        className="group hover:bg-muted/30 transition-all duration-200 border-border"
                      >
                        <TableCell className="w-16 text-center">
                          {category.imagen_url ? (
                            <div
                              className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer group/image relative mx-auto border border-gray-200 dark:border-gray-700 shadow"
                              onClick={() => openImageView(category.imagen_url!)}
                              tabIndex={0}
                              role="button"
                              aria-label="Ver imagen"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") openImageView(category.imagen_url!)
                              }}
                            >
                              <img
                                src={category.imagen_url || "/placeholder.svg"}
                                alt={category.nombre}
                                className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-200 pointer-events-none"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                                <Eye className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto flex items-center justify-center text-gray-400">
                              <Tags className="h-6 w-6" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-gray-900 dark:text-gray-100 font-medium">
                          {category.nombre}
                        </TableCell>
                        <TableCell className="text-center text-gray-600 dark:text-gray-400 hidden md:table-cell">
                          {category.descripcion || (
                            <span className="italic text-gray-400 dark:text-gray-500">Sin descripción</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                            >
                              <Link to={`/categories/${category.id_categoria}`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(category.id_categoria)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center py-24 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-40 h-40 rounded-full bg-primary/10 flex items-center justify-center mb-8 shadow-md dark:shadow-ember">
                  <Tags className="h-20 w-20 text-primary" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-foreground mb-4">No hay categorías</h3>
                <p className="text-muted-foreground text-base mb-8 max-w-md leading-relaxed">
                  {searchTerm
                    ? "No se encontraron categorías con ese término de búsqueda"
                    : "Comienza creando tu primera categoría para organizar tus productos"}
                </p>
                {!searchTerm && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            onClick={() => setIsDialogOpen(true)}
                            className="font-semibold dark:shadow-fire"
                            size="lg"
                            disabled={user?.id_role === 2 && !isWithinBusinessHours}
                          >
                            <Plus className="mr-2 h-5 w-5" />
                            Nueva Categoría
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {user?.id_role === 2 && !isWithinBusinessHours && (
                        <TooltipContent className="max-w-xs">
                          <p>No puedes crear categorías fuera del horario laboral (8:00 AM - 8:00 PM)</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </motion.div>
            )}{" "}
            {/* Paginación mejorada */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <div className="text-sm text-muted-foreground font-medium">
                  Mostrando <span className="font-bold text-primary">{indexOfFirstItem + 1}</span> a{" "}
                  <span className="font-bold text-primary">{Math.min(indexOfLastItem, filteredCategories?.length || 0)}</span> de{" "}
                  <span className="font-bold text-primary">{filteredCategories?.length || 0}</span> categorías
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-10"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm font-semibold text-foreground px-3 py-2 bg-muted/50 rounded-lg border border-border">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-10"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>{" "}
      {/* Modal de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl font-heading font-bold text-center">
              Eliminar categoría
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              ¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center space-x-3 mt-6">
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Image view modal */}
      {isImageViewOpen && selectedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsImageViewOpen(false)}
        >
          <div className="relative max-w-md max-h-96 flex items-center justify-center">
            <div className="relative">
              <img
                src={selectedImageUrl || "/placeholder.svg"}
                alt="Imagen de la categoría"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/70 text-white hover:bg-black/90 border-white/20 rounded-full h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsImageViewOpen(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesPage
