import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Receipt,
  Clock,
  Coins,
} from 'lucide-react';
import { PaymentMethod, SaleRecord } from '../../types';
import { useBakery } from '../../context/BakeryContext';

interface CheckoutModalProps {
  isOpen: boolean;
  totalAmount: number;
  onClose: () => void;
  onConfirm: (params: {
    paymentMethod: PaymentMethod;
    cashGiven?: number;
    changeDue?: number;
    isRetroactive?: boolean;
    retroactiveNote?: string;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  totalAmount,
  onClose,
  onConfirm,
}) => {
  const { theme } = useBakery();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGivenStr, setCashGivenStr] = useState<string>(totalAmount.toString());
  const [isRetroactive, setIsRetroactive] = useState<boolean>(false);
  const [retroactiveNote, setRetroactiveNote] = useState<string>('');

  const cashGivenNum = parseFloat(cashGivenStr) || 0;
  const changeDue = Math.max(0, +(cashGivenNum - totalAmount).toFixed(2));
  const isCashInsufficient = paymentMethod === 'cash' && cashGivenNum < totalAmount;

  // Preset cash suggestions
  const cashPresets = [
    { label: 'المبلغ بالضبط', val: totalAmount },
    { label: '50 ج.م', val: 50 },
    { label: '100 ج.م', val: 100 },
    { label: '200 ج.م', val: 200 },
    { label: '500 ج.م', val: 500 },
  ].filter((p) => p.val >= totalAmount || p.label === 'المبلغ بالضبط');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCashInsufficient) return;

    onConfirm({
      paymentMethod,
      cashGiven: paymentMethod === 'cash' ? cashGivenNum : totalAmount,
      changeDue: paymentMethod === 'cash' ? changeDue : 0,
      isRetroactive,
      retroactiveNote: isRetroactive ? retroactiveNote || 'إضافة يدوية لاحقة' : undefined,
    });
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md transition-all"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-lg max-h-[85vh] max-h-[85dvh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
            isLight
              ? 'bg-white border-[#E8E2D8] text-[#1F1B16]'
              : 'bg-[#141414] border-[#2A2A2A] text-[#E0D8D0]'
          }`}
        >
          {/* Header (Fixed at top) */}
          <div
            className={`px-5 py-3.5 sm:py-4 flex items-center justify-between border-b flex-shrink-0 ${
              isLight
                ? 'bg-gradient-to-r from-[#FAF4E8] via-[#F5ECD8] to-[#FFFDF8] border-[#E8E0D2] text-[#1F1B16]'
                : 'bg-[#101010] text-[#F5EBE6] border-[#262626]'
            }`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div
                className={`p-2 rounded-xl font-bold ${
                  isLight
                    ? 'bg-[#D4AF37] text-stone-950'
                    : 'bg-[#D4AF37] text-stone-950'
                }`}
              >
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className={`text-lg sm:text-xl font-bold font-heading ${
                    isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                  }`}
                >
                  إتمام عملية الدفع
                </h3>
                <p
                  className={`text-[11px] sm:text-xs ${
                    isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
                  }`}
                >
                  اختر طريقة السداد وأدخل المبلغ المستلم
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`cursor-pointer p-2 rounded-xl transition ${
                isLight
                  ? 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                  : 'text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#222222]'
              }`}
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form with scrollable body & pinned footer */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable body content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Total Display */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between border ${
                  isLight
                    ? 'bg-gradient-to-br from-[#FDF8EE] via-[#FAF1DE] to-[#FFFDF8] border-[#ECD9B4]'
                    : 'bg-gradient-to-br from-[#241B0E] via-[#1A140B] to-[#120E08] border-[#4A3B1B]'
                }`}
              >
                <span
                  className={`font-semibold text-xs sm:text-sm ${
                    isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
                  }`}
                >
                  المبلغ الإجمالي المطلوب:
                </span>
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono ${
                    isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                  }`}
                >
                  {totalAmount.toFixed(2)}{' '}
                  <span
                    className={`text-xs sm:text-sm font-sans font-bold ${
                      isLight ? 'text-[#AA820A]' : 'text-[#AA820A]'
                    }`}
                  >
                    ج.م
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label
                  className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider block mb-1.5 ${
                    isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
                  }`}
                >
                  طريقة الدفع:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'cash'
                        ? isLight
                          ? 'border-[#D4AF37] bg-[#FDF8EE] text-[#8A6414] font-bold shadow-xs'
                          : 'border-[#D4AF37] bg-[#221C11] text-[#D4AF37] font-bold shadow-xs'
                        : isLight
                        ? 'border-[#E2DAD0] text-[#5C5248] hover:border-[#D4AF37] bg-[#FAF8F5]'
                        : 'border-[#2A2A2A] text-[#A8A096] hover:border-[#3A3A3A] bg-[#181818]'
                    }`}
                  >
                    <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                    <span className="text-xs">نقدي (كاش)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'card'
                        ? isLight
                          ? 'border-[#D4AF37] bg-[#FDF8EE] text-[#8A6414] font-bold shadow-xs'
                          : 'border-[#D4AF37] bg-[#221C11] text-[#D4AF37] font-bold shadow-xs'
                        : isLight
                        ? 'border-[#E2DAD0] text-[#5C5248] hover:border-[#D4AF37] bg-[#FAF8F5]'
                        : 'border-[#2A2A2A] text-[#A8A096] hover:border-[#3A3A3A] bg-[#181818]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <span className="text-xs">بطاقة / فيزا</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === 'wallet'
                        ? isLight
                          ? 'border-[#D4AF37] bg-[#FDF8EE] text-[#8A6414] font-bold shadow-xs'
                          : 'border-[#D4AF37] bg-[#221C11] text-[#D4AF37] font-bold shadow-xs'
                        : isLight
                        ? 'border-[#E2DAD0] text-[#5C5248] hover:border-[#D4AF37] bg-[#FAF8F5]'
                        : 'border-[#2A2A2A] text-[#A8A096] hover:border-[#3A3A3A] bg-[#181818]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                    <span className="text-xs">محفظة / إنستاباي</span>
                  </button>
                </div>
              </div>

              {/* Cash Tendered & Change Section */}
              {paymentMethod === 'cash' && (
                <div
                  className={`space-y-3 p-3.5 sm:p-4 rounded-2xl border ${
                    isLight
                      ? 'bg-[#FAF8F5] border-[#E5DDD2]'
                      : 'bg-[#181818] border-[#2A2A2A]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      className={`text-xs font-bold flex items-center gap-1.5 ${
                        isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                      }`}
                    >
                      <Coins
                        className={`w-4 h-4 ${
                          isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                        }`}
                      />
                      المبلغ المدفوع من العميل:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={cashGivenStr}
                      onChange={(e) => setCashGivenStr(e.target.value)}
                      className={`w-28 sm:w-32 px-2.5 py-1.5 text-right font-mono font-bold text-base sm:text-lg rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                        isLight
                          ? 'bg-white border-[#DFC99E] text-[#1F1B16]'
                          : 'bg-[#1E1E1E] border-[#333333] text-[#F5EBE6]'
                      }`}
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {cashPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashGivenStr(preset.val.toString())}
                        className={`cursor-pointer px-2.5 py-1 text-xs font-semibold rounded-lg transition border ${
                          isLight
                            ? 'bg-white border-[#E2DAD0] hover:border-[#D4AF37] hover:bg-[#FDF7E7] text-[#1F1B16]'
                            : 'bg-[#222222] border-[#333333] hover:bg-[#2A2A2A] hover:border-[#D4AF37]/40 text-[#E0D8D0]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Change Due Box */}
                  <div
                    className={`pt-2.5 border-t flex items-center justify-between ${
                      isLight ? 'border-[#EAE3D8]' : 'border-[#2A2A2A]'
                    }`}
                  >
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
                      }`}
                    >
                      الباقي للعميل (Change):
                    </span>
                    <div
                      className={`text-lg sm:text-xl font-mono font-black ${
                        isCashInsufficient
                          ? 'text-red-600'
                          : isLight
                          ? 'text-emerald-700'
                          : 'text-emerald-400'
                      }`}
                    >
                      {isCashInsufficient ? 'المبلغ أقل من الإجمالي!' : `${changeDue.toFixed(2)} ج.م`}
                    </div>
                  </div>
                </div>
              )}

              {/* Retroactive Sale Option */}
              <div
                className={`p-3 border rounded-2xl ${
                  isLight
                    ? 'bg-[#FAF8F5] border-[#E5DDD2]'
                    : 'bg-[#181818] border-[#2A2A2A]'
                }`}
              >
                <label
                  className={`flex items-center gap-2 cursor-pointer text-xs font-bold ${
                    isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isRetroactive}
                    onChange={(e) => setIsRetroactive(e.target.checked)}
                    className="rounded text-[#D4AF37] focus:ring-[#D4AF37] h-4 w-4 bg-transparent border-[#9E9080]"
                  />
                  <span className="flex items-center gap-1">
                    <Clock
                      className={`w-3.5 h-3.5 ${
                        isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                      }`}
                    />
                    تسجيل كعملية فائتة / يدوية سابقة (Retroactive Sale)
                  </span>
                </label>

                {isRetroactive && (
                  <div className="mt-2.5 space-y-1.5">
                    <input
                      type="text"
                      value={retroactiveNote}
                      onChange={(e) => setRetroactiveNote(e.target.value)}
                      placeholder="سبب التسجيل اللاحق (مثال: عطل مؤقت في الكهرباء)"
                      className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                        isLight
                          ? 'bg-white border-[#DFC99E] text-[#1F1B16] placeholder-[#8E847A]'
                          : 'bg-[#1E1E1E] border-[#333333] text-[#F5EBE6] placeholder-[#6C635B]'
                      }`}
                    />
                    <p
                      className={`text-[10px] ${
                        isLight ? 'text-[#7A6F65]' : 'text-[#A8A096]'
                      }`}
                    >
                      * سيتم تمييز هذه العملية في التقارير وسجل النشاطات كعملية مضافة بأثر رجعي.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Pinned Action Footer (Always visible) */}
            <div
              className={`px-4 py-3 sm:py-3.5 border-t flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0 ${
                isLight
                  ? 'bg-[#FAF8F5] border-[#E8E2D8]'
                  : 'bg-[#101010] border-[#262626]'
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`cursor-pointer px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                  isLight
                    ? 'text-stone-500 hover:bg-stone-200 hover:text-stone-800'
                    : 'text-[#8C827A] hover:bg-[#222222] hover:text-[#F5EBE6]'
                }`}
              >
                رجوع للسلة
              </button>
              <button
                type="submit"
                disabled={isCashInsufficient}
                className="cursor-pointer px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>تأكيد وطباعة الإيصال</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
