import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Printer,
  X,
  Clock,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { ShiftSession } from '../../types';
import { useBakery } from '../../context/BakeryContext';
import { getShiftDuration, getShiftShortId } from '../../utils/shiftUtils';

interface ZReportModalProps {
  shift: ShiftSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({ shift, isOpen, onClose }) => {
  const { bakerySettings, theme } = useBakery();
  const isLight = theme === 'light';
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !shift) return null;

  const duration = getShiftDuration(shift.openedAt, shift.closedAt);
  const shortId = getShiftShortId(shift.id);

  const openedTimeStr = new Date(shift.openedAt).toLocaleString('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const closedTimeStr = shift.closedAt
    ? new Date(shift.closedAt).toLocaleString('ar-EG', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'لم يُغلق بعد';

  const startingCash = shift.startingCash || 0;
  const totalSales = shift.totalSales || 0;
  const expectedCash = shift.expectedCash !== undefined ? shift.expectedCash : startingCash + totalSales;
  const actualCash = shift.actualCash !== undefined ? shift.actualCash : expectedCash;
  const cashDiff = shift.cashDifference !== undefined ? shift.cashDifference : (actualCash - expectedCash);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-all"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-lg rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh] max-h-[85dvh] ${
            isLight
              ? 'bg-white border-[#E8E2D8] text-[#1F1B16]'
              : 'bg-[#141414] border-[#3A2E14] text-[#E0D8D0]'
          }`}
        >
          {/* Top Bar */}
          <div
            className={`px-5 py-3.5 flex items-center justify-between border-b shrink-0 ${
              isLight
                ? 'bg-gradient-to-r from-[#FAF4E8] via-[#F6EDE0] to-[#FFFDF8] border-[#E8DFD0]'
                : 'bg-gradient-to-r from-[#241A0A] to-[#14120D] text-[#F5EBE6] border-[#382C16]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#D4AF37] rounded-xl text-stone-950 font-black shadow-md shadow-[#D4AF37]/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-base font-bold font-heading ${
                      isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                    }`}
                  >
                    تقرير الإقفال والتسوية النقدية (Z-Report)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#D4AF37]/15 text-[#8A6414] border border-[#D4AF37]/30">
                    {shortId}
                  </span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'}`}>
                  توثيق ختامي للوردية وحسابات الصندوق
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrint}
                className="cursor-pointer p-2 rounded-xl bg-[#D4AF37] text-stone-950 font-bold hover:bg-[#E5C04B] transition flex items-center gap-1 text-xs shadow-xs"
                title="طباعة التقرير"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">طباعة</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`cursor-pointer p-2 rounded-xl transition ${
                  isLight
                    ? 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                    : 'text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#222222]'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Report Body (Thermal Slip Format) */}
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            <div
              ref={printRef}
              className={`p-5 rounded-2xl border font-mono space-y-4 ${
                isLight ? 'bg-[#FAF8F5] border-[#EAE2D5]' : 'bg-[#181818] border-[#2A2A2A]'
              }`}
            >
              {/* Bakery Header */}
              <div className="text-center pb-3 border-b border-dashed border-stone-400/40">
                <div className="text-xl mb-1">{bakerySettings.logoEmoji || '🥐'}</div>
                <h4 className="font-heading font-black text-base text-[#D4AF37]">
                  {bakerySettings.name}
                </h4>
                <p className="text-[11px] text-stone-400 font-sans mt-0.5">
                  {bakerySettings.slogan || 'طازج وشهي كل يوم'}
                </p>
                <div className="text-[10px] text-stone-400 mt-1">
                  س.ت / رقم ضريبي: {bakerySettings.taxNumber || '300-456-789'}
                </div>
                <div className="inline-block mt-2 px-3 py-1 bg-stone-900 text-stone-100 text-[11px] font-bold rounded-lg border border-stone-700">
                  ★ تقرير التسوية النقدية اليومية (Z-REPORT) ★
                </div>
              </div>

              {/* Shift Timing & Duration Report */}
              <div className="space-y-1.5 text-[11px] pb-3 border-b border-dashed border-stone-400/40">
                <div className="flex justify-between">
                  <span className="text-stone-400 font-sans">رقم الوردية:</span>
                  <span className="font-bold">{shortId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-sans">المسؤول:</span>
                  <span className="font-bold">{shift.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-sans">توقيت البدء:</span>
                  <span className="font-bold">{openedTimeStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-sans">توقيت الإغلاق:</span>
                  <span className="font-bold">{closedTimeStr}</span>
                </div>
                <div className="flex justify-between bg-[#D4AF37]/10 p-1.5 rounded-lg border border-[#D4AF37]/20 font-bold">
                  <span className="text-[#8A6414] dark:text-[#D4AF37] font-sans flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>مدة فتح الشيفت:</span>
                  </span>
                  <span className="text-[#8A6414] dark:text-[#D4AF37]">{duration.formatted}</span>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="space-y-2 pb-3 border-b border-dashed border-stone-400/40">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400 font-sans">عهدة البداية (رصيد الافتتاح):</span>
                  <span className="font-bold">{startingCash.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400 font-sans">إجمالي مبيعات الوردية:</span>
                  <span className="font-bold text-emerald-500">+{totalSales.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400 font-sans">عدد الفواتير المنفذة:</span>
                  <span className="font-bold">{shift.totalTransactions || 0} فاتورة</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400 font-sans">إجمالي الوزن المباع:</span>
                  <span className="font-bold">{(shift.totalWeightSoldKg || 0).toFixed(2)} كجم</span>
                </div>

                <div className="pt-2 border-t border-stone-700/40 flex justify-between text-sm font-bold">
                  <span className="font-sans">المتوقع بالخزينة (العهدة + المبيعات):</span>
                  <span className="text-[#D4AF37]">{expectedCash.toFixed(2)} ج.م</span>
                </div>
              </div>

              {/* Cash Reconciliation & Discrepancy */}
              <div className="space-y-2 pb-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400 font-sans">النقدية الفعلية المحصاة (الجرد):</span>
                  <span className="font-bold">{actualCash.toFixed(2)} ج.م</span>
                </div>

                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between font-bold text-xs ${
                    cashDiff === 0
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                      : cashDiff > 0
                      ? 'bg-blue-950/40 text-blue-300 border-blue-800'
                      : 'bg-red-950/40 text-red-300 border-red-800'
                  }`}
                >
                  <span className="font-sans flex items-center gap-1.5">
                    {cashDiff === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span>حالة المطابقة النقدية:</span>
                  </span>
                  <span>
                    {cashDiff === 0
                      ? 'متطابق تماماً (0.00 ج.م)'
                      : cashDiff > 0
                      ? `فائض / زيادة: +${cashDiff.toFixed(2)} ج.م`
                      : `عجز نقدي: -${Math.abs(cashDiff).toFixed(2)} ج.م`}
                  </span>
                </div>

                {/* Itemized Denominations Breakdown (if counted) */}
                {shift.cashDenominations && (
                  <div className="mt-2 p-2.5 bg-stone-900/40 rounded-xl border border-stone-700/50 space-y-1 text-[11px]">
                    <span className="font-sans text-stone-400 font-bold block mb-1">
                      بيان تفقيط وتعداد الفئات النقدية (الجرد الفعلي):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[10px]">
                      {shift.cashDenominations.bill200 > 0 && (
                        <div>فئة 200 ج.م: {shift.cashDenominations.bill200} ورقة ({shift.cashDenominations.bill200 * 200} ج.م)</div>
                      )}
                      {shift.cashDenominations.bill100 > 0 && (
                        <div>فئة 100 ج.م: {shift.cashDenominations.bill100} ورقة ({shift.cashDenominations.bill100 * 100} ج.م)</div>
                      )}
                      {shift.cashDenominations.bill50 > 0 && (
                        <div>فئة 50 ج.م: {shift.cashDenominations.bill50} ورقة ({shift.cashDenominations.bill50 * 50} ج.م)</div>
                      )}
                      {shift.cashDenominations.bill20 > 0 && (
                        <div>فئة 20 ج.م: {shift.cashDenominations.bill20} ورقة ({shift.cashDenominations.bill20 * 20} ج.م)</div>
                      )}
                      {shift.cashDenominations.bill10 > 0 && (
                        <div>فئة 10 ج.م: {shift.cashDenominations.bill10} ورقة ({shift.cashDenominations.bill10 * 10} ج.م)</div>
                      )}
                      {shift.cashDenominations.bill5 > 0 && (
                        <div>فئة 5 ج.م: {shift.cashDenominations.bill5} ورقة ({shift.cashDenominations.bill5 * 5} ج.م)</div>
                      )}
                      {shift.cashDenominations.coins > 0 && (
                        <div>عملات معدنية وفكة: {shift.cashDenominations.coins} ج.م</div>
                      )}
                    </div>
                  </div>
                )}

                {shift.notes && (
                  <div className="mt-2 text-[11px] p-2 bg-stone-900/50 rounded-lg text-stone-300 border border-stone-800">
                    <span className="font-sans text-stone-400 block mb-0.5">ملاحظات الكاشير:</span>
                    <span>{shift.notes}</span>
                  </div>
                )}

                {shift.earlyCloseApproved && (
                  <div className="mt-2 text-[11px] p-2 bg-amber-950/40 rounded-lg text-amber-300 border border-amber-800/60">
                    <span className="font-sans font-bold block mb-0.5">⚠️ إغلاق استثنائي مبكر معتمد من الإدارة:</span>
                    <span>السبب: {shift.earlyCloseReason || 'ظرف طارئ'} - معتمد بواسطة: {shift.authorizedByManager || 'المدير'}</span>
                  </div>
                )}
              </div>

              {/* Signatures & Footer */}
              <div className="pt-3 border-t border-dashed border-stone-400/40 grid grid-cols-2 gap-4 text-center text-[10px] text-stone-400 font-sans">
                <div>
                  <div className="border-b border-stone-600 pb-5 mb-1 font-bold text-stone-300">
                    {shift.cashierSignature?.signatureName || shift.cashierName}
                  </div>
                  <span>توقيع الكاشير وتسليم العهدة</span>
                  {shift.cashierSignature?.signedAt && (
                    <span className="block text-[9px] text-stone-500 font-mono mt-0.5">
                      {new Date(shift.cashierSignature.signedAt).toLocaleTimeString('ar-EG')}
                    </span>
                  )}
                </div>
                <div>
                  <div className="border-b border-stone-600 pb-5 mb-1 font-bold text-[#D4AF37]">
                    {shift.authorizedByManager || 'اعتماد الإدارة العامة'}
                  </div>
                  <span>اعتماد وقفل اليومية رسمياً</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div
            className={`px-5 py-3 border-t flex items-center justify-end shrink-0 ${
              isLight ? 'bg-stone-50 border-[#E8E2D8]' : 'bg-[#181818] border-[#2A2A2A]'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-5 py-2 rounded-xl text-xs font-bold bg-[#D4AF37] text-stone-950 hover:bg-[#E5C04B] transition shadow-xs"
            >
              إغلاق المعاينة
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
