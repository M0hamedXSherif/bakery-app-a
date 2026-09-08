import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Clock,
  Coins,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  User,
  Calculator,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  PenTool,
  Check,
  Calendar,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { getShiftDuration, getShiftShortId, checkShiftCloseAllowed } from '../../utils/shiftUtils';
import { sounds } from '../../utils/sound';
import { ZReportModal } from './ZReportModal';
import { ShiftSession, ShiftCashDenominations, ShiftCashierSignature } from '../../types';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftClosed?: (closedSession: ShiftSession) => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  onShiftClosed,
}) => {
  const { currentShift, closeShift, currentUser, theme, terminalFailedAttempts } = useBakery();
  const isLight = theme === 'light';

  // Denomination Counting State
  const [useDenominations, setUseDenominations] = useState<boolean>(true);
  const [b200, setB200] = useState<string>('');
  const [b100, setB100] = useState<string>('');
  const [b50, setB50] = useState<string>('');
  const [b20, setB20] = useState<string>('');
  const [b10, setB10] = useState<string>('');
  const [b5, setB5] = useState<string>('');
  const [coins, setCoins] = useState<string>('');

  // Direct manual total (if user toggles off denomination mode)
  const [directCashStr, setDirectCashStr] = useState<string>('');

  // Cashier Signature & Acknowledgement
  const [isSigned, setIsSigned] = useState<boolean>(true);
  const [signatureName, setSignatureName] = useState<string>('');

  // Early close & manager authorization
  const [earlyCloseReason, setEarlyCloseReason] = useState<string>('');
  const [managerSecret, setManagerSecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);

  // General notes & errors
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justClosedShift, setJustClosedShift] = useState<ShiftSession | null>(null);

  const isOwner = currentUser?.role === 'owner';

  // Initialize signature name from current user
  useEffect(() => {
    if (currentUser) {
      setSignatureName(currentUser.name);
    }
  }, [currentUser]);

  // Denominations sum calculation
  const denominationTotal = useMemo(() => {
    const n200 = (parseInt(b200, 10) || 0) * 200;
    const n100 = (parseInt(b100, 10) || 0) * 100;
    const n50 = (parseInt(b50, 10) || 0) * 50;
    const n20 = (parseInt(b20, 10) || 0) * 20;
    const n10 = (parseInt(b10, 10) || 0) * 10;
    const n5 = (parseInt(b5, 10) || 0) * 5;
    const nCoins = parseFloat(coins) || 0;
    return +(n200 + n100 + n50 + n20 + n10 + n5 + nCoins).toFixed(2);
  }, [b200, b100, b50, b20, b10, b5, coins]);

  const effectiveActualCash = useMemo(() => {
    if (useDenominations) {
      return denominationTotal;
    }
    const val = parseFloat(directCashStr);
    return isNaN(val) ? 0 : val;
  }, [useDenominations, denominationTotal, directCashStr]);

  if (!isOpen && !justClosedShift) return null;

  // If user just closed, show the ZReportModal
  if (justClosedShift) {
    return (
      <ZReportModal
        isOpen={true}
        shift={justClosedShift}
        onClose={() => {
          setJustClosedShift(null);
          onClose();
        }}
      />
    );
  }

  if (!currentShift) return null;

  const duration = getShiftDuration(currentShift.openedAt);
  const shortId = getShiftShortId(currentShift.id);

  const startingCash = currentShift.startingCash || 0;
  const totalSales = currentShift.totalSales || 0;
  const expectedCash = +(startingCash + totalSales).toFixed(2);
  const difference = +(effectiveActualCash - expectedCash).toFixed(2);

  // Timing check
  const closeTimingCheck = checkShiftCloseAllowed(currentShift, isOwner);
  const isEarly = closeTimingCheck.isEarly;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (effectiveActualCash < 0 || isNaN(effectiveActualCash)) {
      setErrorMsg('يرجى مراجعة مبالغ النقدية الفعلية المحصاة بالدرج');
      return;
    }

    // Cashier signature requirement
    if (!isSigned) {
      setErrorMsg('يرجى تأكيد وتوقيع إقرار جرد العهدة النقدية قبل المتابعة');
      return;
    }

    // If early close and non-owner: Manager password is required
    if (!isOwner && isEarly) {
      if (!managerSecret.trim()) {
        setErrorMsg('⚠️ لا يمكن للكاشير إغلاق الشفت قبل موعده إلا قبلها بـ 5 دقائق كحد أقصى! للإغلاق الاستثنائي الآن، يجب حضور المدير العام وإدخال كلمة المرور أو رمز الـ PIN.');
        sounds.playWarning();
        return;
      }
      if (!earlyCloseReason.trim()) {
        setErrorMsg('يرجى كتابة سبب الإغلاق المبكر للوردية لتوثيقه رسمياً في تقرير الـ Z-Report.');
        return;
      }
    }

    // Construct denomination snapshot
    const cashDenominationsObj: ShiftCashDenominations = {
      bill200: parseInt(b200, 10) || 0,
      bill100: parseInt(b100, 10) || 0,
      bill50: parseInt(b50, 10) || 0,
      bill20: parseInt(b20, 10) || 0,
      bill10: parseInt(b10, 10) || 0,
      bill5: parseInt(b5, 10) || 0,
      coins: parseFloat(coins) || 0,
      totalCounted: effectiveActualCash,
    };

    // Construct cashier signature snapshot
    const cashierSignatureObj: ShiftCashierSignature = {
      signedAt: new Date().toISOString(),
      signatureName: signatureName.trim() || currentUser?.name || currentShift.cashierName,
      pinConfirmed: true,
      statement: 'أقر أنا كاشير الوردية بجرد النقدية بالدرج ومطابقتها وفق الفئات المحددة أعلاه تحت مسؤوليتي.',
    };

    const res = closeShift(
      effectiveActualCash,
      notes,
      managerSecret.trim(),
      isEarly,
      earlyCloseReason.trim(),
      useDenominations ? cashDenominationsObj : undefined,
      cashierSignatureObj
    );

    if (res.success) {
      const closedSession: ShiftSession = {
        ...currentShift,
        closedAt: new Date().toISOString(),
        expectedCash,
        actualCash: effectiveActualCash,
        cashDifference: difference,
        status: 'closed',
        isSuspended: false,
        notes: isEarly && !isOwner ? `${notes ? notes + ' | ' : ''}إغلاق مبكر استثنائي بموافقة المدير: ${managerSecret ? 'معتمد' : ''}` : notes,
        earlyCloseApproved: isEarly,
        earlyCloseReason: isEarly ? earlyCloseReason : undefined,
        cashDenominations: useDenominations ? cashDenominationsObj : undefined,
        cashierSignature: cashierSignatureObj,
      };

      if (onShiftClosed) {
        onShiftClosed(closedSession);
      }
      setJustClosedShift(closedSession);
    } else {
      setErrorMsg(res.message);
    }
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
          className={`relative w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] max-h-[90dvh] my-auto ${
            isLight
              ? 'bg-white border-[#E8E2D8] text-[#1F1B16]'
              : 'bg-[#141414] border-[#3A2E14] text-[#E0D8D0]'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b shrink-0 ${
              isLight
                ? 'bg-gradient-to-r from-[#FAF4E8] via-[#F6EDE0] to-[#FFFDF8] border-[#E8DFD0]'
                : 'bg-gradient-to-r from-[#241A0A] to-[#14120D] text-[#F5EBE6] border-[#382C16]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] rounded-2xl text-stone-950 font-black shadow-md shadow-[#D4AF37]/20">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-base sm:text-lg font-bold font-heading ${
                      isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                    }`}
                  >
                    تسوية الخزينة وإقفال الوردية (Z-Report)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#D4AF37]/15 text-[#8A6414] border border-[#D4AF37]/30">
                    {shortId}
                  </span>
                </div>
                <p className={`text-xs ${isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'}`}>
                  تعداد فئات النقدية وتوثيق إقرار العهدة الرقمي
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
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar space-y-4 text-xs">
              
              {/* Early Close Notice for Cashier */}
              {!isOwner && isEarly && (
                <div className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-600/80 text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>⚠️ تنبيه: محاولة إغلاق الشفت قبل موعده المجدول!</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    موعد انتهاء ورديتك المجدول هو: <strong className="font-mono text-white underline">{closeTimingCheck.scheduledEndFormatted}</strong> (متبقي {closeTimingCheck.minutesRemainingToUnlock} دقيقة لتفعيل الإغلاق التلقائي للكاشير).
                  </p>
                  <p className="text-[11px] text-amber-300 font-bold bg-amber-900/40 p-2 rounded-xl border border-amber-700/50">
                    لا يمكن إغلاق الشفت قبل موعده، يرجى مراجعة الإدارة. وإذا كان هناك ظرف طارئ، يتطلب الإغلاق موافقة وباسورد المدير العام (Admin Approval).
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-900/60 border border-red-700 text-red-200 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Shift Session Details */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border grid grid-cols-2 sm:grid-cols-4 gap-3 ${
                  isLight ? 'bg-[#FAF8F5] border-[#EAE2D5]' : 'bg-[#181818] border-[#2A2A2A]'
                }`}
              >
                <div>
                  <span className="text-[#8C827A] text-[11px] block">الكاشير المسؤول:</span>
                  <span className="font-bold text-[#D4AF37] text-xs sm:text-sm">
                    {currentShift.cashierName}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C827A] text-[11px] block">وقت البدء:</span>
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200 text-xs">
                    {new Date(currentShift.openedAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C827A] text-[11px] block">الانتهاء المجدول:</span>
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200 text-xs">
                    {currentShift.scheduledEndTime
                      ? new Date(currentShift.scheduledEndTime).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '8 ساعات'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C827A] text-[11px] block">مدة العمل حتى الآن:</span>
                  <span className="font-mono font-black text-xs text-[#D4AF37]">
                    {duration.formatted}
                  </span>
                </div>
              </div>

              {/* Cash Ledger Summary */}
              <div
                className={`p-4 rounded-2xl border space-y-2 font-mono ${
                  isLight ? 'bg-[#FFFDF8] border-[#E8DFC8]' : 'bg-[#1C1810] border-[#3E2E14]'
                }`}
              >
                <div className="flex justify-between text-xs">
                  <span className="text-[#8C827A] font-sans">العهدة الافتتاحية بالدرج:</span>
                  <span className="font-bold">{startingCash.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8C827A] font-sans">إجمالي مبيعات الشيفت النقدية:</span>
                  <span className="font-bold text-emerald-400">+{totalSales.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#8C827A] font-sans">عدد الفواتير المنفذة:</span>
                  <span className="font-bold text-stone-300">{currentShift.totalTransactions || 0} عملية</span>
                </div>

                <div className="pt-2 border-t border-stone-400/20 dark:border-stone-700/60 flex justify-between text-sm font-black">
                  <span className="font-sans text-stone-800 dark:text-stone-100">
                    المبلغ المتوقع وجوده بالدرج:
                  </span>
                  <span className="text-[#D4AF37] font-bold text-base">
                    {expectedCash.toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              {/* SECTION: Denomination Cash Counter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100">
                      جرد فئات النقدية بالدرج (العد التفصيلي) *
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setUseDenominations(false);
                        setDirectCashStr(expectedCash.toString());
                      }}
                      className="cursor-pointer px-2.5 py-1 rounded-lg font-bold text-[11px] bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1"
                      title="مطابقة المبلغ الفعلي مع المتوقع تلقائياً"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>مطابقة سريعة ({expectedCash.toLocaleString()} ج)</span>
                    </button>
                    <div className="flex items-center gap-1 bg-stone-200 dark:bg-stone-800 p-0.5 rounded-xl text-[11px]">
                      <button
                        type="button"
                        onClick={() => setUseDenominations(true)}
                        className={`cursor-pointer px-2.5 py-1 rounded-lg font-bold transition ${
                          useDenominations
                            ? 'bg-[#D4AF37] text-stone-950 shadow-sm'
                            : 'text-[#8C827A] hover:text-stone-900 dark:hover:text-stone-200'
                        }`}
                      >
                        عد بالفئات
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseDenominations(false);
                          if (!directCashStr) setDirectCashStr(expectedCash.toString());
                        }}
                        className={`cursor-pointer px-2.5 py-1 rounded-lg font-bold transition ${
                          !useDenominations
                            ? 'bg-[#D4AF37] text-stone-950 shadow-sm'
                            : 'text-[#8C827A] hover:text-stone-900 dark:hover:text-stone-200'
                        }`}
                      >
                        مبلغ إجمالي
                      </button>
                    </div>
                  </div>
                </div>

                {useDenominations ? (
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#181818] border-[#2A2A2A]'
                  }`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {/* 200 */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-[#D4AF37]">فئة 200 ج.م</span>
                          <span className="font-mono text-[10px] text-stone-500">
                            ={( (parseInt(b200, 10) || 0) * 200 ).toLocaleString()} ج.م
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="عدد الأوراق..."
                          value={b200}
                          onChange={(e) => setB200(e.target.value)}
                          className="w-full text-sm font-mono font-bold p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>

                      {/* 100 */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-[#D4AF37]">فئة 100 ج.م</span>
                          <span className="font-mono text-[10px] text-stone-500">
                            ={( (parseInt(b100, 10) || 0) * 100 ).toLocaleString()} ج.م
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="عدد الأوراق..."
                          value={b100}
                          onChange={(e) => setB100(e.target.value)}
                          className="w-full text-sm font-mono font-bold p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>

                      {/* 50 */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-[#D4AF37]">فئة 50 ج.م</span>
                          <span className="font-mono text-[10px] text-stone-500">
                            ={( (parseInt(b50, 10) || 0) * 50 ).toLocaleString()} ج.م
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="عدد الأوراق..."
                          value={b50}
                          onChange={(e) => setB50(e.target.value)}
                          className="w-full text-sm font-mono font-bold p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>

                      {/* 20 */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-[#D4AF37]">فئة 20 ج.م</span>
                          <span className="font-mono text-[10px] text-stone-500">
                            ={( (parseInt(b20, 10) || 0) * 20 ).toLocaleString()} ج.م
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="عدد الأوراق..."
                          value={b20}
                          onChange={(e) => setB20(e.target.value)}
                          className="w-full text-sm font-mono font-bold p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>

                      {/* 10 */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-[#D4AF37]">فئة 10 ج.م</span>
                          <span className="font-mono text-[10px] text-stone-500">
                            ={( (parseInt(b10, 10) || 0) * 10 ).toLocaleString()} ج.م
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="عدد الأوراق..."
                          value={b10}
                          onChange={(e) => setB10(e.target.value)}
                          className="w-full text-sm font-mono font-bold p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>

                      {/* 5 */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-[#D4AF37]">فئة 5 ج.م</span>
                          <span className="font-mono text-[10px] text-stone-500">
                            ={( (parseInt(b5, 10) || 0) * 5 ).toLocaleString()} ج.م
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="عدد الأوراق..."
                          value={b5}
                          onChange={(e) => setB5(e.target.value)}
                          className="w-full text-sm font-mono font-bold p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>
                    </div>

                    {/* Coins */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-[#D4AF37] block">فكة وعملات معدنية (coins)</span>
                        <span className="text-[10px] text-stone-500">مجموع الجنيهات والأنصاص المعدنية</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="المبلغ الإجمالي للفكة..."
                        value={coins}
                        onChange={(e) => setCoins(e.target.value)}
                        className="w-40 text-sm font-mono font-bold p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-left focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      />
                    </div>

                    {/* Denomination Total Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-300/60 dark:border-stone-700">
                      <span className="font-bold text-xs">إجمالي النقدية المحصاة من الفئات:</span>
                      <span className="font-mono font-black text-base text-[#D4AF37]">
                        {denominationTotal.toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={directCashStr}
                      onChange={(e) => setDirectCashStr(e.target.value)}
                      placeholder="أدخل المبلغ الإجمالي الفعلي الموجود بالدرج..."
                      className={`w-full text-lg font-mono font-black p-3 rounded-2xl border transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                        isLight
                          ? 'bg-[#F8F5F0] border-[#DFD7CB] text-[#1F1B16]'
                          : 'bg-[#1C1C1C] border-[#333333] text-[#F5EBE6]'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Real-time Discrepancy Comparison Indicator */}
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                  difference === 0
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                    : difference > 0
                    ? 'bg-blue-950/60 border-blue-700 text-blue-300'
                    : 'bg-red-950/60 border-red-700 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {difference === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>
                    {difference === 0
                      ? 'الخزينة مطابقة تماماً (بدون عجز أو زيادة)'
                      : difference > 0
                      ? 'يوجد زيادة وفائض نقدي في الخزينة'
                      : 'يوجد عجز نقدي في الخزينة'}
                  </span>
                </div>
                <span className="font-mono text-sm font-black">
                  {difference === 0
                    ? '0.00 ج.م'
                    : difference > 0
                    ? `+${difference.toFixed(2)} ج.م (فائض)`
                    : `-${Math.abs(difference).toFixed(2)} ج.م (عجز)`}
                </span>
              </motion.div>

              {/* Cashier Digital Signature & Acknowledgement */}
              <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-[#181611] border-[#3B3019]'
              }`}>
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                    إقرار وتوقيع الكاشير على تسليم العهدة
                  </span>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer text-[11px] leading-relaxed select-none">
                  <input
                    type="checkbox"
                    checked={isSigned}
                    onChange={(e) => setIsSigned(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                  />
                  <span>
                    أقر أنا الكاشير (<strong>{signatureName || currentShift.cashierName}</strong>) بأنني قمت بجرد النقدية بالدرج شخصياً، وتطابق الفئات المدخلة أعلاه النقدية الفعلية المسلمة بنهاية هذه الوردية، وتتحمل عهدتي أي عجز مسجل.
                  </span>
                </label>
              </div>

              {/* Non-Owner Manager Authorization (Required for early close) */}
              {!isOwner && isEarly && (
                <div
                  className={`p-3.5 border-2 rounded-2xl space-y-3 ${
                    isLight
                      ? 'bg-[#FDF9F0] border-[#DFC99E]'
                      : 'bg-[#1C160B] border-[#4A3B1B]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert
                        className={`w-5 h-5 ${
                          isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                        }`}
                      />
                      <div>
                        <h4
                          className={`text-xs font-black ${
                            isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                          }`}
                        >
                          إذن واعتماد المدير العام للإغلاق الاستثنائي (Admin Approval)
                        </h4>
                        <p
                          className={`text-[11px] ${
                            isLight ? 'text-[#6B5E4F]' : 'text-[#A89F91]'
                          }`}
                        >
                          بسبب محاولة الإغلاق قبل موعد الوردية، يتطلب إدخال كلمة مرور أو PIN المدير وتوثيقه في السجل
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                      سبب الإغلاق المبكر (ظرف طارئ) *:
                    </label>
                    <input
                      type="text"
                      required={!isOwner && isEarly}
                      value={earlyCloseReason}
                      onChange={(e) => setEarlyCloseReason(e.target.value)}
                      placeholder="مثال: ظرف صحي طارئ، تبديل كاشير مبكر، عطل فني..."
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-[#151515] border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
                        باسورد أو PIN المدير العام للاعتماد *:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 font-normal cursor-pointer"
                      >
                        {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showSecret ? 'إخفاء' : 'إظهار'}
                      </button>
                    </div>

                    <input
                      type={showSecret ? 'text' : 'password'}
                      required={!isOwner && isEarly}
                      value={managerSecret}
                      onChange={(e) => setManagerSecret(e.target.value)}
                      placeholder="أدخل رمز الـ PIN أو كلمة مرور المدير للموافقة..."
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm font-bold focus:outline-none transition ${
                        isLight
                          ? 'bg-white border-[#DFC99E] text-stone-900 focus:border-[#B89028]'
                          : 'bg-[#151515] border-[#383838] focus:border-[#D4AF37] text-white'
                      }`}
                    />
                  </div>

                  {terminalFailedAttempts > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-bold bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        تنبيه أمني: يوجد {terminalFailedAttempts} محاولات خاطئة مسجلة! (الحد الأقصى 3 قبل إغلاق المحطة).
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Shift Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8C827A] block">
                  ملاحظات وتوضيحات إضافية (اختياري):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="أي توضيحات بشأن الفوارق النقدية أو تسليم الوردية للكاشير القادم..."
                  className={`w-full p-2.5 rounded-2xl text-xs border transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                    isLight
                      ? 'bg-[#F8F5F0] border-[#DFD7CB] text-[#1F1B16] placeholder-[#8E847A]'
                      : 'bg-[#1C1C1C] border-[#333333] text-[#F5EBE6] placeholder-[#6C635B]'
                  }`}
                />
              </div>
            </div>

            {/* Action Buttons - Pinned Footer */}
            <div className={`flex items-center justify-end gap-3 p-3 sm:p-4 border-t shrink-0 ${
              isLight ? 'bg-[#FAF8F5] border-[#E8DFD0]' : 'bg-[#101010] border-[#2A2A2A]'
            }`}>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold text-[#8C827A] hover:bg-stone-200 dark:hover:bg-[#222222] transition"
              >
                إلغاء وتراجع
              </button>

              <button
                type="submit"
                className={`cursor-pointer px-5 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm shadow-lg transition flex items-center gap-2 active:scale-95 ${
                  !isOwner && isEarly
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-700/25'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 shadow-[#D4AF37]/25'
                }`}
              >
                {!isOwner && isEarly ? (
                  <>
                    <Lock className="w-4 h-4 text-white" />
                    <span>إغلاق استثنائي مبكر (يتطلب موافقة المدير)</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>إقفال الوردية وعرض الـ Z-Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
