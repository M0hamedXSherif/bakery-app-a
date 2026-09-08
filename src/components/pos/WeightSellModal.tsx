import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scale, Coins, Check, Calculator, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { useBakery } from '../../context/BakeryContext';

interface WeightSellModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product, weightKg: number, subtotal: number) => void;
}

export const WeightSellModal: React.FC<WeightSellModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { theme } = useBakery();
  const isLight = theme === 'light';

  if (!product || !isOpen) return null;

  const pricePerKg = product.price;

  // Real-time two-way state
  const [weightStr, setWeightStr] = useState<string>('0.5'); // default to 0.5 kg (نصف كيلو)
  const [amountStr, setAmountStr] = useState<string>(
    (0.5 * pricePerKg).toFixed(2)
  );
  const [activeInput, setActiveInput] = useState<'weight' | 'amount'>('weight');

  // Reset when product changes
  useEffect(() => {
    if (product) {
      const defaultWeight = 0.5;
      setWeightStr('0.5');
      setAmountStr((defaultWeight * product.price).toFixed(2));
      setActiveInput('weight');
    }
  }, [product]);

  // Handle Weight change -> updates Amount
  const handleWeightChange = (val: string) => {
    setActiveInput('weight');
    setWeightStr(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const calculatedAmount = +(num * pricePerKg).toFixed(2);
      setAmountStr(calculatedAmount.toString());
    } else if (val === '') {
      setAmountStr('');
    }
  };

  // Handle Amount change -> updates Weight
  const handleAmountChange = (val: string) => {
    setActiveInput('amount');
    setAmountStr(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && pricePerKg > 0) {
      const calculatedWeight = +(num / pricePerKg).toFixed(3);
      setWeightStr(calculatedWeight.toString());
    } else if (val === '') {
      setWeightStr('');
    }
  };

  // Quick weight presets
  const quickWeights = [
    { label: 'ربع كيلو (250 جم)', weight: 0.25 },
    { label: 'نص كيلو (500 جم)', weight: 0.5 },
    { label: 'كيلو إلا ربع (750 جم)', weight: 0.75 },
    { label: '1 كيلو (1000 جم)', weight: 1.0 },
    { label: '1.5 كيلو', weight: 1.5 },
    { label: '2 كيلو', weight: 2.0 },
  ];

  // Quick amount presets
  const quickAmounts = [20, 50, 80, 100, 150, 200];

  const currentWeightNum = parseFloat(weightStr) || 0;
  const currentAmountNum = parseFloat(amountStr) || 0;

  const handleKeypadPress = (key: string) => {
    if (activeInput === 'weight') {
      if (key === 'C') {
        setWeightStr('');
        setAmountStr('');
      } else if (key === 'DEL') {
        const next = weightStr.slice(0, -1);
        handleWeightChange(next);
      } else {
        if (key === '.' && weightStr.includes('.')) return;
        const next = weightStr + key;
        handleWeightChange(next);
      }
    } else {
      if (key === 'C') {
        setAmountStr('');
        setWeightStr('');
      } else if (key === 'DEL') {
        const next = amountStr.slice(0, -1);
        handleAmountChange(next);
      } else {
        if (key === '.' && amountStr.includes('.')) return;
        const next = amountStr + key;
        handleAmountChange(next);
      }
    }
  };

  const handleConfirm = () => {
    if (currentWeightNum <= 0 || currentAmountNum <= 0) return;
    onConfirm(product, currentWeightNum, currentAmountNum);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md transition-all"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-2xl max-h-[85vh] max-h-[85dvh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
            isLight
              ? 'bg-white border-[#E8E2D8] text-[#1F1B16]'
              : 'bg-[#141414] border-[#2A2A2A] text-[#E0D8D0]'
          }`}
        >
          {/* Header */}
          <div
            className={`px-5 py-3.5 sm:py-4 flex items-center justify-between border-b flex-shrink-0 ${
              isLight
                ? 'bg-gradient-to-r from-[#FAF4E8] via-[#F5ECD8] to-[#FFFDF8] border-[#E8E0D2] text-[#1F1B16]'
                : 'bg-gradient-to-r from-[#241B0E] via-[#1C150A] to-[#141414] border-[#2A2A2A] text-[#F5EBE6]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 sm:p-2.5 rounded-2xl border ${
                  isLight
                    ? 'bg-[#FDF7E7] border-[#ECD9B4] text-[#8A6414]'
                    : 'bg-[#2A2012] border-[#4A3B1B] text-[#D4AF37]'
                }`}
              >
                <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-lg sm:text-xl font-bold font-heading ${
                      isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                    }`}
                  >
                    {product.name}
                  </h3>
                  <span
                    className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold border ${
                      isLight
                        ? 'bg-[#FDF7E7] text-[#8A6414] border-[#ECD9B4]'
                        : 'bg-[#241D12] text-[#D4AF37] border-[#5A451A]'
                    }`}
                  >
                    بيع بالوزن
                  </span>
                </div>
                <div
                  className={`flex items-center gap-3 text-xs sm:text-sm mt-0.5 ${
                    isLight ? 'text-[#6E6359]' : 'text-[#A8A096]'
                  }`}
                >
                  <span>
                    سعر الكيلو:{' '}
                    <span
                      className={`font-extrabold text-sm sm:text-base ${
                        isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                      }`}
                    >
                      {pricePerKg} ج.م
                    </span>
                  </span>
                  <span className={isLight ? 'text-stone-300' : 'text-[#555]'}>•</span>
                  <span>
                    المتوفر بالمخزن:{' '}
                    <span
                      className={`font-bold font-mono ${
                        isLight ? 'text-amber-700' : 'text-amber-400'
                      }`}
                    >
                      {product.stock} كجم
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isLight
                  ? 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                  : 'text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#222222]'
              }`}
              title="إغلاق"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto min-h-0">
            {/* Stock Exceeded Warning Banner */}
            {currentWeightNum > product.stock && (
              <div
                className={`border rounded-2xl p-3 text-xs font-bold flex items-center justify-between gap-2 ${
                  isLight
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-red-950/90 border-red-800 text-red-200'
                }`}
              >
                <span>
                  ⚠️ الوزن المطلوب ({currentWeightNum} كجم) يتجاوز الرصيد المتوفر بالمخزن ({product.stock} كجم)!
                </span>
                <button
                  type="button"
                  onClick={() => handleWeightChange(product.stock.toString())}
                  className="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold shrink-0 transition"
                >
                  تعيين للحد الأقصى ({product.stock} كجم)
                </button>
              </div>
            )}

            {/* Two-Way Interactive Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Weight input box */}
              <div
                onClick={() => setActiveInput('weight')}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  activeInput === 'weight'
                    ? isLight
                      ? 'border-[#D4AF37] bg-[#FDFBF7] ring-4 ring-[#D4AF37]/15'
                      : 'border-[#D4AF37] bg-[#221C11] ring-4 ring-[#D4AF37]/10'
                    : isLight
                    ? 'border-[#E5DDD2] hover:border-[#D4AF37] bg-[#FAF8F5]'
                    : 'border-[#2A2A2A] hover:border-[#3A3A3A] bg-[#181818]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${
                      isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                    }`}
                  >
                    <Scale
                      className={`w-4 h-4 ${
                        isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                      }`}
                    />
                    الوزن المطلوب (كجم)
                  </span>
                  {activeInput === 'weight' && (
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${
                        isLight
                          ? 'text-[#8A6414] bg-[#FDF7E7] border-[#ECD9B4]'
                          : 'text-[#D4AF37] bg-[#3D2E14] border-[#5A451A]'
                      }`}
                    >
                      الحقل النشط
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={weightStr}
                    onChange={(e) => handleWeightChange(e.target.value)}
                    onFocus={() => setActiveInput('weight')}
                    placeholder="0.00"
                    className={`w-full text-2xl sm:text-3xl font-extrabold bg-transparent focus:outline-none text-left font-mono ${
                      isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                    }`}
                    dir="ltr"
                  />
                  <span
                    className={`absolute left-0 bottom-1 text-[10px] sm:text-xs font-sans pointer-events-none ${
                      isLight ? 'text-[#7A6F65]' : 'text-[#8C827A]'
                    }`}
                  >
                    كجم (KG)
                  </span>
                </div>
                <div
                  className={`text-[11px] sm:text-xs mt-1.5 ${
                    isLight ? 'text-[#7A6F65]' : 'text-[#8C827A]'
                  }`}
                >
                  {currentWeightNum >= 1
                    ? `${currentWeightNum} كجم (${(currentWeightNum * 1000).toLocaleString()} جرام)`
                    : `${(currentWeightNum * 1000).toLocaleString()} جرام`}
                </div>
              </div>

              {/* Amount input box */}
              <div
                onClick={() => setActiveInput('amount')}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  activeInput === 'amount'
                    ? isLight
                      ? 'border-emerald-600 bg-emerald-50/50 ring-4 ring-emerald-500/15'
                      : 'border-[#D4AF37] bg-[#221C11] ring-4 ring-[#D4AF37]/10'
                    : isLight
                    ? 'border-[#E5DDD2] hover:border-emerald-500 bg-[#FAF8F5]'
                    : 'border-[#2A2A2A] hover:border-[#3A3A3A] bg-[#181818]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${
                      isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-emerald-600" />
                    المبلغ المطلوب (ج.م)
                  </span>
                  {activeInput === 'amount' && (
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${
                        isLight
                          ? 'text-emerald-800 bg-emerald-100 border-emerald-300'
                          : 'text-emerald-300 bg-emerald-950 border-emerald-800'
                      }`}
                    >
                      الحقل النشط
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={amountStr}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onFocus={() => setActiveInput('amount')}
                    placeholder="0.00"
                    className={`w-full text-2xl sm:text-3xl font-extrabold bg-transparent focus:outline-none text-left font-mono ${
                      isLight ? 'text-emerald-700' : 'text-emerald-400'
                    }`}
                    dir="ltr"
                  />
                  <span
                    className={`absolute left-0 bottom-1 text-[10px] sm:text-xs font-sans pointer-events-none ${
                      isLight ? 'text-emerald-700/80' : 'text-emerald-500/70'
                    }`}
                  >
                    جنيه (EGP)
                  </span>
                </div>
                <div
                  className={`text-[11px] sm:text-xs mt-1.5 ${
                    isLight ? 'text-[#7A6F65]' : 'text-[#8C827A]'
                  }`}
                >
                  محسوب على أساس {pricePerKg} ج/كجم
                </div>
              </div>
            </div>

            {/* Quick Weight Buttons */}
            <div>
              <label
                className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider block mb-2 ${
                  isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
                }`}
              >
                ⚡ أوزان سريعة ومشهورة:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                {quickWeights.map((qw) => {
                  const isSelected =
                    Math.abs(currentWeightNum - qw.weight) < 0.001;
                  return (
                    <button
                      key={qw.weight}
                      type="button"
                      onClick={() => handleWeightChange(qw.weight.toString())}
                      className={`cursor-pointer px-3 py-2 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center justify-between border ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black border-[#D4AF37] shadow-md shadow-[#D4AF37]/20'
                          : isLight
                          ? 'bg-[#F8F5F0] text-[#5C5248] hover:bg-[#FDF7E7] hover:border-[#D4AF37] border-[#E2DAD0]'
                          : 'bg-[#181818] text-[#A8A096] hover:bg-[#222222] hover:border-[#D4AF37]/40 border-[#2A2A2A]'
                      }`}
                    >
                      <span>{qw.label}</span>
                      <span
                        className={`text-[11px] font-bold ${
                          isSelected
                            ? 'text-stone-900'
                            : isLight
                            ? 'text-[#8A6414]'
                            : 'text-[#8C827A]'
                        }`}
                      >
                        {(qw.weight * pricePerKg).toFixed(0)} ج
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label
                className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider block mb-2 ${
                  isLight ? 'text-[#6E6359]' : 'text-[#8C827A]'
                }`}
              >
                💵 مبالغ سريعة (بكام جنيه؟):
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {quickAmounts.map((amt) => {
                  const isSelected = Math.abs(currentAmountNum - amt) < 0.1;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAmountChange(amt.toString())}
                      className={`cursor-pointer px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-600 shadow-md'
                          : isLight
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
                          : 'bg-[#122218] text-emerald-300 hover:bg-[#183022] border-[#1B4D2F]'
                      }`}
                    >
                      {amt} ج.م
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keypad for Touchscreens */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border ${
                isLight
                  ? 'bg-[#FAF8F5] border-[#E5DDD2]'
                  : 'bg-[#181818] border-[#2A2A2A]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-bold flex items-center gap-1 ${
                    isLight ? 'text-[#5C5248]' : 'text-[#A8A096]'
                  }`}
                >
                  <Calculator
                    className={`w-3.5 h-3.5 ${
                      isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                    }`}
                  />
                  لوحة مفاتيح اللمس السريع ({activeInput === 'weight' ? 'الوزن' : 'المبلغ'}):
                </span>
                <span
                  className={`text-[10px] sm:text-xs ${
                    isLight ? 'text-[#8E847A]' : 'text-[#8C827A]'
                  }`}
                >
                  انقر على الحقل لتغيير اتجاه الإدخال
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5 max-w-sm mx-auto">
                {['7', '8', '9', 'C', '4', '5', '6', 'DEL', '1', '2', '3', '.', '0', '00', '0.25', '0.5'].map(
                  (key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeypadPress(key)}
                      className={`cursor-pointer h-10 sm:h-11 rounded-xl font-bold text-sm sm:text-base transition active:scale-95 shadow-xs border ${
                        key === 'C'
                          ? isLight
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                            : 'bg-red-950/60 text-red-300 hover:bg-red-900/60 border-red-800'
                          : key === 'DEL'
                          ? isLight
                            ? 'bg-[#FDF7E7] text-[#8A6414] hover:bg-[#F5ECD6] border-[#DFC99E]'
                            : 'bg-[#2E2211] text-[#D4AF37] hover:bg-[#3D2E14] border-[#5A451A]'
                          : key === '.' || key === '00' || key === '0.25' || key === '0.5'
                          ? isLight
                            ? 'bg-stone-100 text-[#1F1B16] hover:bg-stone-200 border-stone-200 text-xs'
                            : 'bg-[#252525] text-[#F5EBE6] hover:bg-[#303030] text-xs border-[#333333]'
                          : isLight
                          ? 'bg-white text-[#1F1B16] hover:bg-stone-100 border-[#E2DAD0]'
                          : 'bg-[#1E1E1E] text-[#F5EBE6] hover:bg-[#282828] border-[#2E2E2E]'
                      }`}
                    >
                      {key}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Summary Box */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between ${
                isLight
                  ? 'bg-gradient-to-r from-[#FDF8EE] to-[#FFFDF8] border-[#ECD9B4]'
                  : 'bg-[#1C160E] border-[#3A2E1A]'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider block ${
                    isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                  }`}
                >
                  ملخص الإضافة للسلة:
                </span>
                <p
                  className={`text-sm sm:text-base font-bold ${
                    isLight ? 'text-[#1F1B16]' : 'text-[#F5EBE6]'
                  }`}
                >
                  {product.name} × {currentWeightNum} كجم
                </p>
                <p
                  className={`text-[11px] sm:text-xs ${
                    isLight ? 'text-[#7A6F65]' : 'text-[#8C827A]'
                  }`}
                >
                  {currentWeightNum} كجم × {pricePerKg} ج/كجم = {currentAmountNum} ج.م
                </p>
              </div>
              <div className="text-left">
                <div
                  className={`text-xl sm:text-2xl font-black font-mono ${
                    isLight ? 'text-[#8A6414]' : 'text-[#D4AF37]'
                  }`}
                >
                  {currentAmountNum.toFixed(2)}
                  <span
                    className={`text-xs sm:text-sm font-sans font-normal mr-1 ${
                      isLight ? 'text-[#B89028]' : 'text-[#AA820A]'
                    }`}
                  >
                    ج.م
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer (Fixed at bottom) */}
          <div
            className={`px-4 py-3 sm:py-3.5 border-t flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0 ${
              isLight
                ? 'bg-[#FAF8F5] border-[#E8E2D8]'
                : 'bg-[#101010] border-[#2A2A2A]'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`cursor-pointer px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                isLight
                  ? 'text-stone-500 hover:bg-stone-200 hover:text-stone-800'
                  : 'text-[#8C827A] hover:bg-[#222222] hover:text-[#F5EBE6]'
              }`}
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={
                currentWeightNum <= 0 ||
                currentAmountNum <= 0 ||
                currentWeightNum > product.stock
              }
              onClick={handleConfirm}
              className="cursor-pointer px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs sm:text-sm shadow-lg shadow-[#D4AF37]/20 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>
                {currentWeightNum > product.stock
                  ? 'يتجاوز المخزون'
                  : `إضافة للسلة (${currentAmountNum.toFixed(2)} ج.م)`}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
