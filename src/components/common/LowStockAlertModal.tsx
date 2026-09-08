import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Package, Layers, X, ArrowRight, PlusCircle, CheckCircle } from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';

interface LowStockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDashboard?: () => void;
}

export const LowStockAlertModal: React.FC<LowStockAlertModalProps> = ({
  isOpen,
  onClose,
  onNavigateToDashboard,
}) => {
  const { lowStockProducts, lowStockRawMaterials, updateProduct, restockRawMaterial, theme } = useBakery();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const totalLowCount = lowStockProducts.length + lowStockRawMaterials.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
        {/* Backdrop */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] border ${
            isLight
              ? 'bg-white border-[#E8E2D8] text-[#1F1B16]'
              : 'bg-[#141414] border-[#3E2E14] text-[#E0D8D0]'
          }`}
        >
          {/* Header */}
          <div
            className={`p-4 sm:p-5 border-b flex items-center justify-between ${
              isLight
                ? 'bg-gradient-to-r from-[#FAF4E8] via-[#F6ECE0] to-[#FFFDF9] border-[#E8DFD0]'
                : 'bg-gradient-to-r from-[#24180A] via-[#1A1208] to-[#12100C] border-[#3E2E14]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className={`text-base sm:text-lg font-black font-heading flex items-center gap-2 ${
                    isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                  }`}
                >
                  <span>تنبيه المخزون الحرج والنواقص</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                      isLight
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    {totalLowCount} عنصر
                  </span>
                </h3>
                <p
                  className={`text-xs mt-0.5 ${
                    isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
                  }`}
                >
                  قائمة بالأصناف والمواد الخام التي أوشكت على النفاذ في المخبز
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                isLight
                  ? 'bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900'
                  : 'bg-[#202020] hover:bg-[#303030] text-[#A8A096] hover:text-[#F5EBE6]'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-right">
            {totalLowCount === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div
                  className={`w-16 h-16 rounded-full border flex items-center justify-center text-2xl mb-3 ${
                    isLight
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                      : 'bg-emerald-950/60 border border-emerald-800 text-emerald-400'
                  }`}
                >
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4
                  className={`text-base font-bold ${
                    isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                  }`}
                >
                  المخزون في وضع ممتاز!
                </h4>
                <p
                  className={`text-xs mt-1 max-w-sm ${
                    isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
                  }`}
                >
                  لا توجد حالياً أي منتجات مخبوزة أو مواد خام وصلت لحد الخطر الأدنى.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Low Stock Baked Products */}
                {lowStockProducts.length > 0 && (
                  <div className="space-y-2">
                    <div
                      className={`flex items-center gap-2 text-xs font-bold ${
                        isLight ? 'text-amber-800' : 'text-amber-400'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      <span>منتجات المخبز الجاهزة أوشكت على النفاذ ({lowStockProducts.length}):</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {lowStockProducts.map((p) => (
                        <div
                          key={p.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                            isLight
                              ? 'bg-[#FAF8F5] border-[#EADFCF]'
                              : 'bg-[#1A1612] border-[#3E2E18]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-2xl shrink-0">{p.image || '🍞'}</span>
                            <div className="min-w-0">
                              <h5
                                className={`text-xs font-bold truncate ${
                                  isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                                }`}
                              >
                                {p.name}
                              </h5>
                              <p
                                className={`text-[10px] truncate ${
                                  isLight ? 'text-[#7A6F65]' : 'text-[#A8A096]'
                                }`}
                              >
                                {p.category}
                              </p>
                              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono">
                                <span className="text-red-600 font-bold">
                                  المتبقي: {p.stock} {p.unitType === 'weight' ? 'كجم' : 'ق'}
                                </span>
                                <span className={isLight ? 'text-stone-400' : 'text-[#666]'}>/</span>
                                <span className={isLight ? 'text-stone-500' : 'text-[#8C827A]'}>
                                  الحد: {p.minStockAlert}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              updateProduct(p.id, { stock: p.stock + 20 });
                            }}
                            className={`cursor-pointer px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition flex items-center gap-1 border ${
                              isLight
                                ? 'bg-[#FDF6E7] hover:bg-[#F9ECCF] text-[#8A6414] border-[#DEC798]'
                                : 'bg-[#281D10] hover:bg-[#382814] text-[#D4AF37] border-[#5A451A]'
                            }`}
                            title="إضافة 20 قطعة للمخزون سريعاً"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+20</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Low Stock Raw Materials */}
                {lowStockRawMaterials.length > 0 && (
                  <div
                    className={`space-y-2 pt-2 border-t ${
                      isLight ? 'border-[#EAE2D5]' : 'border-[#242424]'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 text-xs font-bold ${
                        isLight ? 'text-amber-800' : 'text-amber-400'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>مواد خام في المخزن قاربت على الانتهاء ({lowStockRawMaterials.length}):</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {lowStockRawMaterials.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                            isLight
                              ? 'bg-[#FAF8F5] border-[#EADFCF]'
                              : 'bg-[#1A1612] border-[#3E2E18]'
                          }`}
                        >
                          <div className="min-w-0">
                            <h5
                              className={`text-xs font-bold truncate ${
                                isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                              }`}
                            >
                              {m.name}
                            </h5>
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono">
                              <span className="text-red-600 font-bold">
                                الرصيد: {m.currentStock} {m.unit}
                              </span>
                              <span className={isLight ? 'text-stone-400' : 'text-[#666]'}>/</span>
                              <span className={isLight ? 'text-stone-500' : 'text-[#8C827A]'}>
                                حد الطلب: {m.minStockAlert}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              restockRawMaterial(m.id, 50);
                            }}
                            className={`cursor-pointer px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition flex items-center gap-1 border ${
                              isLight
                                ? 'bg-[#FDF6E7] hover:bg-[#F9ECCF] text-[#8A6414] border-[#DEC798]'
                                : 'bg-[#281D10] hover:bg-[#382814] text-[#D4AF37] border-[#5A451A]'
                            }`}
                            title="إضافة 50 وحدة شحن سريع"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+50 {m.unit}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div
            className={`p-3.5 sm:p-4 border-t flex items-center justify-between gap-3 ${
              isLight
                ? 'bg-[#FAF8F5] border-[#E8E0D0]'
                : 'bg-[#111111] border-[#242424]'
            }`}
          >
            <span
              className={`text-xs ${
                isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
              }`}
            >
              اضغط على أزرار التزويد السريع أو توجه للوحة التحكم لإدارة المخزون بالكامل.
            </span>

            {onNavigateToDashboard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToDashboard();
                }}
                className="cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md hover:brightness-110 transition shrink-0"
              >
                <span>إدارة المخزون والمواد</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
