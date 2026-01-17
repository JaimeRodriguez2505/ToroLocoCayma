"use client";

import { useState } from 'react';
import { postReserva, postReservaComprobante } from '@/lib/toroApi';

export default function Contact() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    fecha_reserva: '',
    cantidad_personas: '2 Personas',
    comentarios: ''
  });
  const [reservaId, setReservaId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await postReserva(formData);
      setReservaId(res.reserva.id);
      setStep(2);
    } catch (error) {
      console.error(error);
      alert('Error al iniciar la reserva. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaId || !file) {
      alert('Por favor adjunte el comprobante');
      return;
    }
    setLoading(true);
    try {
      await postReservaComprobante(reservaId, file);
      setSuccess(true);
    } catch (error) {
        console.error(error);
        alert('Error al subir comprobante. Pero tu reserva ha sido registrada, nos contactaremos contigo.');
        setSuccess(true); // Asumimos éxito parcial para no frustrar al usuario
    } finally {
      setLoading(false);
    }
  };

  if (success) {
      return (
          <section id="contacto" className="py-24 bg-toro-black relative">
              <div className="container mx-auto px-4 text-center">
                  <div className="bg-toro-charcoal p-12 border border-white/5 shadow-2xl max-w-2xl mx-auto">
                      <h3 className="text-3xl font-display font-bold text-white mb-4">¡RESERVA RECIBIDA!</h3>
                      <p className="text-gray-300 text-lg mb-8">
                          Gracias {formData.nombre}, hemos recibido tu solicitud de reserva para el {formData.fecha_reserva}.
                          <br/>
                          Nuestro equipo confirmará tu reserva a la brevedad posible al número {formData.telefono}.
                      </p>
                      <button 
                        onClick={() => {
                            setSuccess(false);
                            setStep(1);
                            setFormData({
                                nombre: '',
                                telefono: '',
                                fecha_reserva: '',
                                cantidad_personas: '2 Personas',
                                comentarios: ''
                            });
                            setFile(null);
                            setReservaId(null);
                        }}
                        className="bg-toro-red text-white font-bold uppercase tracking-widest px-8 py-3 hover:bg-red-700 transition-colors"
                      >
                          Realizar otra reserva
                      </button>
                  </div>
              </div>
          </section>
      )
  }

  return (
    <section id="ubicacion" className="py-24 bg-toro-black relative">
      <div className="absolute inset-0 bg-noise opacity-5"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Info & Mapa */}
          <div className="space-y-12">
            <div>
              <h2 className="text-toro-orange font-bold tracking-widest uppercase mb-2 text-sm">Visítanos</h2>
              <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                ENCUENTRA <span className="text-toro-red">EL FUEGO</span>
              </h3>
              <p className="text-gray-300 text-lg font-light">
                Estamos ubicados en el corazón de Cayma. Ven y disfruta de la mejor experiencia parrillera.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-toro-charcoal p-6 border-l-4 border-toro-orange">
                <h4 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">Horario</h4>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex justify-between">
                    <span>Lunes - Domingo:</span>
                    <span className="text-white">10:00 AM - 12:00 AM</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-toro-charcoal p-6 border-l-4 border-toro-red">
                <h4 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">Contacto</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Cayma. Micaela Bastidas 131, Arequipa 04018</li>
                  <li>+51 914 095 777</li>
                  <li>info@torolococayma.com</li>
                </ul>
              </div>
            </div>

            {/* Mapa Embed */}
            <div className="h-64 bg-gray-800 rounded-sm relative overflow-hidden border border-white/10">
              <iframe 
                src="https://maps.google.com/maps?q=Toro+Loco+Cayma+La+Tomilla&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%" 
                height="100%" 
                style={{border:0}} 
                allowFullScreen={true} 
                loading="lazy"
                className="filter grayscale invert contrast-125 opacity-80 hover:opacity-100 transition-opacity duration-500"
              ></iframe>
            </div>
          </div>

          {/* Reserva Form */}
          <div id="contacto" className="bg-toro-charcoal p-8 md:p-12 border border-white/5 shadow-2xl">
            <h3 className="text-2xl font-display font-bold text-white mb-2">
                {step === 1 ? 'RESERVA TU MESA' : 'CONFIRMAR RESERVA'}
            </h3>
            <p className="text-gray-400 text-sm mb-8">
                {step === 1 
                    ? 'Vive la experiencia Toro Loco. Completa el formulario para reservar.' 
                    : 'Para confirmar tu reserva, por favor sube el comprobante de pago (Yape/Plin/Transferencia).'}
            </p>
            
            {step === 1 && (
                <form onSubmit={handleSubmitStep1} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre</label>
                    <input 
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        type="text" 
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-sm p-3 text-white focus:border-toro-red focus:outline-none transition-colors" 
                        placeholder="Tu nombre" 
                    />
                    </div>
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Teléfono</label>
                    <input 
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        type="tel" 
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-sm p-3 text-white focus:border-toro-red focus:outline-none transition-colors" 
                        placeholder="+51 999..." 
                    />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha</label>
                    <input 
                        name="fecha_reserva"
                        value={formData.fecha_reserva}
                        onChange={handleInputChange}
                        type="date" 
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-sm p-3 text-white focus:border-toro-red focus:outline-none transition-colors" 
                    />
                    </div>
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personas</label>
                    <select 
                        name="cantidad_personas"
                        value={formData.cantidad_personas}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-sm p-3 text-white focus:border-toro-red focus:outline-none transition-colors"
                    >
                        <option>2 Personas</option>
                        <option>4 Personas</option>
                        <option>6+ Personas</option>
                    </select>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Comentarios</label>
                    <textarea 
                        name="comentarios"
                        value={formData.comentarios}
                        onChange={handleInputChange}
                        className="w-full bg-black/40 border border-white/10 rounded-sm p-3 text-white focus:border-toro-red focus:outline-none transition-colors h-24" 
                        placeholder="¿Alguna ocasión especial?"
                    ></textarea>
                </div>
                
                <button 
                    disabled={loading}
                    className="w-full py-4 bg-toro-red text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-colors mt-4 disabled:opacity-50"
                >
                    {loading ? 'Procesando...' : 'Siguiente Paso'}
                </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleSubmitStep2} className="space-y-6">
                    <div className="bg-black/20 p-4 rounded border border-white/5">
                        <p className="text-white text-sm mb-2">Resumen:</p>
                        <p className="text-gray-400 text-xs">Fecha: {formData.fecha_reserva} - {formData.cantidad_personas}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Comprobante de Pago</label>
                        <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-toro-red/50 transition-colors">
                            <input 
                                type="file" 
                                onChange={handleFileChange}
                                accept="image/*"
                                className="block w-full text-sm text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-xs file:font-semibold
                                file:bg-toro-red file:text-white
                                hover:file:bg-red-700
                                "
                            />
                            <p className="text-xs text-gray-500 mt-2">Sube una captura de tu transferencia o Yape/Plin</p>
                        </div>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full py-4 bg-toro-red text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-colors mt-4 disabled:opacity-50"
                    >
                        {loading ? 'Subiendo...' : 'Confirmar Reserva'}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full py-2 text-gray-400 text-xs hover:text-white transition-colors"
                    >
                        Volver a editar datos
                    </button>
                </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
