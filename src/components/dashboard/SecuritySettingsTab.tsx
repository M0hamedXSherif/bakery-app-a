import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Clock,
  Fingerprint,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
  UserCheck,
  UserX,
  Eye,
  Sliders,
  Timer,
  RefreshCw,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { TwoFactorModal } from '../auth/TwoFactorModal';
import { sounds } from '../../utils/sound';

export const SecuritySettingsTab: React.FC = () => {
  const {
    securitySettings,
    updateSecuritySettings,
    users,
    failedLoginLogs,
    clearFailedLoginLogs,
    unlockUserAccount,
    currentUser,
    theme,
    auditLogs,
  } = useBakery();

  const [isTesting2FA, setIsTesting2FA] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    sounds.playSuccess();
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Filter security and auto-lock logs from audit trail
  const securityAuditLogs = auditLogs.filter(
    (log) =>
      log.type === 'security' ||
      log.action.includes('قفل') ||
      log.action.includes('دخول') ||
      log.details.includes('قفل')
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#1C1810] via-[#141414] to-[#0E0E0E] border border-[#5A451A] p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-stone-950 flex items-center justify-center text-2xl shadow-lg shadow-[#D4AF37]/20 font-black shrink-0">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold font-heading text-[#F5EBE6]">
                إدارة الأمان والقفل التلقائي وسياسات الحسابات
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                أمان مصرفي مشدد 🛡️
              </span>
            </div>
            <p className="text-xs text-[#8C827A] mt-1">
              التحكم في زمن قفل الشاشة التلقائي (1-5 دقائق)، إطالة تشغيل شاشة المدير، تفعيل التحقق بخطوتين (2FA)، وإلغاء قفل الحسابات.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTesting2FA(true)}
            className="cursor-pointer px-4 py-2 rounded-2xl bg-[#241D12] hover:bg-[#332715] text-[#D4AF37] border border-[#5A451A] text-xs font-bold flex items-center gap-2 shadow-xs transition"
          >
            <Fingerprint className="w-4 h-4 text-[#D4AF37]" />
            <span>تجربة فحص 2FA (OTP / بصمة)</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Auto-Lock Idle Timer (1 - 5 minutes) */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5EBE6]">
                    خاصية القفل التلقائي للكاشير (Auto-Lock)
                  </h4>
                  <span className="text-[11px] text-[#8C827A]">
                    قابلة للتعديل من قبل المدير بين 1 إلى 5 دقائق
                  </span>
                </div>
              </div>

              <div className="text-left font-mono">
                <span className="text-xs text-[#D4AF37] font-black bg-[#241D12] px-3 py-1 rounded-xl border border-[#5A451A]">
                  {(securitySettings.autoLockSeconds / 60).toFixed(0)} دقائق (
                  {securitySettings.autoLockSeconds} ثانية)
                </span>
              </div>
            </div>

            <p className="text-xs text-[#A8A096] leading-relaxed my-3">
              إذا كانت الشاشة خاملة وبدون حركة، تظهر شاشة تسجيل الدخول تلقائياً.
              يُظهر النظام تحذيراً بارزاً مع عد تنازلي قبل <strong>30 ثانية</strong> من الإغلاق.
              <strong> لا يتم الإغلاق إطلاقاً</strong> إذا كان هناك فاتورة مفتوحة (أصناف في السلة).
            </p>

            {/* Selector Buttons */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              {[
                { label: 'دقيقة واحدة', sec: 60 },
                { label: 'دقيقتان (افتراضي)', sec: 120 },
                { label: '3 دقائق', sec: 180 },
                { label: '4 دقائق', sec: 240 },
                { label: '5 دقائق', sec: 300 },
              ].map((item) => {
                const isSelected = securitySettings.autoLockSeconds === item.sec;
                return (
                  <button
                    key={item.sec}
                    type="button"
                    onClick={() => {
                      updateSecuritySettings({ autoLockSeconds: item.sec });
                      showNotification(`تم ضبط مدة القفل التلقائي بنجاح على ${item.label}`);
                    }}
                    className={`cursor-pointer p-2.5 rounded-2xl border text-center transition ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black shadow-md shadow-[#D4AF37]/20 border-transparent'
                        : 'bg-[#1C1C1C] border-[#2E2E2E] text-[#E0D8D0] hover:bg-[#252525]'
                    }`}
                  >
                    <span className="text-xs font-bold block">{item.sec / 60} د</span>
                    <span className="text-[10px] block opacity-80">{item.sec} ثانية</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-[11px] text-emerald-400">
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              حماية الفواتير المفتوحة نشطة (لا يقفل أثناء وزن أو إضافة أصناف)
            </span>
            <span className="text-amber-400/90 font-mono">تحذير 30 ثانية مسبق</span>
          </div>
        </div>

        {/* CARD 2: Manager Screen-On Extension (خاص بحساب المدير فقط) */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F5EBE6]">
                    إطالة تشغيل الشاشة لحساب المدير فقط 👑
                  </h4>
                  <span className="text-[11px] text-[#8C827A]">
                    خاصية استثنائية لصاحب المخبز والمدير العام
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                حساب المدير فقط
              </span>
            </div>

            <p className="text-xs text-[#A8A096] leading-relaxed my-3">
              يقدر المدير إطالة مدة إبقاء الشاشة قيد التشغيل فترة طويلة <strong>في حسابه هو فقط</strong> أثناء مراجعة التقارير المالية، مراقبة المخزون، أو تعديل الوصفات دون أن تقفل الشاشة في وجهه.
            </p>

            {/* Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {[
                { label: 'نفس الكاشير', sec: 0, desc: 'تطبيق نفس المدة' },
                { label: '15 دقيقة', sec: 900, desc: '900 ثانية' },
                { label: '30 دقيقة', sec: 1800, desc: 'نصف ساعة' },
                { label: 'ساعة كاملة', sec: 3600, desc: '60 دقيقة' },
              ].map((item) => {
                const isSelected = securitySettings.managerScreenOnSeconds === item.sec;
                return (
                  <button
                    key={item.sec}
                    type="button"
                    onClick={() => {
                      updateSecuritySettings({ managerScreenOnSeconds: item.sec });
                      showNotification(`تم تعيين مدة تشغيل شاشة المدير على: ${item.label}`);
                    }}
                    className={`cursor-pointer p-2.5 rounded-2xl border text-center transition ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-black shadow-md border-transparent'
                        : 'bg-[#1C1C1C] border-[#2E2E2E] text-[#E0D8D0] hover:bg-[#252525]'
                    }`}
                  >
                    <span className="text-xs font-bold block">{item.label}</span>
                    <span className="text-[10px] block text-[#8C827A] mt-0.5">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#222222] text-[11px] text-[#D4AF37] font-bold flex items-center justify-between">
            <span>الحالة الحالية للمدير:</span>
            <span className="font-mono">
              {securitySettings.managerScreenOnSeconds === 0
                ? `مثل باقي الموظفين (${securitySettings.autoLockSeconds / 60} د)`
                : `${securitySettings.managerScreenOnSeconds / 60} دقيقة بدون قفل`}
            </span>
          </div>
        </div>

        {/* CARD 3: 2FA for Managers (بصمة أو رمز تحقق OTP) */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F5EBE6]">
                  خاصية العاملين: التحقق بخطوتين (2FA للمديرين فقط)
                </h4>
                <span className="text-[11px] text-[#8C827A]">
                  تفعيل بصمة الإصبع أو رمز تحقق ديناميكي (OTP)
                </span>
              </div>
            </div>

            {/* Toggle switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.require2FAForManagers}
                onChange={(e) => {
                  const val = e.target.checked;
                  updateSecuritySettings({ require2FAForManagers: val });
                  showNotification(
                    val
                      ? 'تم تفعيل التحقق بخطوتين (2FA) للمديرين بنجاح 🛡️'
                      : 'تم إيقاف التحقق بخطوتين للمديرين'
                  );
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#2E2E2E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
            </label>
          </div>

          <p className="text-xs text-[#A8A096] leading-relaxed">
            عند تفعيل هذه الخاصية، يُطلب من أي مستخدم برتبة <strong>مدير</strong> إدخال رمز تحقق أمان (OTP) مكون من 6 أرقام يتجدد كل دقيقة، أو تأكيد الدخول عبر البصمة الحيوية (Biometric Scan) لحماية الخزينة والتقارير.
          </p>

          <div className="p-3 bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[#E0D8D0]">
                حالة التحقق الحالية: {securitySettings.require2FAForManagers ? 'مفعّل للمديرين ✅' : 'معطل ❌'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsTesting2FA(true)}
              className="cursor-pointer px-3 py-1 rounded-xl bg-[#241D12] text-[#D4AF37] border border-[#5A451A] text-xs font-bold hover:bg-[#332715] transition"
            >
              اختبار الشاشة
            </button>
          </div>
        </div>

        {/* CARD 4: Single Active Session & Device Sync */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F5EBE6]">
                  سياسة الجلسة الواحدة النشطة (Single Active Session)
                </h4>
                <span className="text-[11px] text-[#8C827A]">
                  طرد الجلسة السابقة تلقائياً عند الدخول من جهاز آخر
                </span>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              مفعّل دائمًا 🔒
            </span>
          </div>

          <p className="text-xs text-[#A8A096] leading-relaxed">
            لضمان عدم تداخل الإيرادات ومنع أي موظف من استخدام حساب زميله من جهازين في نفس اللحظة؛ يمنح النظام كل تسجيل دخول رمز جلسة مؤمّن، وفي حال سجل الموظف دخوله من تبويب أو جهاز آخر، يتم إنهاء الجلسة القديمة فوراً وإغلاق الشاشة مع رسالة تنبيه.
          </p>

          <div className="p-3 bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] flex items-center justify-between text-xs font-mono">
            <span className="text-[#8C827A]">الجلسة النشطة الحالية:</span>
            <span className="text-[#D4AF37] font-bold">
              {currentUser?.name} (@{currentUser?.username})
            </span>
          </div>
        </div>
      </div>

      {/* CARD 5: Account Lockout Management (Lockout after 3 failed attempts) */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-[#F5EBE6]">
                إدارة أقفال الحسابات (Account Lockout Policy)
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800">
                قفل بعد 3 محاولات فاشلة
              </span>
            </div>
            <p className="text-xs text-[#8C827A] mt-1">
              إذا أدخل أي موظف أو شخص رمز الدخول بشكل خاطئ 3 مرات متتالية، يُقفل الحساب تلقائياً ولا يمكن فتحه إلا بواسطة المدير من هذا الجدول.
            </p>
          </div>

          <div className="text-xs text-[#A8A096] bg-[#1E1E1E] px-3 py-1.5 rounded-xl border border-[#2E2E2E]">
            صلاحية كلمات المرور: <strong className="text-[#D4AF37]">30 يوماً</strong>
          </div>
        </div>

        {/* Users Lockout Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="text-[#8C827A] border-b border-[#262626]">
                <th className="pb-3 font-bold">الموظف</th>
                <th className="pb-3 font-bold">اسم المستخدم</th>
                <th className="pb-3 font-bold">الرتبة</th>
                <th className="pb-3 font-bold">المحاولات الخاطئة</th>
                <th className="pb-3 font-bold">حالة الحساب</th>
                <th className="pb-3 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {users.map((u) => {
                const isLocked = u.isAccountLocked;
                const attempts = u.failedLoginAttempts || 0;
                return (
                  <tr key={u.id} className="hover:bg-[#1A1A1A] transition">
                    <td className="py-3 font-bold text-[#F5EBE6] flex items-center gap-2">
                      <span>{u.name}</span>
                      {u.role === 'owner' && <span className="text-xs">👑</span>}
                    </td>
                    <td className="py-3 font-mono text-[#D4AF37]">@{u.username}</td>
                    <td className="py-3 text-[#A8A096]">
                      {u.role === 'owner' ? 'المدير العام' : 'كاشير مبيعات'}
                    </td>
                    <td className="py-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          attempts >= 3
                            ? 'bg-red-950 text-red-400 border border-red-700'
                            : attempts > 0
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-[#1E1E1E] text-stone-400'
                        }`}
                      >
                        {attempts} / 3
                      </span>
                    </td>
                    <td className="py-3">
                      {isLocked ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-700 flex items-center gap-1 w-max">
                          <UserX className="w-3 h-3 text-red-400" />
                          <span>مقفول أمنياً 🔒</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-max">
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>نشط ومتاح 🟢</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {isLocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            unlockUserAccount(u.id);
                            showNotification(`تم فك قفل حساب الموظف (${u.name}) وتصفير المحاولات بنجاح ✅`);
                          }}
                          className="cursor-pointer px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition mx-auto"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>فك القفل الآن</span>
                        </button>
                      ) : attempts > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            unlockUserAccount(u.id);
                            showNotification(`تم تصفير محاولات الموظف (${u.name})`);
                          }}
                          className="cursor-pointer px-2.5 py-1 rounded-lg border border-[#333333] text-[#8C827A] hover:text-[#F5EBE6] text-[11px] transition"
                        >
                          تصفير المحاولات
                        </button>
                      ) : (
                        <span className="text-[11px] text-stone-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CARD 6: Security Incidents & Auto-Lock Audit Log */}
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-[#F5EBE6] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>سجل محاولات الدخول الخاطئة والقفل التلقائي (بالوقت والدقيقة)</span>
            </h4>
            <p className="text-xs text-[#8C827A] mt-1">
              توثيق زمني كامل لكل مرة يتم فيها قفل الشاشة تلقائياً بسبب الخمول، أو محاولات الدخول غير المصرح بها
            </p>
          </div>

          {failedLoginLogs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearFailedLoginLogs();
                showNotification('تم مسح سجل المحاولات الخاطئة بنجاح');
              }}
              className="cursor-pointer px-3 py-1.5 rounded-xl border border-red-900/60 text-red-400 hover:bg-red-950/40 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-[#1F1F1F] max-h-72 overflow-y-auto pr-1">
          {failedLoginLogs.length === 0 && securityAuditLogs.length === 0 ? (
            <div className="text-center py-8 text-emerald-400 font-bold text-xs bg-[#11291B] rounded-2xl border border-[#165B37]">
              لا توجد أي حوادث أمنية أو محاولات دخول فاشلة مسجلة — النظام محمي بالكامل ✅
            </div>
          ) : (
            <>
              {failedLoginLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-red-950 text-red-400 border border-red-800 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#F5EBE6]">
                        محاولة دخول فاشلة: <span className="font-mono text-[#D4AF37]">@{log.username}</span>
                      </div>
                      <p className="text-[#A8A096] text-[11px] mt-0.5">{log.reason}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[#8C827A] shrink-0">
                    {new Date(log.timestamp).toLocaleString('ar-EG', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>
              ))}

              {securityAuditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-950 text-amber-400 border border-amber-800 mt-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#F5EBE6]">{log.action}</div>
                      <p className="text-[#A8A096] text-[11px] mt-0.5">{log.details}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[#8C827A] shrink-0">
                    {new Date(log.timestamp).toLocaleString('ar-EG', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Two-Factor Authentication Interactive Test Modal */}
      {isTesting2FA && (
        <TwoFactorModal
          isOpen={isTesting2FA}
          managerName={currentUser?.name || 'صاحب المخبز'}
          phone={currentUser?.phone || '01012345678'}
          theme={theme}
          onSuccess={() => {
            setIsTesting2FA(false);
            showNotification('تمت مطابقة واختبار التحقق بخطوتين (2FA) بنجاح فائق! 🎉');
          }}
          onCancel={() => setIsTesting2FA(false)}
        />
      )}
    </div>
  );
};
