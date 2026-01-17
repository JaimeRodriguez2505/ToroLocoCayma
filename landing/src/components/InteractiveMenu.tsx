'use client';

import { useEffect, useMemo, useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getEcommerceProducts, getEcommerceProductsByCategory } from '@/lib/toroApi';
import { EcommerceCategory, EcommerceProduct } from '@/lib/types';
import { getBackendUrl, toWhatsappLink } from '@/lib/url';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for class names
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type SafeImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  src?: string | null;
  alt?: string;
  fill?: boolean;
  fallbackSrc?: string;
};

const SafeImage = ({ src, alt, fill, fallbackSrc = '/placeholder-food.jpg', className, ...props }: SafeImageProps) => {
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

type InteractiveMenuProps = {
  initialCategories: EcommerceCategory[];
  initialProducts: EcommerceProduct[];
};

export default function InteractiveMenu({ initialCategories, initialProducts }: InteractiveMenuProps) {
  const categories = initialCategories;
  const [products, setProducts] = useState<EcommerceProduct[]>(initialProducts);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EcommerceProduct | null>(null);

  const handleCategoryClick = async (categoryId: number | null) => {
    setActiveCategory(categoryId);
    setLoading(true);
    try {
      if (categoryId === null) {
        const prods = await getEcommerceProducts();
        setProducts(prods);
      } else {
        const prods = await getEcommerceProductsByCategory(categoryId);
        setProducts(prods);
      }
    } catch (error) {
      console.error('Error filtering products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#0a0a0a] text-white py-12 md:py-24 relative overflow-hidden font-body">
      {/* Optimized Static Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
         {/* Gradient Mesh - Static CSS for performance */}
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-toro-red font-bold tracking-[0.3em] uppercase text-xs md:text-sm mb-3 block">
              Nuestra Carta
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-display tracking-tight">
              Sabores <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-toro-red">Al Fuego</span>
            </h1>
          </motion.div>
          
          {/* Categories Scroll */}
          <div className="sticky top-4 z-50 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl max-w-4xl mx-auto">
              <div className="flex overflow-x-auto gap-2 scrollbar-hide snap-x">
                <CategoryButton 
                  isActive={activeCategory === null} 
                  onClick={() => handleCategoryClick(null)} 
                  label="Todos" 
                />
                {categories.map((cat) => (
                  <CategoryButton
                    key={cat.id_categoria}
                    isActive={activeCategory === cat.id_categoria}
                    onClick={() => handleCategoryClick(cat.id_categoria)}
                    label={cat.nombre}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="min-h-[600px]">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence mode='popLayout'>
                {products.map((product) => (
                  <ProductCard 
                    key={product.id_producto} 
                    product={product} 
                    onClick={() => setSelectedProduct(product)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <UtensilsIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-xl font-light">No encontramos platos en esta categoría.</p>
              <button 
                onClick={() => handleCategoryClick(null)}
                className="mt-4 text-red-500 hover:text-red-400 underline"
              >
                Ver todo el menú
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// --- Components ---

function CategoryButton({ isActive, onClick, label }: { isActive: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap snap-start flex-shrink-0",
        isActive 
          ? "text-white bg-red-600 shadow-lg shadow-red-900/30" 
          : "text-gray-400 hover:text-white hover:bg-white/5"
      )}
    >
      {label}
    </button>
  );
}

function ProductCard({ product, onClick }: { product: EcommerceProduct; onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="group relative bg-[#121212] rounded-3xl overflow-hidden border border-white/5 hover:border-red-500/50 transition-colors duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-red-900/10"
    >
      {/* Image Aspect Ratio Container */}
      <div className="relative aspect-square w-full overflow-hidden">
        <SafeImage
          src={getBackendUrl(product.imagen_url)}
          alt={product.nombre}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
           {product.es_oferta && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-lg">
              Oferta
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="text-lg font-bold text-white leading-tight group-hover:text-red-500 transition-colors">
            {product.nombre}
          </h3>
          <div className="flex flex-col items-end flex-shrink-0">
             {product.es_oferta ? (
                <>
                  <span className="text-xs text-gray-500 line-through">S/ {product.precio}</span>
                  <span className="text-lg font-bold text-red-500">S/ {product.precio_oferta}</span>
                </>
             ) : (
                <span className="text-lg font-bold text-white">S/ {product.precio}</span>
             )}
          </div>
        </div>
        
        <p className="text-gray-400 text-sm line-clamp-2 mb-4 font-light">
          {product.descripcion || "Delicioso plato preparado al momento."}
        </p>

        <div className="flex items-center text-xs text-gray-500 font-medium uppercase tracking-wider group-hover:text-white transition-colors">
          <span>Ver Detalles</span>
          <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

function ProductModal({ product, onClose }: { product: EcommerceProduct; onClose: () => void }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-5xl bg-[#121212] md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-600 transition-colors border border-white/10"
        >
          <CloseIcon className="w-5 h-5" />
        </button>

        {/* Image Side */}
        <div className="w-full md:w-1/2 relative h-64 md:h-auto bg-black flex-shrink-0">
          <SafeImage
            src={getBackendUrl(product.imagen_url)}
            alt={product.nombre}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent md:bg-gradient-to-r" />
        </div>

        {/* Content Side */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto bg-[#121212]">
          <div className="mb-auto">
            <div className="flex items-center gap-2 mb-6">
               <span className="px-3 py-1 bg-red-600/10 text-red-500 text-xs font-bold rounded-full uppercase tracking-wider border border-red-600/20">
                 Toro Loco Exclusive
               </span>
               <span className="text-toro-red text-xs font-bold flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-toro-red animate-pulse" />
                 Disponible
               </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 font-serif leading-tight">
              {product.nombre}
            </h2>
            
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-3xl font-bold text-red-500">
                S/ {product.es_oferta ? product.precio_oferta : product.precio}
              </span>
              {product.es_oferta && (
                <span className="text-lg text-gray-500 line-through decoration-red-500/30">
                  S/ {product.precio}
                </span>
              )}
            </div>

            <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light mb-8">
              {product.descripcion || "Disfruta de la excelencia culinaria con este plato preparado con los ingredientes más frescos y nuestra técnica de brasas exclusiva."}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <FeatureItem icon={<FireIcon />} text="A la brasa" />
              <FeatureItem icon={<ChefIcon />} text="Receta del Chef" />
              <FeatureItem icon={<FreshIcon />} text="Ingredientes Frescos" />
              <FeatureItem icon={<ClockIcon />} text="Prep: 20 min" />
            </div>
          </div>

          <a 
            href={toWhatsappLink("51987654321") || "#"} // Replace with real number
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-red-900/20 transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <span>Ordenar por WhatsApp</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          </a>
        </div>
      </motion.div>
    </div>
  );
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}

function UtensilsIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
}

function FireIcon() {
  return <svg className="w-5 h-5 text-toro-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>;
}

function ChefIcon() {
  return <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
}

function FreshIcon() {
  return <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
}

function ClockIcon() {
  return <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
      {icon}
      <span className="text-sm font-medium text-gray-300">{text}</span>
    </div>
  );
}
