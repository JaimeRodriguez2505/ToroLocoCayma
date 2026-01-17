'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Experience() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0]);

  const cards = [
    {
      src: "https://images.unsplash.com/photo-1558030006-4506719337d0?q=80&w=800&auto=format&fit=crop",
      alt: "Corte de carne premium",
      title: "Cortes Premium",
      desc: "Selección exclusiva"
    },
    {
      src: "https://images.unsplash.com/photo-1511978293554-7b92f19bd77d?q=80&w=800&auto=format&fit=crop",
      alt: "Brindis con amigos",
      title: "Ambiente",
      desc: "Inigualable y acogedor"
    },
    {
      src: "https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=800&auto=format&fit=crop",
      alt: "Platos deliciosos",
      title: "Sabor",
      desc: "Tradición y fuego"
    }
  ];

  return (
    <section ref={ref} className="py-32 bg-toro-black relative overflow-hidden">
      
      <div className="container mx-auto px-4 text-center relative z-10">
        
        {/* Title Section */}
        <motion.div 
          style={{ opacity, y: useTransform(scrollYProgress, [0, 0.5], [50, 0]) }}
          className="mb-20 space-y-6"
        >
          <span className="text-toro-red text-sm font-sans font-bold tracking-[0.2em] uppercase">
            Nuestra Esencia
          </span>
          <h2 className="text-4xl md:text-6xl font-display font-medium text-white leading-tight">
            Auténtica experiencia <br />
            <span className="italic text-gray-400">de fuego y sabor</span>
          </h2>
          
          <p className="max-w-3xl mx-auto text-gray-400 text-lg font-sans font-light leading-relaxed">
            Descubre los mejores cortes de carne a la parrilla en un ambiente donde cada detalle cuenta.
            Pasión por las brasas en su máxima expresión.
          </p>
        </motion.div>

        {/* Image Trio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group relative h-[450px] w-full overflow-hidden cursor-pointer"
            >
              <Image 
                src={card.src} 
                alt={card.alt} 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                unoptimized
              />
              {/* Minimalist Overlay */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>
              
              <div className="absolute bottom-0 left-0 w-full p-8 text-left">
                <div className="overflow-hidden">
                  <h3 className="text-3xl font-display italic text-white mb-2 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                    {card.title}
                  </h3>
                </div>
                <div className="overflow-hidden">
                  <p className="text-gray-300 text-xs font-sans tracking-widest uppercase transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                    {card.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            href="/ubicacion" 
            className="inline-block border-b border-toro-red text-white text-lg font-sans tracking-widest uppercase hover:text-toro-red transition-colors pb-1"
          >
            Reserva tu mesa
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
