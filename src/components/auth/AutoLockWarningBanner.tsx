import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { sounds } from '../../utils/sound';

interface AutoLockWarningBannerProps {
  isVisible: boolean;
  remainingSeconds: number;
  onStayActive: () => void;
  isOpenCartProtected?: boolean;
}

export const AutoLockWarningBanner: React.FC<AutoLockWarningBannerProps> = ({
  isVisible,
  remainingSeconds,
  onStayActive,
  isOpenCartProtected = false,
}) => {
  if (!isVisible && !isOpenCartProtected) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 pointer-events-auto"
        >
          <div className="p-4 rounded-3xl bg-gradient-to-r from-red-950/95 via-amber-950/95 to-stone-900/95 border-2 border-red-500 text-red-100 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-300 shrink-0">
                <Clock className="w-5 h-5 text-red-300 animate-pulse" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-red-200">
                    تنبيه خمول الشاشة (Auto-Lock)
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-900/80 text-red-100 border border-red-600">
                    متبقي {remainingSeconds} ثانية
                  </span>
                </div>
                <p className="text-xs text-red-200/90 mt-0.5">
                  سيتم قفل الشاشة تلقائياً للرجوع لشاشة الدخول لحماية النظام، انقر للمتابعة.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onStayActive();
                }}
                className="cursor-pointer w-full sm:w-auto px-4 py-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs shadow-lg shadow-[#D4AF37]/25 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>أنا متواجد (متابعة العمل)</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
