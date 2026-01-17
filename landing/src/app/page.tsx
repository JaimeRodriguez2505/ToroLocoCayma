import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import PromoGrid from "@/components/PromoGrid";
import Link from "next/link";
import { getEcommerceBanners } from "@/lib/toroApi";

// Force dynamic rendering to avoid build-time fetch errors
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Use getEcommerceBanners to fetch ALL banners instead of just one
  const banners = await getEcommerceBanners();
  return (
    <>
      <Hero banners={banners} />
      
      <Experience />

      <PromoGrid />
      
      {/* CTA Final - Aesthetic & Hipster */}
      <section className="py-32 bg-toro-charcoal relative overflow-hidden">
        {/* Subtle texture or gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none"></div>
        
        {/* Embers Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
           <div className="absolute bottom-0 left-1/4 w-1 h-1 bg-red-500 shadow-[0_0_10px_red] animate-float-up"></div>
           <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-toro-red shadow-[0_0_15px_red] animate-float-up delay-700"></div>
           <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-red-400 shadow-[0_0_10px_red] animate-float-up delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="block text-toro-red text-sm font-body font-bold tracking-[0.2em] uppercase mb-6">
            Experiencia Culinaria
          </span>
          
          <h3 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 leading-tight drop-shadow-2xl">
            ¿Listo para <span className="text-toro-red/90 underline decoration-wavy decoration-from-font">disfrutar?</span>
          </h3>
          
          <p className="max-w-2xl mx-auto text-gray-300 text-lg md:text-xl font-body leading-relaxed mb-12">
            Reserva tu mesa hoy y vive la auténtica experiencia Toro Loco Cayma. 
            Donde el fuego y la pasión se encuentran.
          </p>
          
          <div className="flex justify-center gap-8 flex-wrap">
            <Link 
              href="/ubicacion" 
              className="px-10 py-4 bg-transparent border border-white/30 text-white font-body font-bold text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 rounded-sm"
            >
              Visítanos
            </Link>
            <Link 
              href="/reservas" 
              className="px-10 py-4 bg-white text-black font-body font-bold text-sm tracking-widest uppercase hover:bg-gray-100 transition-all duration-300 shadow-xl rounded-sm"
            >
              Reservar Mesa
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
