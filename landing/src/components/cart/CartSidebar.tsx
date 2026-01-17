'use client';

import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getBackendUrl } from '@/lib/url';
import { useEffect } from 'react';

export default function CartSidebar() {
  const { items, isCartOpen, toggleCart, updateQuantity, removeFromCart, total } = useCart();

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCartOpen]);

  const handleCheckout = () => {
    const phoneNumber = "51914095777";
    
    let message = "Hola Toro Loco, quiero realizar el siguiente pedido:\n\n";
    
    items.forEach((item) => {
      const price = item.es_oferta ? parseFloat(item.precio_oferta!) : parseFloat(item.precio);
      const subtotal = price * item.quantity;
      message += `▪️ ${item.quantity}x ${item.nombre} (S/ ${price.toFixed(2)}) = S/ ${subtotal.toFixed(2)}\n`;
    });
    
    message += `\n*TOTAL: S/ ${total.toFixed(2)}*`;
    message += `\n\nQuedo atento a su confirmación.`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Optional: Clear cart after checkout or keep it? Usually keep it in case they come back.
    // clearCart(); 
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#121212] border-l border-white/10 z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <span className="text-toro-red">🛒</span> Tu Pedido
              </h2>
              <button 
                onClick={toggleCart}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                  <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>Tu carrito está vacío</p>
                  <button 
                    onClick={toggleCart}
                    className="text-toro-red text-sm font-bold uppercase tracking-widest hover:underline"
                  >
                    Ver la carta
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const price = item.es_oferta ? parseFloat(item.precio_oferta!) : parseFloat(item.precio);
                  return (
                    <motion.div 
                      layout
                      key={item.id_producto} 
                      className="flex gap-4 bg-white/5 p-3 rounded-xl border border-white/5"
                    >
                      {/* Image */}
                      <div className="relative w-20 h-20 flex-shrink-0 bg-black rounded-lg overflow-hidden">
                        <Image
                          src={item.imagen_url ? getBackendUrl(item.imagen_url) : '/placeholder-food.jpg'}
                          alt={item.nombre}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-white font-bold text-sm line-clamp-1">{item.nombre}</h3>
                          <p className="text-toro-red font-bold text-sm">S/ {price.toFixed(2)}</p>
                        </div>
                        
                        <div className="flex justify-between items-end">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 bg-black/40 rounded-lg p-1">
                            <button 
                              onClick={() => updateQuantity(item.id_producto, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-white/10 rounded hover:bg-white/20 text-white transition-colors"
                            >
                              -
                            </button>
                            <span className="text-white text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id_producto, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-toro-red rounded hover:bg-red-700 text-white transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <button 
                            onClick={() => removeFromCart(item.id_producto)}
                            className="text-gray-500 hover:text-red-500 transition-colors p-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 bg-[#1a1a1a] border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-white">
                  <span className="text-sm text-gray-400">Total a pagar</span>
                  <span className="text-2xl font-display font-bold text-toro-red">S/ {total.toFixed(2)}</span>
                </div>
                
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-toro-red hover:bg-red-700 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                >
                  <span>Pedir por WhatsApp</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}