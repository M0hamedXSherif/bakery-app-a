import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  KeyRound,
  Delete,
  RotateCcw,
  LogIn,
  AlertCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Crown,
  Eye,
  EyeOff,
  User as UserIcon,
  Power,
  Keyboard,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { sounds } from '../../utils/sound';
import { TwoFactorModal } from './TwoFactorModal';
import { ManagerApprovalModal } from './ManagerApprovalModal';
import { User } from '../../types';

interface PinLockScreenProps {
  onOpenFullLogin?: () => void;
  onOpenRegister?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = () => {
  const {
    unlockTerminal,
    theme,
    users,
    securitySettings,
    sessionTerminatedNotice,
    clearSessionTerminatedNotice,
    setIsStandbyScreenOpen,
    turnOffScreen,
    setLockedOutUser,
    terminalFailedAttempts,
  } = useBakery();
  const isLight = theme === 'light';
  const isTerminalLocked = terminalFailedAttempts >= (securitySettings.maxFailedAttempts || 3);

  // Alphanumeric secret input (supports letters and numbers)
  const [secret, setSecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [isCaps, setIsCaps] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [pendingManager2FA, setPendingManager2FA] = useState<{ secret: string; user: User } | null>(null);
  const [pendingAccountUser, setPendingAccountUser] = useState<User | null>(null);
  const [managerApprovalTarget, setManagerApprovalTarget] = useState<User | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Live real-time clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Focus the alphanumeric input field on mount
    inputRef.current?.focus();
  }, []);

  const timeString = currentTime.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateString = currentTime.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Handle alphanumeric verification
  const handleVerify = useCallback(
    (secretToVerify: string) => {
      const trimmed = secretToVerify.trim();
      if (!trimmed) {
        sounds.playWarning();
        setErrorMsg('يرجى إدخال رمز الدخول أو كلمة المرور');
        return;
      }

      setErrorMsg(null);

      // Pre-check if matching user is locked or needs 2FA
      const nonActive = users.find(
        (u) =>
          (u.pin === trimmed || u.password === trimmed) && u.status === 'pending'
      );

      if (nonActive) {
        setIsShaking(true);
        sounds.playWarning();
        setPendingAccountUser(nonActive);
        setErrorMsg(`⚠️ حساب (${nonActive.name}) معلق في انتظار اعتماد المدير العام.`);
        setTimeout(() => {
          setIsShaking(false);
          setSecret('');
        }, 700);
        return;
      }

      const matchedUser = users.find(
        (u) =>
          u.status === 'active' &&
          (u.pin === trimmed ||
            u.password === trimmed ||
            u.username.toLowerCase() === trimmed.toLowerCase())
      );

      if (matchedUser) {
        if (matchedUser.isAccountLocked) {
          setIsShaking(true);
          sounds.playWarning();
          setPendingAccountUser(matchedUser);
          setLockedOutUser(matchedUser);
          setIsStandbyScreenOpen(true);
          setErrorMsg(
            '⚠️ هذا الحساب مقفول بقرار أمني لتجاوز 3 محاولات خاطئة متتالية! يرجى مراجعة المدير.'
          );
          setTimeout(() => {
            setIsShaking(false);
            setSecret('');
          }, 700);
          return;
        }

        if (matchedUser.role === 'owner' && securitySettings.require2FAForManagers) {
          setPendingManager2FA({ secret: trimmed, user: matchedUser });
          return;
        }
      }

      // Calls unlockTerminal with alphanumeric secret
      const res = unlockTerminal(trimmed);
      if (res.success) {
        setIsSuccess(true);
      } else {
        if (res.isPending && res.pendingUser) {
          setPendingAccountUser(res.pendingUser);
        }
        setIsShaking(true);
        sounds.playWarning();
        setErrorMsg(res.message || 'بيانات الدخول غير صحيحة، يرجى التحقق من الأحرف والأرقام');
        setTimeout(() => {
          setIsShaking(false);
        }, 700);
      }
    },
    [unlockTerminal, users, securitySettings.require2FAForManagers, setIsStandbyScreenOpen, setLockedOutUser]
  );

  const handle2FASuccess = () => {
    if (!pendingManager2FA) return;
    const verifiedSecret = pendingManager2FA.secret;
    setPendingManager2FA(null);
    const res = unlockTerminal(verifiedSecret);
    if (res.success) {
      setIsSuccess(true);
    } else {
      setErrorMsg(res.message || 'فشل فتح الشاشة');
      setSecret('');
    }
  };

  // Virtual Keypad press handler (for numbers & quick touchscreen use)
  const handleKeypadPress = useCallback(
    (key: string) => {
      if (isSuccess) return;
      setErrorMsg(null);
      sounds.playKeypad();

      if (key === 'clear') {
        setSecret('');
        inputRef.current?.focus();
        return;
      }

      if (key === 'backspace') {
        setSecret((prev) => prev.slice(0, -1));
        inputRef.current?.focus();
        return;
      }

      setSecret((prev) => prev + key);
      inputRef.current?.focus();
    },
    [isSuccess]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(secret);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto ${
        isLight
          ? 'bg-[#F8F5F0] text-[#1F1B16] selection:bg-[#D4AF37]/30'
          : 'bg-[#0A0A0A] text-[#E0D8D0] selection:bg-[#D4AF37]/30'
      }`}
    >
      {/* Background ambient lighting effects */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 sm:h-[500px] rounded-full blur-3xl pointer-events-none ${
          isLight
            ? 'bg-gradient-to-b from-[#D4AF37]/15 via-[#DEC798]/10 to-transparent'
            : 'bg-gradient-to-b from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent'
        }`}
      />

      {/* Top Bar: Brand, Live Clock, Standby Screen Off Action */}
      <header
        className={`relative w-full max-w-3xl flex items-center justify-between py-2 border-b z-10 ${
          isLight ? 'border-[#E8E2D8]' : 'border-[#222222]/80'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-xl shadow-md ${
              isLight
                ? 'bg-[#FDF6E7] border-[#DEC798]'
                : 'bg-[#1A150D] border-[#5A451A] shadow-[#D4AF37]/10'
            }`}
          >
            🥐
          </div>
          <div>
            <h1
              className={`text-base sm:text-lg font-black font-heading flex items-center gap-2 ${
                isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
              }`}
            >
              <span>مخبز النور الذهبي</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                  isLight
                    ? 'bg-[#FDF6E7] text-[#8A6414] border-[#DEC798]'
                    : 'bg-[#241D12] text-[#D4AF37] border-[#5A451A]'
                }`}
              >
                Secure Terminal
              </span>
            </h1>
            <p
              className={`text-xs flex items-center gap-1.5 mt-0.5 ${
                isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>نظام موحد لتسجيل الدخول السريع (يدعم الحروف والأرقام)</span>
            </p>
          </div>
        </div>

        {/* Live Clock & Standby Button */}
        <div className="flex items-center gap-3">
          <div className="text-left hidden sm:flex flex-col items-end">
            <div
              className={`text-lg font-black font-mono tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
              }`}
            >
              <Clock
                className={`w-4 h-4 ${
                  isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                }`}
              />
              <span>{timeString}</span>
            </div>
            <div
              className={`text-xs ${
                isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
              }`}
            >
              {dateString}
            </div>
          </div>

          <button
            type="button"
            onClick={turnOffScreen}
            className={`cursor-pointer px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95 ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
                : 'bg-[#1E170F] hover:bg-[#2A2014] border-[#5A451A] text-[#D4AF37]'
            }`}
            title="إطفاء الشاشة والانتقال لشاشة الأمان والساعة"
          >
            <Power className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline">إطفاء الشاشة</span>
            <span className="sm:hidden">إطفاء</span>
          </button>
        </div>
      </header>

      {/* Center Box: Unified Alphanumeric Login Screen */}
      <main className="relative my-auto w-full max-w-xl flex flex-col items-center z-10 py-3">
        {/* Session Terminated Notice if kicked out */}
        {sessionTerminatedNotice && (
          <div className="w-full mb-3.5 p-3.5 rounded-2xl bg-amber-950/90 border border-amber-500 text-amber-200 text-xs font-bold shadow-xl flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{sessionTerminatedNotice}</span>
            </div>
            <button
              onClick={clearSessionTerminatedNotice}
              className="cursor-pointer text-amber-400 hover:text-amber-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Security Shield Badge */}
        <div
          className={`mb-3.5 px-3.5 py-1.5 rounded-full border text-[11px] font-bold flex items-center gap-1.5 shadow-xs ${
            isLight
              ? 'bg-[#FAF6EE] text-[#8A6414] border-[#E5D7BE]'
              : 'bg-[#1C160C] text-[#D4AF37] border-[#4A3916]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span>منظومة الدخول الموحدة - يقبل كلمة المرور أو رمز الـ PIN (حروف وأرقام)</span>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2
            className={`text-lg sm:text-xl font-black font-heading flex items-center justify-center gap-2 ${
              isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
            }`}
          >
            <Lock className="w-5 h-5 text-[#D4AF37]" />
            <span>تسجيل الدخول للنظام</span>
          </h2>
          <p
            className={`text-xs mt-1 ${
              isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
            }`}
          >
            أدخل كلمة المرور أو رمز PIN الخاص بك (يدعم الحروف الإنجليزية والعربية والأرقام)
          </p>
        </div>

        {/* Error Feedback Message */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full mb-3 p-2.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs font-bold flex items-center justify-center gap-2 text-center"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Terminal Failed Attempts Warning */}
          {!isTerminalLocked && terminalFailedAttempts > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full mb-3 p-2 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5 text-center shadow-md"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                تنبيه أمني: {terminalFailedAttempts} من 3 محاولات خاطئة مسجلة! (قفل تام بعد المحاولة الثالثة)
              </span>
            </motion.div>
          )}

          {/* Full Terminal Lockout Alert */}
          {isTerminalLocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full mb-4 p-4 rounded-2xl bg-red-950/90 border-2 border-red-600 text-red-100 text-xs space-y-3 text-center shadow-2xl"
            >
              <div className="w-10 h-10 mx-auto rounded-full bg-red-900/80 border border-red-500 flex items-center justify-center text-red-300">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm text-red-200">
                  تم قفل المحطة بالكامل لتجاوز 3 محاولات خاطئة!
                </h3>
                <p className="text-[11px] text-red-300/90 leading-relaxed">
                  حظر أمني مشدد: يتطلب فك القفل موافقة وإدخال بيانات المدير العام.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const owner = users.find((u) => u.role === 'owner') || users[0];
                  setManagerApprovalTarget(owner);
                }}
                className="cursor-pointer w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 transition"
              >
                <Crown className="w-4 h-4" />
                <span>فك قفل المحطة بإذن المدير العام 👑</span>
              </button>
            </motion.div>
          )}

          {pendingAccountUser && !isTerminalLocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full mb-4 p-3 rounded-2xl bg-[#1F180F] border border-[#5A451A] text-[#F5EBE6] text-xs space-y-2 text-center shadow-lg"
            >
              <div className="flex items-center justify-center gap-1.5 text-[#D4AF37] font-bold">
                <Crown className="w-4 h-4" />
                <span>اعتماد فوري بصلاحية المدير العام 👑</span>
              </div>
              <p className="text-[11px] text-[#C4BCB2]">
                الحساب معلق. يمكن للمدير العام إدخال بياناته لتفعيل حساب ({pendingAccountUser.name}) والدخول مباشرة.
              </p>
              <button
                type="button"
                onClick={() => setManagerApprovalTarget(pendingAccountUser)}
                className="cursor-pointer w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] text-stone-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>تفعيل الحساب ببيانات المدير 👑</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alphanumeric Form & Keypad (Active if terminal not locked) */}
        {!isTerminalLocked && (
          <form onSubmit={handleFormSubmit} className="w-full space-y-4">
            {/* Alphanumeric Input Field */}
            <motion.div
              animate={isShaking ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="relative w-full"
            >
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type={showSecret ? 'text' : 'password'}
                  value={secret}
                  onChange={(e) => {
                    setSecret(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="أدخل رمز PIN أو كلمة المرور..."
                  autoComplete="current-password"
                  className={`w-full py-3.5 px-4 pr-11 pl-11 rounded-2xl border text-sm sm:text-base font-mono tracking-wider focus:outline-none transition shadow-sm ${
                    isLight
                      ? 'bg-white border-[#E8E2D8] text-[#1F1B16] focus:border-[#8A6414] focus:ring-2 focus:ring-[#8A6414]/20'
                      : 'bg-[#141414] border-[#2E2E2E] text-[#F5EBE6] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20'
                  }`}
                  dir="ltr"
                />

                <div className="absolute right-3.5 pointer-events-none text-[#D4AF37]">
                  <KeyRound className="w-5 h-5" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute left-3.5 text-stone-400 hover:text-[#D4AF37] transition cursor-pointer p-1"
                  title={showSecret ? 'إخفاء الرمز' : 'إظهار الرمز'}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!secret.trim()}
              className="cursor-pointer w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#C59B28] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-sm shadow-lg shadow-[#D4AF37]/25 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول للنظام</span>
            </button>

            {/* Full Virtual Alphanumeric Keyboard for Touchscreen & High Security */}
            <div className="pt-2">
              <div className="text-center mb-2 flex items-center justify-between px-1">
                <span
                  className={`text-[11px] font-bold flex items-center gap-1.5 ${
                    isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>لوحة المفاتيح الكاملة (أرقام وحروف):</span>
                </span>
                <span className="text-[10px] text-stone-400 font-medium">
                  {isCaps ? 'أحرف كبيرة (CAPS)' : 'أحرف صغيرة (caps)'}
                </span>
              </div>

              <div className="space-y-1.5 w-full select-none" dir="ltr">
                {/* Row 1: Numbers (1 2 3 4 5 6 7 8 9 0) */}
                <div className="flex gap-1 sm:gap-1.5 justify-center w-full">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadPress(digit)}
                      className={`cursor-pointer flex-1 max-w-[48px] h-9 sm:h-10 rounded-xl font-mono text-xs sm:text-sm font-black border transition active:scale-95 shadow-xs flex items-center justify-center ${
                        isLight
                          ? 'bg-white hover:bg-[#FAF6EE] text-[#1F1B16] border-[#E8E2D8] hover:border-[#D4AF37]'
                          : 'bg-[#181818] hover:bg-[#222222] text-[#F5EBE6] border-[#2A2A2A] hover:border-[#5A451A]'
                      }`}
                    >
                      {digit}
                    </button>
                  ))}
                </div>

                {/* Row 2: Q W E R T Y U I O P */}
                <div className="flex gap-1 sm:gap-1.5 justify-center w-full">
                  {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map((char) => {
                    const displayChar = isCaps ? char.toUpperCase() : char.toLowerCase();
                    return (
                      <button
                        key={char}
                        type="button"
                        onClick={() => handleKeypadPress(displayChar)}
                        className={`cursor-pointer flex-1 max-w-[48px] h-9 sm:h-10 rounded-xl font-mono text-xs sm:text-sm font-bold border transition active:scale-95 shadow-xs flex items-center justify-center ${
                          isLight
                            ? 'bg-white hover:bg-[#FAF6EE] text-[#1F1B16] border-[#E8E2D8] hover:border-[#D4AF37]'
                            : 'bg-[#181818] hover:bg-[#222222] text-[#F5EBE6] border-[#2A2A2A] hover:border-[#5A451A]'
                        }`}
                      >
                        {displayChar}
                      </button>
                    );
                  })}
                </div>

                {/* Row 3: A S D F G H J K L */}
                <div className="flex gap-1 sm:gap-1.5 justify-center w-full px-2 sm:px-3">
                  {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map((char) => {
                    const displayChar = isCaps ? char.toUpperCase() : char.toLowerCase();
                    return (
                      <button
                        key={char}
                        type="button"
                        onClick={() => handleKeypadPress(displayChar)}
                        className={`cursor-pointer flex-1 max-w-[48px] h-9 sm:h-10 rounded-xl font-mono text-xs sm:text-sm font-bold border transition active:scale-95 shadow-xs flex items-center justify-center ${
                          isLight
                            ? 'bg-white hover:bg-[#FAF6EE] text-[#1F1B16] border-[#E8E2D8] hover:border-[#D4AF37]'
                            : 'bg-[#181818] hover:bg-[#222222] text-[#F5EBE6] border-[#2A2A2A] hover:border-[#5A451A]'
                        }`}
                      >
                        {displayChar}
                      </button>
                    );
                  })}
                </div>

                {/* Row 4: Caps Lock + Z X C V B N M + Backspace */}
                <div className="flex gap-1 sm:gap-1.5 justify-center w-full">
                  {/* Caps Lock Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsCaps(!isCaps)}
                    className={`cursor-pointer px-2 sm:px-3 h-9 sm:h-10 rounded-xl text-[10px] sm:text-xs font-black border transition active:scale-95 flex items-center justify-center gap-1 shrink-0 ${
                      isCaps
                        ? isLight
                          ? 'bg-[#8A6414] text-white border-[#8A6414] shadow-sm'
                          : 'bg-[#D4AF37] text-stone-950 border-[#D4AF37] shadow-sm shadow-[#D4AF37]/30'
                        : isLight
                        ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
                        : 'bg-[#1E1E1E] hover:bg-[#282828] text-[#C4BCB2] border-[#2F2F2F]'
                    }`}
                    title={isCaps ? 'إيقاف الأحرف الكبيرة' : 'تفعيل الأحرف الكبيرة'}
                  >
                    <span>⇪</span>
                    <span>CAPS</span>
                  </button>

                  {/* Z X C V B N M */}
                  {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map((char) => {
                    const displayChar = isCaps ? char.toUpperCase() : char.toLowerCase();
                    return (
                      <button
                        key={char}
                        type="button"
                        onClick={() => handleKeypadPress(displayChar)}
                        className={`cursor-pointer flex-1 max-w-[48px] h-9 sm:h-10 rounded-xl font-mono text-xs sm:text-sm font-bold border transition active:scale-95 shadow-xs flex items-center justify-center ${
                          isLight
                            ? 'bg-white hover:bg-[#FAF6EE] text-[#1F1B16] border-[#E8E2D8] hover:border-[#D4AF37]'
                            : 'bg-[#181818] hover:bg-[#222222] text-[#F5EBE6] border-[#2A2A2A] hover:border-[#5A451A]'
                        }`}
                      >
                        {displayChar}
                      </button>
                    );
                  })}

                  {/* Backspace */}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('backspace')}
                    className={`cursor-pointer px-2.5 sm:px-3.5 h-9 sm:h-10 rounded-xl text-[10px] sm:text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-1 shrink-0 ${
                      isLight
                        ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
                        : 'bg-[#1E1E1E] hover:bg-[#282828] text-[#C4BCB2] border-[#2F2F2F]'
                    }`}
                    title="تراجع"
                  >
                    <Delete className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[10px]">تراجع</span>
                  </button>
                </div>

                {/* Row 5: Common symbols + Spacebar + Clear */}
                <div className="flex gap-1 sm:gap-1.5 justify-center w-full pt-0.5">
                  {/* Symbols */}
                  {['@', '!', '.', '_', '-'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => handleKeypadPress(sym)}
                      className={`cursor-pointer px-2 sm:px-2.5 h-8 sm:h-9 rounded-xl font-mono text-xs sm:text-sm font-black border transition active:scale-95 shadow-xs flex items-center justify-center ${
                        isLight
                          ? 'bg-[#FAF6EE] hover:bg-white text-[#8A6414] border-[#E5D7BE]'
                          : 'bg-[#1F1910] hover:bg-[#292015] text-[#D4AF37] border-[#4A3A18]'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}

                  {/* Spacebar */}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress(' ')}
                    className={`cursor-pointer flex-1 max-w-[150px] sm:max-w-[180px] h-8 sm:h-9 rounded-xl text-[11px] font-bold border transition active:scale-95 flex items-center justify-center ${
                      isLight
                        ? 'bg-white hover:bg-[#FAF6EE] text-[#1F1B16] border-[#E8E2D8]'
                        : 'bg-[#181818] hover:bg-[#222222] text-[#F5EBE6] border-[#2A2A2A]'
                    }`}
                  >
                    <span>مسافة (Space)</span>
                  </button>

                  {/* Clear button */}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('clear')}
                    className={`cursor-pointer px-2.5 sm:px-3 h-8 sm:h-9 rounded-xl text-[10px] sm:text-xs font-bold border transition active:scale-95 flex items-center justify-center gap-1 shrink-0 ${
                      isLight
                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                        : 'bg-red-950/40 hover:bg-red-950/70 text-red-300 border-red-900/50'
                    }`}
                    title="مسح الكل"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>مسح</span>
                  </button>
                </div>
              </div>
            </div>

          </form>
        )}
      </main>

      {/* Footer Navigation */}
      <footer
        className={`relative w-full max-w-3xl flex items-center justify-center gap-3 pt-3 border-t z-10 text-xs ${
          isLight ? 'border-[#E8E2D8] text-[#6E6359]' : 'border-[#222222]/80 text-[#8C827A]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8C827A]">
            تسجيل الموظفين الجدد محصور بصلاحية المدير العام فقط من داخل لوحة التحكم.
          </span>
        </div>
      </footer>

      {/* Two-Factor Authentication Modal for Manager Fast PIN */}
      {pendingManager2FA && (
        <TwoFactorModal
          isOpen={!!pendingManager2FA}
          managerName={pendingManager2FA.user.name}
          phone={pendingManager2FA.user.phone}
          theme={theme}
          onSuccess={handle2FASuccess}
          onCancel={() => {
            setPendingManager2FA(null);
            setSecret('');
          }}
        />
      )}

      {/* Manager Direct Authorization & Activation Modal */}
      {managerApprovalTarget && (
        <ManagerApprovalModal
          isOpen={!!managerApprovalTarget}
          targetUser={managerApprovalTarget}
          theme={theme}
          onSuccess={() => {
            setManagerApprovalTarget(null);
            setPendingAccountUser(null);
          }}
          onCancel={() => setManagerApprovalTarget(null)}
        />
      )}
    </div>
  );
};
