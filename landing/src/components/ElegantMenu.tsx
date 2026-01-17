'use client';

import { useMemo, useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getEcommerceProducts, getEcommerceProductsByCategory } from '@/lib/toroApi';
import { EcommerceCategory, EcommerceProduct } from '@/lib/types';
import { getBackendUrl } from '@/lib/url';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useCart } from '@/context/CartContext';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type SafeImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  src?: string | null;
  alt?: string;
  fill?: boolean;
  fallbackSrc?: string;
};

const SafeImage = ({
  src,
  alt,
  fill,
  fallbackSrc = '/placeholder-food.jpg',
  className,
  ...props
}: SafeImageProps) => {
  const [error, setError] = useState(false);
  
  const cleanedSrc = useMemo(() => {
    if (!src) return fallbackSrc;
    let clean = src.trim();
    while (clean.endsWith(':')) clean = clean.slice(0, -1);
    return clean || fallbackSrc;
  }, [src, fallbackSrc]);

  return (
    <Image
      src={error ? fallbackSrc : cleanedSrc}
      alt={alt || 'Imagen'}
      fill={fill}
      className={className}
      onError={() => setError(true)}
      unoptimized
      {...props}
    />
  );
};

type ElegantMenuProps = {
  initialCategories: EcommerceCategory[];
  initialProducts: EcommerceProduct[];
};

export default function ElegantMenu({ initialCategories, initialProducts }: ElegantMenuProps) {
  const categories = initialCategories;
  const [products, setProducts] = useState<EcommerceProduct[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<EcommerceProduct | null>(
    initialProducts[0] ?? null
  );
  const [loading, setLoading] = useState(false);

  const handleCategoryClick = async (categoryId: number | null) => {
    setActiveCategory(categoryId);
    setLoading(true);
    try {
      const prods = categoryId === null 
        ? await getEcommerceProducts() 
        : await getEcommerceProductsByCategory(categoryId);
      setProducts(prods);
      if (prods.length > 0) setHoveredProduct(prods[0]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#080808] text-[#e5e5e5] font-sans relative overflow-hidden">
      {/* Background Texture */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]"></div>
      
      {/* Dynamic Background Image (The "Atmosphere") */}
      <div className="fixed inset-0 z-0 transition-opacity duration-1000 ease-in-out opacity-20">
        <AnimatePresence mode="wait">
          {hoveredProduct && (
            <motion.div
              key={hoveredProduct.id_producto}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <SafeImage
                src={getBackendUrl(hoveredProduct.imagen_url)}
                alt="Atmosphere"
                fill
                className="object-cover blur-sm grayscale-[50%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/50 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-10 md:py-36 md:h-screen flex flex-col md:flex-row gap-6 md:gap-16">
        
        {/* Left: Navigation & Branding */}
        <div className="w-full md:w-1/4 flex flex-col md:h-full">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 md:mb-12"
          >
            <h2 className="text-xs md:text-sm font-sans font-bold tracking-[0.4em] text-toro-red uppercase mb-2 md:mb-4">
              Nuestra
            </h2>
            <h1 className="text-4xl md:text-6xl font-bold italic leading-tight mb-2 text-white">
              Carta
            </h1>
            <div className="h-1 w-16 md:w-20 bg-toro-red/50 mt-2 md:mt-4"></div>
          </motion.div>

          {/* Categories - Desktop */}
          <nav className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6 hidden md:block">
            <button
              onClick={() => handleCategoryClick(null)}
              className={cn(
                "text-xl block w-full text-left transition-all duration-300 hover:text-toro-red py-1",
                activeCategory === null ? "text-toro-red font-bold translate-x-2" : "text-gray-400 font-medium hover:text-gray-200"
              )}
            >
              Todos los Platos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id_categoria}
                onClick={() => handleCategoryClick(cat.id_categoria)}
                className={cn(
                  "text-xl block w-full text-left transition-all duration-300 hover:text-toro-red py-1",
                  activeCategory === cat.id_categoria ? "text-toro-red font-bold translate-x-2" : "text-gray-400 font-medium hover:text-gray-200"
                )}
              >
                {cat.nombre}
              </button>
            ))}
          </nav>

          {/* Mobile Categories (Horizontal) - Sticky */}
          <div className="md:hidden sticky top-[70px] z-40 bg-[#080808]/95 backdrop-blur-xl -mx-4 px-4 py-3 mb-6 flex gap-2 overflow-x-auto scrollbar-hide border-b border-white/10 shadow-xl">
             <button
                onClick={() => handleCategoryClick(null)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all shadow-lg flex-shrink-0",
                  activeCategory === null 
                    ? "bg-toro-red text-white shadow-red-900/20 ring-1 ring-toro-red/50" 
                    : "bg-[#1a1a1a] text-gray-400 border border-white/10"
                )}
              >
                Todos
              </button>
            {categories.map((cat) => (
              <button
                key={cat.id_categoria}
                onClick={() => handleCategoryClick(cat.id_categoria)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all shadow-lg flex-shrink-0",
                  activeCategory === cat.id_categoria 
                    ? "bg-toro-red text-white shadow-red-900/20 ring-1 ring-toro-red/50" 
                    : "bg-[#1a1a1a] text-gray-400 border border-white/10"
                )}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Menu List */}
        <div className="w-full md:w-2/4 md:h-full md:overflow-y-auto md:pr-4 custom-scrollbar pb-10 relative">
          {/* Scroll Indicator Gradient (Desktop Only) */}
          <div className="hidden md:flex fixed bottom-0 left-0 md:left-auto md:w-[calc(50%-2rem)] w-full h-32 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none z-20 justify-center items-end pb-8">
             <div className="animate-bounce text-toro-red opacity-50 flex flex-col items-center">
               <span className="text-[10px] uppercase tracking-widest mb-1">Desliza</span>
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
               </svg>
             </div>
          </div>
          {loading ? (
             <div className="space-y-8">
               {[1,2,3,4].map(i => (
                 <div key={i} className="animate-pulse flex gap-4">
                   <div className="w-16 h-16 bg-white/5 rounded-full"></div>
                   <div className="flex-1 space-y-2">
                     <div className="h-4 bg-white/5 w-3/4"></div>
                     <div className="h-3 bg-white/5 w-1/2"></div>
                   </div>
                 </div>
               ))}
             </div>
          ) : (
            <motion.div layout className="space-y-8 md:space-y-12">
              <AnimatePresence mode="popLayout">
                {products.map((product) => (
                  <MenuItem 
                    key={product.id_producto} 
                    product={product} 
                    onHover={() => setHoveredProduct(product)}
                  />
                ))}
              </AnimatePresence>

              {!loading && products.length === 0 && (
                <div className="py-20 text-center text-gray-500">
                  <p>No se encontraron platos en esta sección.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right: Preview (Desktop Only) */}
        <div className="hidden md:block w-1/4 h-full relative">
           <div className="sticky top-0 h-full flex items-center justify-center">
             <AnimatePresence mode="wait">
               {hoveredProduct ? (
                 <motion.div
                    key={hoveredProduct.id_producto}
                    initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                 >
                    <SafeImage
                      src={getBackendUrl(hoveredProduct.imagen_url)}
                      alt={hoveredProduct.nombre}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                       <p className="text-toro-red text-xs font-bold uppercase tracking-widest mb-1">
                         Recomendación del Chef
                       </p>
                       <h3 className="text-2xl font-bold text-white mb-2">{hoveredProduct.nombre}</h3>
                       <div className="flex items-center gap-2">
                         <span className="text-3xl font-bold text-white">S/ {hoveredProduct.es_oferta ? hoveredProduct.precio_oferta : hoveredProduct.precio}</span>
                       </div>
                    </div>
                 </motion.div>
               ) : (
                 <div className="text-center text-gray-500 opacity-50">
                    <p className="uppercase tracking-widest text-xs">Selecciona un plato</p>
                 </div>
               )}
             </AnimatePresence>
           </div>
        </div>

      </div>
    </section>
  );
}

function MenuItem({ product, onHover }: { product: EcommerceProduct, onHover: () => void }) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={onHover}
      onClick={onHover}
      className="group relative cursor-pointer"
    >
      {/* --- MOBILE CARD DESIGN (Compact Horizontal) --- */}
      <div className="md:hidden flex gap-4 mb-4 bg-[#121212] p-3 rounded-xl border border-white/5 shadow-lg active:scale-[0.98] transition-transform">
         {/* Image Area */}
         <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
            <SafeImage
              src={getBackendUrl(product.imagen_url)}
              alt={product.nombre}
              fill
              className="object-cover"
            />
         </div>
         
         {/* Content Area */}
         <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
               <div className="flex justify-between items-start gap-2">
                 <h3 className="text-base font-display font-bold text-white leading-tight mb-1 line-clamp-2">
                   {product.nombre}
                 </h3>
                 <span className="text-toro-red font-bold text-base whitespace-nowrap shrink-0">
                   S/ {product.es_oferta ? product.precio_oferta : product.precio}
                 </span>
               </div>
               <p className="text-gray-400 text-xs line-clamp-2 font-light">
                 {product.descripcion || "Una exquisita preparación de la casa."}
               </p>
            </div>
            
            <div className="flex justify-between items-center mt-2">
               {product.es_oferta ? (
                  <span className="text-[10px] text-toro-red font-bold uppercase border border-toro-red/30 px-2 py-0.5 rounded bg-toro-red/5">
                    Oferta
                  </span>
               ) : (
                 <span></span> 
               )}
               
               <button 
                 onClick={handleAdd}
                 disabled={isAdded}
                 className={cn(
                   "text-[10px] font-bold px-3 py-1.5 rounded-full transition-all duration-300 uppercase tracking-wider flex items-center justify-center min-w-[80px]",
                   isAdded 
                     ? "bg-green-600 text-white border border-green-500" 
                     : "text-white bg-white/10 border border-white/10 hover:bg-toro-red"
                 )}
               >
                 {isAdded ? (
                   <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                     Agregado
                   </motion.span>
                 ) : "Agregar"}
               </button>
            </div>
         </div>
      </div>

      {/* --- DESKTOP LIST DESIGN --- */}
      <div className="hidden md:block">
          <div className="flex items-baseline justify-between mb-2 border-b border-white/10 pb-2 group-hover:border-toro-red/50 transition-colors duration-500">
            <h3 className="text-3xl font-display font-bold text-white group-hover:text-toro-red transition-colors duration-300 tracking-wide">
              {product.nombre}
            </h3>
            <span className="text-2xl font-bold text-toro-red/80 group-hover:text-toro-red transition-colors ml-4 shrink-0">
              S/ {product.es_oferta ? product.precio_oferta : product.precio}
            </span>
          </div>
          
          <div className="flex gap-4">
             <div className="flex-1">
                <p className="text-gray-300 font-sans font-normal text-lg leading-relaxed line-clamp-2 group-hover:text-white transition-colors">
                  {product.descripcion || "Una exquisita preparación de la casa."}
                </p>
                <div className="mt-3 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0 transform">
                  <button 
                    onClick={handleAdd}
                    disabled={isAdded}
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1",
                      isAdded ? "text-green-500" : "text-toro-red hover:text-white"
                    )}
                  >
                    {isAdded ? (
                      <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                        Agregado al pedido ✓
                      </motion.span>
                    ) : (
                      <>Agregar al pedido <span className="text-lg">+</span></>
                    )}
                  </button>
                  {product.es_oferta && (
                    <span className="text-xs font-bold uppercase tracking-widest text-toro-red">
                      Oferta Especial
                    </span>
                  )}
                </div>
             </div>
          </div>
      </div>
    </motion.div>
  );
}
