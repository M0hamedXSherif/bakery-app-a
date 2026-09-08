import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Ban,
  Scale,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Unlock,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { CartItem } from '../../types';

interface CartPanelProps {
  onCheckout: () => void;
  onOpenStartShift?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ onCheckout, onOpenStartShift }) => {
  const {
    products,
    cart,
    updateCartItemQty,
    updateCartItemWeight,
    removeFromCart,
    voidCurrentCart,
    clearCart,
    currentShift,
    theme,
  } = useBakery();

  const isLight = theme === 'light';

  const [showVoidDialog, setShowVoidDialog] = useState<boolean>(false);
  const [voidReason, setVoidReason] = useState<string>('');
  const [stockNotice, setStockNotice] = useState<string | null>(null);

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItemsCount = cart.reduce(
    (sum, item) => sum + (item.unitType === 'piece' ? item.quantity : 1),
    0
  );

  const handleConfirmVoid = () => {
    voidCurrentCart(voidReason || 'إلغاء بناء على رغبة العميل');
    setShowVoidDialog(false);
    setVoidReason('');
  };

  const handleIncreaseQty = (item: CartItem) => {
    const prod = products.find((p) => p.id === item.productId);
    const maxStock = prod ? prod.stock : 9999;

    if (item.quantity >= maxStock) {
      setStockNotice(`عفواً! تم بلوغ أقصى رصيد متاح من (${item.productName}) بالمخزن (${maxStock} ق)`);
      setTimeout(() => setStockNotice(null), 3500);
      return;
    }

    const res = updateCartItemQty(item.id, item.quantity + 1);
    if (res && !res.success && res.message) {
      setStockNotice(res.message);
      setTimeout(() => setStockNotice(null), 3500);
    }
  };

  return (
    <div
      className={`h-full flex flex-col rounded-3xl shadow-2xl border overflow-hidden transition-colors duration-200 ${
        isLight
          ? 'bg-white border-[#E8E2D8] text-[#1F1B16]'
          : 'bg-[#141414] border-[#262626] text-[#F5EBE6]'
      }`}
    >
      {/* Cart Header */}
      <div
        className={`p-4 flex items-center justify-between border-b ${
          isLight
            ? 'bg-gradient-to-r from-[#FAF4E8] via-[#F5ECD8] to-[#FFFDF8] border-[#E8E0D2] text-[#1F1B16]'
            : 'bg-gradient-to-r from-[#241B0E] via-[#1C150A] to-[#141414] border-[#2A2A2A] text-[#F5EBE6]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border ${
              isLight
                ? 'bg-[#FDF7E7] border-[#ECD9B4] text-[#8A6414]'
                : 'bg-[#2A2012] border-[#4A3B1B] text-[#D4AF37]'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2
              className={`font-bold text-base font-heading ${
                isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
              }`}
            >
              سلة المشتريات الحالية
            </h2>
            <p
              className={`text-[11px] ${
                isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
              }`}
            >
              {cart.length === 0
                ? 'السلة فارغة'
                : `${cart.length} أصناف (${totalItemsCount} بنود)`}
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => setShowVoidDialog(true)}
            className={`cursor-pointer px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition border ${
              isLight
                ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                : 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border-red-800'
            }`}
            title="إلغاء العملية بالكامل (Void)"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>إلغاء (Void)</span>
          </button>
        )}
      </div>

      {/* Stock Notice Alert */}
      {stockNotice && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`border-b px-3.5 py-2 text-[11px] font-bold flex items-center gap-2 ${
            isLight
              ? 'bg-amber-100 border-amber-300 text-amber-900'
              : 'bg-amber-950/90 border-amber-700/80 text-amber-200'
          }`}
        >
          <AlertCircle
            className={`w-4 h-4 shrink-0 ${
              isLight ? 'text-amber-700' : 'text-amber-400'
            }`}
          />
          <span>{stockNotice}</span>
        </motion.div>
      )}

      {/* Cart Items List */}
      <div
        className={`flex-1 overflow-y-auto p-3 space-y-2.5 divide-y ${
          isLight ? 'divide-[#EFEAE2]' : 'divide-[#222222]'
        }`}
      >
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 border ${
                isLight
                  ? 'bg-[#F8F5F0] border-[#E2DAD0] text-[#8A6414]'
                  : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#D4AF37]'
              }`}
            >
              <ShoppingCart className="w-8 h-8 stroke-[1.5]" />
            </div>
            <p
              className={`font-bold mb-1 ${
                isLight ? 'text-[#1F1B16]' : 'text-[#A8A096]'
              }`}
            >
              السلة جاهزة لاستقبال الطلبات
            </p>
            <p
              className={`text-xs max-w-xs ${
                isLight ? 'text-[#7A6F65]' : 'text-[#6C635B]'
              }`}
            >
              انقر على أي صنف من قائمة المخبوزات أو الأصناف بالوزن لإضافته مباشرة
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {cart.map((item) => {
              const matchingProduct = products.find((p) => p.id === item.productId);
              const maxStock = matchingProduct ? matchingProduct.stock : 9999;
              const isAtMaxStock = item.unitType === 'piece' && item.quantity >= maxStock;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group"
                >
                  {/* Item Details */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className={`w-11 h-11 rounded-xl object-cover border shrink-0 ${
                          isLight ? 'border-[#E2DAD0]' : 'border-[#2D2D2D]'
                        }`}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4
                          className={`font-bold text-sm truncate ${
                            isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                          }`}
                        >
                          {item.productName}
                        </h4>
                        {isAtMaxStock && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                              isLight
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-amber-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            أقصى رصيد ({maxStock})
                          </span>
                        )}
                      </div>
                      <div
                        className={`flex items-center gap-2 text-xs ${
                          isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
                        }`}
                      >
                        {item.unitType === 'weight' ? (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded text-[11px] border ${
                              isLight
                                ? 'text-[#8A6414] bg-[#FDF7E7] border-[#ECD9B4]'
                                : 'text-[#D4AF37] bg-[#241D12] border-[#4A3B1B]'
                            }`}
                          >
                            <Scale className="w-3 h-3" />
                            {item.weightKg} كجم × {item.unitPrice} ج
                          </span>
                        ) : (
                          <span>
                            {item.quantity} × {item.unitPrice} ج.م
                            {matchingProduct && (
                              <span
                                className={`text-[10px] mr-1.5 ${
                                  isLight ? 'text-[#8E847A]' : 'text-[#6E655D]'
                                }`}
                              >
                                (المتاح: {matchingProduct.stock} ق)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Adjustments & Price */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Quantity controls for piece items */}
                    {item.unitType === 'piece' ? (
                      <div
                        className={`flex items-center rounded-xl p-0.5 border ${
                          isLight
                            ? 'bg-[#F8F5F0] border-[#E2DAD0]'
                            : 'bg-[#1C1C1C] border-[#2E2E2E]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => updateCartItemQty(item.id, item.quantity - 1)}
                          className={`p-1 rounded-lg transition ${
                            isLight
                              ? 'text-[#6E6359] hover:text-[#1F1B16] hover:bg-stone-200'
                              : 'text-[#A8A096] hover:text-[#F5EBE6] hover:bg-[#282828]'
                          }`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`px-2 font-mono font-bold text-sm ${
                            isAtMaxStock
                              ? 'text-amber-500'
                              : isLight
                              ? 'text-[#1F1B16]'
                              : 'text-[#F5EBE6]'
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncreaseQty(item)}
                          disabled={isAtMaxStock}
                          className={`p-1 rounded-lg transition ${
                            isAtMaxStock
                              ? 'text-stone-300 cursor-not-allowed opacity-40'
                              : isLight
                              ? 'text-[#6E6359] hover:text-[#1F1B16] hover:bg-stone-200'
                              : 'text-[#A8A096] hover:text-[#F5EBE6] hover:bg-[#282828]'
                          }`}
                          title={isAtMaxStock ? 'تم بلوغ كامل الرصيد المتوفر بالمخزن' : 'زيادة الكمية'}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`text-xs font-mono font-semibold px-2 py-1 rounded-lg border ${
                          isLight
                            ? 'text-[#8A6414] bg-[#FDF7E7] border-[#ECD9B4]'
                            : 'text-[#D4AF37] bg-[#241D12] border-[#4A3B1B]'
                        }`}
                      >
                        {item.weightKg} كجم
                      </div>
                    )}

                    {/* Subtotal */}
                    <div className="text-left min-w-[60px]">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                        }`}
                      >
                        {item.subtotal.toFixed(2)}
                      </span>
                      <span
                        className={`text-[10px] block -mt-1 font-sans ${
                          isLight ? 'text-[#7A6F65]' : 'text-[#8C827A]'
                        }`}
                      >
                        ج.م
                      </span>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className={`p-1.5 rounded-xl transition ${
                        isLight
                          ? 'text-stone-400 hover:text-red-600 hover:bg-red-50'
                          : 'text-[#6C635B] hover:text-red-400 hover:bg-red-950/40'
                      }`}
                      title="حذف من السلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div
          className={`p-4 border-t space-y-3 ${
            isLight
              ? 'bg-[#FDFBF7] border-[#E8E2D8]'
              : 'bg-[#181818] border-[#262626]'
          }`}
        >
          {/* Subtotal row */}
          <div
            className={`flex items-center justify-between text-sm ${
              isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
            }`}
          >
            <span>إجمالي الأصناف ({cart.length}):</span>
            <span
              className={`font-mono font-bold ${
                isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
              }`}
            >
              {totalAmount.toFixed(2)} ج.م
            </span>
          </div>

          {/* Grand Total */}
          <div
            className={`pt-2 border-t flex items-baseline justify-between ${
              isLight ? 'border-[#EAE3D8]' : 'border-[#2A2A2A]'
            }`}
          >
            <div>
              <span
                className={`text-base font-black font-heading ${
                  isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                }`}
              >
                المبلغ النهائي:
              </span>
              <p
                className={`text-[10px] ${
                  isLight ? 'text-[#7A6F65]' : 'text-[#8C827A]'
                }`}
              >
                شامل كافة الرسوم والضرائب
              </p>
            </div>
            <div
              className={`text-3xl font-black font-mono ${
                isLight ? 'text-[#B89028]' : 'text-[#D4AF37]'
              }`}
            >
              {totalAmount.toFixed(2)}
              <span
                className={`text-sm font-sans font-bold mr-1 ${
                  isLight ? 'text-[#8A6414]' : 'text-[#AA820A]'
                }`}
              >
                ج.م
              </span>
            </div>
          </div>

          {/* Checkout Action Button */}
          {currentShift ? (
            <button
              type="button"
              onClick={onCheckout}
              className="cursor-pointer w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#C59F2E] to-[#AA820A] hover:from-[#E5C04B] hover:to-[#B89028] text-stone-950 font-black text-base shadow-xl shadow-[#D4AF37]/15 flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <CheckCircle2 className="w-5 h-5 text-stone-950" />
              <span>إتمام الدفع والحساب ({totalAmount.toFixed(2)} ج.م)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenStartShift || onCheckout}
              className="cursor-pointer w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-black text-sm shadow-xl shadow-amber-600/20 flex items-center justify-center gap-2 transition active:scale-[0.99] animate-pulse"
            >
              <Unlock className="w-5 h-5 text-stone-950" />
              <span>فتح شيفت أولاً لإتمام البيع ({totalAmount.toFixed(2)} ج.م)</span>
            </button>
          )}
        </div>
      )}

      {/* Void Confirmation Modal */}
      {showVoidDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className={`rounded-2xl max-w-sm w-full p-5 border shadow-2xl space-y-4 max-h-[85vh] max-h-[85dvh] overflow-y-auto ${
              isLight
                ? 'bg-white border-red-200 text-[#1F1B16]'
                : 'bg-[#181818] border-red-900/60 text-[#E0D8D0]'
            }`}
          >
            <div className="flex items-center gap-3 text-red-500">
              <div
                className={`p-2 rounded-xl border ${
                  isLight
                    ? 'bg-red-50 border-red-200'
                    : 'bg-red-950 border-red-800'
                }`}
              >
                <Ban className="w-6 h-6" />
              </div>
              <h3
                className={`font-bold text-lg ${
                  isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                }`}
              >
                إلغاء العملية (Void)
              </h3>
            </div>
            <p
              className={`text-xs ${
                isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
              }`}
            >
              سيتم تفريغ السلة الحالية وتسجيل هذا الإلغاء وتفاصيله تلقائياً في سجل الرقابة
              والنشاطات للإدارة.
            </p>
            <div>
              <label
                className={`text-xs font-bold block mb-1 ${
                  isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                }`}
              >
                سبب الإلغاء:
              </label>
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="تراجع العميل / خطأ في الإدخال..."
                className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  isLight
                    ? 'bg-[#F8F5F0] border-[#DFD7CB] text-[#1F1B16] placeholder-[#8E847A]'
                    : 'bg-[#121212] border-[#333333] text-[#F5EBE6] placeholder-[#6C635B]'
                }`}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVoidDialog(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                  isLight
                    ? 'text-stone-600 hover:bg-stone-100'
                    : 'text-[#8C827A] hover:bg-[#242424]'
                }`}
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="cursor-pointer px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow-md transition"
              >
                تأكيد الإلغاء وتسجيل بالسجل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
