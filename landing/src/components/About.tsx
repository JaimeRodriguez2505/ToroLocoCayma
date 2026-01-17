import Image from 'next/image';

export default function About() {
  return (
    <section id="historia" className="py-24 bg-toro-dark relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-noise opacity-10"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Image Side */}
          <div className="relative group">
            <div className="relative h-[500px] w-full overflow-hidden rounded-sm shadow-2xl shadow-toro-red/10">
              <Image
                src="https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=1000&auto=format&fit=crop"
                alt="Chef preparando parrilla"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-toro-black/60 to-transparent"></div>
            </div>
            
            {/* Decorative Frame */}
            <div className="absolute -top-4 -left-4 w-24 h-24 border-t-4 border-l-4 border-toro-orange opacity-50"></div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-4 border-r-4 border-toro-orange opacity-50"></div>
          </div>

          {/* Text Side */}
          <div className="space-y-8">
            <div>
              <h2 className="text-toro-orange font-bold tracking-widest uppercase mb-2 text-sm">Nuestra Historia</h2>
              <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                MAESTROS DE LA <br />
                <span className="text-toro-red">PARRILLA AREQUIPEÑA</span>
              </h3>
              <div className="w-20 h-1 bg-toro-red mb-8"></div>
            </div>

            <div className="space-y-6 text-gray-300 text-lg font-light leading-relaxed">
              <p>
                En el corazón de Cayma, Toro Loco nació de una obsesión: dominar el arte del fuego. 
                Lo que comenzó como una pequeña reunión de amigos alrededor de las brasas se ha convertido 
                en el destino definitivo para los amantes de la carne en Arequipa.
              </p>
              <p>
                Seleccionamos rigurosamente cada corte, respetando su maduración y potenciando su sabor 
                con leña de la región. No es solo comida, es un ritual que celebramos todos los días.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
              <div>
                <span className="block text-4xl font-display font-bold text-toro-orange mb-1">15+</span>
                <span className="text-sm uppercase tracking-wider text-gray-400">Años de experiencia</span>
              </div>
              <div>
                <span className="block text-4xl font-display font-bold text-toro-orange mb-1">10k+</span>
                <span className="text-sm uppercase tracking-wider text-gray-400">Clientes felices</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
