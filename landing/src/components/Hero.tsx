'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { EcommerceBanner } from '@/lib/types';
import { getBackendUrl } from '@/lib/url';

type HeroProps = {
  banners: EcommerceBanner[];
};

export default function Hero({ banners }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate banners every 6 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const currentBanner = banners[currentIndex];

  const now = new Date();
  const month = new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    timeZone: 'America/Lima',
  }).format(now);
  const year = new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(now);
  const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  const currentDate = `${formattedMonth} ${year}`;

  // Fallback if no banners are provided
  const bgImage = currentBanner?.imagen_url 
    ? getBackendUrl(currentBanner.imagen_url)
    : 'https://images.unsplash.com/photo-1544025162-d76690b60943?q=80&w=2000&auto=format&fit=crop';

  const title = currentBanner?.titulo || "TORO LOCO";
  const subtitle = currentBanner?.descripcion || "PARRILLERÍA & RESTAURANTE";

  const whatsappUrl = currentBanner?.whatsapp 
    ? `https://wa.me/${currentBanner.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Hola, me interesa conocer más sobre ${title} - ${subtitle}`)}`
    : null;

  return (
    <section id="hero" className="relative h-svh min-h-[600px] flex items-center overflow-hidden bg-black">
      
      {/* Background Image Carousel */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex} // Key change triggers animation
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={bgImage}
            alt={title}
            fill
            className="object-cover object-center opacity-90"
            priority
            unoptimized
          />
          {/* Cinematic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/95"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/20"></div>
        </motion.div>
      </AnimatePresence>

      {/* Particles Effect */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute w-1 h-1 bg-toro-red rounded-full top-1/3 left-1/4 animate-pulse opacity-40"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full bottom-1/3 right-1/4 blur-[1px] animate-ping opacity-20"></div>
      </div>

      {/* Content */}
      <div className="container relative z-20 px-4 md:px-12 flex flex-col h-full justify-between pt-28 pb-10 md:pt-32 md:pb-20 max-w-7xl mx-auto">
        
        {/* Top: Location & Date */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full flex justify-start border-l-2 border-toro-red pl-4"
        >
          <div className="flex flex-col">
            <span className="text-xs md:text-sm font-body font-bold tracking-[0.2em] text-white uppercase">
              Cayma, Arequipa
            </span>
            <span className="text-[10px] md:text-xs font-body tracking-widest text-gray-400 uppercase mt-1">
              {currentDate}
            </span>
          </div>
        </motion.div>

        {/* Bottom: Title & Actions - Animated on Slide Change */}
        <div className="flex flex-col items-start max-w-4xl">
           <AnimatePresence mode="wait">
             <motion.div
              key={`text-${currentIndex}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.05] tracking-tight mb-4 drop-shadow-2xl">
                {title}
              </h1>
            </motion.div>
           </AnimatePresence>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={`sub-${currentIndex}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-8 pl-1 border-l border-white/30"
            >
              <p className="text-base md:text-lg text-gray-300 font-body font-light leading-relaxed pl-4 max-w-lg">
                {subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="flex flex-wrap items-center gap-4 sm:gap-6"
          >
            <Link 
              href="/menu" 
              className="group flex items-center gap-3 text-white transition-all hover:text-toro-red"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/30 flex items-center justify-center group-hover:border-toro-red group-hover:bg-toro-red/10 transition-all backdrop-blur-sm">
                 <svg className="w-4 h-4 transition-transform group-hover:-rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              <span className="font-body font-bold text-sm tracking-widest uppercase">Ver Carta</span>
            </Link>
            
            <Link 
              href="/ubicacion" 
              className="px-6 py-2.5 rounded-full bg-white/10 border border-white/20 text-white font-body font-bold text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-md"
            >
              Reservar Mesa
            </Link>

            {whatsappUrl && (
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-full bg-toro-red border border-toro-red text-white font-body font-bold text-xs tracking-widest uppercase hover:bg-red-700 transition-all duration-300 shadow-lg shadow-red-900/20 flex items-center gap-2"
              >
                <span>Más Info</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              </a>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Slider Indicators */}
      {banners.length > 1 && (
        <div className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-toro-red h-8' : 'bg-white/30 hover:bg-white'
              }`}
              aria-label={`Ir al banner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
