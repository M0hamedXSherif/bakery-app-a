import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Crown,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  KeyRound,
  Check,
  Sparkles,
} from 'lucide-react';
import { validatePassword } from '../../utils/securityUtils';
import { sounds } from '../../utils/sound';
import { User } from '../../types';
import { useBakery } from '../../context/BakeryContext';

interface PasswordExpiryModalProps {
  isOpen: boolean;
  username: string;
  targetUser?: User | null;
  previousPasswords?: string[];
  currentPinOrPass?: string;
  onSuccess: (newPassword: string, updatedUser?: User) => void;
  onCancel?: () => void;
}

export const PasswordExpiryModal: React.FC<PasswordExpiryModalProps> = ({
  isOpen,
  username,
  targetUser,
  previousPasswords = [],
  currentPinOrPass = '',
  onSuccess,
  onCancel,
}) => {
  const {
    users,
    verifyManagerCredentials,
    changeUserPassword,
    recordFailedLogin,
    terminalFailedAttempts,
  } = useBakery();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manager Override toggle & state
  const [isManagerOverride, setIsManagerOverride] = useState(false);
  const [managerSecret, setManagerSecret] = useState('');
  const [showManagerSecret, setShowManagerSecret] = useState(false);

  if (!isOpen) return null;

  const resolvedUser = targetUser || users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  const ownerUser = users.find((u) => u.role === 'owner');
  const validation = validatePassword(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (terminalFailedAttempts >= 3 && !isManagerOverride) {
      sounds.playWarning();
      setErrorMsg('⚠️ تم قفل المحطة لتجاوز 3 محاولات خاطئة! يجب استخدام خيار تفعيل المدير العام أدناه لإلغاء القفل.');
      return;
    }

    // If Manager Override is active
    if (isManagerOverride) {
      if (!managerSecret.trim()) {
        sounds.playWarning();
        setErrorMsg('يرجى إدخال رمز الـ PIN أو كلمة المرور الخاصة بصاحب المخبز (المدير)');
        return;
      }

      const verifyRes = verifyManagerCredentials(managerSecret.trim());
      if (!verifyRes.success) {
        sounds.playWarning();
        setErrorMsg(verifyRes.message || 'بيانات اعتماد المدير غير صحيحة!');
        return;
      }

      // Check new password validation
      if (!validation.isValid) {
        sounds.playWarning();
        setErrorMsg('يرجى استيفاء جميع شروط أمان كلمة المرور الجديدة');
        return;
      }

      if (newPassword !== confirmPassword) {
        sounds.playWarning();
        setErrorMsg('تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة');
        return;
      }

      if (resolvedUser) {
        const changeRes = changeUserPassword(resolvedUser.id, newPassword, true);
        if (changeRes.success) {
          sounds.playSuccess();
          setSuccessMsg('✅ تم تفعيل الحساب وتعيين كلمة المرور بنجاح بصلاحية المدير العام! جاري الدخول...');
          setTimeout(() => {
            onSuccess(newPassword, changeRes.updatedUser);
          }, 800);
          return;
        } else {
          sounds.playWarning();
          setErrorMsg(changeRes.message);
          return;
        }
      }
    }

    // Normal User Password Update:
    // Verify old password or PIN against provided values or user object
    const trimmedOld = oldPassword.trim();
    const isOldMatch =
      !currentPinOrPass && !resolvedUser
        ? true
        : trimmedOld === currentPinOrPass ||
          (resolvedUser?.password && trimmedOld === resolvedUser.password) ||
          (resolvedUser?.pin && trimmedOld === resolvedUser.pin);

    if (!isOldMatch) {
      sounds.playWarning();
      recordFailedLogin(resolvedUser?.username || username, 'محاولة خاطئة لكلمة المرور القديمة');
      setErrorMsg('كلمة المرور القديمة أو رمز الـ PIN غير صحيح! يمكنك استخدام خيار تفعيل المدير أدناه إذا نسيتها.');
      return;
    }

    // Check policy
    if (!validation.isValid) {
      sounds.playWarning();
      setErrorMsg('يرجى استيفاء جميع شروط أمان كلمة المرور الموضحة أدناه');
      return;
    }

    // Check repeat
    if (newPassword === oldPassword || (currentPinOrPass && newPassword === currentPinOrPass)) {
      sounds.playWarning();
      setErrorMsg('لا يُسمح باستخدام كلمة المرور الحالية نفسها، يرجى إدخال كلمة جديدة');
      return;
    }

    const history = resolvedUser?.previousPasswords || previousPasswords;
    if (history.includes(newPassword)) {
      sounds.playWarning();
      setErrorMsg('لا يُسمح بإعادة استخدام كلمات المرور السابقة');
      return;
    }

    // Check match
    if (newPassword !== confirmPassword) {
      sounds.playWarning();
      setErrorMsg('تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة');
      return;
    }

    if (resolvedUser) {
      const changeRes = changeUserPassword(resolvedUser.id, newPassword, true);
      if (changeRes.success) {
        sounds.playSuccess();
        setSuccessMsg('✅ تم تحديث كلمة المرور وتفعيل الحساب بنجاح! جاري تسجيل الدخول...');
        setTimeout(() => {
          onSuccess(newPassword, changeRes.updatedUser);
        }, 800);
      } else {
        sounds.playWarning();
        setErrorMsg(changeRes.message);
      }
    } else {
      sounds.playSuccess();
      onSuccess(newPassword);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto transition-all">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md max-h-[85vh] max-h-[85dvh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#D4AF37]/30 bg-[#141414] text-[#E0D8D0] my-auto"
      >
        {/* Header - Fixed at Top */}
        <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-[#2E2820] bg-gradient-to-r from-[#2A1D0E] via-[#1E170C] to-[#141414] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37]">
              <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-heading text-[#F5EBE6]">
                تحديث كلمة المرور وتفعيل الحساب
              </h3>
              <p className="text-[11px] text-[#A8A096]">
                حساب المستخدم: <span className="text-[#D4AF37] font-mono">@{username}</span>
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer p-1.5 rounded-lg text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#252525] transition"
            >
              ✕
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Body */}
          <div className="p-4 sm:p-5 space-y-3 sm:space-y-3.5 overflow-y-auto flex-1 custom-scrollbar text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-950/70 border border-red-800 text-red-200 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Manager Override Notice / Option */}
          <div className="p-3 rounded-2xl bg-[#1C1812] border border-[#3A2E1A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-bold text-[#F5EBE6]">
                  هل أنت صاحب المخبز (المدير)؟
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManagerOverride(!isManagerOverride);
                  setErrorMsg(null);
                }}
                className={`cursor-pointer px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                  isManagerOverride
                    ? 'bg-[#D4AF37] text-stone-950'
                    : 'bg-[#2A2318] text-[#D4AF37] hover:bg-[#382F20]'
                }`}
              >
                {isManagerOverride ? 'إلغاء وضع المدير ✕' : 'تفعيل ببيانات المدير 👑'}
              </button>
            </div>

            {isManagerOverride && (
              <div className="mt-3 pt-3 border-t border-[#332717] space-y-2">
                <p className="text-[11px] text-[#A8A096]">
                  كصاحب مخبز، أدخل رمز PIN أو كلمة المرور الخاصة بك لتخطي كلمة المرور القديمة وتفعيل حساب الموظف فوراً:
                </p>
                <div className="relative">
                  <input
                    type={showManagerSecret ? 'text' : 'password'}
                    value={managerSecret}
                    onChange={(e) => setManagerSecret(e.target.value)}
                    placeholder={`أدخل PIN أو كلمة مرور ${ownerUser?.name || 'المدير العام'}...`}
                    className="w-full pl-10 pr-3 py-2 text-xs bg-[#121212] text-[#F5EBE6] rounded-xl border border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowManagerSecret(!showManagerSecret)}
                    className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#F5EBE6]"
                  >
                    {showManagerSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Old Password (only shown if not in manager override mode) */}
          {!isManagerOverride && (
            <div>
              <label className="text-xs font-bold block mb-1 text-[#E0D8D0]">
                كلمة المرور القديمة أو رمز الـ PIN:
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  required={!isManagerOverride}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور القديمة أو رمز PIN (مثال: Ahmed@2026! أو 111111)..."
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#1E1E1E] text-[#F5EBE6] rounded-xl border border-[#333333] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#F5EBE6]"
                  title={showOld ? 'إخفاء' : 'إظهار'}
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="text-xs font-bold block mb-1 text-[#E0D8D0]">
              كلمة المرور الجديدة القوية:
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8 خانات على الأقل، حروف كبيرة وصغيرة وأرقام ورموز..."
                className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#1E1E1E] text-[#F5EBE6] rounded-xl border border-[#333333] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#F5EBE6]"
                title={showNew ? 'إخفاء' : 'إظهار'}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Live Criteria Checklist */}
          <div className="p-3 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] text-xs space-y-1.5">
            <span className="font-bold text-[11px] text-[#A8A096] block mb-1">
              شروط الأمان الإلزامية لكلمة المرور:
            </span>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <span className={`flex items-center gap-1.5 ${validation.hasMinLength ? 'text-emerald-400 font-bold' : 'text-[#8C827A]'}`}>
                {validation.hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : '○'}
                <span>8 خانات على الأقل</span>
              </span>
              <span className={`flex items-center gap-1.5 ${validation.hasUppercase ? 'text-emerald-400 font-bold' : 'text-[#8C827A]'}`}>
                {validation.hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : '○'}
                <span>حرف كبير (A-Z)</span>
              </span>
              <span className={`flex items-center gap-1.5 ${validation.hasLowercase ? 'text-emerald-400 font-bold' : 'text-[#8C827A]'}`}>
                {validation.hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : '○'}
                <span>حرف صغير (a-z)</span>
              </span>
              <span className={`flex items-center gap-1.5 ${validation.hasNumber ? 'text-emerald-400 font-bold' : 'text-[#8C827A]'}`}>
                {validation.hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : '○'}
                <span>رقم واحد (0-9)</span>
              </span>
              <span className={`flex items-center gap-1.5 col-span-2 ${validation.hasSpecialChar ? 'text-emerald-400 font-bold' : 'text-[#8C827A]'}`}>
                {validation.hasSpecialChar ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : '○'}
                <span>رمز خاص (!@#$%^&*...)</span>
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-bold block mb-1 text-[#E0D8D0]">
              تأكيد كلمة المرور الجديدة:
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور الجديدة للتطابق..."
                className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#1E1E1E] text-[#F5EBE6] rounded-xl border border-[#333333] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#F5EBE6]"
                title={showConfirm ? 'إخفاء' : 'إظهار'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          </div>

          {/* Action Footer - Always Pinned & Accessible */}
          <div className="p-3 sm:p-4 border-t border-[#2E2820] bg-[#101010] shrink-0 flex items-center justify-end gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="cursor-pointer px-4 py-2.5 rounded-xl text-xs text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#1E1E1E] transition"
              >
                إلغاء
              </button>
            )}
            <button
              type="submit"
              className="cursor-pointer flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs shadow-md shadow-[#D4AF37]/20 transition flex items-center justify-center gap-2 active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>حفظ كلمة المرور وتفعيل الحساب</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
