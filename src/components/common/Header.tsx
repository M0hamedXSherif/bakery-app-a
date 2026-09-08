import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ShoppingCart,
  LogOut,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Lock,
  Sun,
  Moon,
  AlertTriangle,
  Users,
  UserPlus,
  ShieldCheck,
  Package,
  Power,
  ChefHat,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { LowStockAlertModal } from './LowStockAlertModal';

interface HeaderProps {
  currentView: 'pos' | 'dashboard' | 'kitchen';
  onViewChange: (view: 'pos' | 'dashboard' | 'kitchen') => void;
  onOpenAuth: () => void;
  onOpenRefundModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenAuth,
  onOpenRefundModal,
}) => {
  const {
    currentUser,
    users,
    login,
    logout,
    lockTerminal,
    turnOffScreen,
    pendingRefundsCount,
    pendingUsersCount,
    lowStockProducts,
    lowStockRawMaterials,
    bakerySettings,
    theme,
    toggleTheme,
  } = useBakery();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);

  const isOwner = currentUser?.role === 'owner';
  const totalLowStock = lowStockProducts.length + lowStockRawMaterials.length;
  const isLight = theme === 'light';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-md shadow-lg px-2 sm:px-4 md:px-6 py-1.5 sm:py-2.5 w-full transition-colors duration-200 border-b ${
          isLight
            ? 'bg-white/95 border-[#E6DFD5] text-[#1F1B16] shadow-stone-200/50'
            : 'bg-[#121212]/95 border-[#262626] text-[#F5EBE6] shadow-xl'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-3">
          {/* 1. Bakery Logo & Title */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#B89028] to-[#6E5005] flex items-center justify-center text-stone-950 shadow-md shadow-[#D4AF37]/20 text-sm sm:text-lg font-black shrink-0 overflow-hidden border border-[#D4AF37]/30">
              {bakerySettings.logoUrl ? (
                <img
                  src={bakerySettings.logoUrl}
                  alt={bakerySettings.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <span>{bakerySettings.logoEmoji || '🥐'}</span>
              )}
            </div>
            <div className="hidden sm:flex flex-col min-w-0">
              <h1
                className={`text-xs sm:text-base font-black font-heading tracking-tight leading-tight truncate max-w-[85px] xs:max-w-[130px] sm:max-w-none ${
                  isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                }`}
                title={bakerySettings.name}
              >
                <span>{bakerySettings.name}</span>
              </h1>
              <span
                className={`text-[9px] hidden md:inline-block font-mono ${
                  isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
                }`}
              >
                {isOwner ? 'لوحة تحكم ونقاط البيع' : 'نقطة بيع الكاشير'}
              </span>
            </div>
          </div>

          {/* 2. Navigation Actions & Role Indicators */}
          {isOwner ? (
            /* Manager Navigation Tabs */
            <div
              className={`flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-2xl border shrink-0 ${
                isLight
                  ? 'bg-[#F4EFE6] border-[#E2DAD0]'
                  : 'bg-[#181818] border-[#282828]'
              }`}
            >
              <button
                type="button"
                onClick={() => onViewChange('pos')}
                className={`cursor-pointer px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-1.5 transition-all ${
                  currentView === 'pos'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 shadow-md shadow-[#D4AF37]/20 font-black'
                    : isLight
                    ? 'text-[#6E6359] hover:text-[#1F1B16] hover:bg-white'
                    : 'text-[#9C948A] hover:text-[#F5EBE6] hover:bg-[#222222]'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-xs sm:text-sm">البيع</span>
              </button>

              <button
                type="button"
                onClick={() => onViewChange('kitchen')}
                className={`cursor-pointer px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-1.5 transition-all ${
                  currentView === 'kitchen'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 shadow-md shadow-[#D4AF37]/20 font-black'
                    : isLight
                    ? 'text-[#6E6359] hover:text-[#1F1B16] hover:bg-white'
                    : 'text-[#9C948A] hover:text-[#F5EBE6] hover:bg-[#222222]'
                }`}
                title="واجهة الشيف والمخبوزات وطلب المقادير"
              >
                <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline text-xs sm:text-sm">الخبز والإنتاج</span>
                <span className="inline sm:hidden text-xs">الإنتاج</span>
              </button>

              <button
                type="button"
                onClick={() => onViewChange('dashboard')}
                className={`cursor-pointer px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-1.5 transition-all relative ${
                  currentView === 'dashboard'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 shadow-md shadow-[#D4AF37]/20 font-black'
                    : isLight
                    ? 'text-[#6E6359] hover:text-[#1F1B16] hover:bg-white'
                    : 'text-[#9C948A] hover:text-[#F5EBE6] hover:bg-[#222222]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-xs sm:text-sm">التحكم</span>
                {(pendingRefundsCount > 0 || pendingUsersCount > 0 || totalLowStock > 0) && (
                  <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1 left-1 animate-ping" />
                )}
              </button>
            </div>
          ) : (
            /* Staff / Cashier / Chef Navigation Tabs & Badge */
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div
                className={`flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-2xl border shrink-0 ${
                  isLight
                    ? 'bg-[#F4EFE6] border-[#E2DAD0]'
                    : 'bg-[#181818] border-[#282828]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onViewChange('pos')}
                  className={`cursor-pointer px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 transition-all ${
                    currentView === 'pos'
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 shadow-md shadow-[#D4AF37]/20 font-black'
                      : isLight
                      ? 'text-[#6E6359] hover:text-[#1F1B16] hover:bg-white'
                      : 'text-[#9C948A] hover:text-[#F5EBE6] hover:bg-[#222222]'
                  }`}
                  title="نقطة البيع (الكاشير)"
                >
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline text-xs">نقطة البيع</span>
                  <span className="inline sm:hidden text-xs">البيع</span>
                </button>

                <button
                  type="button"
                  onClick={() => onViewChange('kitchen')}
                  className={`cursor-pointer px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 transition-all ${
                    currentView === 'kitchen'
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 shadow-md shadow-[#D4AF37]/20 font-black'
                      : isLight
                      ? 'text-[#6E6359] hover:text-[#1F1B16] hover:bg-white'
                      : 'text-[#9C948A] hover:text-[#F5EBE6] hover:bg-[#222222]'
                  }`}
                  title="طلب مقادير وخبز دفعات جديدة"
                >
                  <ChefHat className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline text-xs">طلب مقادير وخبز</span>
                  <span className="inline sm:hidden text-xs">الإنتاج</span>
                </button>
              </div>

              {/* Staff Badge */}
              <div
                className={`hidden xs:flex items-center gap-1.5 py-1 px-1.5 sm:px-2 rounded-2xl border text-xs max-w-[80px] sm:max-w-[180px] truncate ${
                  isLight
                    ? 'bg-[#F4EFE6] border-[#E2DAD0]'
                    : 'bg-[#181818] border-[#282828]'
                }`}
              >
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isLight
                      ? 'bg-[#FDF7E7] border border-[#ECD9B4] text-[#8A6414]'
                      : 'bg-[#282012] border border-[#5A451A] text-[#D4AF37]'
                  }`}
                >
                  {currentUser?.avatar || '🧑‍🍳'}
                </div>
                <div className="flex flex-col text-right truncate">
                  <span
                    className={`font-bold text-[10px] sm:text-xs leading-tight truncate ${
                      isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                    }`}
                  >
                    {currentUser?.name || 'موظف'}
                  </span>
                  <span
                    className={`text-[8px] sm:text-[9px] hidden sm:inline ${
                      isLight ? 'text-emerald-700' : 'text-emerald-400'
                    }`}
                  >
                    {currentUser?.jobTitle || (currentView === 'kitchen' ? 'شيف نشط 🟢' : 'كاشير نشط 🟢')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenRefundModal}
                className={`cursor-pointer px-2 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 border hidden lg:flex shrink-0 ${
                  isLight
                    ? 'bg-[#FDF7E7] text-[#8A6414] border-[#ECD9B4] hover:bg-[#FAF0D8]'
                    : 'text-[#D4AF37] hover:bg-[#241D12] border-[#4A3B1B]'
                }`}
                title="طلب استرجاع فاتورة للمدير"
              >
                <RefreshCw className="w-3 h-3" />
                <span>استرجاع</span>
              </button>
            </div>
          )}

          {/* 3. Action Controls: Theme Switcher + Standby Button */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`cursor-pointer p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs shrink-0 ${
                isLight
                  ? 'bg-white hover:bg-stone-100 border-[#E2DAD0] text-[#1F1B16]'
                  : 'bg-[#181818] hover:bg-[#222222] border-[#2B2B2B] hover:border-[#4A3B1B] text-[#E0D8D0]'
              }`}
              title={theme === 'dark' ? 'التحويل للوضع النهاري (فاتح)' : 'التحويل للوضع الليلي (داكن)'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                  <span className="hidden lg:inline text-[11px]">النهار</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
                  <span className="hidden lg:inline text-[11px]">الليل</span>
                </>
              )}
            </button>

            {/* Screen Off / Standby Button */}
            <button
              type="button"
              onClick={turnOffScreen}
              className={`cursor-pointer p-1.5 sm:p-2 rounded-xl border text-xs font-bold flex items-center justify-center transition-all shadow-sm shrink-0 active:scale-95 ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
                  : 'bg-[#1F180F] hover:bg-[#2A2014] border-[#5A451A] text-[#D4AF37]'
              }`}
              title="إطفاء الشاشة والانتقال الفوري لشاشة الأمان والساعة"
            >
              <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-[#D4AF37]" />
            </button>
          </div>
        </div>

        {/* 4. Centered Bottom Chevron Tab for Owner Tools */}
        {isOwner && (
          <div className="absolute -bottom-3 sm:-bottom-3.5 left-1/2 -translate-x-1/2 z-50">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className={`cursor-pointer px-2.5 sm:px-3.5 py-0.5 rounded-full border shadow-lg text-[9px] sm:text-[10px] font-bold flex items-center gap-1 sm:gap-1.5 transition-all duration-200 whitespace-nowrap ${
                isDrawerOpen
                  ? 'bg-[#D4AF37] text-stone-950 border-[#E5C04B] shadow-[#D4AF37]/30 scale-105 font-black'
                  : isLight
                  ? 'bg-[#FAF7F0] text-[#8A6414] border-[#DFC99E] hover:bg-white shadow-sm'
                  : 'bg-[#18150F] text-[#D4AF37] border-[#4A3B1B] hover:bg-[#261E13] hover:border-[#6A5425]'
              }`}
              title="لوحة الأدوات والتحكم السريعة للمدير"
            >
              {totalLowStock > 0 && !isDrawerOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              )}
              <span className="hidden xs:inline">{isDrawerOpen ? 'إخفاء الأدوات' : 'أدوات الإدارة السريعة'}</span>
              <span className="inline xs:hidden">{isDrawerOpen ? 'إخفاء' : 'أدوات'}</span>
              {isDrawerOpen ? (
                <ChevronUp className="w-3 h-3 shrink-0" />
              ) : (
                <ChevronDown className="w-3 h-3 shrink-0" />
              )}
            </button>
          </div>
        )}

        {/* 5. Manager Dropdown Menu Drawer */}
        <AnimatePresence>
          {isOwner && isDrawerOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 top-12 z-30 bg-black/60 backdrop-blur-xs"
                onClick={() => setIsDrawerOpen(false)}
              />

              {/* Drawer Content */}
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className={`absolute top-full left-0 right-0 z-40 border-b shadow-2xl p-4 sm:p-5 ${
                  isLight
                    ? 'bg-white border-[#E6DFD5] text-[#1F1B16]'
                    : 'bg-[#141414] border-[#3A2E14] text-[#E0D8D0]'
                }`}
              >
                <div className="max-w-7xl mx-auto space-y-4 text-right">
                  {/* Top Bar inside Drawer */}
                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
                      isLight ? 'border-[#EAE3D8]' : 'border-[#242424]'
                    }`}
                  >
                    {/* Low Stock Warning Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLowStockModalOpen(true);
                        setIsDrawerOpen(false);
                      }}
                      className={`cursor-pointer px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition shadow-sm ${
                        totalLowStock > 0
                          ? isLight
                            ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 animate-pulse'
                            : 'bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900/80 animate-pulse'
                          : isLight
                          ? 'bg-[#FDF8EE] border-[#DFC99E] text-[#8A6414] hover:bg-[#FAF0D8]'
                          : 'bg-[#1C1812] border-[#382E1C] text-[#D4AF37] hover:bg-[#282015]'
                      }`}
                    >
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 ${
                          isLight ? 'text-amber-600' : 'text-amber-400'
                        }`}
                      />
                      <span>
                        تحذير النواقص والمخزون الحرج:
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border ${
                          isLight
                            ? 'bg-white text-amber-950 border-amber-300'
                            : 'bg-[#121212] text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {totalLowStock} صنف
                      </span>
                    </button>

                    {/* Pending Requests Counters */}
                    <div className="flex items-center gap-2 text-xs">
                      {pendingRefundsCount > 0 && (
                        <span
                          className={`px-2.5 py-1 rounded-xl border font-bold flex items-center gap-1.5 ${
                            isLight
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-red-950 text-red-300 border-red-800'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-red-500" />
                          <span>{pendingRefundsCount} استرجاع معلق</span>
                        </span>
                      )}

                      {pendingUsersCount > 0 && (
                        <span
                          className={`px-2.5 py-1 rounded-xl border font-bold flex items-center gap-1.5 ${
                            isLight
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-yellow-950 text-yellow-300 border-yellow-800'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                          <span>{pendingUsersCount} موظف جديد للموافقة</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onOpenAuth();
                          setIsDrawerOpen(false);
                        }}
                        className={`cursor-pointer px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition border ${
                          isLight
                            ? 'bg-[#FDF8EE] text-[#8A6414] border-[#DFC99E] hover:bg-[#FAF0D8]'
                            : 'bg-[#241D12] text-[#D4AF37] border-[#5A451A] hover:bg-[#322718]'
                        }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ موظف جديد</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick User Switcher Grid */}
                  <div>
                    <span
                      className={`text-xs font-bold block mb-2 flex items-center gap-1.5 ${
                        isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
                      }`}
                    >
                      <Users
                        className={`w-3.5 h-3.5 ${
                          isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                        }`}
                      />
                      <span>التبديل الفوري بين حسابات الموظفين والمدير:</span>
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {users.map((u) => {
                        const isSelected = currentUser?.id === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              login(u.id);
                              setIsDrawerOpen(false);
                            }}
                            className={`cursor-pointer p-2.5 rounded-2xl border transition flex items-center gap-2 text-right ${
                              isSelected
                                ? isLight
                                  ? 'bg-[#FDF7E7] border-[#D4AF37] text-[#1F1B16] shadow-sm'
                                  : 'bg-[#2A2012] border-[#D4AF37] text-[#F5EBE6] shadow-md'
                                : isLight
                                ? 'bg-[#F8F5F0] border-[#E2DAD0] hover:border-[#D4AF37] text-[#5C5248] hover:text-[#1F1B16]'
                                : 'bg-[#181818] border-[#2A2A2A] hover:border-[#4A3B1B] text-[#A8A096] hover:text-[#F5EBE6]'
                            }`}
                          >
                            <span className="text-xl shrink-0">{u.avatar || '👤'}</span>
                            <div className="min-w-0">
                              <span className="font-bold text-xs block truncate">{u.name}</span>
                              <span
                                className={`text-[10px] font-semibold ${
                                  isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                                }`}
                              >
                                {u.role === 'owner' ? '👑 مدير' : '🧑‍💼 كاشير'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Low Stock Alert Modal */}
      <LowStockAlertModal
        isOpen={isLowStockModalOpen}
        onClose={() => setIsLowStockModalOpen(false)}
        onNavigateToDashboard={() => onViewChange('dashboard')}
      />
    </>
  );
};
