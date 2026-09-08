import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import { useBakery } from '../../context/BakeryContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { cart, theme } = useBakery();
  const isLight = theme === 'light';

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
  const isWeightBased = product.unitType === 'weight';

  // Calculate quantity currently in cart
  const cartItem = cart.find((c) => c.productId === product.id);
  const cartQty = cartItem
    ? isWeightBased
      ? cartItem.weightKg || 0
      : cartItem.quantity
    : 0;

  const isCartFull = !isOutOfStock && cartQty >= product.stock;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={`group relative rounded-3xl p-2.5 sm:p-4 transition-all duration-200 shadow-md hover:shadow-xl border flex flex-col justify-between overflow-hidden ${
        isOutOfStock
          ? isLight
            ? 'border-stone-200 opacity-60 bg-stone-100'
            : 'border-[#262626] opacity-60 bg-[#101010]'
          : isCartFull
          ? isLight
            ? 'border-amber-400 bg-[#FFFBF0]'
            : 'border-amber-700/60 bg-[#171410]'
          : isLowStock
          ? isLight
            ? 'border-red-300 ring-2 ring-red-100 bg-red-50/40'
            : 'border-red-900/60 ring-2 ring-red-900/20 bg-[#161212]'
          : isLight
          ? 'bg-white border-[#E8E2D8] hover:border-[#D4AF37] hover:shadow-[#D4AF37]/10'
          : 'bg-[#141414] border-[#262626] hover:border-[#D4AF37]/60 hover:shadow-[#D4AF37]/10'
      }`}
    >
      {/* Top Badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
        {isWeightBased ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs ${
              isLight
                ? 'bg-[#FDF7E7] text-[#8A6414] border border-[#ECD9B4]'
                : 'bg-[#241D12] text-[#D4AF37] border border-[#5A451A]'
            }`}
          >
            <Scale className="w-3 h-3" />
            بالوزن
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isLight
                ? 'bg-stone-100 text-[#6E6359] border border-stone-200'
                : 'bg-[#1E1E1E] text-[#A8A096] border border-[#2D2D2D]'
            }`}
          >
            قطعة
          </span>
        )}

        {isCartFull ? (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isLight
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            كامل المتوفر بالسلة ({cartQty})
          </span>
        ) : isLowStock ? (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse ${
              isLight
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-red-950 text-red-300 border border-red-800'
            }`}
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            متبقي {product.stock} {isWeightBased ? 'كجم' : 'ق'}
          </span>
        ) : null}
      </div>

      {/* Product Image Area */}
      <div
        className={`relative w-full aspect-square sm:h-36 rounded-2xl overflow-hidden flex items-center justify-center mb-3 ${
          isLight ? 'bg-[#F6F2EA]' : 'bg-[#1A1A1A]'
        }`}
      >
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback nicely if image fails
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80';
          }}
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center">
            <span className="text-white font-bold text-xs bg-red-700 px-3 py-1 rounded-full shadow-lg">
              نفذت الكمية
            </span>
          </div>
        )}
      </div>

      {/* Product Title & Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3
            className={`text-sm sm:text-base md:text-lg font-black font-heading tracking-tight leading-snug line-clamp-1 mb-1 text-center transition ${
              isLight
                ? 'text-[#1F1B16] group-hover:text-[#B89028]'
                : 'text-[#F5EBE6] group-hover:text-[#D4AF37]'
            }`}
          >
            {product.name}
          </h3>
          <p
            className={`text-[10px] sm:text-[11px] text-center line-clamp-1 mb-1 ${
              isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
            }`}
          >
            {product.description || product.category}
          </p>
          <p
            className={`text-[9px] sm:text-[10px] font-mono text-center mb-1.5 sm:mb-2 ${
              isLight ? 'text-[#7A6F65]' : 'text-[#A8A096]'
            }`}
          >
            المخزون:{' '}
            <span
              className={`font-bold ${
                isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
              }`}
            >
              {product.stock}
            </span>{' '}
            {isWeightBased ? 'كجم' : 'قطعة'}
          </p>
        </div>

        {/* Bottom Price & Purchase Button Bar */}
        <div
          className={`pt-2 border-t flex items-center justify-between gap-1.5 sm:gap-2 ${
            isLight ? 'border-[#EAE3D8]' : 'border-[#222222]'
          }`}
        >
          {/* Price Tag */}
          <div className="flex items-baseline gap-0.5">
            <span
              className={`text-base sm:text-xl md:text-2xl font-black font-mono ${
                isLight ? 'text-[#B89028]' : 'text-[#D4AF37]'
              }`}
            >
              {product.price}
            </span>
            <span
              className={`text-[10px] sm:text-xs font-bold ${
                isLight ? 'text-[#7A6F65]' : 'text-[#8C827A]'
              }`}
            >
              {isWeightBased ? 'ج/ك' : 'ج'}
            </span>
          </div>

          {/* Golden Buy Button */}
          <button
            type="button"
            disabled={isOutOfStock || isCartFull}
            onClick={() => onSelect(product)}
            className={`cursor-pointer px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all shadow-xs ${
              isOutOfStock
                ? isLight
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#222222] text-[#666666] cursor-not-allowed'
                : isCartFull
                ? isLight
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 cursor-not-allowed'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black shadow-md shadow-[#D4AF37]/20 active:scale-95'
            }`}
          >
            <span>{isCartFull ? 'بالسلة' : 'شراء'}</span>
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
