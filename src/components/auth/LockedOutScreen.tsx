import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Clock,
  Calendar,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  AlertTriangle,
  Sparkles,
  Phone,
  Store,
  ChevronLeft,
  RefreshCw,
  Sun,
  Moon,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { ManagerApprovalModal } from './ManagerApprovalModal';
import { User } from '../../types';
import { sounds } from '../../utils/sound';

interface LockedOutScreenProps {
  onReturnToLogin: () => void;
  onOpenPinKeypad?: () => void;
}

export const LockedOutScreen: React.FC<LockedOutScreenProps> = ({
  onReturnToLogin,
  onOpenPinKeypad,
}) => {
  const {
    lockedOutUser,
    clearLockedOutUser,
    theme,
    toggleTheme,
    currentShift,
    securitySettings,
    terminalFailedAttempts,
    unlockTerminalOverride,
    users,
  } = useBakery();

  const isLight = theme === 'light';
  const isTerminalLocked = terminalFailedAttempts >= (securitySettings.maxFailedAttempts || 3);

  // Live real-time clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [managerModalTarget, setManagerModalTarget] = useState<User | null>(null);
  const [unlockedSuccess, setUnlockedSuccess] = useState<boolean>(false);
  const [lockoutError, setLockoutError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format hours, minutes, seconds for clock display
  const hours = currentTime.getHours();
  const rawHours12 = hours % 12 || 12;
  const hoursString = String(rawHours12).padStart(2, '0');
  const minutesString = String(currentTime.getMinutes()).padStart(2, '0');
  const secondsString = String(currentTime.getSeconds()).padStart(2, '0');
  const periodString = hours >= 12 ? 'مساءً' : 'صباحاً';

  const fullDateString = currentTime.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleOpenManagerModal = () => {
    setLockoutError(null);
    if (lockedOutUser) {
      setManagerModalTarget(lockedOutUser);
    } else {
      const owner = users.find((u) => u.role === 'owner') || users[0];
      setManagerModalTarget(owner);
    }
  };

  const handleManagerSuccess = () => {
    setManagerModalTarget(null);
    setUnlockedSuccess(true);
    setLockoutError(null);
    sounds.playSuccess();
    setTimeout(() => {
      clearLockedOutUser();
      onReturnToLogin();
    }, 1800);
  };

  const handleTryLeave = (destination: 'login' | 'pin') => {
    if (isTerminalLocked) {
      sounds.playWarning();
      setLockoutError(
        '⚠️ تم إيقاف وقفل المحطة بالكامل لتجاوز 3 محاولات خاطئة متتالية! لا يمكن العودة أو الاستخدام دون إدخال إذن واعتماد المدير العام أولاً.'
      );
      return;
    }

    clearLockedOutUser();
    if (destination === 'login') {
      onReturnToLogin();
    } else if (onOpenPinKeypad) {
      onOpenPinKeypad();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-y-auto selection:bg-[#D4AF37]/30 transition-colors duration-300 ${
        isLight
          ? 'bg-gradient-to-br from-[#FDFBF7] via-[#F6F0E6] to-[#EAE0D0] text-[#1F1B16]'
          : 'bg-gradient-to-br from-[#0B0907] via-[#14110C] to-[#1C160F] text-[#F5EBE6]'
      }`}
    >
      {/* Decorative Ambient Warm Glow Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-40 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 ${
            isLight ? 'bg-amber-400' : 'bg-[#D4AF37]'
          }`}
        />
        <div
          className={`absolute -bottom-40 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 ${
            isLight ? 'bg-orange-300' : 'bg-[#9E782F]'
          }`}
        />
      </div>

      {/* Top Header Navigation Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl border shadow-sm flex items-center justify-center ${
              isLight
                ? 'bg-white border-[#E0D5C3] text-[#8A6414]'
                : 'bg-[#1D170F] border-[#3D301C] text-[#D4AF37]'
            }`}
          >
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-black text-base sm:text-lg tracking-tight">
                مخبز وحلويات أطايب زمان
              </h1>
              <span
                className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isLight
                    ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                    : 'bg-[#291F11] border-[#5A431D] text-[#D4AF37]'
                }`}
              >
                شاشة الأمان والحماية
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-[#7D7061]' : 'text-[#A89D8E]'}`}>
              نظام نقاط البيع وإدارة الورديات الذكية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`cursor-pointer p-2 rounded-xl border transition ${
              isLight
                ? 'bg-white/80 border-[#E0D5C3] text-stone-700 hover:bg-stone-100'
                : 'bg-[#1E1810]/80 border-[#3D301C] text-[#D4AF37] hover:bg-[#2A2116]'
            }`}
            title="تبديل المظهر"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Quick Return to Login Button */}
          <button
            onClick={() => {
              clearLockedOutUser();
              onReturnToLogin();
            }}
            className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              isLight
                ? 'bg-white border-[#DCD0BE] text-stone-800 hover:bg-stone-50 shadow-sm'
                : 'bg-[#1F1912] border-[#3D301C] text-[#F5EBE6] hover:bg-[#2B2319]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>تسجيل الدخول</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full my-auto">
        {/* Luxury Digital Clock Display */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-6 sm:mb-8"
        >
          {/* Live Digital Clock Numbers */}
          <div className="inline-flex items-center justify-center gap-1.5 sm:gap-3 px-6 sm:px-10 py-4 sm:py-6 rounded-3xl border shadow-2xl backdrop-blur-md">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#D4AF37]">
                {hoursString}
              </span>
              <span className={`text-[10px] sm:text-xs font-bold ${isLight ? 'text-stone-500' : 'text-[#8C827A]'}`}>
                ساعة
              </span>
            </div>

            {/* Pulsing Colon */}
            <span className="font-mono text-3xl sm:text-5xl font-black text-[#D4AF37] animate-pulse pb-4 sm:pb-6">
              :
            </span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <span
                className={`font-mono text-4xl sm:text-6xl md:text-7xl font-black tracking-tight ${
                  isLight ? 'text-stone-900' : 'text-stone-100'
                }`}
              >
                {minutesString}
              </span>
              <span className={`text-[10px] sm:text-xs font-bold ${isLight ? 'text-stone-500' : 'text-[#8C827A]'}`}>
                دقيقة
              </span>
            </div>

            {/* Pulsing Colon */}
            <span className="font-mono text-3xl sm:text-5xl font-black text-[#D4AF37] animate-pulse pb-4 sm:pb-6">
              :
            </span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <span className="font-mono text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#B89028]">
                {secondsString}
              </span>
              <span className={`text-[10px] sm:text-xs font-bold ${isLight ? 'text-stone-500' : 'text-[#8C827A]'}`}>
                ثانية
              </span>
            </div>

            {/* AM/PM Badge */}
            <div className="mr-2 sm:mr-4 self-center">
              <span
                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm border shadow-inner ${
                  isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-950'
                    : 'bg-[#2A2012] border-[#5A451A] text-[#D4AF37]'
                }`}
              >
                {periodString}
              </span>
            </div>
          </div>

          {/* Date and Calendar Ribbon */}
          <div className="mt-3.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <span className={isLight ? 'text-stone-700' : 'text-[#D0C7BC]'}>{fullDateString}</span>
          </div>
        </motion.div>

        {/* Lockout / Security Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-md ${
            isLight
              ? 'bg-white/95 border-[#E6DBCA] text-[#1F1B16]'
              : 'bg-[#16120D]/95 border-[#3E301B] text-[#F5EBE6]'
          }`}
        >
          {/* Status Header Banner */}
          <div
            className={`p-4 sm:p-5 flex items-center gap-3.5 border-b ${
              isTerminalLocked || lockedOutUser
                ? isLight
                  ? 'bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border-red-200 text-red-950'
                  : 'bg-gradient-to-r from-[#2B1111] via-[#24150D] to-[#1E130B] border-red-900/60 text-red-200'
                : isLight
                ? 'bg-gradient-to-r from-amber-50 to-orange-50/60 border-amber-200 text-amber-950'
                : 'bg-gradient-to-r from-[#241A0E] to-[#16120D] border-[#3E301B] text-[#D4AF37]'
            }`}
          >
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                isTerminalLocked || lockedOutUser
                  ? isLight
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-red-950 text-red-400 border border-red-800'
                  : isLight
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-[#2E2010] text-[#D4AF37] border border-[#5A451A]'
              }`}
            >
              {isTerminalLocked || lockedOutUser ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>

            <div>
              <h2 className="font-heading font-black text-base sm:text-lg">
                {isTerminalLocked
                  ? 'تم إيقاف وقفل المحطة بالكامل لحماية النظام'
                  : lockedOutUser
                  ? 'تم تعليق الحساب مؤقتاً لأسباب أمنية'
                  : 'شاشة الحماية والانتظار النشطة'}
              </h2>
              <p
                className={`text-xs ${
                  isTerminalLocked || lockedOutUser
                    ? isLight
                      ? 'text-red-800'
                      : 'text-red-300/90'
                    : isLight
                    ? 'text-amber-800'
                    : 'text-[#A89D8E]'
                }`}
              >
                {isTerminalLocked
                  ? `تم استنفاد الحد الأقصى (3 محاولات خاطئة) على المحطة! تم تجميد الدخول ولا يمكن الاستخدام إلا بإذن المدير العام.`
                  : lockedOutUser
                  ? `تم استنفاد 3 محاولات خاطئة متتالية للحساب. تم القفل لحماية بيانات ومبيعات المخبز.`
                  : 'النظام محمي ومؤمن بالكامل. يرجى تسجيل الدخول أو إدخال الـ PIN للمتابعة.'}
              </p>
            </div>
          </div>

          {/* Body Information */}
          <div className="p-5 sm:p-6 space-y-4 text-xs">
            {lockoutError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-red-950/80 border border-red-600 text-red-300 font-bold flex items-center gap-2"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
                <span>{lockoutError}</span>
              </motion.div>
            )}

            {unlockedSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>تم التحقق من هوية المدير وإلغاء القفل بنجاح! جاري توجيهك لشاشة الدخول...</span>
              </motion.div>
            )}

            {/* Locked User Details Card */}
            {lockedOutUser && (
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isLight
                    ? 'bg-[#FAF7F2] border-[#E8DFD0]'
                    : 'bg-[#1D1711] border-[#362A17]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#8C827A] font-bold">الحساب المتأثر:</span>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-red-900/20 text-red-400 border border-red-800/40">
                    مقفول أمنياً
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] flex items-center justify-center text-stone-950 font-black text-base shadow-sm">
                    {lockedOutUser.avatar || '👤'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#F5EBE6]">{lockedOutUser.name}</h3>
                    <p className="text-[#8C827A] font-mono">@{lockedOutUser.username}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-stone-300 dark:border-stone-800 flex items-center justify-between text-[11px] text-[#A89D8E]">
                  <span>الحد الأقصى للمحاولات المسموح بها:</span>
                  <span className="font-bold text-red-400">
                    {securitySettings.maxFailedAttempts || 3} محاولات خاطئة
                  </span>
                </div>
              </div>
            )}

            {/* Guidance & Solution Section */}
            <div
              className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                isLight
                  ? 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                  : 'bg-[#1C160F] border-[#4A3919] text-[#E0D5C1]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#D4AF37] mb-0.5">كيفية فتح الحساب وإلغاء القفل:</strong>
                  إذا كنت أنت صاحب المخبز أو المدير المسؤول، يمكنك إدخال بياناتك الإدارية لفك الحظر فوراً دون الحاجة للانتظار. وإذا كنت كاشيراً، يرجى طلب مساعدة المدير لفتح حسابك.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              {(lockedOutUser || isTerminalLocked) && (
                <button
                  type="button"
                  onClick={handleOpenManagerModal}
                  className="cursor-pointer w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs sm:text-sm shadow-lg shadow-[#D4AF37]/25 transition flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Unlock className="w-4 h-4" />
                  <span>
                    {isTerminalLocked
                      ? 'فك قفل المحطة بواسطة المدير فوراً'
                      : 'فك الحظر بواسطة المدير فوراً'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleTryLeave('login')}
                className={`cursor-pointer w-full sm:w-auto py-3 px-5 rounded-2xl font-bold text-xs border transition flex items-center justify-center gap-2 ${
                  isLight
                    ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800'
                    : 'bg-[#221B13] hover:bg-[#2F2418] border-[#42341D] text-[#F5EBE6]'
                }`}
              >
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <span>العودة لشاشة الدخول</span>
              </button>

              {onOpenPinKeypad && (
                <button
                  type="button"
                  onClick={() => handleTryLeave('pin')}
                  className={`cursor-pointer w-full sm:w-auto py-3 px-4 rounded-2xl font-bold text-xs border transition flex items-center justify-center gap-2 ${
                    isLight
                      ? 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                      : 'bg-[#18140E] hover:bg-[#221B13] border-[#332715] text-[#A89D8E]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>لوحة الـ PIN السريعة</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer Security Badges */}
          <div
            className={`px-5 py-3.5 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] ${
              isLight ? 'bg-stone-50 border-stone-200 text-stone-500' : 'bg-[#110E0A] border-[#292012] text-[#8C827A]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>جدار الحماية الفولاذي نشط 24/7</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>دعم الإدارة: 01012345678</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full text-center py-4 text-[11px] opacity-70">
        <p>© {new Date().getFullYear()} مخبز وحلويات أطايب زمان • جميع الحقوق محفوظة ومؤمنة</p>
      </footer>

      {/* Direct Manager Approval & Unlock Modal on top of Locked Screen */}
      {managerModalTarget && (
        <ManagerApprovalModal
          isOpen={!!managerModalTarget}
          targetUser={managerModalTarget}
          theme={theme}
          onSuccess={handleManagerSuccess}
          onCancel={() => setManagerModalTarget(null)}
        />
      )}
    </div>
  );
};
