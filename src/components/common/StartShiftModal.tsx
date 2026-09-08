import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  Clock,
  Coins,
  User,
  CheckCircle2,
  X,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';

interface StartShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StartShiftModal: React.FC<StartShiftModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, startShift, users, theme, terminalFailedAttempts } = useBakery();
  const isLight = theme === 'light';
  const isOwner = currentUser?.role === 'owner';

  const [startingCashStr, setStartingCashStr] = useState<string>('500');
  const [selectedCashierId, setSelectedCashierId] = useState<string>(currentUser?.id || '');
  const [durationHours, setDurationHours] = useState<number>(8);
  const [managerSecret, setManagerSecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeStaff = users.filter((u) => u.status === 'active');

  const presets = [
    { label: '0 ج.م (بدون عهدة)', val: 0 },
    { label: '200 ج.م', val: 200 },
    { label: '500 ج.م (شائع)', val: 500 },
    { label: '1000 ج.م', val: 1000 },
  ];

  const durationPresets = [4, 6, 8, 10, 12];

  const calculatedEndTime = new Date(Date.now() + durationHours * 60 * 60 * 1000).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cash = Math.max(0, parseFloat(startingCashStr) || 0);

    if (!isOwner && !managerSecret.trim()) {
      setErrorMsg('⚠️ يرجى إدخال رمز الـ PIN أو كلمة المرور الخاصة بالمدير العام للاعتماد');
      return;
    }

    const res = startShift(
      cash,
      durationHours,
      managerSecret.trim(),
      isOwner && selectedCashierId ? selectedCashierId : undefined
    );

    if (res.success) {
      onClose();
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
          className={`relative w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh] max-h-[85dvh] my-auto ${
            isLight
              ? 'bg-white border-[#E8E2D8] text-[#1F1B16]'
              : 'bg-[#141414] border-[#3A2E14] text-[#E0D8D0]'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between border-b shrink-0 ${
              isLight
                ? 'bg-gradient-to-r from-[#FAF4E8] via-[#F6EDE0] to-[#FFFDF8] border-[#E8DFD0]'
                : 'bg-gradient-to-r from-[#241A0A] to-[#14120D] text-[#F5EBE6] border-[#382C16]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#D4AF37] rounded-2xl text-stone-950 font-black shadow-md shadow-[#D4AF37]/20">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className={`text-lg font-bold font-heading ${
                    isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                  }`}
                >
                  فتح شيفت كاشير جديد
                </h3>
                <p
                  className={`text-xs ${
                    isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
                  }`}
                >
                  بدء تسجيل المبيعات والعهدة النقدية
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 custom-scrollbar space-y-3.5 sm:space-y-4 text-xs">
            {/* Cashier Info / Selection Card */}
            {isOwner ? (
              <div
                className={`p-3.5 rounded-2xl border space-y-2 ${
                  isLight
                    ? 'bg-[#FAF8F5] border-[#EAE2D5]'
                    : 'bg-[#1A1A1A] border-[#2A2A2A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#D4AF37]">
                    تعيين الكاشير المسؤول عن الوردية:
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] font-bold">
                    لوحة تحكم المدير
                  </span>
                </div>
                <select
                  value={selectedCashierId}
                  onChange={(e) => setSelectedCashierId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border text-xs font-bold bg-white dark:bg-[#151515] border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  {activeStaff.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (@{u.username}) {u.id === currentUser?.id ? '- (حسابي)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isLight
                    ? 'bg-[#FAF8F5] border-[#EAE2D5]'
                    : 'bg-[#1A1A1A] border-[#2A2A2A]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-bold ${
                      isLight
                        ? 'bg-[#FDF7E7] border-[#DEC798] text-[#8A6414]'
                        : 'bg-[#282012] border-[#5A451A] text-[#D4AF37]'
                    }`}
                  >
                    {currentUser?.avatar || '👤'}
                  </div>
                  <div>
                    <span
                      className={`text-[11px] block ${
                        isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
                      }`}
                    >
                      الكاشير المسئول:
                    </span>
                    <span
                      className={`font-bold text-sm ${
                        isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                      }`}
                    >
                      {currentUser?.name}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isLight
                      ? 'bg-[#FDF7E7] text-[#8A6414] border-[#DEC798]'
                      : 'bg-[#221C11] text-[#D4AF37] border-[#4A3B1B]'
                  }`}
                >
                  كاشير
                </span>
              </div>
            )}

            {/* Shift Duration Selection */}
            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#181818] border-[#2A2A2A]'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>مدة الوردية المجدولة:</span>
                </span>
                <span className="font-mono font-bold text-[11px] text-[#D4AF37]">
                  الإغلاق المتوقع: {calculatedEndTime}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {durationPresets.map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setDurationHours(hrs)}
                    className={`cursor-pointer py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border ${
                      durationHours === hrs
                        ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37] shadow-sm font-black'
                        : 'bg-white dark:bg-[#121212] border-stone-300 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-[#D4AF37]'
                    }`}
                  >
                    <span>{hrs}</span>
                    <span className="text-[9px]">ساعات</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-stone-500">
                زر إغلاق الشفت للكاشير يفتح تلقائياً قبل {calculatedEndTime} بـ 5 دقائق فقط.
              </p>
            </div>

            {/* Starting Cash Input */}
            <div className="space-y-2">
              <label
                className={`font-bold flex items-center gap-1.5 text-xs ${
                  isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                }`}
              >
                <Coins
                  className={`w-4 h-4 ${
                    isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                  }`}
                />
                <span>العهدة النقدية الافتتاحية في الدرج (Starting Cash):</span>
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={startingCashStr}
                  onChange={(e) => setStartingCashStr(e.target.value)}
                  placeholder="500"
                  className={`w-full px-4 py-3 border-2 rounded-2xl text-lg font-mono font-bold focus:outline-none transition ${
                    isLight
                      ? 'bg-white border-[#DFC99E] text-[#8A6414] focus:border-[#B89028]'
                      : 'bg-[#1C1C1C] border-[#383838] focus:border-[#D4AF37] text-[#D4AF37]'
                  }`}
                />
                <span
                  className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${
                    isLight ? 'text-stone-400' : 'text-[#8C827A]'
                  }`}
                >
                  ج.م
                </span>
              </div>

              {/* Cash Presets */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setStartingCashStr(preset.val.toString())}
                    className={`cursor-pointer py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center ${
                      parseFloat(startingCashStr) === preset.val
                        ? isLight
                          ? 'bg-[#FDF7E7] border-[#D4AF37] text-[#8A6414] shadow-xs'
                          : 'bg-[#261E10] border-[#D4AF37] text-[#D4AF37]'
                        : isLight
                        ? 'bg-[#FAF8F5] border-[#E2DAD0] text-[#5C5248] hover:bg-stone-100 hover:text-stone-900'
                        : 'bg-[#1A1A1A] border-[#2E2E2E] text-[#A8A096] hover:bg-[#222222] hover:text-[#F5EBE6]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Non-Owner Manager Authorization Requirement */}
            {!isOwner && (
              <div
                className={`p-3.5 border-2 rounded-2xl space-y-3 ${
                  isLight
                    ? 'bg-[#FDF9F0] border-[#DFC99E]/80'
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
                        إذن واعتماد المدير العام (إلزامي لفتح الشيفت)
                      </h4>
                      <p
                        className={`text-[11px] ${
                          isLight ? 'text-[#6B5E4F]' : 'text-[#A89F91]'
                        }`}
                      >
                        بموجب السياسة الصارمة، لا يمكن للموظف فتح الشيفت واستلام العهدة إلا بإذن المدير
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isLight
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-amber-950/60 text-amber-300 border-amber-800'
                    }`}
                  >
                    توقيع رقمي
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label
                    className={`font-bold flex items-center justify-between text-xs ${
                      isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
                      رمز الـ PIN أو كلمة مرور المدير العام:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 font-normal cursor-pointer"
                    >
                      {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showSecret ? 'إخفاء' : 'إظهار'}
                    </button>
                  </label>

                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      required
                      value={managerSecret}
                      onChange={(e) => setManagerSecret(e.target.value)}
                      placeholder="أدخل رمز الـ PIN أو كلمة مرور المدير..."
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm font-bold focus:outline-none transition ${
                        isLight
                          ? 'bg-white border-[#DFC99E] text-stone-900 focus:border-[#B89028]'
                          : 'bg-[#151515] border-[#383838] focus:border-[#D4AF37] text-white'
                      }`}
                    />
                  </div>
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

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2 text-red-500 text-xs font-bold leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Notice */}
            <div
              className={`p-3 border rounded-2xl text-[11px] leading-relaxed ${
                isLight
                  ? 'bg-[#FAF7F0] border-[#E8DFC8] text-[#5C4F3D]'
                  : 'bg-[#18150D] border-[#3A2D14] text-[#C4B290]'
              }`}
            >
              💡{' '}
              <strong className={isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'}>
                ملاحظة هامة:
              </strong>{' '}
              سيتم احتساب إجمالي مبيعات اليوم إضافةً إلى هذه العهدة لحساب النقدية الإجمالية المتوقعة في الدرج عند إغلاق الشيفت.
            </div>

            </div>

            {/* Actions - Pinned */}
            <div
              className={`flex items-center justify-end gap-2.5 p-3 sm:p-4 border-t shrink-0 ${
                isLight ? 'border-[#EAE2D5] bg-[#FAF8F5]' : 'border-[#262626] bg-[#101010]'
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`cursor-pointer px-4 py-2.5 rounded-xl font-bold transition text-xs ${
                  isLight
                    ? 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                    : 'text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#222222]'
                }`}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="cursor-pointer px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs shadow-md shadow-[#D4AF37]/20 flex items-center gap-1.5 transition active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4 text-stone-950" />
                <span>بدء الشيفت وتفعيل البيع</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
