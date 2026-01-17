'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { getEcommerceOffers, getEcommerceTarjetas } from '@/lib/toroApi';
import { EcommerceProduct, EcommerceTarjeta } from '@/lib/types';
import { getBackendUrl } from '@/lib/url';
import { useCart } from '@/context/CartContext';

export default function PromoGrid() {
  const [offers, setOffers] = useState<EcommerceProduct[]>([]);
  const [tarjetas, setTarjetas] = useState<EcommerceTarjeta[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<EcommerceTarjeta | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offersData, tarjetasData] = await Promise.all([
          getEcommerceOffers(),
          getEcommerceTarjetas()
        ]);
        setOffers(offersData.slice(0, 3)); // Solo mostrar las 3 mejores ofertas
        setTarjetas(tarjetasData);
      } catch (error) {
        console.error('Error fetching promo data:', error);
      }
    };

    fetchData();
  }, []);

  if (offers.length === 0 && tarjetas.length === 0) return null;

  return (
    <section id="promociones" className="py-24 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-toro-red/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-amber-900/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-toro-red font-bold tracking-[0.3em] uppercase text-xs md:text-sm mb-4 block">
              Oportunidades Únicas
            </span>
            <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight">
              Promociones <span className="text-transparent bg-clip-text bg-gradient-to-r from-toro-red to-amber-600">&</span> Ofertas
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-toro-red to-transparent mx-auto rounded-full"></div>
          </motion.div>
        </div>

        {/* Tarjetas de Marketing (Banners Promocionales) */}
        {tarjetas.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 mb-16 md:mb-24">
            {tarjetas.map((tarjeta, index) => (
              <motion.div 
                key={tarjeta.id_tarjeta} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative h-[280px] md:h-[450px] rounded-2xl md:rounded-3xl overflow-hidden group cursor-pointer border border-white/5 hover:border-toro-red/30 transition-colors duration-500 shadow-2xl"
                onClick={() => setSelectedPromo(tarjeta)}
              >
                <Image
                  src={tarjeta.imagen_url ? getBackendUrl(tarjeta.imagen_url) : '/placeholder-promo.jpg'}
                  alt={tarjeta.titulo}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                
                <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-12">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-toro-red text-white text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 md:mb-4 shadow-lg shadow-red-900/40">
                      Destacado
                    </span>
                    <h4 className="text-xl md:text-4xl font-display font-bold text-white mb-2 md:mb-3 leading-tight line-clamp-2">
                      {tarjeta.titulo}
                    </h4>
                    <p className="text-gray-300 font-body text-xs md:text-base leading-relaxed mb-4 md:mb-6 max-w-lg line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      {tarjeta.descripcion}
                    </p>
                    <button className="flex items-center gap-2 text-white text-xs md:text-sm font-bold uppercase tracking-widest group/btn">
                      <span className="border-b-2 border-toro-red pb-1 group-hover/btn:text-toro-red transition-colors">Ver Detalles</span>
                      <svg className="w-3 h-3 md:w-4 md:h-4 text-toro-red transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Grid de Productos en Oferta */}
        {offers.length > 0 && (
          <div className="relative">
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-8 md:mb-12 border-b border-white/10 pb-4 md:pb-6">
              <div>
                <h4 className="text-2xl md:text-4xl font-display font-bold text-white mb-2">
                  Ofertas del Día
                </h4>
                <p className="text-gray-400 font-body text-sm md:text-base">Disfruta de nuestros precios especiales por tiempo limitado.</p>
              </div>
              <div className="flex items-center gap-2 text-toro-red font-bold text-xs md:text-sm uppercase tracking-widest">
                <span className="relative flex h-2 w-2 md:h-3 md:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-red-500"></span>
                </span>
                En vivo
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {offers.map((offer, idx) => (
                <motion.div 
                  key={offer.id_producto}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-[#121212] rounded-xl md:rounded-2xl overflow-hidden border border-white/5 hover:border-toro-red/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/10 flex md:block h-32 md:h-auto"
                >
                  {/* Mobile: Horizontal Layout | Desktop: Vertical */}
                  <div className="relative w-32 h-full md:w-full md:h-72 flex-shrink-0">
                    <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10">
                      <span className="bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 md:px-4 md:py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        -{Math.round((1 - parseFloat(offer.precio_oferta || offer.precio)/parseFloat(offer.precio)) * 100)}%
                      </span>
                    </div>
                    
                    <Image
                      src={offer.imagen_url ? getBackendUrl(offer.imagen_url) : '/placeholder-food.jpg'}
                      alt={offer.nombre}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      unoptimized
                    />
                    
                    {/* Overlay Gradient (Desktop Only) */}
                    <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60"></div>
                  </div>

                  <div className="p-3 md:p-6 flex flex-col justify-between flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 md:mb-4">
                      <h5 className="text-sm md:text-xl font-display font-bold text-white group-hover:text-toro-red transition-colors line-clamp-2 md:line-clamp-1">
                        {offer.nombre}
                      </h5>
                    </div>
                    
                    <div className="flex items-end justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm text-gray-500 line-through font-body mb-0.5 md:mb-1">
                          S/ {parseFloat(offer.precio).toFixed(2)}
                        </span>
                        <span className="text-lg md:text-2xl font-bold text-white font-display">
                          S/ {parseFloat(offer.precio_oferta || offer.precio).toFixed(2)}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => addToCart(offer)}
                        className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-toro-red hover:text-white transition-all duration-300 shadow-lg flex-shrink-0 ml-2"
                        title="Agregar al carrito"
                      >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Vista Previa para Promociones */}
      <AnimatePresence>
        {selectedPromo && (
          <PromoModal 
            promo={selectedPromo} 
            onClose={() => setSelectedPromo(null)} 
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function PromoModal({ promo, onClose }: { promo: EcommerceTarjeta; onClose: () => void }) {
  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-[#121212] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row max-h-[90vh] overflow-y-auto md:overflow-y-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-toro-red transition-colors border border-white/10"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Imagen Completa */}
        <div className="w-full md:w-3/5 relative h-[250px] md:h-auto bg-black flex-shrink-0">
          <Image
            src={promo.imagen_url ? getBackendUrl(promo.imagen_url) : '/placeholder-promo.jpg'}
            alt={promo.titulo}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Info y Acción */}
        <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col bg-[#121212] justify-center">
          <span className="text-toro-red text-xs font-bold uppercase tracking-[0.2em] mb-2 md:mb-4">
            Promoción Exclusiva
          </span>
          
          <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-4 md:mb-6 leading-tight">
            {promo.titulo}
          </h2>
          
          <p className="text-gray-300 text-sm md:text-lg leading-relaxed font-light mb-6 md:mb-10">
            {promo.descripcion}
          </p>

          <a 
            href={`https://wa.me/51914095777?text=${encodeURIComponent(`Hola, me interesa la promoción: ${promo.titulo}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 md:py-4 bg-white hover:bg-gray-200 text-black font-bold uppercase tracking-widest rounded-sm transition-all duration-300 flex items-center justify-center gap-2 md:gap-3 group shadow-xl"
          >
            <span className="text-xs md:text-base">Me interesa</span>
            <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
               <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
