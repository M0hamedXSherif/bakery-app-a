import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  UserCheck,
  UserPlus,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Phone,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldAlert,
  Fingerprint,
  Crown,
  AlertTriangle,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { validatePassword, isPasswordExpired } from '../../utils/securityUtils';
import { TwoFactorModal } from './TwoFactorModal';
import { PasswordExpiryModal } from './PasswordExpiryModal';
import { ManagerApprovalModal } from './ManagerApprovalModal';
import { User } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const {
    login,
    loginUserDirectly,
    registerStaff,
    users,
    theme,
    securitySettings,
    changeUserPassword,
    terminalFailedAttempts,
  } = useBakery();
  const isLight = theme === 'light';
  const isTerminalLocked = terminalFailedAttempts >= (securitySettings.maxFailedAttempts || 3);

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFeedback(null);
      setPendingAccountUser(null);
      setManagerApprovalTarget(null);
    }
  }, [isOpen, initialMode]);

  // Login form states
  const [username, setUsername] = useState('');
  const [secretInput, setSecretInput] = useState(''); // PIN or Password
  const [showSecret, setShowSecret] = useState(false);
  const [remember, setRemember] = useState(true);

  // Register form states
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPin, setRegPin] = useState('');
  const [showRegPin, setShowRegPin] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPhone, setRegPhone] = useState('');

  // 2FA & Password Expiry & Manager Approval flow states
  const [pending2FAUser, setPending2FAUser] = useState<User | null>(null);
  const [pendingExpiredUser, setPendingExpiredUser] = useState<User | null>(null);
  const [pendingAccountUser, setPendingAccountUser] = useState<User | null>(null);
  const [managerApprovalTarget, setManagerApprovalTarget] = useState<User | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const regValidation = validatePassword(regPassword);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setPendingAccountUser(null);

    if (isTerminalLocked) {
      const owner = users.find((u) => u.role === 'owner') || users[0];
      setPendingAccountUser(owner);
      setFeedback({
        type: 'error',
        message: '⚠️ تم إيقاف وقفل المحطة بالكامل لتجاوز 3 محاولات خاطئة متتالية! لا يمكن تسجيل الدخول دون إدخال إذن واعتماد المدير العام.',
      });
      return;
    }

    const targetUser = users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() ||
        u.id === username.trim()
    );

    if (!targetUser) {
      const res = login(username.trim(), secretInput.trim(), remember);
      setFeedback({ type: 'error', message: res.message || 'بيانات الدخول غير صحيحة' });
      return;
    }

    if (targetUser.isAccountLocked) {
      setPendingAccountUser(targetUser);
      setFeedback({
        type: 'error',
        message: '⚠️ هذا الحساب مقفول بقرار أمني لتجاوز 3 محاولات دخول خاطئة متتالية! يمكنك فك القفل والتفعيل ببيانات المدير العام أدناه.',
      });
      return;
    }

    if (targetUser.status === 'pending') {
      setPendingAccountUser(targetUser);
      setFeedback({
        type: 'error',
        message: '⚠️ هذا الحساب ما زال معلقاً في انتظار موافقة المدير العام. إذا كان المدير متواجداً، يمكنه التفعيل والدخول فوراً بالزر أدناه.',
      });
      return;
    }

    // Check credentials match
    const isPinMatch = targetUser.pin === secretInput.trim();
    const isPassMatch = targetUser.password && targetUser.password === secretInput.trim();

    if (!isPinMatch && !isPassMatch) {
      const res = login(username.trim(), secretInput.trim(), remember);
      setFeedback({ type: 'error', message: res.message || 'بيانات الدخول غير صحيحة' });
      return;
    }

    // Credentials match! Now check if password expired (>30 days)
    if (isPasswordExpired(targetUser.passwordUpdatedAt, securitySettings.passwordExpiryDays)) {
      setPendingExpiredUser(targetUser);
      return;
    }

    // Check 2FA requirement for managers
    if (targetUser.role === 'owner' && securitySettings.require2FAForManagers) {
      setPending2FAUser(targetUser);
      return;
    }

    // Complete direct login
    const result = login(username.trim(), secretInput.trim(), remember);
    if (result.success) {
      onClose();
    } else {
      if (result.isPending && result.pendingUser) {
        setPendingAccountUser(result.pendingUser);
      }
      setFeedback({ type: 'error', message: result.message || 'فشل تسجيل الدخول' });
    }
  };

  const handle2FASuccess = () => {
    if (!pending2FAUser) return;
    const userToLogin = pending2FAUser;
    setPending2FAUser(null);
    loginUserDirectly(userToLogin, remember);
    onClose();
  };

  const handlePasswordExpiredSuccess = (newPass: string, updatedUser?: User) => {
    if (!pendingExpiredUser) return;
    const userToUpdate = updatedUser || pendingExpiredUser;
    setPendingExpiredUser(null);

    // If manager, check 2FA next
    if (userToUpdate.role === 'owner' && securitySettings.require2FAForManagers) {
      setPending2FAUser(userToUpdate);
    } else {
      loginUserDirectly(userToUpdate, remember);
      onClose();
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setPendingAccountUser(null);

    if (!/^\d{6}$/.test(regPin.trim())) {
      setFeedback({ type: 'error', message: 'رمز الـ PIN يجب أن يتكون من 6 أرقام بالضبط' });
      return;
    }

    if (regPassword && !regValidation.isValid) {
      setFeedback({ type: 'error', message: 'يرجى استيفاء شروط أمان كلمة المرور الموضحة' });
      return;
    }

    const result = registerStaff(regName.trim(), regUsername.trim(), regPin.trim(), regPhone.trim());
    if (result.success) {
      setFeedback({ type: 'success', message: result.message });
      if (result.newUser) {
        setPendingAccountUser(result.newUser);
      }
      setRegName('');
      setRegUsername('');
      setRegPin('');
      setRegPassword('');
      setRegPhone('');
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  return (
    <>
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
            className={`relative w-full max-w-md max-h-[85vh] max-h-[85dvh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border my-auto ${
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
                  className={`p-2 sm:p-2.5 rounded-2xl border ${
                    isLight
                      ? 'bg-[#FDF6E7] border-[#DEC798]'
                      : 'bg-[#2A2012] border-[#4A3B1B]'
                  }`}
                >
                  <Lock
                    className={`w-5 h-5 ${
                      isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                    }`}
                  />
                </div>
                <div>
                  <h3
                    className={`text-base sm:text-lg font-bold font-heading ${
                      isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                    }`}
                  >
                    {mode === 'login' ? 'تسجيل الدخول للنظام' : 'طلب تسجيل موظف جديد'}
                  </h3>
                  <p
                    className={`text-xs ${
                      isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
                    }`}
                  >
                    {mode === 'login'
                      ? 'أدخل بيانات الحساب مع رمز PIN أو كلمة المرور'
                      : 'يتطلب موافقة صاحب المخبز قبل تفعيل الحساب'}
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

            {/* Mode Banner */}
            <div
              className={`p-3 border-b flex items-center justify-between text-xs font-bold shrink-0 ${
                isLight ? 'border-[#E8E2D8] bg-[#F7F4EE] text-[#8A6414]' : 'border-[#2A2A2A] bg-[#101010] text-[#D4AF37]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>تسجيل الدخول للنظام (كلمة المرور أو PIN)</span>
              </div>
              <span className="text-[10px] text-[#8C827A] font-normal hidden sm:inline">
                (إضافة وتعيين الموظفين الجدد محصورة بالمدير فقط)
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar text-xs">
              {feedback && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2 ${
                    feedback.type === 'success'
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-[#11291B] text-emerald-300 border border-[#165B37]'
                      : isLight
                      ? 'bg-red-50 text-red-800 border border-red-300'
                      : 'bg-red-950/60 text-red-300 border border-red-800'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isLight ? 'text-emerald-600' : 'text-emerald-400'
                      }`}
                    />
                  ) : (
                    <AlertCircle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isLight ? 'text-red-600' : 'text-red-400'
                      }`}
                    />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Terminal Failed Attempts Counter Warning */}
              {!isTerminalLocked && terminalFailedAttempts > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-300 text-[11px] font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    تنبيه أمني: يوجد {terminalFailedAttempts} من 3 محاولات خاطئة مسجلة! (قفل تام بعد المحاولة الثالثة)
                  </span>
                </div>
              )}

              {/* Manager Direct Authorization Action Card */}
              {pendingAccountUser && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-2.5 transition-all ${
                    isLight
                      ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-300 text-amber-950'
                      : 'bg-gradient-to-br from-[#1F180F] to-[#171209] border-[#5A451A] text-[#F5EBE6]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-[#D4AF37]">
                    <Crown className="w-4 h-4" />
                    <span>صلاحية صاحب المخبز (المدير العام) 👑</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    إذا كان صاحب المخبز متواجداً الآن، يمكنه إدخال بيانات اعتماده لفك التعليق وتفعيل حساب ({pendingAccountUser.name}) والدخول للنظام فوراً دون تركه معلقاً.
                  </p>
                  <button
                    type="button"
                    onClick={() => setManagerApprovalTarget(pendingAccountUser)}
                    className="cursor-pointer w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs shadow-md shadow-[#D4AF37]/20 flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <Crown className="w-4 h-4" />
                    <span>تفعيل الحساب فوراً ببيانات المدير 👑</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label
                      className={`text-xs font-bold block mb-1 ${
                        isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                      }`}
                    >
                      اسم المستخدم:
                    </label>
                    <div className="relative">
                      <UserIcon
                        className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                          isLight ? 'text-stone-400' : 'text-[#8C827A]'
                        }`}
                      />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="اكتب اسمك"
                        className={`w-full pl-3 pr-9 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                          isLight
                            ? 'bg-[#FAF8F5] border-[#E2DAD0] text-[#1F1B16] placeholder-stone-400'
                            : 'bg-[#1E1E1E] border-[#333333] text-[#F5EBE6] placeholder-[#6C635B]'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        className={`text-xs font-bold ${
                          isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                        }`}
                      >
                        رمز PIN أو كلمة المرور:
                      </label>
                      <span className="text-[10px] text-[#A8A096]">
                        (مشفّرة بنجوم ••••)
                      </span>
                    </div>
                    <div className="relative">
                      <KeyRound
                        className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 ${
                          isLight ? 'text-stone-400' : 'text-[#8C827A]'
                        }`}
                      />
                      <input
                        type={showSecret ? 'text' : 'password'}
                        required
                        value={secretInput}
                        onChange={(e) => setSecretInput(e.target.value)}
                        placeholder="كلمة المرور"
                        className={`w-full pl-10 pr-9 py-2 text-xs rounded-xl border font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                          isLight
                            ? 'bg-[#FAF8F5] border-[#E2DAD0] text-[#1F1B16] placeholder-stone-400'
                            : 'bg-[#1E1E1E] border-[#333333] text-[#F5EBE6] placeholder-[#6C635B]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className={`cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 p-1 transition ${
                          isLight ? 'text-stone-400 hover:text-stone-700' : 'text-[#8C827A] hover:text-[#F5EBE6]'
                        }`}
                        title={showSecret ? 'إخفاء الرمز' : 'إظهار الرمز'}
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Security Policy Badge */}
                  <div
                    className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                      isLight
                        ? 'bg-[#FAF6EE] text-[#8A6414] border-[#E5D7BE]'
                        : 'bg-[#1A160E] text-[#D4AF37] border-[#3D2E14]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                    <span>حماية أمنية: إقفال الحساب تلقائياً عند 3 محاولات فاشلة | جلسة واحدة نشطة</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label
                      className={`flex items-center gap-2 cursor-pointer ${
                        isLight ? 'text-stone-600' : 'text-[#A8A096]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="rounded text-[#D4AF37] focus:ring-[#D4AF37] bg-transparent border-stone-400"
                      />
                      <span>تذكر هذا الجهاز</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="cursor-pointer w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-sm shadow-md shadow-[#D4AF37]/20 transition"
                  >
                    دخول للنظام
                  </button>
                </form>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Two-Factor Authentication Modal for Managers */}
      {pending2FAUser && (
        <TwoFactorModal
          isOpen={!!pending2FAUser}
          managerName={pending2FAUser.name}
          phone={pending2FAUser.phone}
          theme={theme}
          onSuccess={handle2FASuccess}
          onCancel={() => setPending2FAUser(null)}
        />
      )}

      {/* Password Expiration Enforcement Modal */}
      {pendingExpiredUser && (
        <PasswordExpiryModal
          isOpen={!!pendingExpiredUser}
          username={pendingExpiredUser.username}
          targetUser={pendingExpiredUser}
          previousPasswords={pendingExpiredUser.previousPasswords}
          currentPinOrPass={secretInput}
          onSuccess={handlePasswordExpiredSuccess}
          onCancel={() => setPendingExpiredUser(null)}
        />
      )}

      {/* Manager Direct Approval & Instant Activation Modal */}
      {managerApprovalTarget && (
        <ManagerApprovalModal
          isOpen={!!managerApprovalTarget}
          targetUser={managerApprovalTarget}
          theme={theme}
          onSuccess={(user) => {
            setManagerApprovalTarget(null);
            setPendingAccountUser(null);
            onClose();
          }}
          onCancel={() => setManagerApprovalTarget(null)}
        />
      )}
    </>
  );
};
