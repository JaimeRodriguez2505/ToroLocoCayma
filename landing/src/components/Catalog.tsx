'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getEcommerceCategories, getEcommerceProducts, getEcommerceProductsByCategory } from '@/lib/toroApi';
import { EcommerceCategory, EcommerceProduct } from '@/lib/types';
import { getBackendUrl } from '@/lib/url';

export default function Catalog() {
  const [categories, setCategories] = useState<EcommerceCategory[]>([]);
  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cats = await getEcommerceCategories();
        setCategories(cats);
        
        // Cargar productos iniciales (todos o la primera categoría)
        const prods = await getEcommerceProducts();
        setProducts(prods);
      } catch (error) {
        console.error('Error fetching catalog data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    <section id="menu" className="py-24 bg-toro-black relative">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Header de Sección */}
        <div className="text-center mb-16">
          <h2 className="text-toro-orange font-bold tracking-widest uppercase mb-2 text-sm">Nuestra Carta</h2>
          <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            SABORES AL <span className="text-toro-red">FUEGO</span>
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-toro-red to-transparent mx-auto"></div>
        </div>

        {/* Filtros de Categoría */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`px-6 py-2 rounded-sm text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
              activeCategory === null
                ? 'bg-toro-red text-white shadow-lg shadow-toro-red/25 scale-105'
                : 'bg-toro-charcoal text-gray-400 hover:bg-toro-dark hover:text-white border border-white/5'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id_categoria}
              onClick={() => handleCategoryClick(cat.id_categoria)}
              className={`px-6 py-2 rounded-sm text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                activeCategory === cat.id_categoria
                  ? 'bg-toro-red text-white shadow-lg shadow-toro-red/25 scale-105'
                  : 'bg-toro-charcoal text-gray-400 hover:bg-toro-dark hover:text-white border border-white/5'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Grid de Productos */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-toro-dark h-96 rounded-sm"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div 
                key={product.id_producto} 
                className="group bg-toro-dark border border-white/5 rounded-sm overflow-hidden hover:border-toro-orange/30 transition-all duration-300 hover:shadow-xl hover:shadow-toro-orange/5"
              >
                {/* Imagen Producto */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={product.imagen_url ? getBackendUrl(product.imagen_url) : '/placeholder-food.jpg'} // Necesitarás un placeholder real o usar una URL externa
                    alt={product.nombre}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-toro-dark via-transparent to-transparent opacity-80"></div>
                  
                  {/* Badge de Oferta */}
                  {product.es_oferta && (
                    <div className="absolute top-4 right-4 bg-toro-red text-white text-xs font-bold px-3 py-1 uppercase tracking-wider shadow-lg">
                      Oferta
                    </div>
                  )}
                </div>

                {/* Info Producto */}
                <div className="p-6 relative">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-display font-bold text-white group-hover:text-toro-orange transition-colors">
                      {product.nombre}
                    </h4>
                    <span className="text-toro-orange font-bold text-lg">
                      S/ {product.es_oferta ? product.precio_oferta : product.precio}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2 font-light">
                    {product.descripcion || "Deliciosa preparación con nuestros mejores ingredientes seleccionados."}
                  </p>

                  <button className="w-full py-3 border border-white/10 text-white uppercase text-xs font-bold tracking-widest hover:bg-white hover:text-toro-black transition-colors">
                    Ordenar Ahora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {products.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl font-light">No hay productos disponibles en esta categoría.</p>
          </div>
        )}
      </div>
    </section>
  );
}
