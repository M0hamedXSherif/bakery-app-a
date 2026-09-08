import React from 'react';
import { motion } from 'motion/react';
import {
  X,
  History,
  User,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { AuditLog } from '../../types';

interface AuditLogDetailsModalProps {
  log: AuditLog | null;
  onClose: () => void;
}

export const AuditLogDetailsModal: React.FC<AuditLogDetailsModalProps> = ({ log, onClose }) => {
  if (!log) return null;

  const dateFormatted = new Date(log.timestamp).toLocaleString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl bg-[#161616] border border-[#2E2E2E] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#262626] bg-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#F5EBE6]">
                تفاصيل العملية وسجل التغييرات
              </h3>
              <p className="text-[11px] text-[#8C827A] font-mono mt-0.5">
                معرف السجل: {log.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-2 rounded-xl text-[#8C827A] hover:text-white hover:bg-[#262626] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Action Overview Box */}
          <div className="p-4 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8C827A]">عنوان الإجراء:</span>
              <span className="font-black text-sm text-[#D4AF37]">{log.action}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
              <span className="text-[11px] font-bold text-[#8C827A] flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>المنفّذ:</span>
              </span>
              <span className="font-bold text-[#F5EBE6]">
                {log.userName} (
                <span className="text-[#D4AF37]">
                  {log.userRole === 'owner' ? 'المدير العام 👑' : 'كاشير / موظف'}
                </span>
                )
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
              <span className="text-[11px] font-bold text-[#8C827A] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>تاريخ ووقت التنفيذ:</span>
              </span>
              <span className="font-mono text-[#C4BCB2]">{dateFormatted}</span>
            </div>
          </div>

          {/* Full Recorded Details Statement */}
          <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#262626] space-y-1">
            <span className="text-[11px] font-bold text-[#8C827A] block">
              الوصف الكامل المسجل بالنظام:
            </span>
            <p className="text-xs text-[#E0D8D0] leading-relaxed font-semibold">
              {log.details}
            </p>
          </div>

          {/* Detailed Differences (Diff View) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-xs text-[#F5EBE6] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>بيان الحقول المُعدلة (قبل وبعد):</span>
              </h4>
              <span className="text-[10px] text-[#8C827A] font-bold">
                {log.diffs && log.diffs.length > 0
                  ? `${log.diffs.length} تغييرات محددة`
                  : 'تفاصيل مسجلة بالنص'}
              </span>
            </div>

            {log.diffs && log.diffs.length > 0 ? (
              <div className="space-y-2.5">
                {log.diffs.map((diff, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-[#1C1811] border border-[#423218] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#D4AF37]">
                        📌 {diff.fieldLabel || diff.field}
                      </span>
                      <span className="text-[10px] font-mono text-[#8C827A]">
                        {diff.field}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* Old Value */}
                      <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-900/50 flex flex-col">
                        <span className="text-[10px] font-bold text-red-400 mb-0.5">
                          القيمة السابقة (قبل التعديل):
                        </span>
                        <span className="text-xs font-semibold text-red-200 line-through decoration-red-400/70 font-mono">
                          {String(diff.oldValue ?? '—')}
                        </span>
                      </div>

                      {/* New Value */}
                      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 flex flex-col">
                        <span className="text-[10px] font-bold text-emerald-400 mb-0.5">
                          القيمة الجديدة (بعد التعديل):
                        </span>
                        <span className="text-xs font-bold text-emerald-200 font-mono">
                          {String(diff.newValue ?? '—')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#282828] text-center text-[#8C827A] space-y-1">
                <p className="font-bold text-xs text-[#C4BCB2]">
                  تم تسجيل التغيير بنص وصفي مباشر:
                </p>
                <p className="text-xs text-[#A8A096]">{log.details}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#262626] bg-[#1A1A1A] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-5 py-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-white font-bold text-xs transition"
          >
            إغلاق النافذة
          </button>
        </div>
      </motion.div>
    </div>
  );
};
