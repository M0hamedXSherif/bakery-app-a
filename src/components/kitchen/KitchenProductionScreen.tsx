import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChefHat,
  Scale,
  Package,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
  History,
  ShieldAlert,
  Info,
  ChevronDown,
  X,
  Plus,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { Product, RawMaterial } from '../../types';

export const KitchenProductionScreen: React.FC = () => {
  const {
    products,
    rawMaterials,
    currentUser,
    theme,
    produceBatch,
    auditLogs,
    lowStockProducts,
  } = useBakery();

  const isLight = theme === 'light';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitType, setSelectedUnitType] = useState<'all' | 'weight' | 'piece'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'production' | 'history' | 'materials'>('production');

  // Modal State for Producing a Batch
  const [producingProduct, setProducingProduct] = useState<Product | null>(null);
  const [produceQty, setProduceQty] = useState<string>('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search query filter
      if (
        searchQuery.trim() &&
        !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(product.barcode && product.barcode.includes(searchQuery.trim()))
      ) {
        return false;
      }
      // Unit type filter (weight vs piece)
      if (selectedUnitType !== 'all' && product.unitType !== selectedUnitType) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      // Low stock only filter
      if (showLowStockOnly && product.stock > product.minStockAlert) {
        return false;
      }
      return true;
    });
  }, [products, searchQuery, selectedUnitType, selectedCategory, showLowStockOnly]);

  // Helper to calculate max batches possible for a product
  const calculateMaxProduction = (product: Product): number => {
    if (!product.recipe || product.recipe.length === 0) return 0;
    let max = Infinity;
    for (const ing of product.recipe) {
      const raw = rawMaterials.find((r) => r.id === ing.rawMaterialId);
      if (!raw || ing.quantityNeeded <= 0) {
        return 0;
      }
      const possible = Math.floor(raw.currentStock / ing.quantityNeeded);
      if (possible < max) {
        max = possible;
      }
    }
    return max === Infinity ? 0 : max;
  };

  // Helper to open modal for producing
  const handleOpenProduce = (product: Product) => {
    setProducingProduct(product);
    setFeedback(null);
    // Suggest initial quantity based on unitType
    setProduceQty(product.unitType === 'weight' ? '5' : '20');
  };

  // Helper to execute batch production
  const handleExecuteBatch = () => {
    if (!producingProduct || isSubmitting) return;
    const qty = parseFloat(produceQty);
    if (!qty || qty <= 0) {
      setFeedback({
        type: 'error',
        message: 'يرجى إدخال كمية صحيحة أكبر من الصفر.',
      });
      return;
    }

    setIsSubmitting(true);
    const result = produceBatch(producingProduct.id, qty);

    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
    });

    if (result.success) {
      setTimeout(() => {
        setIsSubmitting(false);
        setProducingProduct(null);
        setFeedback(null);
      }, 1600);
    } else {
      setIsSubmitting(false);
    }
  };

  // Filter today's batch production logs
  const todayBatchLogs = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return auditLogs.filter(
      (log) => log.type === 'batch_production' && log.timestamp.startsWith(todayStr)
    );
  }, [auditLogs]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* 1. Header & Chef Role Banner */}
      <div
        className={`p-4 sm:p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
          isLight
            ? 'bg-gradient-to-br from-white via-[#FAF7F2] to-[#F5ECE0] border-[#E8DFC8] text-[#1F1B16]'
            : 'bg-gradient-to-br from-[#161616] via-[#1C1710] to-[#121212] border-[#4A3B1C] text-[#F5EBE6]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#B89028] to-[#735108] text-stone-950 flex items-center justify-center text-2xl shadow-lg shadow-[#D4AF37]/20 border border-[#D4AF37]/40 shrink-0">
              <ChefHat className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black font-heading tracking-tight">
                  محطة الشيف وخبز الدفعات الجديدة
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-[#D4AF37]/20 text-[#8A6414] dark:text-[#D4AF37] border border-[#D4AF37]/40">
                  طلب مقادير وخصم فوري
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                اختر الصنف المراد خبزه بالكيلو أو بالقطعة لحساب المقادير وخصم المواد الخام تلقائيًا
              </p>
            </div>
          </div>

          {/* User badge & Security notice */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <div
              className={`p-2.5 sm:p-3 rounded-2xl border text-xs flex items-center gap-2 sm:gap-3 ${
                isLight ? 'bg-white/80 border-[#E2DAD0]' : 'bg-[#181818]/90 border-[#333333]'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-sm font-bold text-[#D4AF37]">
                {currentUser?.avatar || '🧑‍🍳'}
              </div>
              <div>
                <span className="font-bold block text-xs">
                  {currentUser?.name || 'الشيف المسؤول'}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  {currentUser?.jobTitle || 'شيف مخبوزات وإنتاج'}
                </span>
              </div>
            </div>

            <div
              className={`p-2 sm:p-2.5 rounded-2xl border flex items-center gap-2 text-[11px] font-bold ${
                isLight
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              }`}
              title="صلاحيات محددة لطلب مقادير الإنتاج فقط. لا يمكن تغيير أسعار البيع أو نسب الوصفات"
            >
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="leading-tight hidden sm:block">
                <span className="block text-[10px] text-amber-600 dark:text-amber-400">نظام حماية البيانات</span>
                <span>الأسعار والوصفات محمية</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick KPI stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5 pt-4 border-t border-stone-200 dark:border-stone-800">
          <div
            className={`p-2.5 sm:p-3 rounded-2xl border ${
              isLight ? 'bg-white/90 border-[#EADECE]' : 'bg-[#141414] border-[#2A2A2A]'
            }`}
          >
            <span className="text-[11px] text-stone-500 dark:text-stone-400 block mb-0.5">
              الأصناف المتاحة للخبز
            </span>
            <span className="text-base sm:text-xl font-black font-mono text-[#D4AF37]">
              {products.length} صنف
            </span>
          </div>

          <div
            className={`p-2.5 sm:p-3 rounded-2xl border ${
              isLight ? 'bg-white/90 border-[#EADECE]' : 'bg-[#141414] border-[#2A2A2A]'
            }`}
          >
            <span className="text-[11px] text-stone-500 dark:text-stone-400 block mb-0.5">
              أصناف بحاجة للخبز فوراً
            </span>
            <span className="text-base sm:text-xl font-black font-mono text-amber-500">
              {lowStockProducts.length} صنف
            </span>
          </div>

          <div
            className={`p-2.5 sm:p-3 rounded-2xl border ${
              isLight ? 'bg-white/90 border-[#EADECE]' : 'bg-[#141414] border-[#2A2A2A]'
            }`}
          >
            <span className="text-[11px] text-stone-500 dark:text-stone-400 block mb-0.5">
              خامات ومقادير في المخزن
            </span>
            <span className="text-base sm:text-xl font-black font-mono text-emerald-500">
              {rawMaterials.length} مادة خام
            </span>
          </div>

          <div
            className={`p-2.5 sm:p-3 rounded-2xl border ${
              isLight ? 'bg-white/90 border-[#EADECE]' : 'bg-[#141414] border-[#2A2A2A]'
            }`}
          >
            <span className="text-[11px] text-stone-500 dark:text-stone-400 block mb-0.5">
              دفعات تم إنتاجها اليوم
            </span>
            <span className="text-base sm:text-xl font-black font-mono text-blue-400">
              {todayBatchLogs.length} دفعة
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Tabs (Production / Today History / Pantry Monitor) */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('production')}
            className={`cursor-pointer px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeTab === 'production'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black shadow-md shadow-[#D4AF37]/20'
                : isLight
                ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                : 'bg-[#1E1E1E] hover:bg-[#282828] text-stone-300'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>طلب مقادير وخبز دفعات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`cursor-pointer px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black shadow-md shadow-[#D4AF37]/20'
                : isLight
                ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                : 'bg-[#1E1E1E] hover:bg-[#282828] text-stone-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل خبز اليوم ({todayBatchLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`cursor-pointer px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeTab === 'materials'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black shadow-md shadow-[#D4AF37]/20'
                : isLight
                ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                : 'bg-[#1E1E1E] hover:bg-[#282828] text-stone-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>أرصدة الخامات بالمخزن</span>
          </button>
        </div>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'production' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div
            className={`p-3 sm:p-4 rounded-3xl border space-y-3 ${
              isLight ? 'bg-white border-[#EADECE]' : 'bg-[#141414] border-[#2A2A2A]'
            }`}
          >
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم الصنف أو الباركود..."
                  className={`w-full pr-9 pl-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                    isLight
                      ? 'bg-[#FAF8F5] border-[#E2DAD0] text-[#1F1B16]'
                      : 'bg-[#1C1C1C] border-[#333333] text-[#F5EBE6]'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Unit Type Selector (All vs Kilo/Weight vs Piece) */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-bold text-stone-500 whitespace-nowrap ml-1">
                  طريقة البيع:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedUnitType('all')}
                  className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    selectedUnitType === 'all'
                      ? 'bg-[#D4AF37] text-stone-950 font-black'
                      : isLight
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      : 'bg-[#222222] hover:bg-[#2A2A2A] text-stone-300'
                  }`}
                >
                  جميع الأصناف
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUnitType('weight')}
                  className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                    selectedUnitType === 'weight'
                      ? 'bg-[#D4AF37] text-stone-950 font-black shadow-sm'
                      : isLight
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      : 'bg-[#222222] hover:bg-[#2A2A2A] text-stone-300'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>بالكيلو (وزن)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUnitType('piece')}
                  className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                    selectedUnitType === 'piece'
                      ? 'bg-[#D4AF37] text-stone-950 font-black shadow-sm'
                      : isLight
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      : 'bg-[#222222] hover:bg-[#2A2A2A] text-stone-300'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>بالقطعة</span>
                </button>

                {/* Low stock toggle */}
                <button
                  type="button"
                  onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                  className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap mr-2 ${
                    showLowStockOnly
                      ? 'bg-amber-600 text-white font-black'
                      : isLight
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>منخفض بالمحل فقط ({lowStockProducts.length})</span>
                </button>
              </div>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-stone-200 dark:border-stone-800 pb-1 scrollbar-thin">
              <span className="text-[11px] font-bold text-stone-400 whitespace-nowrap ml-1">
                القسم:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950'
                      : isLight
                      ? 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                      : 'bg-[#1C1C1C] hover:bg-[#262626] text-stone-400'
                  }`}
                >
                  {cat === 'all' ? 'الكل' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const maxBatch = calculateMaxProduction(product);
              const isLowStock = product.stock <= product.minStockAlert;
              const hasRecipe = product.recipe && product.recipe.length > 0;
              const unitText = product.unitType === 'weight' ? 'كجم' : 'قطعة';

              return (
                <div
                  key={product.id}
                  className={`p-4 rounded-3xl border flex flex-col justify-between transition-all hover:shadow-lg ${
                    isLight
                      ? 'bg-white border-[#E8DFC8] hover:border-[#D4AF37]'
                      : 'bg-[#141414] border-[#2A2A2A] hover:border-[#5A451A]'
                  }`}
                >
                  <div>
                    {/* Top row: Image, Name, and Unit Badge */}
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-[#1E1E1E] border border-stone-200 dark:border-stone-700 flex items-center justify-center overflow-hidden shrink-0">
                        {product.image.startsWith('http') || product.image.startsWith('data:') ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{product.image}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-stone-400 truncate">
                            {product.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 ${
                              product.unitType === 'weight'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {product.unitType === 'weight' ? (
                              <>
                                <Scale className="w-3 h-3" />
                                <span>يُباع بالكيلو</span>
                              </>
                            ) : (
                              <>
                                <Package className="w-3 h-3" />
                                <span>يُباع بالقطعة</span>
                              </>
                            )}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 truncate mt-0.5">
                          {product.name}
                        </h3>

                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs font-mono font-bold ${
                              isLowStock ? 'text-red-500' : 'text-emerald-500'
                            }`}
                          >
                            المتوفر بالمحل: {product.stock} {unitText}
                          </span>
                          {isLowStock && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                              منخفض ⚠️
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ingredients & Recipe Preview Box */}
                    <div
                      className={`mt-3 p-3 rounded-2xl border text-xs space-y-2 ${
                        isLight ? 'bg-[#FAF8F5] border-[#EAE2D5]' : 'bg-[#181818] border-[#282828]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400">
                        <span>مقادير الوصفة لكل 1 {unitText}:</span>
                        <span className="text-[#8A6414] dark:text-[#D4AF37]">
                          {hasRecipe ? `${product.recipe.length} مكونات` : 'غير محددة'}
                        </span>
                      </div>

                      {hasRecipe ? (
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                          {product.recipe.map((ing) => {
                            const raw = rawMaterials.find((r) => r.id === ing.rawMaterialId);
                            const rawName = raw ? raw.name : 'مادة خام';
                            const rawUnit = raw ? raw.unit : 'كجم';
                            const rawStock = raw ? raw.currentStock : 0;
                            const isSufficient = rawStock >= ing.quantityNeeded;

                            return (
                              <div
                                key={ing.rawMaterialId}
                                className="flex items-center justify-between text-[10px] text-stone-600 dark:text-stone-300"
                              >
                                <div className="flex items-center gap-1 truncate max-w-[150px]">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isSufficient ? 'bg-emerald-500' : 'bg-red-500'
                                    }`}
                                  />
                                  <span className="truncate">{rawName}</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono">
                                  <span>
                                    {ing.quantityNeeded} {rawUnit}
                                  </span>
                                  <span className="text-stone-400 text-[9px]">
                                    (مخزون: {rawStock} {rawUnit})
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-500 py-1">
                          ⚠️ لا توجد وصفة خامات مضبوطة لهذا الصنف.
                        </div>
                      )}

                      {/* Max possible batch note */}
                      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500 dark:text-stone-400 font-medium">
                          أقصى كمية يمكن خبزها حاليًا:
                        </span>
                        <span className="font-mono font-black text-[#D4AF37]">
                          {hasRecipe ? `${maxBatch} ${unitText}` : '0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button: Request Ingredients & Bake Batch */}
                  <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800">
                    <button
                      type="button"
                      disabled={!hasRecipe || maxBatch <= 0}
                      onClick={() => handleOpenProduce(product)}
                      className={`w-full py-2.5 px-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        !hasRecipe || maxBatch <= 0
                          ? 'opacity-40 cursor-not-allowed bg-stone-200 dark:bg-stone-800 text-stone-500'
                          : 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 shadow-md shadow-[#D4AF37]/20 active:scale-98'
                      }`}
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>طلب مقادير وخبز دفعة ({unitText})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 p-6 rounded-3xl border border-dashed border-stone-300 dark:border-stone-700">
              <Package className="w-10 h-10 mx-auto text-stone-400 mb-2 opacity-50" />
              <h3 className="font-bold text-sm text-stone-700 dark:text-stone-300">
                لا توجد أصناف مطابقة للبحث أو التصفية الحالية
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                جرب تغيير البحث أو اختيار تصنيف آخر
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Tab: Today's Batches History */}
      {activeTab === 'history' && (
        <div
          className={`p-4 sm:p-6 rounded-3xl border space-y-4 ${
            isLight ? 'bg-white border-[#EADECE]' : 'bg-[#141414] border-[#2A2A2A]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                سجل الدفعات المخبوزة اليوم
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                توثيق فوري لكافة الدفعات التي تم طلب مقاديرها وخصمها من المخزن اليوم
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-500 font-bold text-xs">
              {todayBatchLogs.length} عملية إنتاج
            </span>
          </div>

          <div className="space-y-2">
            {todayBatchLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                  isLight ? 'bg-[#FAF8F5] border-[#E8E2D8]' : 'bg-[#181818] border-[#262626]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100">
                      {log.action}
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {log.details}
                    </p>
                  </div>
                </div>

                <div className="text-left font-mono text-[11px] text-stone-400 shrink-0">
                  <span className="block font-bold text-stone-700 dark:text-stone-300">
                    بواسطة: {log.userName}
                  </span>
                  <span>{new Date(log.timestamp).toLocaleTimeString('ar-EG')}</span>
                </div>
              </div>
            ))}

            {todayBatchLogs.length === 0 && (
              <div className="text-center py-10 text-stone-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-bold text-xs">لم يتم إنتاج أي دفعات جديدة اليوم حتى الآن</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  انتقل لتبويب "طلب مقادير وخبز دفعات" للبدء في تجهيز الدفعات
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab: Storehouse Raw Materials Monitor (Read-Only) */}
      {activeTab === 'materials' && (
        <div
          className={`p-4 sm:p-6 rounded-3xl border space-y-4 ${
            isLight ? 'bg-white border-[#EADECE]' : 'bg-[#141414] border-[#2A2A2A]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                أرصدة المواد الخام في المخزن (للقراءة فقط)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                متابعة الخامات والمقادير المتوفرة للخبز دون إمكانية التعديل في التكلفة أو الأسعار
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-xs">
              {rawMaterials.length} مادة خام متوفرة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {rawMaterials.map((raw) => {
              const isLow = raw.currentStock <= raw.minStockAlert;
              return (
                <div
                  key={raw.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    isLight ? 'bg-[#FAF8F5] border-[#E8E2D8]' : 'bg-[#181818] border-[#282828]'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100">
                      {raw.name}
                    </h4>
                    <span className="text-[10px] text-stone-400">
                      حد الأمان: {raw.minStockAlert} {raw.unit}
                    </span>
                  </div>

                  <div className="text-left font-mono">
                    <span
                      className={`text-sm font-black block ${
                        isLow ? 'text-red-500' : 'text-emerald-500'
                      }`}
                    >
                      {raw.currentStock} {raw.unit}
                    </span>
                    {isLow && (
                      <span className="text-[9px] font-bold text-red-500">
                        رصيد حرج ⚠️
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Batch Production Modal / Form */}
      <AnimatePresence>
        {producingProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              if (!isSubmitting) setProducingProduct(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`max-w-lg w-full p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
                isLight
                  ? 'bg-white border-[#E8DFC8] text-[#1F1B16]'
                  : 'bg-[#141414] border-[#5A451A] text-[#F5EBE6]'
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg font-heading">
                      خبز دفعة جديدة: {producingProduct.name}
                    </h3>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      يُباع {producingProduct.unitType === 'weight' ? 'بالكيلو (وزن ⚖️)' : 'بالقطعة 🥐'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setProducingProduct(null)}
                  className="p-1 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold ${
                    feedback.type === 'success'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : 'bg-red-950/80 text-red-300 border border-red-800'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              {/* Quantity Input with Quick Helpers */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  الكمية المراد إنتاجها (
                  {producingProduct.unitType === 'weight' ? 'كيلوجرام' : 'قطعة'}):
                </label>

                <div className="relative">
                  <input
                    type="number"
                    step={producingProduct.unitType === 'weight' ? '0.5' : '1'}
                    min="1"
                    value={produceQty}
                    onChange={(e) => setProduceQty(e.target.value)}
                    className={`w-full text-2xl font-mono font-black p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-left ${
                      isLight
                        ? 'bg-[#FAF8F5] border-[#D8CEBF] text-[#1F1B16]'
                        : 'bg-[#1C1C1C] border-[#444444] text-[#D4AF37]'
                    }`}
                    dir="ltr"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                    {producingProduct.unitType === 'weight' ? 'كجم' : 'قطعة'}
                  </span>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-stone-400 ml-1">إضافة سريعة:</span>
                  {producingProduct.unitType === 'weight' ? (
                    <>
                      {['1', '2', '5', '10', '20'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setProduceQty(val)}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 hover:border-[#D4AF37] bg-stone-100 dark:bg-stone-800 transition"
                        >
                          +{val} كجم
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {['10', '25', '50', '100', '200'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setProduceQty(val)}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 hover:border-[#D4AF37] bg-stone-100 dark:bg-stone-800 transition"
                        >
                          +{val} ق
                        </button>
                      ))}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const max = calculateMaxProduction(producingProduct);
                      setProduceQty(max.toString());
                    }}
                    className="px-2.5 py-1 rounded-xl text-xs font-black border border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition mr-auto"
                  >
                    أقصى كمية ممكنة ({calculateMaxProduction(producingProduct)})
                  </button>
                </div>
              </div>

              {/* Real-time Ingredient Deduction Forecast Table */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  المقادير التي سيتم خصمها من المخزن فورياً لهذه الدفعة:
                </span>

                <div
                  className={`p-3 rounded-2xl border text-xs space-y-2 max-h-48 overflow-y-auto ${
                    isLight ? 'bg-[#FAF8F5] border-[#E8DFC8]' : 'bg-[#1A1A1A] border-[#333333]'
                  }`}
                >
                  {producingProduct.recipe && producingProduct.recipe.length > 0 ? (
                    producingProduct.recipe.map((ing) => {
                      const raw = rawMaterials.find((r) => r.id === ing.rawMaterialId);
                      const qty = parseFloat(produceQty) || 0;
                      const required = +(ing.quantityNeeded * qty).toFixed(3);
                      const available = raw ? raw.currentStock : 0;
                      const remaining = +(available - required).toFixed(3);
                      const isSufficient = available >= required;

                      return (
                        <div
                          key={ing.rawMaterialId}
                          className="flex items-center justify-between pb-1.5 border-b border-stone-200 dark:border-stone-800 last:border-0 last:pb-0"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isSufficient ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                              />
                              <span className="font-bold text-stone-800 dark:text-stone-200">
                                {raw ? raw.name : 'مادة مجهولة'}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-400 block pr-3.5">
                              المطلوب: {required} {raw?.unit} | المتوفر بالمخزن: {available} {raw?.unit}
                            </span>
                          </div>

                          <div className="text-left font-mono">
                            <span
                              className={`text-[11px] font-bold ${
                                isSufficient ? 'text-emerald-500' : 'text-red-500'
                              }`}
                            >
                              {isSufficient ? `متبقي: ${remaining}` : 'عجز بالرصيد ❌'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-2 text-amber-500 text-xs">
                      لا توجد وصفة مواد خام محددة لهذا الصنف.
                    </div>
                  )}
                </div>
              </div>

              {/* Security & Non-Editable Notice */}
              <div
                className={`p-3 rounded-2xl border flex items-start gap-2.5 text-[11px] ${
                  isLight
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-amber-950/20 border-amber-900/50 text-amber-300'
                }`}
              >
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>صلاحية تشغيلية محددة:</strong> بالضغط على الزر أدناه، سيتم خصم المواد الخام المحددة فورياً من رصيد المخزن وإضافة الكمية لرصيد المعروض بالمحل. لا يُسمح بتعديل أسعار البيع أو نسب الوصفات من هذه الواجهة.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setProducingProduct(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer transition"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleExecuteBatch}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md ${
                    isSubmitting
                      ? 'opacity-50 cursor-not-allowed bg-stone-700 text-stone-300'
                      : 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 shadow-[#D4AF37]/20 active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                      <span>جاري الخصم والإنتاج...</span>
                    </>
                  ) : (
                    <>
                      <ChefHat className="w-4 h-4" />
                      <span>تأكيد طلب المقادير والخصم الفوري وبدء الخبز 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
