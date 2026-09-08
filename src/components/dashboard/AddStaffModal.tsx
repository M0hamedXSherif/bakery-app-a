import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  UserPlus,
  Lock,
  Phone,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Crown,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { EmployeeDepartment, UserRole } from '../../types';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({ isOpen, onClose }) => {
  const { addStaffUserByManager } = useBakery();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [department, setDepartment] = useState<EmployeeDepartment>('cashier');
  const [jobTitle, setJobTitle] = useState('كاشير نقطة بيع');
  const [showPin, setShowPin] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'يرجى إدخال اسم الموظف بالكامل' });
      return;
    }
    if (!username.trim()) {
      setFeedback({ type: 'error', message: 'يرجى إدخال اسم المستخدم للنظام' });
      return;
    }
    if (!pin.trim() || pin.trim().length < 3) {
      setFeedback({ type: 'error', message: 'يرجى إدخال رمز دخول / كلمة مرور مكونة من 3 أحرف أو أرقام على الأقل' });
      return;
    }

    const res = addStaffUserByManager({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      pin: pin.trim(),
      phone: phone.trim(),
      role,
      department,
      jobTitle: jobTitle.trim() || (role === 'owner' ? 'المدير العام' : 'كاشير'),
    });

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        onClose();
        setName('');
        setUsername('');
        setPin('');
        setPhone('');
        setFeedback(null);
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#161616] border border-[#2E2E2E] rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-[#262626] bg-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B89028] text-stone-950 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#F5EBE6]">
                إضافة وتسجيل موظف جديد
              </h3>
              <p className="text-[11px] text-[#8C827A]">
                صلاحية حصرية للمدير العام لإنشاء حسابات فورية ومباشرة
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {feedback && (
            <div
              className={`p-3 rounded-2xl flex items-center gap-2 font-bold ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
                  : 'bg-red-950/80 border border-red-700 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#C4BCB2] font-bold mb-1">
                اسم الموظف الثلاثي:
              </label>
              <input
                type="text"
                required
                placeholder="مثال: أحمد محمود إبراهيم"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#1F1F1F] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-[#C4BCB2] font-bold mb-1">
                اسم المستخدم (للدخول):
              </label>
              <input
                type="text"
                required
                placeholder="مثال: ahmed_pos"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#1F1F1F] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37] font-mono text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#C4BCB2] font-bold mb-1">
                رمز الدخول / كلمة المرور (حروف وأرقام):
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  placeholder="مثال: 554433 أو Pass123"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#1F1F1F] border border-[#333333] text-[#D4AF37] font-mono font-bold focus:outline-none focus:border-[#D4AF37] text-left pr-9"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#C4BCB2] font-bold mb-1">
                رقم الهاتف (اختياري):
              </label>
              <input
                type="tel"
                placeholder="010XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#1F1F1F] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37] font-mono text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#C4BCB2] font-bold mb-1">
                صلاحية الحساب:
              </label>
              <select
                value={role}
                onChange={(e) => {
                  const r = e.target.value as UserRole;
                  setRole(r);
                  if (r === 'owner') {
                    setDepartment('admin');
                    setJobTitle('المدير العام');
                  } else {
                    setDepartment('cashier');
                    setJobTitle('كاشير نقطة بيع');
                  }
                }}
                className="w-full p-2.5 rounded-xl bg-[#1F1F1F] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="staff">كاشير / موظف</option>
                <option value="owner">مدير عام 👑</option>
              </select>
            </div>

            <div>
              <label className="block text-[#C4BCB2] font-bold mb-1">
                القسم:
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as EmployeeDepartment)}
                className="w-full p-2.5 rounded-xl bg-[#1F1F1F] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="cashier">كاشير ومبيعات</option>
                <option value="bakery">مخبوزات وتصنيع</option>
                <option value="pastry">حلويات وتزيين</option>
                <option value="inventory">مخازن ومواد خام</option>
                <option value="admin">إدارة وإشراف</option>
              </select>
            </div>

            <div>
              <label className="block text-[#C4BCB2] font-bold mb-1">
                المسمى الوظيفي:
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#1F1F1F] border border-[#333333] text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-stone-300 font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="cursor-pointer px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black shadow-lg shadow-[#D4AF37]/20 transition active:scale-95"
            >
              تسجيل وتفعيل الموظف فوراً
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
