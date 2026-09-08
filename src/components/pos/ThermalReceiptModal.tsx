import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X, Check, QrCode, Sparkles } from 'lucide-react';
import { SaleRecord } from '../../types';
import { useBakery } from '../../context/BakeryContext';

interface ThermalReceiptModalProps {
  sale: SaleRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  sale,
  isOpen,
  onClose,
}) => {
  const { bakerySettings, theme } = useBakery();
  const isLight = theme === 'light';

  if (!sale || !isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.timestamp).toLocaleString('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-sm max-h-[85vh] max-h-[85dvh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
            isLight
              ? 'bg-white border-[#E8E2D8] text-[#1F1B16]'
              : 'bg-[#141414] border-[#2A2A2A] text-[#E0D8D0]'
          }`}
        >
          {/* Header Bar */}
          <div
            className={`px-4 py-3 flex items-center justify-between border-b flex-shrink-0 ${
              isLight
                ? 'bg-[#FAF8F5] border-[#E8E2D8] text-[#1F1B16]'
                : 'bg-[#101010] border-[#262626] text-[#F5EBE6]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-[#D4AF37]" />
              <span className="font-bold text-sm">فاتورة ضريبية مبسطة</span>
            </div>
            <button
              onClick={onClose}
              className={`cursor-pointer p-1.5 rounded-xl transition ${
                isLight
                  ? 'text-stone-400 hover:text-stone-700 hover:bg-stone-200'
                  : 'text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#222222]'
              }`}
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Thermal Receipt Paper (Designated for print & clean contrast preview) */}
          <div
            className={`p-3 sm:p-4 overflow-y-auto flex-1 ${
              isLight ? 'bg-[#F2ECE4]' : 'bg-[#0D0D0D]'
            }`}
          >
            <div
              id="thermal-receipt"
              className="bg-white p-5 rounded-2xl shadow-xl border border-stone-300 text-stone-900 font-mono text-xs leading-relaxed"
            >
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b-2 border-dashed border-stone-300">
                {bakerySettings.logoUrl ? (
                  <div className="flex justify-center mb-1.5">
                    <img
                      src={bakerySettings.logoUrl}
                      alt={bakerySettings.name}
                      referrerPolicy="no-referrer"
                      className="max-h-12 max-w-[120px] object-contain mx-auto rounded"
                    />
                  </div>
                ) : (
                  <div className="text-2xl mb-1">{bakerySettings.logoEmoji || '🥐'}</div>
                )}
                <h2 className="text-base font-black font-heading text-stone-900">
                  {bakerySettings.name}
                </h2>
                {bakerySettings.slogan && (
                  <p className="text-[10px] text-stone-600 font-sans">
                    {bakerySettings.slogan}
                  </p>
                )}
                <p className="text-[10px] text-stone-500 font-sans mt-0.5">
                  تليفون: {bakerySettings.phone} - الرقم الضريبي: {bakerySettings.taxNumber}
                </p>
                {bakerySettings.address && (
                  <p className="text-[9px] text-stone-400 font-sans mt-0.5">
                    {bakerySettings.address}
                  </p>
                )}
              </div>

              {/* Invoice Meta */}
              <div className="py-2.5 border-b border-stone-200 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone-500">رقم الفاتورة:</span>
                  <span className="font-bold">{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">التاريخ والوقت:</span>
                  <span>{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">الكاشير:</span>
                  <span>{sale.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">طريقة الدفع:</span>
                  <span className="font-bold">
                    {sale.paymentMethod === 'cash'
                      ? 'نقدي (كاش)'
                      : sale.paymentMethod === 'card'
                      ? 'بطاقة / فيزا'
                      : 'محفظة إلكترونية'}
                  </span>
                </div>
                {sale.isRetroactive && (
                  <div className="text-center text-[10px] font-bold text-amber-800 bg-amber-50 p-1 rounded">
                    ⚠️ عملية مسجلة بأثر رجعي ({sale.retroactiveNote})
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="py-2.5 border-b-2 border-dashed border-stone-300">
                <div className="grid grid-cols-12 font-bold text-stone-700 pb-1 border-b border-stone-200 text-[10px]">
                  <span className="col-span-6 text-right">الصنف</span>
                  <span className="col-span-3 text-center">الكمية/الوزن</span>
                  <span className="col-span-3 text-left">الإجمالي</span>
                </div>

                <div className="divide-y divide-stone-100 py-1 space-y-1">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 pt-1 text-[11px]">
                      <div className="col-span-6 text-right font-semibold">
                        {item.productName}
                        <div className="text-[9px] text-stone-400 font-sans">
                          {item.unitType === 'weight'
                            ? `@ ${item.unitPrice} ج/كجم`
                            : `@ ${item.unitPrice} ج/ق`}
                        </div>
                      </div>
                      <div className="col-span-3 text-center font-bold" dir="ltr">
                        {item.unitType === 'weight'
                          ? `${item.weightKg} kg`
                          : `x ${item.quantity}`}
                      </div>
                      <div className="col-span-3 text-left font-bold font-mono">
                        {item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Payments */}
              <div className="py-2.5 space-y-1 text-[11px] border-b border-stone-200">
                <div className="flex justify-between font-bold text-sm">
                  <span>الإجمالي الكلي:</span>
                  <span className="font-mono text-base font-black">
                    {sale.totalAmount.toFixed(2)} ج.م
                  </span>
                </div>

                {sale.paymentMethod === 'cash' && sale.cashGiven && (
                  <>
                    <div className="flex justify-between text-stone-600">
                      <span>المدفوع نقداً:</span>
                      <span className="font-mono">{sale.cashGiven.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>الباقي المسترد:</span>
                      <span className="font-mono">
                        {(sale.changeDue || 0).toFixed(2)} ج.م
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* QR Code & Footer */}
              <div className="text-center pt-3 space-y-2">
                <div className="flex justify-center">
                  <div className="p-2 border border-stone-300 rounded-lg bg-stone-50 inline-block">
                    <QrCode className="w-16 h-16 text-stone-800" />
                  </div>
                </div>
                <p className="text-[10px] text-stone-600 font-sans font-bold">
                  شكرًا لزيارتكم مخبز النور الذهبي
                </p>
                <p className="text-[9px] text-stone-400 font-sans">
                  بالهناء والشفاء - نتمنى لكم يومًا سعيدًا!
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
              isLight
                ? 'bg-[#FAF8F5] border-[#E8E2D8]'
                : 'bg-[#181818] border-[#2A2A2A]'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`cursor-pointer w-1/2 py-2.5 rounded-xl border font-bold transition ${
                isLight
                  ? 'border-[#D9CFBF] text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  : 'border-[#333333] text-[#A8A096] hover:bg-[#222222] hover:text-[#F5EBE6]'
              }`}
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="cursor-pointer w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black flex items-center justify-center gap-2 shadow-md shadow-[#D4AF37]/20 transition"
            >
              <Printer className="w-4 h-4" />
              طباعة (Print)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
