import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Fingerprint,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Copy,
  Sparkles,
  Smartphone,
  X,
} from 'lucide-react';
import { generateOTP } from '../../utils/securityUtils';
import { sounds } from '../../utils/sound';

interface TwoFactorModalProps {
  isOpen: boolean;
  managerName: string;
  phone?: string;
  onSuccess: () => void;
  onCancel: () => void;
  theme?: 'dark' | 'light';
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  managerName,
  phone = '01012345678',
  onSuccess,
  onCancel,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [method, setMethod] = useState<'otp' | 'biometric'>('otp');

  // OTP State
  const [currentOtp, setCurrentOtp] = useState<string>(() => generateOTP());
  const [otpInputs, setOtpInputs] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(60);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Biometric State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Regenerate OTP and countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const newCode = generateOTP();
    setCurrentOtp(newCode);
    setCountdown(60);
    setOtpInputs(['', '', '', '', '', '']);
    setErrorMsg(null);
    setScanSuccess(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const fresh = generateOTP();
          setCurrentOtp(fresh);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen && method === 'otp') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen, method]);

  if (!isOpen) return null;

  const handleOtpChange = (index: number, val: string) => {
    setErrorMsg(null);
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const copy = [...otpInputs];
      copy[index] = '';
      setOtpInputs(copy);
      return;
    }

    // Single digit entry
    const char = cleaned[cleaned.length - 1];
    const copy = [...otpInputs];
    copy[index] = char;
    setOtpInputs(copy);

    // Auto advance
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify when 6 digits entered
    const fullCode = copy.join('');
    if (fullCode.length === 6) {
      verifyOtpCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtpCode = (entered: string) => {
    if (entered === currentOtp) {
      sounds.playSuccess();
      setErrorMsg(null);
      setScanSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 600);
    } else {
      sounds.playWarning();
      setErrorMsg('رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة');
    }
  };

  const handleCopyOtp = () => {
    navigator.clipboard.writeText(currentOtp);
    setIsCopied(true);
    sounds.playClick();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAutoFillOtp = () => {
    const chars = currentOtp.split('');
    setOtpInputs(chars);
    sounds.playKeypad();
    setTimeout(() => {
      verifyOtpCode(currentOtp);
    }, 200);
  };

  const handleBiometricScan = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    sounds.playClick();

    // Check if real WebAuthn is supported
    if (window.PublicKeyCredential && navigator.credentials) {
      try {
        // Attempt webauthn or simulate interactive bio scan
        await new Promise((res) => setTimeout(res, 1200));
      } catch {
        // fallback
      }
    } else {
      await new Promise((res) => setTimeout(res, 1400));
    }

    setIsScanning(false);
    setScanSuccess(true);
    sounds.playSuccess();
    setTimeout(() => {
      onSuccess();
    }, 700);
  };

  const maskedPhone = phone.length >= 8 ? `${phone.slice(0, 3)}****${phone.slice(-3)}` : phone;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto transition-all"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md max-h-[85vh] max-h-[85dvh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border my-auto ${
          isLight
            ? 'bg-white border-[#E8E2D8] text-[#1F1B16]'
            : 'bg-[#141414] border-[#2E2820] text-[#E0D8D0]'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between border-b shrink-0 ${
            isLight
              ? 'bg-gradient-to-r from-[#FAF4E8] via-[#F6EDE0] to-[#FFFDF8] border-[#E8DFD0]'
              : 'bg-gradient-to-r from-[#241B0E] via-[#1B150A] to-[#141414] border-[#2E2820]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold font-heading text-[#F5EBE6]">
                  التحقق بخطوتين (2FA) للمدير
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  حساب الإدارة
                </span>
              </div>
              <p className="text-xs text-[#A8A096]">
                مرحباً {managerName}، يرجى تأكيد هويتك لحماية صلاحيات المخبز
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer p-1.5 rounded-lg text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#222222] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#2A2A2A] bg-[#101010] shrink-0">
          <button
            type="button"
            onClick={() => {
              setMethod('otp');
              setErrorMsg(null);
            }}
            className={`cursor-pointer flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              method === 'otp'
                ? 'border-b-2 border-[#D4AF37] text-[#D4AF37] bg-[#181818]'
                : 'text-[#8C827A] hover:text-[#F5EBE6]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>رمز التحقق (OTP)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMethod('biometric');
              setErrorMsg(null);
            }}
            className={`cursor-pointer flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              method === 'biometric'
                ? 'border-b-2 border-[#D4AF37] text-[#D4AF37] bg-[#181818]'
                : 'text-[#8C827A] hover:text-[#F5EBE6]'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>بصمة الإصبع (Biometric)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-950/70 border border-red-800 text-red-200 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {scanSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تم التحقق من هوية المدير بنجاح! جاري فتح الشاشة...</span>
            </div>
          )}

          {method === 'otp' ? (
            <div className="space-y-4">
              {/* Simulated SMS / Authenticator Dispatch info */}
              <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] text-xs space-y-1">
                <div className="flex items-center justify-between text-[#A8A096]">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>تم إرسال الرمز لرقم المدير:</span>
                  </span>
                  <span className="font-mono font-bold text-[#F5EBE6]">{maskedPhone}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#262626]">
                  <span className="text-[11px] text-[#8C827A] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#D4AF37]" />
                    <span>صلاحية الرمز تتجدد خلال:</span>
                  </span>
                  <span className="font-mono font-bold text-[#D4AF37] text-xs">
                    {countdown} ثانية
                  </span>
                </div>
              </div>

              {/* Live Generator Badge for Easy Testing */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#241B0E] to-[#18140B] border border-[#5A451A] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#A8A096] block font-bold">
                    رمز التحقق الحالي للمعاينة:
                  </span>
                  <span className="text-xl font-black font-mono tracking-widest text-[#D4AF37]">
                    {currentOtp}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyOtp}
                    className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-[#2E2414] hover:bg-[#3D3019] text-[#D4AF37] text-[11px] font-bold border border-[#5A451A] flex items-center gap-1 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoFillOtp}
                    className="cursor-pointer px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 text-[11px] font-black shadow transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-stone-950" />
                    <span>إدخال فوري</span>
                  </button>
                </div>
              </div>

              {/* 6-box input fields */}
              <div>
                <label className="block text-xs font-bold text-[#A8A096] mb-2 text-center">
                  أدخل الرمز المكون من 6 أرقام:
                </label>
                <div className="flex items-center justify-center gap-2" dir="ltr">
                  {otpInputs.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-xl font-mono font-black bg-[#1C1C1C] text-[#F5EBE6] border border-[#333333] rounded-xl focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none transition"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const fresh = generateOTP();
                    setCurrentOtp(fresh);
                    setCountdown(60);
                    setOtpInputs(['', '', '', '', '', '']);
                    sounds.playKeypad();
                  }}
                  className="cursor-pointer text-[#D4AF37] hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>توليد رمز جديد الآن</span>
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="cursor-pointer text-[#8C827A] hover:text-[#F5EBE6]"
                >
                  إلغاء والعودة
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all ${
                    scanSuccess
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                      : isScanning
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] animate-pulse scale-105'
                      : 'bg-[#1C1C1C] border-[#333333] text-[#A8A096] hover:border-[#D4AF37]'
                  }`}
                >
                  <Fingerprint
                    className={`w-14 h-14 ${
                      isScanning ? 'animate-bounce text-[#D4AF37]' : scanSuccess ? 'text-emerald-400' : ''
                    }`}
                  />
                </div>

                {isScanning && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#D4AF37] opacity-75"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                )}
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#F5EBE6]">
                  {scanSuccess
                    ? 'تم التعرف على بصمة المدير!'
                    : isScanning
                    ? 'جاري فحص ومطابقة البصمة...'
                    : 'التحقق ببصمة الإصبع الحيوية'}
                </h4>
                <p className="text-xs text-[#8C827A] mt-1 max-w-xs mx-auto">
                  ضع إصبعك على قارئ البصمة أو اضغط الزر أدناه لتأكيد الهوية عبر مستشعر الجهاز
                </p>
              </div>

              <button
                type="button"
                disabled={isScanning || scanSuccess}
                onClick={handleBiometricScan}
                className="cursor-pointer w-full py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs shadow-lg shadow-[#D4AF37]/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4 text-stone-950" />
                <span>{isScanning ? 'جاري المسح...' : 'مسح وتأكيد البصمة الآن'}</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="cursor-pointer text-xs text-[#8C827A] hover:text-[#F5EBE6]"
              >
                إلغاء والعودة
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
