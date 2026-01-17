import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-toro-black border-t border-white/10 pt-16 pb-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-toro-red to-transparent opacity-50"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="relative w-32 h-20 mb-6">
              <Image 
                src="/logo.png" 
                alt="Toro Loco Cayma" 
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              La experiencia definitiva de parrilla en Arequipa. Cortes premium, fuego real y un ambiente inigualable.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/ToroLoco.Cayma" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-toro-red transition-colors cursor-pointer">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://www.instagram.com/toroloco.miraflores/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-toro-red transition-colors cursor-pointer">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.673 2.013 10.027 2 12.315 2m0-2c-2.67 0-3.004.01-4.125.06-1.121.05-1.889.224-2.657.522C4.704.935 4.076 1.352 3.451 1.977 2.826 2.602 2.41 3.227 2.062 4.02c-.298.768-.472 1.536-.522 2.657-.05 1.121-.06 1.455-.06 4.125s.01 3.004.06 4.125c.05 1.121.224 1.889.522 2.657.348.793.765 1.418 1.39 2.043.625.625 1.25 1.042 2.043 1.39.768.298 1.536.472 2.657.522 1.121.05 1.455.06 4.125.06s3.004-.01 4.125-.06c1.121-.05 1.889-.224 2.657-.522.793-.348 1.418-.765 2.043-1.39.625-.625 1.042-1.25 1.39-2.043.298-.768.472-1.536.522-2.657.05-1.121.06-1.455.06-4.125s-.01-3.004-.06-4.125c-.05-1.121-.224-1.889-.522-2.657-.348-.793-.765-1.418-1.39-2.043-.625-.625-1.25-1.042-2.043-1.39-.768-.298-1.536-.472-2.657-.522C15.319 2.01 14.985 2 12.315 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@torolococayma" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-toro-red transition-colors cursor-pointer">
                <span className="sr-only">TikTok</span>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18c0 1.32-.43 2.59-1.22 3.63-.79 1.04-1.92 1.8-3.19 2.15-1.27.35-2.64.33-3.9-.06-1.26-.39-2.35-1.2-3.09-2.27-.74-1.07-1.1-2.35-1.03-3.64.07-1.29.58-2.52 1.45-3.47.87-.95 2.06-1.55 3.35-1.71 1.29-.16 2.61.1 3.75.74v-4.02c-.92-.27-1.87-.4-2.83-.39-1.75.02-3.46.59-4.87 1.63-1.41 1.04-2.45 2.53-2.92 4.2-.47 1.67-.37 3.47.28 5.07.65 1.6 1.84 2.95 3.38 3.79 1.54.84 3.33 1.17 5.04.93 1.71-.24 3.28-1.09 4.41-2.41 1.13-1.32 1.71-3.03 1.64-4.78V.02z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Navegación</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-gray-400 hover:text-toro-orange transition-colors text-sm">Inicio</Link></li>
              <li><Link href="/nosotros" className="text-gray-400 hover:text-toro-orange transition-colors text-sm">Nosotros</Link></li>
              <li><Link href="/menu" className="text-gray-400 hover:text-toro-orange transition-colors text-sm">La Carta</Link></li>
              <li><Link href="/reservas" className="text-gray-400 hover:text-toro-orange transition-colors text-sm">Reservas</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/terminos" className="text-gray-400 hover:text-toro-orange transition-colors text-sm">Términos y Condiciones</Link></li>
              <li><Link href="/privacidad" className="text-gray-400 hover:text-toro-orange transition-colors text-sm">Política de Privacidad</Link></li>
              <li><Link href="/reclamaciones" className="text-gray-400 hover:text-toro-orange transition-colors text-sm">Libro de Reclamaciones</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-6 text-sm">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <span className="text-toro-red">📍</span>
                <a href="https://maps.app.goo.gl/wZxrTRntvPgbF42D8" target="_blank" rel="noopener noreferrer" className="hover:text-toro-orange transition-colors">Cayma. Micaela Bastidas 131, Arequipa 04018</a>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <span className="text-toro-red">📞</span>
                <a href="https://wa.me/51914095777" target="_blank" rel="noopener noreferrer" className="hover:text-toro-orange transition-colors">+51 914 095 777</a>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <span className="text-toro-red">✉️</span>
                <a href="mailto:info@torolococayma.com" className="hover:text-toro-orange transition-colors">info@torolococayma.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            © 2026 Toro Loco Cayma. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="/reclamaciones" className="text-gray-500 hover:text-white text-sm transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Libro de Reclamaciones
            </Link>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Política de Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
