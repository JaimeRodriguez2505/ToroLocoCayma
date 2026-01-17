"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  ShoppingCart,
  Star,
  Coffee,
  Utensils,
  Beer,
  Wine,
  IceCream
} from 'lucide-react'
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { ScrollArea, ScrollBar } from "../ui/scroll-area"
import { Product } from "../../services/productService"
import { Category } from "../../services/categoryService"
import { formatCurrency } from "../../lib/utils"

interface DigitalMenuProps {
  products: Product[]
  categories: Category[]
  onClose?: () => void
  isLoadingProducts?: boolean
  isLoadingCategories?: boolean
  className?: string
  onAddToCart: (product: Product) => void
}

export function DigitalMenu({ 
  products, 
  categories, 
  isLoadingProducts = false, 
  isLoadingCategories = false,
  className = "",
  onAddToCart
}: DigitalMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.id_categoria === selectedCategory
    const matchesSearch = product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  }

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("bebida") || lowerName.includes("refresco")) return <Beer className="h-5 w-5" />
    if (lowerName.includes("cafe") || lowerName.includes("café")) return <Coffee className="h-5 w-5" />
    if (lowerName.includes("postre") || lowerName.includes("helado")) return <IceCream className="h-5 w-5" />
    if (lowerName.includes("vino") || lowerName.includes("licor")) return <Wine className="h-5 w-5" />
    return <Utensils className="h-5 w-5" />
  }

  return (
    <div className={`flex flex-col h-full bg-background/50 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 ${className}`}>
      
      {/* Header & Search */}
      <div className="p-4 sm:p-6 space-y-4 bg-gradient-to-b from-background/80 to-background/20 z-10 sticky top-0 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Buscar en el menú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all hover:bg-black/30"
            />
          </div>
          {selectedCategory !== 'all' && (
            <Button 
              variant="ghost" 
              onClick={() => setSelectedCategory('all')}
              className="hidden sm:flex"
            >
              Ver Todo
            </Button>
          )}
        </div>

        {/* Categories Carousel */}
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex space-x-2 sm:space-x-3 p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory('all')}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                ${selectedCategory === 'all' 
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(236,19,19,0.5)]" 
                  : "bg-secondary/50 hover:bg-secondary text-secondary-foreground border border-transparent hover:border-primary/20"}
              `}
            >
              <Star className={`h-4 w-4 ${selectedCategory === 'all' ? "fill-current" : ""}`} />
              Todo
            </motion.button>

            {categories.map((category) => (
              <motion.button
                key={category.id_categoria}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id_categoria)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                  ${selectedCategory === category.id_categoria 
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(236,19,19,0.5)]" 
                    : "bg-secondary/50 hover:bg-secondary text-secondary-foreground border border-transparent hover:border-primary/20"}
                `}
              >
                {getCategoryIcon(category.nombre)}
                {category.nombre}
              </motion.button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar" ref={scrollContainerRef}>
        <AnimatePresence mode="wait">
          
          {isLoadingProducts || isLoadingCategories ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground"
            >
              <Coffee className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No se encontraron productos</p>
              <p className="text-sm">Intenta con otra búsqueda o categoría</p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedCategory || "all"}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
            >
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id_producto} 
                  product={product} 
                  onAdd={() => onAddToCart(product)}
                  variants={itemVariants}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ProductCard({ product, onAdd, variants }: { product: Product, onAdd: () => void, variants: any }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      variants={variants}
      className="group relative flex flex-col h-full bg-card hover:bg-card/80 border border-border/50 hover:border-primary/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_10px_40px_-10px_rgba(236,19,19,0.1)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onAdd}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary/30">
        {product.imagen_url ? (
          <motion.img
            src={product.imagen_url}
            alt={product.nombre}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <Utensils className="h-12 w-12" />
          </div>
        )}
        
        {/* Quick Add Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-primary text-white rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <ShoppingCart className="h-6 w-6" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.es_oferta && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-sm">
              Oferta
            </Badge>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <Badge variant="outline" className="bg-orange-500/90 text-white border-0 shadow-sm">
              ¡Poco Stock!
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 space-y-2">
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors">
            {product.nombre}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {product.descripcion || "Sin descripción disponible"}
          </p>
        </div>
        
        <div className="flex items-end justify-between mt-2">
          <div className="flex flex-col">
            {product.es_oferta && product.precio_oferta ? (
              <>
                <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                  {formatCurrency(Number(product.precio_unitario_con_igv))}
                </span>
                <span className="font-bold text-lg text-red-500">
                  {formatCurrency(Number(product.precio_oferta_con_igv))}
                </span>
              </>
            ) : (
              <span className="font-bold text-lg text-primary">
                {formatCurrency(Number(product.precio_unitario_con_igv))}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
