import Image from 'next/image';

const images = [
  'https://images.unsplash.com/photo-1544025162-d76690b60943?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1592686092913-90ec40c65d6c?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop',
];

export default function Gallery() {
  return (
    <section id="galeria" className="py-24 bg-toro-dark">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-toro-orange font-bold tracking-widest uppercase mb-2 text-sm">Experiencia Visual</h2>
          <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            MOMENTOS <span className="text-toro-red">TORO LOCO</span>
          </h3>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-toro-red to-transparent mx-auto"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {images.map((src, index) => (
            <div 
              key={index} 
              className={`relative overflow-hidden rounded-sm group ${
                index === 0 ? 'col-span-2 row-span-2' : 
                index === 3 ? 'col-span-2' : ''
              }`}
            >
              <Image
                src={src}
                alt={`Galería Toro Loco ${index + 1}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale group-hover:grayscale-0"
                unoptimized
              />
              <div className="absolute inset-0 bg-toro-red/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
