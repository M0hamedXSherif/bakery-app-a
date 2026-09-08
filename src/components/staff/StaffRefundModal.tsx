import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { SaleRecord } from '../../types';

interface StaffRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffRefundModal: React.FC<StaffRefundModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { sales, requestRefund, currentUser, theme } = useBakery();
  const isLight = theme === 'light';
  const [searchInvoice, setSearchInvoice] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [reason, setReason] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  // Filter completed sales matching invoice search
  const filteredSales = sales.filter((s) => {
    if (searchInvoice.trim()) {
      return (
        s.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase().trim()) ||
        s.cashierName.toLowerCase().includes(searchInvoice.toLowerCase().trim())
      );
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !reason.trim()) return;

    const result = requestRefund(selectedSale.id, reason.trim());
    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
      setSelectedSale(null);
      setReason('');
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 2500);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto transition-all"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-xl max-h-[85vh] max-h-[85dvh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border my-auto ${
            isLight
              ? 'bg-white border-[#E8E2D8] text-[#1F1B16]'
              : 'bg-[#141414] border-[#2A2A2A] text-[#E0D8D0]'
          }`}
        >
          {/* Header */}
          <div
            className={`p-4 sm:p-5 flex items-center justify-between border-b shrink-0 ${
              isLight
                ? 'bg-gradient-to-r from-[#FAF4E8] via-[#F6EDE0] to-[#FFFDF8] border-[#E8DFD0] text-[#1F1B16]'
                : 'bg-gradient-to-r from-[#241B0E] via-[#1C150A] to-[#141414] text-[#F5EBE6] border-[#2A2A2A]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl border ${
                  isLight
                    ? 'bg-[#FDF6E7] border-[#DEC798]'
                    : 'bg-[#2A2012] border-[#4A3B1B]'
                }`}
              >
                <RefreshCw
                  className={`w-5 h-5 ${
                    isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`text-lg font-bold font-heading ${
                    isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                  }`}
                >
                  طلب استرجاع فاتورة (Refund Request)
                </h3>
                <p
                  className={`text-xs ${
                    isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
                  }`}
                >
                  بموجب الصلاحيات: يتم إرسال الطلب لمدير المخبز للموافقة عليه عن بُعد
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`cursor-pointer p-1.5 rounded-lg transition ${
                isLight
                  ? 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                  : 'text-[#8C827A] hover:text-[#F5EBE6] rounded-lg hover:bg-[#222222]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar text-xs">
            {/* Status Feedback */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? isLight
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-[#11291B] text-emerald-300 border border-[#165B37]'
                    : isLight
                    ? 'bg-red-50 text-red-800 border border-red-300'
                    : 'bg-red-950/60 text-red-300 border border-red-800'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      isLight ? 'text-emerald-600' : 'text-emerald-400'
                    }`}
                  />
                ) : (
                  <AlertCircle
                    className={`w-4 h-4 shrink-0 ${
                      isLight ? 'text-red-600' : 'text-red-400'
                    }`}
                  />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Search Invoice */}
            <div>
              <label
                className={`text-xs font-bold block mb-1.5 ${
                  isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                }`}
              >
                1. ابحث برقم الفاتورة:
              </label>
              <div className="relative">
                <Search
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                    isLight ? 'text-stone-400' : 'text-[#8C827A]'
                  }`}
                />
                <input
                  type="text"
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  placeholder="ابحث برقم الفاتورة (مثال: INV-1001)..."
                  className={`w-full pl-3 pr-9 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                    isLight
                      ? 'bg-[#FAF8F5] border-[#E2DAD0] text-[#1F1B16] placeholder-stone-400'
                      : 'bg-[#1E1E1E] border-[#333333] text-[#F5EBE6] placeholder-[#6C635B]'
                  }`}
                />
              </div>
            </div>

            {/* Sales Selection List */}
            <div>
              <label
                className={`text-xs font-bold block mb-1.5 ${
                  isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                }`}
              >
                2. اختر الفاتورة المراد استرجاعها:
              </label>
              <div
                className={`max-h-48 overflow-y-auto space-y-1.5 rounded-2xl p-2 border ${
                  isLight
                    ? 'border-[#E8E2D8] bg-[#FAF8F5]'
                    : 'border-[#2A2A2A] bg-[#101010]'
                }`}
              >
                {filteredSales.length === 0 ? (
                  <p
                    className={`text-xs text-center py-4 ${
                      isLight ? 'text-stone-400' : 'text-[#8C827A]'
                    }`}
                  >
                    لا توجد فواتير مطابقة
                  </p>
                ) : (
                  filteredSales.map((sale) => {
                    const isSelected = selectedSale?.id === sale.id;
                    const isPending = sale.status === 'refund_requested';
                    const isRefunded = sale.status === 'refunded';

                    return (
                      <div
                        key={sale.id}
                        onClick={() => {
                          if (!isPending && !isRefunded) {
                            setSelectedSale(sale);
                          }
                        }}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                          isSelected
                            ? isLight
                              ? 'bg-[#FDF6E7] border-[#D4AF37] text-[#8A6414] font-bold shadow-xs'
                              : 'bg-[#282012] border-[#D4AF37] text-[#D4AF37] font-bold shadow-xs'
                            : isRefunded
                            ? isLight
                              ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                              : 'bg-[#181818] text-[#6C635B] border-[#222222] cursor-not-allowed'
                            : isPending
                            ? isLight
                              ? 'bg-amber-50 text-amber-800 border-amber-300 cursor-not-allowed'
                              : 'bg-[#241D12] text-amber-300 border-[#5A451A] cursor-not-allowed'
                            : isLight
                            ? 'bg-white text-[#1F1B16] border-[#E8E2D8] hover:border-[#D4AF37]'
                            : 'bg-[#181818] text-[#E0D8D0] border-[#262626] hover:border-[#D4AF37]/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{sale.invoiceNumber}</span>
                            <span
                              className={`text-[10px] ${
                                isLight ? 'text-stone-500' : 'text-[#8C827A]'
                              }`}
                            >
                              {new Date(sale.timestamp).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p
                            className={`text-[11px] truncate max-w-[220px] ${
                              isLight ? 'text-stone-600' : 'text-[#8C827A]'
                            }`}
                          >
                            {sale.items.map((i) => i.productName).join(', ')}
                          </p>
                        </div>

                        <div className="text-left">
                          <span
                            className={`font-mono font-bold text-sm block ${
                              isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                            }`}
                          >
                            {sale.totalAmount.toFixed(2)} ج.م
                          </span>
                          {isRefunded && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                isLight
                                  ? 'bg-stone-200 text-stone-600'
                                  : 'bg-[#222222] text-[#8C827A]'
                              }`}
                            >
                              مسترجع مسبقاً
                            </span>
                          )}
                          {isPending && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                                isLight
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-[#3D2E14] text-[#D4AF37] border-[#5A451A]'
                              }`}
                            >
                              طلب معلق ⏳
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Reason Form */}
            {selectedSale && (
              <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                <div>
                  <label
                    className={`text-xs font-bold block mb-1 ${
                      isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                    }`}
                  >
                    3. سبب الاسترجاع (إلزامي):
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="مثال: خطأ في الصنف، تالف، العميل يرغب في استبداله..."
                    className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                      isLight
                        ? 'border-[#DFC99E] bg-[#FAF8F5] text-[#1F1B16] placeholder-stone-400'
                        : 'border-[#333333] bg-[#1E1E1E] text-[#F5EBE6] placeholder-[#6C635B]'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`cursor-pointer px-4 py-2 text-xs font-semibold rounded-xl transition ${
                      isLight
                        ? 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                        : 'text-[#8C827A] hover:bg-[#222222] hover:text-[#F5EBE6]'
                    }`}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={!reason.trim()}
                    className="cursor-pointer px-5 py-2 text-xs font-black text-stone-950 bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إرسال طلب الاسترجاع للمدير</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
