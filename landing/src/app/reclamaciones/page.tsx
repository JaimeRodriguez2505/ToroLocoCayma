import LibroReclamacionesForm from '@/components/LibroReclamacionesForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Libro de Reclamaciones | Toro Loco Cayma',
  description: 'Libro de reclamaciones virtual de Restaurante Toro Loco Cayma.',
};

export default function ReclamacionesPage() {
  return (
    <main className="min-h-screen bg-black pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              LIBRO DE <span className="text-toro-red">RECLAMACIONES</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Conforme a lo establecido en el código de protección y defensa del consumidor, ponemos a su disposición este libro de reclamaciones virtual.
            </p>
          </div>
          
          <div className="bg-toro-charcoal border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
            <LibroReclamacionesForm />
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              Toro Loco Cayma S.A.C. - RUC 20601234567 <br />
              Cayma. Micaela Bastidas 131, Arequipa 04018
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}