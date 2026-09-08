import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Clock, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { sounds } from '../../utils/sound';

interface AutoLockWarningBannerProps {
  remainingSeconds: number;
  onStayActive: () => void;
  isOpenCartProtected?: boolean;
}

export const AutoLockWarningBanner: React.FC<AutoLockWarningBannerProps> = ({
  remainingSeconds,
  onStayActive,
  isOpenCartProtected = false,
}) => {
  // If cart is open, show safe protection badge instead of countdown locking
  if (isOpenCartProtected) {
    return null;
  }

  if (remainingSeconds > 30 || remainingSeconds <= 0) {
    return null;
  }

  const isUrgent = remainingSeconds <= 10;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg shadow-2xl"
      >
        <div
          className={`p-4 sm:p-5 rounded-3xl border backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isUrgent
              ? 'bg-gradient-to-r from-red-950/95 via-red-900/90 to-amber-950/95 border-red-500 text-red-100 ring-2 ring-red-500/50 animate-pulse'
              : 'bg-gradient-to-r from-[#241B0E]/95 via-[#1C150A]/95 to-[#141414]/95 border-[#D4AF37] text-[#F5EBE6] ring-2 ring-[#D4AF37]/30'
          }`}
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black font-mono text-xl shrink-0 border ${
                isUrgent
                  ? 'bg-red-600/30 border-red-400 text-red-300 animate-ping'
                  : 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]'
              }`}
            >
              {remainingSeconds}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {isUrgent ? '⚠️ تحذير عاجل: وشك القفل التلقائي!' : 'تنبيه أمان: خمول الشاشة'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 font-mono font-bold">
                  Auto-Lock
                </span>
              </div>
              <p className="text-xs text-[#A8A096] mt-0.5">
                سيتم قفل الشاشة تلقائياً خلال <strong className="font-mono text-amber-300">{remainingSeconds} ثانية</strong> بسبب عدم وجود نشاط.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onStayActive();
            }}
            className="cursor-pointer shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs shadow-lg shadow-[#D4AF37]/30 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-stone-950" />
            <span>أنا متواجد (متابعة العمل)</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
