import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Scale,
  Sparkles,
  Filter,
  Layers,
  AlertTriangle,
  QrCode,
  Flame,
  CheckCircle,
  Tag,
  Clock,
  TrendingUp,
  ShoppingCart,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { ProductCard } from './ProductCard';
import { WeightSellModal } from './WeightSellModal';
import { CartPanel } from './CartPanel';
import { CheckoutModal } from './CheckoutModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { StartShiftModal } from '../common/StartShiftModal';
import { CloseShiftModal } from '../common/CloseShiftModal';
import { Product, PaymentMethod, SaleRecord } from '../../types';
import { Unlock, AlertCircle, LogOut, Lock, Play } from 'lucide-react';
import { getShiftDuration, checkShiftCloseAllowed } from '../../utils/shiftUtils';

export const POSScreen: React.FC = () => {
  const {
    products,
    cart,
    addToCartPiece,
    addToCartWeight,
    checkoutCart,
    currentShift,
    currentUser,
    lockTerminal,
    logout,
    resumeCurrentShift,
    theme,
  } = useBakery();

  const isLight = theme === 'light';

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [filterType, setFilterType] = useState<'all' | 'weight' | 'piece' | 'low_stock'>('all');

  // Modals state
  const [selectedWeightProduct, setSelectedWeightProduct] = useState<Product | null>(null);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Shift Expiration & Duration & Timing
  const isOwner = currentUser?.role === 'owner';
  const isSuspended = !!(currentShift?.isSuspended || currentShift?.status === 'suspended');
  const isMyShift = !!(currentShift && (currentUser?.id === currentShift.cashierId || isOwner));

  const shiftDuration = useMemo(() => {
    if (!currentShift) return { formatted: '', hours: 0, minutes: 0 };
    return getShiftDuration(currentShift.openedAt);
  }, [currentShift]);

  const closeTiming = useMemo(() => {
    return checkShiftCloseAllowed(currentShift, isOwner);
  }, [currentShift, isOwner]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['الكل', ...Array.from(set)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'الكل' && p.category !== selectedCategory) {
        return false;
      }

      // Filter type
      if (filterType === 'weight' && p.unitType !== 'weight') return false;
      if (filterType === 'piece' && p.unitType !== 'piece') return false;
      if (filterType === 'low_stock' && p.stock > p.minStockAlert) return false;

      // Search query (name, barcode, category)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        const matchesBarcode = p.barcode ? p.barcode.includes(query) : false;
        return matchesName || matchesCategory || matchesBarcode;
      }

      return true;
    });
  }, [products, selectedCategory, filterType, searchQuery]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle clicking product
  const handleProductSelect = (product: Product) => {
    if (!currentShift) {
      setIsStartShiftModalOpen(true);
      return;
    }

    if (isSuspended) {
      setToastMessage(`⚠️ الوردية الحالية معلقة (${currentShift.cashierName})! يجب استئناف الوردية أولاً لمتابعة البيع.`);
      return;
    }

    if (product.unitType === 'weight') {
      setSelectedWeightProduct(product);
      setIsWeightModalOpen(true);
    } else {
      const result = addToCartPiece(product, 1);
      if (result && result.message) {
        setToastMessage(result.message);
        setTimeout(() => setToastMessage(null), 3500);
      }
    }
  };

  // Handle Weight Modal Confirm
  const handleWeightConfirm = (product: Product, weightKg: number, subtotal: number) => {
    if (!currentShift) {
      setIsStartShiftModalOpen(true);
      return;
    }

    if (isSuspended) {
      setToastMessage(`⚠️ الوردية الحالية معلقة (${currentShift.cashierName})! يجب استئناف الوردية أولاً لمتابعة البيع.`);
      return;
    }

    const result = addToCartWeight(product, weightKg, subtotal);
    if (result && result.message) {
      setToastMessage(result.message);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Handle Checkout Process
  const handleConfirmPayment = (params: {
    paymentMethod: PaymentMethod;
    cashGiven?: number;
    changeDue?: number;
    isRetroactive?: boolean;
    retroactiveNote?: string;
  }) => {
    const result = checkoutCart(params);
    if (result.success && result.saleRecord) {
      setIsCheckoutModalOpen(false);
      setCompletedSale(result.saleRecord);
      setIsReceiptModalOpen(true);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 overflow-x-hidden relative">
      {/* Dynamic Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-900/95 text-amber-100 border border-amber-500/80 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 font-bold text-sm max-w-md text-center"
          >
            <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Welcome & Shift Status Banner */}
      <div
        className={`rounded-3xl p-3.5 sm:p-5 shadow-xl border flex flex-col md:flex-row items-center justify-between gap-3.5 transition-all ${
          isLight
            ? 'bg-gradient-to-r from-[#FFFDF8] via-[#FAF4E8] to-[#F5ECDA] text-[#1F1B16] border-[#ECD8B5]'
            : 'bg-gradient-to-r from-[#1C160E] via-[#16120C] to-[#0E0E0E] text-[#F5EBE6] border-[#2C2317]'
        }`}
      >
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0 ${
                isLight
                  ? 'bg-[#F5EBD7] border border-[#DFC99E] text-stone-900'
                  : 'bg-[#282013] border border-[#5A451A] text-[#F5EBE6]'
              }`}
            >
              🥐
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className={`text-base sm:text-xl font-black font-heading ${
                    isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                  }`}
                >
                  شاشة كاشير المخبز • {currentUser?.name}
                </h2>
                {currentShift ? (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isLight
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-[#11291B] text-emerald-400 border border-[#165B37]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    الشيفت نشط 🟢
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isLight
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-red-950/80 text-red-300 border border-red-800'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    الشيفت مغلق 🔴
                  </span>
                )}
              </div>
              <p
                className={`text-[11px] sm:text-xs mt-0.5 ${
                  isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
                }`}
              >
                {currentShift
                  ? 'حدد الصنف بالقطعة أو بالوزن (كيلو / نص / ربع / مخصص) وأتمم الحساب فوريًا'
                  : 'يجب فتح شيفت الكاشير وتحديد العهدة النقدية لبدء تسجيل المبيعات وحساب الإيراد'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Shift Stats or Open Shift CTA */}
        {currentShift ? (
          <div
            className={`w-full md:w-auto p-2.5 sm:p-3 rounded-2xl backdrop-blur-xs border text-xs shadow-xs flex flex-wrap items-center justify-between gap-2 sm:gap-3 ${
              isLight
                ? 'bg-white/95 border-[#E6DFD5] text-[#1F1B16]'
                : 'bg-[#141414]/90 border-[#2A2A2A] text-[#E0D8D0]'
            }`}
          >
            <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 sm:gap-3 flex-1 items-center">
              <div className="text-center">
                <span
                  className={`text-[9px] sm:text-[10px] block ${
                    isLight ? 'text-[#7A6F65]' : 'text-[#8C827A]'
                  }`}
                >
                  عهدة البداية
                </span>
                <span
                  className={`font-mono font-bold text-xs sm:text-sm ${
                    isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                  }`}
                >
                  {currentShift.startingCash} ج
                </span>
              </div>

              <div className="text-center border-r border-[#EAE3D8] dark:border-[#262626] pr-1.5">
                <span
                  className={`text-[9px] sm:text-[10px] block ${
                    isLight ? 'text-[#7A6F65]' : 'text-[#8C827A]'
                  }`}
                >
                  مبيعات الشيفت
                </span>
                <span className="font-mono font-bold text-[#D4AF37] text-xs sm:text-sm">
                  {currentShift.totalSales.toFixed(2)} ج
                </span>
              </div>

              <div className="text-center border-r border-[#EAE3D8] dark:border-[#262626] pr-1.5">
                <span
                  className={`text-[9px] sm:text-[10px] block ${
                    isLight ? 'text-[#7A6F65]' : 'text-[#8C827A]'
                  }`}
                >
                  الوزن المباع
                </span>
                <span
                  className={`font-mono font-bold text-xs sm:text-sm ${
                    isLight ? 'text-[#1F1B16]' : 'text-[#E0D8D0]'
                  }`}
                >
                  {currentShift.totalWeightSoldKg.toFixed(2)} كجم
                </span>
              </div>

              {/* Shift Duration */}
              <div className="text-center border-r border-[#EAE3D8] dark:border-[#262626] pr-1.5">
                <span
                  className={`text-[9px] sm:text-[10px] block ${
                    isLight ? 'text-[#7A6F65]' : 'text-[#8C827A]'
                  }`}
                >
                  مدة الشيفت
                </span>
                <span
                  className={`font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-1 ${
                    isLight
                      ? 'text-[#1F1B16]'
                      : 'text-[#E0D8D0]'
                  }`}
                >
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  <span>{shiftDuration.formatted || '0د'}</span>
                </span>
              </div>
            </div>

            {/* End Shift Button */}
            <button
              type="button"
              onClick={() => {
                if (!isOwner && !closeTiming.canClose) {
                  setToastMessage(
                    '⚠️ لا يمكن إغلاق الشفت قبل موعده، يرجى مراجعة الإدارة. (يلزم إذن واعتماد المدير العام)'
                  );
                }
                setIsCloseShiftModalOpen(true);
              }}
              className={`cursor-pointer w-full xs:w-auto px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 border ${
                closeTiming.canClose
                  ? 'bg-red-600/10 hover:bg-red-600/20 border-red-600/30 text-red-500 hover:text-red-400'
                  : 'bg-amber-600/15 hover:bg-amber-600/25 border-amber-600/40 text-amber-400 hover:text-amber-300'
              }`}
              title={
                closeTiming.canClose
                  ? 'إقفال الشيفت وتسوية الخزينة (Z-Report)'
                  : `لا يمكن إغلاق الشفت قبل موعده، يرجى مراجعة الإدارة. (متبقي ${closeTiming.minutesRemainingToUnlock} دقيقة لتفعيل الإغلاق التلقائي)`
              }
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {closeTiming.canClose
                  ? 'إقفال الوردية'
                  : `🔒 قفل الوردية (${closeTiming.minutesRemainingToUnlock}د)`}
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsStartShiftModalOpen(true)}
            className="cursor-pointer w-full md:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs sm:text-sm shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <Unlock className="w-4 h-4 text-stone-950" />
            <span>🔓 فتح شيفت جديد وبدء البيع</span>
          </button>
        )}
      </div>

      {/* Suspended Shift Banner (Session Lock) */}
      {currentShift && isSuspended && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl border bg-gradient-to-r from-amber-950/90 via-stone-900/90 to-amber-950/90 border-amber-500/80 text-amber-100 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-600/30 border border-amber-500 text-amber-200 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm sm:text-base text-amber-200">
                  ⚠️ وردية معلقة مؤقتاً (Session Lock) - الكاشير: {currentShift.cashierName}
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-800/80 border border-amber-400 font-bold">
                  حالة معلقة
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-1">
                {isMyShift
                  ? 'تم تعليق الوردية عند الخروج لحماية الخزينة والمبيعات. يمكنك الآن استئناف الوردية لمتابعة البيع أو إقفالها وتسوية العهدة.'
                  : `هذه الوردية ملك للكاشير (${currentShift.cashierName}) وهي معلقة حالياً. لا يمكن فتح بيع جديد أو بدء شيفت آخر إلا بعد قيام الكاشير نفسه باستئنافها أو قيام المدير العام بإقفالها وتسويتها.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            {isMyShift && (
              <button
                type="button"
                onClick={resumeCurrentShift}
                className="cursor-pointer flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>استئناف الوردية ومتابعة البيع</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCloseShiftModalOpen(true)}
              className="cursor-pointer flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>إقفال وتسوية العهدة</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Grid: Products (Left) + Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Products Section (8 cols on large screens) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search & Filter Bar */}
          <div
            className={`p-3.5 sm:p-4 rounded-3xl shadow-md border flex flex-col sm:flex-row items-center gap-3 ${
              isLight
                ? 'bg-white border-[#E8E2D8]'
                : 'bg-[#141414] border-[#262626]'
            }`}
          >
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search
                className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 ${
                  isLight ? 'text-[#8E847A]' : 'text-[#8C827A]'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الباركود (مثال: بقسماط، فينو، 622001)..."
                className={`w-full pl-4 pr-10 py-2.5 rounded-2xl text-xs sm:text-sm border transition focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                  isLight
                    ? 'bg-[#F8F5F0] border-[#DFD7CB] text-[#1F1B16] placeholder-[#8E847A] focus:bg-white'
                    : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#F5EBE6] placeholder-[#6C635B] focus:bg-[#202020]'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${
                    isLight
                      ? 'text-[#8E847A] hover:text-[#1F1B16]'
                      : 'text-[#8C827A] hover:text-[#F5EBE6]'
                  }`}
                >
                  مسح
                </button>
              )}
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`cursor-pointer px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition shrink-0 ${
                  filterType === 'all'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black shadow-md shadow-[#D4AF37]/20'
                    : isLight
                    ? 'bg-[#F8F5F0] text-[#5C5248] hover:bg-stone-200 border border-[#E2DAD0]'
                    : 'bg-[#1C1C1C] text-[#A8A096] hover:bg-[#262626] border border-[#2A2A2A]'
                }`}
              >
                الكل ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('weight')}
                className={`cursor-pointer px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                  filterType === 'weight'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black shadow-md shadow-[#D4AF37]/20'
                    : isLight
                    ? 'bg-[#F8F5F0] text-[#5C5248] hover:bg-stone-200 border border-[#E2DAD0]'
                    : 'bg-[#1C1C1C] text-[#A8A096] hover:bg-[#262626] border border-[#2A2A2A]'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>بالوزن</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('piece')}
                className={`cursor-pointer px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition shrink-0 ${
                  filterType === 'piece'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black shadow-md shadow-[#D4AF37]/20'
                    : isLight
                    ? 'bg-[#F8F5F0] text-[#5C5248] hover:bg-stone-200 border border-[#E2DAD0]'
                    : 'bg-[#1C1C1C] text-[#A8A096] hover:bg-[#262626] border border-[#2A2A2A]'
                }`}
              >
                بالقطعة
              </button>
              <button
                type="button"
                onClick={() => setFilterType('low_stock')}
                className={`cursor-pointer px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                  filterType === 'low_stock'
                    ? 'bg-red-700 text-white font-black shadow-md'
                    : isLight
                    ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    : 'bg-red-950/40 text-red-300 hover:bg-red-900/50 border border-red-900/60'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>مخزون حرج</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`cursor-pointer px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black border-[#D4AF37] shadow-md shadow-[#D4AF37]/20'
                    : isLight
                    ? 'bg-white text-[#5C5248] border-[#E2DAD0] hover:border-[#D4AF37] hover:bg-[#FDFBF7] hover:text-stone-950 shadow-xs'
                    : 'bg-[#141414] text-[#A8A096] border-[#262626] hover:border-[#D4AF37]/50 hover:bg-[#1A1A1A] hover:text-[#F5EBE6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid (Visual Layout matching Reference Image & elevated) */}
          {filteredProducts.length === 0 ? (
            <div
              className={`rounded-3xl p-8 sm:p-12 text-center border ${
                isLight
                  ? 'bg-white border-[#E8E2D8]'
                  : 'bg-[#141414] border-[#262626]'
              }`}
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto flex items-center justify-center mb-3 text-2xl border ${
                  isLight
                    ? 'bg-[#F8F5F0] border-[#E2DAD0] text-[#D4AF37]'
                    : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#D4AF37]'
                }`}
              >
                🥖
              </div>
              <h3
                className={`font-bold mb-1 ${
                  isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                }`}
              >
                لم يتم العثور على منتجات مطابقة
              </h3>
              <p
                className={`text-xs ${
                  isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
                }`}
              >
                جرّب البحث باسم آخر أو إزالة التصفية
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleProductSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart Section (4 cols on large screens, sticky panel) */}
        <div
          id="cart-panel-section"
          className="lg:col-span-4 lg:sticky lg:top-20 h-auto min-h-[420px] lg:h-[calc(100vh-6rem)] pb-16 lg:pb-0"
        >
          <CartPanel
            onCheckout={() => setIsCheckoutModalOpen(true)}
            onOpenStartShift={() => setIsStartShiftModalOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Floating Cart Summary Bar */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-3 inset-x-3 z-30 lg:hidden"
        >
          <div
            className={`p-2.5 sm:p-3 rounded-2xl shadow-2xl border flex items-center justify-between gap-2.5 ${
              isLight
                ? 'bg-[#1F1B16] text-[#F5EBE6] border-[#4A3B1B]'
                : 'bg-[#161616] text-white border-[#D4AF37]/50 shadow-black/80'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-stone-950 flex items-center justify-center font-black text-xs shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold block truncate">
                  السلة ({cart.length} أصناف)
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-[#D4AF37]">
                  {cart.reduce((s, i) => s + i.subtotal, 0).toFixed(2)} ج
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('cart-panel-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition text-stone-200"
              >
                عرض السلة ⬇️
              </button>
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(true)}
                className="cursor-pointer px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black text-xs shadow-md transition active:scale-95"
              >
                الدفع 💳
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Start Shift Modal */}
      <StartShiftModal
        isOpen={isStartShiftModalOpen}
        onClose={() => setIsStartShiftModalOpen(false)}
      />

      {/* Close Shift Modal & Z-Report Flow */}
      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
      />

      {/* Weight Sell Modal */}
      <WeightSellModal
        product={selectedWeightProduct}
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onConfirm={handleWeightConfirm}
      />

      {/* Checkout Payment Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        totalAmount={cartTotal}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirm={handleConfirmPayment}
      />

      {/* Thermal Receipt Print Modal */}
      <ThermalReceiptModal
        sale={completedSale}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
};
