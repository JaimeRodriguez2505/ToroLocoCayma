'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || pathname !== '/' || mobileMenuOpen 
          ? 'bg-black py-2 shadow-lg border-b border-white/10' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group relative">
          <div className="relative w-40 h-28 md:w-56 md:h-32 transition-transform duration-300 group-hover:scale-105">
            <Image 
              src="/logo.png" 
              alt="Toro Loco Cayma" 
              fill
              className="object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]"
              sizes="(max-width: 768px) 160px, 224px"
              priority
              unoptimized
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          
          <Link 
            href="/menu"
            className={`text-sm font-body font-bold tracking-widest transition-colors ${
              isActive('/menu') ? 'text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            NUESTRA CARTA
          </Link>
          <Link 
            href="/nosotros"
            className={`text-sm font-body font-bold tracking-widest transition-colors ${
              isActive('/nosotros') ? 'text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            NOSOTROS
          </Link>
          <Link 
            href="/promociones"
            className={`text-sm font-body font-bold tracking-widest transition-colors ${
              isActive('/promociones') ? 'text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            PROMOCIONES
          </Link>
          
          <Link 
            href="/ubicacion#contacto" 
            className="btn-red-gradient text-xs font-body font-bold tracking-widest"
          >
            RESERVAR
          </Link>
          
          <Link 
            href="/reclamaciones" 
            className="text-gray-500 hover:text-white transition-colors"
            title="Libro de Reclamaciones"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white p-2 z-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <div className="w-6 h-5 relative flex flex-col justify-between">
            <span className={`w-full h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-full h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-full h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
          </div>
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <div className={`md:hidden fixed inset-0 bg-black z-40 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col items-center justify-center h-full gap-8">
          <div className="relative w-32 h-24 mb-4" onClick={() => { setMobileMenuOpen(false); window.location.href = '/'; }}>
             <Image 
              src="/logo.png" 
              alt="Toro Loco Cayma" 
              fill
              className="object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]"
              unoptimized
            />
          </div>
          <Link href="/menu" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-display font-bold text-white tracking-widest">NUESTRA CARTA</Link>
          <Link href="/nosotros" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-display font-bold text-white tracking-widest">NOSOTROS</Link>
          <Link href="/promociones" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-display font-bold text-white tracking-widest">PROMOCIONES</Link>
          <Link 
            href="/ubicacion#contacto" 
            onClick={() => setMobileMenuOpen(false)}
            className="btn-red-gradient mt-4 font-body font-bold tracking-widest"
          >
            RESERVAR AHORA
          </Link>
        </div>
      </div>
    </header>
  );
}
