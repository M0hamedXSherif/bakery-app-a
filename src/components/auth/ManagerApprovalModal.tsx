import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ShieldAlert,
  Crown,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  LogIn,
  AlertTriangle,
  X,
  Lock,
} from 'lucide-react';
import { User } from '../../types';
import { useBakery } from '../../context/BakeryContext';
import { sounds } from '../../utils/sound';

interface ManagerApprovalModalProps {
  isOpen: boolean;
  targetUser: User | null;
  onClose?: () => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  theme?: 'dark' | 'light';
}

export const ManagerApprovalModal: React.FC<ManagerApprovalModalProps> = ({
  isOpen,
  targetUser,
  onClose,
  onCancel,
  onSuccess,
  theme,
}) => {
  const { authorizeAndActivatePendingUser, unlockTerminalOverride, users, terminalFailedAttempts } = useBakery();

  const handleClose = onClose || onCancel || (() => {});

  const [managerSecret, setManagerSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !targetUser) return null;

  const ownerUser = users.find((u) => u.role === 'owner');

  const handleAuthorize = (loginMode: 'as_user' | 'as_manager') => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!managerSecret.trim()) {
      setErrorMsg('يرجى إدخال رمز الـ PIN أو كلمة المرور الخاصة بصاحب المخبز (المدير)');
      sounds.playWarning();
      return;
    }

    // If targetUser is locked or terminal is locked, also trigger terminal unlock override
    if (targetUser.isAccountLocked || terminalFailedAttempts >= 3) {
      const overrideRes = unlockTerminalOverride(managerSecret.trim());
      if (!overrideRes.success) {
        setErrorMsg(overrideRes.message);
        return;
      }
    }

    const res = authorizeAndActivatePendingUser(targetUser.id, managerSecret.trim(), loginMode);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 700);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto transition-all">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md max-h-[85vh] max-h-[85dvh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#D4AF37]/40 bg-[#141414] text-[#E0D8D0] my-auto"
      >
        {/* Header - Fixed */}
        <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-[#2E2820] bg-gradient-to-r from-[#2A1D0E] via-[#1E170C] to-[#141414] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-stone-950 flex items-center justify-center font-black shadow-md shadow-[#D4AF37]/20 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-heading text-[#F5EBE6]">
                تفعيل الحساب بصلاحية المدير العام
              </h3>
              <p className="text-[11px] text-[#D4AF37]">
                الموافقة والتجاوز الأمني الفوري 👑
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer p-1.5 rounded-xl text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#252525] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar text-xs">
          {/* Target User Info */}
          <div className="p-3 rounded-2xl bg-[#1C1812] border border-[#3A2E1A] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{targetUser.avatar || '🧑‍💼'}</span>
              <div>
                <div className="font-bold text-xs text-[#F5EBE6]">{targetUser.name}</div>
                <div className="font-mono text-[11px] text-[#D4AF37]">@{targetUser.username}</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
              حساب معلق / قيد المراجعة
            </span>
          </div>

          <p className="text-xs text-[#A8A096] leading-relaxed">
            إذا كنت أنت <strong>صاحب المخبز ({ownerUser?.name || 'المدير العام'})</strong> وتريد تفعيل هذا الحساب فوراً دون تركه معلقاً، أدخل رمز الـ PIN أو كلمة المرور الخاصة بحسابك للتأكيد:
          </p>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Manager Secret Input */}
          <div>
            <label className="text-xs font-bold block mb-1 text-[#E0D8D0]">
              رمز الـ PIN أو كلمة مرور المدير العام ({ownerUser?.name || 'إبراهيم النور'}):
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={managerSecret}
                onChange={(e) => {
                  setManagerSecret(e.target.value);
                  setErrorMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAuthorize('as_user');
                  }
                }}
                autoFocus
                placeholder="أدخل رمز PIN أو كلمة مرور المدير..."
                className="w-full pl-10 pr-3 py-2 text-xs bg-[#1E1E1E] text-[#F5EBE6] rounded-xl border border-[#333333] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#F5EBE6]"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Footer - Fixed & Visible */}
        <div className="p-3 sm:p-4 border-t border-[#2E2820] bg-[#101010] shrink-0 space-y-2">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={() => handleAuthorize('as_user')}
              className="cursor-pointer w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs shadow-md shadow-[#D4AF37]/20 flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <UserCheck className="w-4 h-4" />
              <span>تفعيل ودخول باسم ({targetUser.name})</span>
            </button>

            <button
              type="button"
              onClick={() => handleAuthorize('as_manager')}
              className="cursor-pointer w-full py-2.5 px-3 rounded-xl bg-[#241D12] hover:bg-[#332715] text-[#D4AF37] border border-[#5A451A] font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>تفعيل والدخول كمدير عام</span>
            </button>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-[#8C827A]">
              🔒 لن يتمكن أحد من تفعيل الحساب ما لم يكن يملك رمز أو كلمة مرور المدير العام.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
