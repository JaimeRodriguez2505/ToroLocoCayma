'use client';

import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartButton() {
  const { toggleCart, itemsCount } = useCart();

  return (
    <AnimatePresence>
      {itemsCount > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleCart}
          className="fixed bottom-6 right-6 z-50 bg-toro-red text-white w-14 h-14 rounded-full shadow-lg shadow-red-900/40 flex items-center justify-center border-2 border-white/10"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-3 -right-3 bg-white text-toro-red text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
              {itemsCount}
            </span>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}