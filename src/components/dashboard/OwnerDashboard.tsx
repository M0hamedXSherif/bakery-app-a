import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Package,
  Boxes,
  ChefHat,
  RefreshCw,
  Users,
  ShieldCheck,
  History,
  Lock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Scale,
  DollarSign,
  Layers,
  Search,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Calculator,
  Eye,
  FileSpreadsheet,
  Receipt,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Clock,
  Printer,
  Unlock,
  Database,
  Download,
  Upload,
  HardDrive,
  Check,
  Store,
  Save,
  Image as ImageIcon,
  Camera,
  Link as LinkIcon,
  FileText,
  ShieldAlert,
  UserPlus,
  Cloud,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import { StartShiftModal } from '../common/StartShiftModal';
import { CloseShiftModal } from '../common/CloseShiftModal';
import { ZReportModal } from '../common/ZReportModal';
import { Product, RawMaterial, RecipeIngredient, User, SaleRecord, ShiftSession, AuditLog } from '../../types';
import { getShiftDuration, isShiftExpired, getShiftShortId } from '../../utils/shiftUtils';
import { SecuritySettingsTab } from './SecuritySettingsTab';
import { AddStaffModal } from './AddStaffModal';
import { AuditLogDetailsModal } from './AuditLogDetailsModal';
import { fileToOptimizedDataUrl, BAKERY_PRESET_IMAGES } from '../../utils/imageUtils';

export const OwnerDashboard: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,

    rawMaterials,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    restockRawMaterial,
    produceBatch,

    sales,
    refundRequests,
    approveRefund,
    rejectRefund,

    users,
    approveStaff,
    rejectStaff,
    deleteUser,
    deactivateUser,
    reactivateUser,
    permanentDeleteUser,
    updateUserDepartment,

    auditLogs,
    logAuditAction,
    currentShift,
    shiftHistory,
    closeShift,
    startShift,
    suspendCurrentShift,
    resumeCurrentShift,
    updateActiveShiftSchedule,

    lowStockProducts,
    lowStockRawMaterials,
    pendingRefundsCount,
    pendingUsersCount,
    currentUser,

    bakerySettings,
    updateBakeryName,
    updateBakerySettings,

    exportBackupJSON,
    restoreBackupJSON,
    exportSalesCSV,

    supabaseConnected,
    syncProductsToSupabase,
  } = useBakery();

  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);
  const [supabaseSyncMsg, setSupabaseSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDashboardSupabaseSync = async () => {
    setIsSupabaseSyncing(true);
    setSupabaseSyncMsg(null);
    try {
      const res = await syncProductsToSupabase();
      setSupabaseSyncMsg({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } catch (err: any) {
      setSupabaseSyncMsg({
        type: 'error',
        text: err?.message || 'تعذر الاتصال بـ Supabase',
      });
    } finally {
      setIsSupabaseSyncing(false);
    }
  };

  // Active dashboard tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'sales'
    | 'products'
    | 'raw_materials'
    | 'recipes'
    | 'refunds'
    | 'staff'
    | 'audit'
    | 'shifts'
    | 'security'
    | 'settings'
    | 'backup'
  >('overview');

  // Bakery Profile Settings Local Edit State
  const [settingsForm, setSettingsForm] = useState({
    name: bakerySettings.name,
    slogan: bakerySettings.slogan,
    phone: bakerySettings.phone,
    taxNumber: bakerySettings.taxNumber,
    address: bakerySettings.address || '',
    logoEmoji: bakerySettings.logoEmoji || '🥐',
    logoUrl: bakerySettings.logoUrl || '',
  });
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url' | 'emoji'>('upload');
  const [settingsFeedback, setSettingsFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Synchronize settings form when bakery settings change
  React.useEffect(() => {
    setSettingsForm({
      name: bakerySettings.name,
      slogan: bakerySettings.slogan,
      phone: bakerySettings.phone,
      taxNumber: bakerySettings.taxNumber,
      address: bakerySettings.address || '',
      logoEmoji: bakerySettings.logoEmoji || '🥐',
      logoUrl: bakerySettings.logoUrl || '',
    });
  }, [bakerySettings]);

  // Backup & Restore State
  const [backupFeedback, setBackupFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Selected Invoice for Detailed Inspection
  const [selectedInvoice, setSelectedInvoice] = useState<SaleRecord | null>(null);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<string>('all');

  // Product Add / Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('مخبوزات طازجة');
  const [prodUnitType, setProdUnitType] = useState<'piece' | 'weight'>('piece');
  const [prodPrice, setProdPrice] = useState('5');
  const [prodStock, setProdStock] = useState('50');
  const [prodMinAlert, setProdMinAlert] = useState('10');
  const [prodImage, setProdImage] = useState('');
  const [prodImageMode, setProdImageMode] = useState<'upload' | 'url' | 'preset'>('upload');
  const [isDraggingProdImage, setIsDraggingProdImage] = useState(false);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodDesc, setProdDesc] = useState('');

  // Raw Material Add / Edit / Restock Modal State
  const [editingRaw, setEditingRaw] = useState<RawMaterial | null>(null);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [rawName, setRawName] = useState('');
  const [rawStock, setRawStock] = useState('50');
  const [rawUnit, setRawUnit] = useState<'kg' | 'liter' | 'gram' | 'piece'>('kg');
  const [rawMinAlert, setRawMinAlert] = useState('15');
  const [rawCost, setRawCost] = useState('25');
  const [rawSupplier, setRawSupplier] = useState('');

  // Restock flyout modal
  const [restockingRaw, setRestockingRaw] = useState<RawMaterial | null>(null);
  const [restockAmount, setRestockAmount] = useState('20');

  // Batch Produce Modal State
  const [producingProduct, setProducingProduct] = useState<Product | null>(null);
  const [produceQty, setProduceQty] = useState('10');
  const [isProducing, setIsProducing] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [selectedAuditLogForModal, setSelectedAuditLogForModal] = useState<AuditLog | null>(null);
  const [produceFeedback, setProduceFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Recipe Formulation Editor Modal State
  const [editingRecipeProduct, setEditingRecipeProduct] = useState<Product | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);

  // Shift Close & Start Modal State
  const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [inspectZReportShift, setInspectZReportShift] = useState<ShiftSession | null>(null);
  const [actualCashInput, setActualCashInput] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [shiftCloseFeedback, setShiftCloseFeedback] = useState<string | null>(null);

  // Audit search & filter
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Staff Role/Department edit modal state
  const [editingStaffUser, setEditingStaffUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<'owner' | 'staff'>('staff');
  const [editDepartment, setEditDepartment] = useState<string>('كاشير ومبيعات');
  const [editJobTitle, setEditJobTitle] = useState<string>('كاشير');
  const [editPreferredView, setEditPreferredView] = useState<'pos' | 'kitchen'>('pos');

  // Deactivation confirmation modal state
  const [deactivatingStaffUser, setDeactivatingStaffUser] = useState<User | null>(null);

  // Shift schedule adjustment state
  const [isAdjustingSchedule, setIsAdjustingSchedule] = useState(false);
  const [customScheduleTime, setCustomScheduleTime] = useState<string>('');

  // Overview Analytics Calculations
  const analytics = useMemo(() => {
    const completedSales = sales.filter((s) => s.status === 'completed' || s.status === 'refund_requested');
    const totalRevenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0);

    let totalWeightSoldKg = 0;
    let weightRevenue = 0;
    let pieceRevenue = 0;
    const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};

    completedSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!itemCounts[item.productId]) {
          itemCounts[item.productId] = { name: item.productName, count: 0, revenue: 0 };
        }
        itemCounts[item.productId].revenue += item.subtotal;

        if (item.unitType === 'weight' && item.weightKg) {
          totalWeightSoldKg += item.weightKg;
          weightRevenue += item.subtotal;
          itemCounts[item.productId].count += item.weightKg;
        } else {
          pieceRevenue += item.subtotal;
          itemCounts[item.productId].count += item.quantity;
        }
      });
    });

    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders: completedSales.length,
      totalWeightSoldKg,
      weightRevenue,
      pieceRevenue,
      avgTicket: completedSales.length > 0 ? totalRevenue / completedSales.length : 0,
      topItems,
    };
  }, [sales]);

  // Handle Open Product Modal for Add / Edit
  const openProductModal = (product?: Product) => {
    setImageUploadError(null);
    setIsOptimizingImage(false);
    if (product) {
      setEditingProduct(product);
      setProdName(product.name);
      setProdCategory(product.category);
      setProdUnitType(product.unitType);
      setProdPrice(product.price.toString());
      setProdStock(product.stock.toString());
      setProdMinAlert(product.minStockAlert.toString());
      setProdImage(product.image);
      setProdImageMode(product.image.startsWith('data:') ? 'upload' : 'url');
      setProdBarcode(product.barcode || '');
      setProdDesc(product.description || '');
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdCategory('مخبوزات طازجة');
      setProdUnitType('piece');
      setProdPrice('5');
      setProdStock('50');
      setProdMinAlert('10');
      setProdImage('https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80');
      setProdImageMode('upload');
      setProdBarcode('');
      setProdDesc('');
    }
    setIsProductModalOpen(true);
  };

  // Handle local device image upload & optimization for product
  const handleProductImageFile = async (file?: File) => {
    if (!file) return;
    setImageUploadError(null);
    if (!file.type.startsWith('image/')) {
      setImageUploadError('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageUploadError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 10 ميجابايت');
      return;
    }

    try {
      setIsOptimizingImage(true);
      const optimized = await fileToOptimizedDataUrl(file, 640, 640, 0.82);
      setProdImage(optimized);
      setProdImageMode('upload');
    } catch {
      setImageUploadError('تعذر معالجة الصورة، يرجى المحاولة مرة أخرى');
    } finally {
      setIsOptimizingImage(false);
    }
  };

  // Handle Save Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const productPayload = {
      name: prodName.trim(),
      category: prodCategory.trim(),
      unitType: prodUnitType,
      price: parseFloat(prodPrice) || 0,
      stock: parseFloat(prodStock) || 0,
      minStockAlert: parseFloat(prodMinAlert) || 5,
      image: prodImage || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
      barcode: prodBarcode.trim() || undefined,
      description: prodDesc.trim() || undefined,
      isAvailable: true,
      recipe: editingProduct?.recipe || [],
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }
    setIsProductModalOpen(false);
  };

  // Handle Open Raw Material Modal for Add / Edit
  const openRawModal = (raw?: RawMaterial) => {
    if (raw) {
      setEditingRaw(raw);
      setRawName(raw.name);
      setRawStock(raw.currentStock.toString());
      setRawUnit(raw.unit);
      setRawMinAlert(raw.minStockAlert.toString());
      setRawCost(raw.costPerUnit.toString());
      setRawSupplier(raw.supplier || '');
    } else {
      setEditingRaw(null);
      setRawName('');
      setRawStock('50');
      setRawUnit('kg');
      setRawMinAlert('15');
      setRawCost('30');
      setRawSupplier('');
    }
    setIsRawModalOpen(true);
  };

  // Handle Save Raw Material
  const handleSaveRaw = (e: React.FormEvent) => {
    e.preventDefault();
    const rawPayload = {
      name: rawName.trim(),
      currentStock: parseFloat(rawStock) || 0,
      unit: rawUnit,
      minStockAlert: parseFloat(rawMinAlert) || 10,
      costPerUnit: parseFloat(rawCost) || 0,
      supplier: rawSupplier.trim() || undefined,
    };

    if (editingRaw) {
      updateRawMaterial(editingRaw.id, rawPayload);
    } else {
      addRawMaterial(rawPayload);
    }
    setIsRawModalOpen(false);
  };

  // Handle Restock Raw Material
  const handleConfirmRestock = () => {
    if (!restockingRaw) return;
    const amount = parseFloat(restockAmount);
    if (amount > 0) {
      restockRawMaterial(restockingRaw.id, amount);
      setRestockingRaw(null);
      setRestockAmount('20');
    }
  };

  // Handle Batch Production Execute (Guarded against double clicks)
  const handleExecuteProduce = () => {
    if (!producingProduct || isProducing) return;
    const qty = parseFloat(produceQty);
    if (qty > 0) {
      setIsProducing(true);
      const res = produceBatch(producingProduct.id, qty);
      setProduceFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
      if (res.success) {
        setTimeout(() => {
          setProducingProduct(null);
          setProduceFeedback(null);
          setIsProducing(false);
        }, 1500);
      } else {
        setTimeout(() => {
          setIsProducing(false);
        }, 1000);
      }
    }
  };

  // Recipe Formulation Handlers
  const openRecipeModal = (prod: Product) => {
    setEditingRecipeProduct(prod);
    setRecipeIngredients(prod.recipe ? prod.recipe.map((r) => ({ ...r })) : []);
  };

  const handleAddRecipeIngredient = () => {
    if (rawMaterials.length === 0) return;
    const unusedRaw =
      rawMaterials.find((r) => !recipeIngredients.some((ing) => ing.rawMaterialId === r.id)) ||
      rawMaterials[0];
    setRecipeIngredients((prev) => [
      ...prev,
      { rawMaterialId: unusedRaw.id, quantityNeeded: 0.05 },
    ]);
  };

  const handleUpdateRecipeIngredient = (
    index: number,
    rawMaterialId: string,
    quantityNeeded: number
  ) => {
    setRecipeIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { rawMaterialId, quantityNeeded: Math.max(0, quantityNeeded) };
      return copy;
    });
  };

  const handleRemoveRecipeIngredient = (index: number) => {
    setRecipeIngredients((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipeProduct) return;
    const validIngredients = recipeIngredients.filter(
      (ing) => ing.rawMaterialId && Number(ing.quantityNeeded) > 0
    );
    updateProduct(editingRecipeProduct.id, {
      recipe: validIngredients,
    });
    logAuditAction(
      'تعديل وصفة منتج',
      `تم تحديث مقادير وصفة "${editingRecipeProduct.name}" (${validIngredients.length} خامات مستهلكة)`,
      'inventory'
    );
    setEditingRecipeProduct(null);
  };

  // Handle Shift Close
  const handleConfirmCloseShift = () => {
    const counted = parseFloat(actualCashInput);
    if (isNaN(counted)) return;
    const res = closeShift(counted, shiftNotes);
    setShiftCloseFeedback(res.message);
    setTimeout(() => {
      setIsCloseShiftModalOpen(false);
      setShiftCloseFeedback(null);
    }, 2500);
  };

  // Filtered Sales Records
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (salesFilter !== 'all' && sale.status !== salesFilter) return false;
      if (salesPaymentFilter !== 'all' && sale.paymentMethod !== salesPaymentFilter) return false;
      if (salesSearch.trim()) {
        const q = salesSearch.toLowerCase().trim();
        const matchesInvoice = sale.invoiceNumber.toLowerCase().includes(q);
        const matchesCashier = sale.cashierName.toLowerCase().includes(q);
        const matchesItems = sale.items.some((item) => item.productName.toLowerCase().includes(q));
        return matchesInvoice || matchesCashier || matchesItems;
      }
      return true;
    });
  }, [sales, salesFilter, salesPaymentFilter, salesSearch]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditFilter !== 'all') {
        if (auditFilter === 'security') {
          if (log.type !== 'security' && !log.action.includes('قفل') && !log.action.includes('دخول')) {
            return false;
          }
        } else if (log.type !== auditFilter) {
          return false;
        }
      }
      if (auditSearch.trim()) {
        const query = auditSearch.toLowerCase().trim();
        return (
          log.action.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query) ||
          log.userName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [auditLogs, auditFilter, auditSearch]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6 overflow-x-hidden">
      {/* Dashboard Top Header */}
      <div className="bg-[#141414] rounded-3xl p-5 sm:p-6 border border-[#2A2A2A] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-stone-950 flex items-center justify-center text-2xl shadow-lg shadow-[#D4AF37]/20 font-black">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-heading text-[#F5EBE6]">
                لوحة تحكم إدارة المخبز
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#241D12] text-[#D4AF37] border border-[#5A451A]">
                صلاحية المالك (Owner)
              </span>
            </div>
            <p className="text-xs text-[#8C827A] mt-0.5">
              مراقبة المبيعات • ضبط الوصفات • التحكم بالمخزون والمواد الخام • موافقة الموظفين
            </p>
          </div>
        </div>

        {/* Quick Alerts Summary */}
        <div className="flex items-center gap-2">
          {pendingRefundsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('refunds')}
              className="cursor-pointer px-3 py-1.5 rounded-xl bg-red-950/70 text-red-300 border border-red-800 text-xs font-bold flex items-center gap-1.5 animate-pulse"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{pendingRefundsCount} طلب استرجاع بانتظارك</span>
            </button>
          )}

          {pendingUsersCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className="cursor-pointer px-3 py-1.5 rounded-xl bg-[#282012] text-[#D4AF37] border border-[#5A451A] text-xs font-bold flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{pendingUsersCount} موظف جديد بانتظار الموافقة</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-[#121212] p-1.5 rounded-2xl border border-[#262626]">
        {[
          { id: 'overview', label: 'التقارير والأداء', icon: TrendingUp },
          { id: 'sales', label: `سجل الفواتير (${sales.length})`, icon: Receipt },
          { id: 'products', label: 'المنتجات والأسعار', icon: Package },
          { id: 'raw_materials', label: 'المواد الخام', icon: Boxes },
          { id: 'recipes', label: 'الوصفات والإنتاج', icon: ChefHat },
          {
            id: 'refunds',
            label: `طلبات الاسترجاع ${pendingRefundsCount > 0 ? `(${pendingRefundsCount})` : ''}`,
            icon: RefreshCw,
            highlight: pendingRefundsCount > 0,
          },
          {
            id: 'staff',
            label: `الموظفين والصلاحيات ${pendingUsersCount > 0 ? `(${pendingUsersCount})` : ''}`,
            icon: Users,
            highlight: pendingUsersCount > 0,
          },
          { id: 'audit', label: 'سجل النشاطات والرقابة', icon: ShieldCheck },
          { id: 'shifts', label: 'الشيفتات والخزينة', icon: History },
          { id: 'security', label: 'الأمان والقفل التلقائي', icon: ShieldAlert },
          { id: 'settings', label: 'هوية المخبز والفاتورة', icon: Store },
          { id: 'backup', label: 'مركز الأمان والنسخ الاحتياطي', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`cursor-pointer px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black shadow-md shadow-[#D4AF37]/20'
                  : tab.highlight
                  ? 'bg-red-950/80 text-red-300 font-bold border border-red-700'
                  : 'text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#1E1E1E]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Overview & Reports */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Supabase PostgreSQL Cloud Banner */}
          <div className="bg-gradient-to-r from-[#171614] via-[#1A1813] to-[#141414] p-4 sm:p-5 rounded-3xl border border-[#4A3B1B] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-stone-950 flex items-center justify-center text-xl font-black shadow-md shadow-[#D4AF37]/20 shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold font-heading text-[#F5EBE6]">
                    الربط السحابي المركزي (Supabase PostgreSQL)
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      supabaseConnected
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                        : 'bg-amber-950/80 text-amber-300 border-amber-700'
                    }`}
                  >
                    {supabaseConnected ? 'متصل سحابياً 🟢' : 'قيد المزامنة 🟡'}
                  </span>
                </div>
                <p className="text-xs text-[#8C827A] mt-0.5">
                  حفظ الفواتير والخصم التلقائي للمخزون عبر Transactions ذريّة لحظية مع المزامنة بين أجهزة الكاشير والموبايل.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={handleDashboardSupabaseSync}
                disabled={isSupabaseSyncing}
                className={`cursor-pointer px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                  isSupabaseSyncing
                    ? 'bg-[#332A15] text-[#D4AF37] border border-[#5A451A] opacity-70 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 hover:brightness-110 shadow-[#D4AF37]/20'
                }`}
                title="رفع الأصناف والأسعار الحالية إلى قاعدة بيانات Supabase"
              >
                <Cloud className="w-4 h-4" />
                <span>{isSupabaseSyncing ? 'جارٍ رفع ومزامنة كل البيانات...' : 'مزامنة كل البيانات للسحابة الآن (شامل) ☁️'}</span>
              </button>
            </div>
          </div>

          {/* Cloud Sync Feedback Alert */}
          {supabaseSyncMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-md border ${
                supabaseSyncMsg.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700'
                  : 'bg-red-950/90 text-red-200 border-red-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{supabaseSyncMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setSupabaseSyncMsg(null)}
                className="cursor-pointer text-white/60 hover:text-white text-xs px-2 py-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] shadow-sm">
              <span className="text-xs font-bold text-[#8C827A] block mb-1">
                إجمالي إيراد المبيعات
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#D4AF37] font-mono">
                {analytics.totalRevenue.toFixed(2)}{' '}
                <span className="text-xs font-sans text-[#A8A096] font-bold">ج.م</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold block mt-2">
                ↑ {analytics.totalOrders} فواتير مكتملة
              </span>
            </div>

            <div className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] shadow-sm">
              <span className="text-xs font-bold text-[#8C827A] block mb-1">
                إجمالي الوزن المباع
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#F5EBE6] font-mono">
                {analytics.totalWeightSoldKg.toFixed(2)}{' '}
                <span className="text-xs font-sans text-[#D4AF37] font-bold">كجم</span>
              </div>
              <span className="text-[11px] text-[#8C827A] block mt-2">
                بقيمة {analytics.weightRevenue.toFixed(0)} ج.م
              </span>
            </div>

            <div className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] shadow-sm">
              <span className="text-xs font-bold text-[#8C827A] block mb-1">
                مبيعات القطع الفردية
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#E0D8D0] font-mono">
                {analytics.pieceRevenue.toFixed(2)}{' '}
                <span className="text-xs font-sans text-[#8C827A] font-bold">ج.م</span>
              </div>
              <span className="text-[11px] text-[#8C827A] block mt-2">
                فينو، مشلتت، باتيه، قرص
              </span>
            </div>

            <div className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] shadow-sm">
              <span className="text-xs font-bold text-[#8C827A] block mb-1">
                متوسط قيمة الفاتورة
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {analytics.avgTicket.toFixed(2)}{' '}
                <span className="text-xs font-sans text-emerald-500 font-bold">ج.م</span>
              </div>
              <span className="text-[11px] text-emerald-400/80 block mt-2">
                معدل إنفاق العميل
              </span>
            </div>
          </div>

          {/* Top Products & Low Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Selling Baked Goods */}
            <div className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] shadow-sm">
              <h3 className="font-bold text-base text-[#F5EBE6] font-heading mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                الأصناف الأكثر مبيعاً وتحقيقاً للإيراد
              </h3>

              {analytics.topItems.length === 0 ? (
                <p className="text-xs text-[#8C827A] py-6 text-center">
                  لا توجد بيانات مبيعات كافية بعد
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.topItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1A1A] border border-[#262626]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#D4AF37] text-stone-950 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-[#F5EBE6]">{item.name}</h4>
                          <span className="text-[11px] text-[#8C827A]">
                            الكمية المباعة: {item.count.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="text-left font-mono font-bold text-[#D4AF37]">
                        {item.revenue.toFixed(2)} ج.م
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Warning Center */}
            <div className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#F5EBE6] font-heading mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  مركز تنبيهات المخزون الحرج
                </h3>
                <p className="text-xs text-[#8C827A] mb-4">
                  أصناف ومواد خام تجاوزت حد الأمان الأدنى وتحتاج إلى إنتاج أو توريد فوري
                </p>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl bg-[#241D12] border border-[#5A451A] flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-[#F5EBE6]">
                          🥖 {p.name} (منتج تام)
                        </span>
                        <div className="text-[10px] text-[#A8A096]">
                          الحد الأدنى للتنبيه: {p.minStockAlert} | المتبقي:{' '}
                          <strong className="text-[#D4AF37]">{p.stock}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProducingProduct(p);
                          setActiveTab('recipes');
                        }}
                        className="cursor-pointer px-3 py-1 rounded-xl bg-[#D4AF37] hover:bg-[#E5C04B] text-stone-950 font-black text-xs shadow-xs"
                      >
                        إنتاج دفعة
                      </button>
                    </div>
                  ))}

                  {lowStockRawMaterials.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-2xl bg-red-950/40 border border-red-800/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-red-200">
                          🌾 {r.name} (مادة خام)
                        </span>
                        <div className="text-[10px] text-red-300/80">
                          الحد الأدنى: {r.minStockAlert} {r.unit} | الرصيد الحالي:{' '}
                          <strong className="text-red-200">
                            {r.currentStock} {r.unit}
                          </strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRestockingRaw(r);
                          setActiveTab('raw_materials');
                        }}
                        className="cursor-pointer px-3 py-1 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs shadow-xs"
                      >
                        توريد الآن
                      </button>
                    </div>
                  ))}

                  {lowStockProducts.length === 0 && lowStockRawMaterials.length === 0 && (
                    <div className="text-center py-8 text-emerald-300 font-bold text-xs bg-[#11291B] rounded-2xl border border-[#165B37]">
                      كل الأرصدة والمخزون في المستوى الآمن تماماً ✅
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Sales & Invoices Records */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-heading text-[#F5EBE6]">
                سجل الفواتير وتفاصيل المبيعات
              </h3>
              <p className="text-xs text-[#8C827A]">
                استعراض كامل لكافة الفواتير الصادرة، الأصناف المباعة، الأوزان، وطريقة السداد
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A]" />
                <input
                  type="text"
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  placeholder="رقم الفاتورة، كاشير، صنف..."
                  className="w-full text-xs pr-8 pl-3 py-2 bg-[#1E1E1E] text-[#F5EBE6] placeholder-[#6C635B] border border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <select
                value={salesFilter}
                onChange={(e) => setSalesFilter(e.target.value)}
                className="text-xs px-3 py-2 bg-[#1E1E1E] text-[#F5EBE6] border border-[#333333] rounded-xl focus:outline-none font-bold"
              >
                <option value="all">كل الحالات</option>
                <option value="completed">مكتملة ✅</option>
                <option value="refund_requested">طلب استرجاع ⏳</option>
                <option value="refunded">مسترجعة ↩️</option>
                <option value="voided">ملغاة 🚫</option>
              </select>

              <select
                value={salesPaymentFilter}
                onChange={(e) => setSalesPaymentFilter(e.target.value)}
                className="text-xs px-3 py-2 bg-[#1E1E1E] text-[#F5EBE6] border border-[#333333] rounded-xl focus:outline-none font-bold"
              >
                <option value="all">كل طرق الدفع</option>
                <option value="cash">نقدي (كاش)</option>
                <option value="card">بطاقة / فيزا</option>
                <option value="wallet">محفظة / إنستاباي</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  try {
                    const csvContent = exportSalesCSV();
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    const fileName = `bakery_sales_${new Date().toISOString().slice(0, 10)}.csv`;
                    link.setAttribute('href', url);
                    link.setAttribute('download', fileName);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  } catch (err: any) {
                    console.error('CSV export failed', err);
                  }
                }}
                className="cursor-pointer text-xs px-3.5 py-2 bg-[#1E1E1E] hover:bg-[#282828] text-blue-300 border border-blue-700/60 font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95"
                title="تصدير جدول الفواتير إلى ملف Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                <span>تصدير Excel</span>
              </button>
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="bg-[#141414] rounded-3xl p-12 text-center border border-[#2A2A2A]">
              <Receipt className="w-12 h-12 text-[#8C827A] mx-auto mb-2 opacity-50" />
              <h4 className="font-bold text-[#F5EBE6]">لا توجد فواتير مطابقة للبحث</h4>
              <p className="text-xs text-[#8C827A] mt-0.5">
                تأكد من شروط الفلترة أو قم بإجراء عمليات بيع من نقطة البيع
              </p>
            </div>
          ) : (
            <div className="bg-[#141414] rounded-3xl border border-[#2A2A2A] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#101010] text-[#A8A096] uppercase tracking-wider font-bold border-b border-[#262626]">
                    <tr>
                      <th className="p-3.5">رقم الفاتورة</th>
                      <th className="p-3.5">التوقيت والتاريخ</th>
                      <th className="p-3.5">الكاشير</th>
                      <th className="p-3.5">الأصناف</th>
                      <th className="p-3.5">طريقة الدفع</th>
                      <th className="p-3.5">الإجمالي</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]">
                    {filteredSales.map((sale) => {
                      const totalItemsCount = sale.items.reduce(
                        (sum, i) => sum + (i.unitType === 'piece' ? i.quantity : 1),
                        0
                      );
                      const totalWeight = sale.items.reduce(
                        (sum, i) => sum + (i.weightKg || 0),
                        0
                      );

                      return (
                        <tr
                          key={sale.id}
                          className="hover:bg-[#1A1A1A] transition cursor-pointer"
                          onClick={() => setSelectedInvoice(sale)}
                        >
                          <td className="p-3.5 font-mono font-bold text-[#D4AF37]">
                            #{sale.invoiceNumber}
                            {sale.isRetroactive && (
                              <span className="block text-[10px] text-amber-400 font-sans">
                                (أثر رجعي)
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-[#8C827A]">
                            <div className="text-[#F5EBE6] font-medium">
                              {new Date(sale.timestamp).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div className="text-[10px]">
                              {new Date(sale.timestamp).toLocaleDateString('ar-EG')}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-[#F5EBE6]">{sale.cashierName}</span>
                          </td>
                          <td className="p-3.5 text-[#E0D8D0]">
                            <span className="font-bold text-[#F5EBE6]">
                              {sale.items.length} أصناف
                            </span>
                            <span className="text-[11px] text-[#8C827A] block">
                              {totalWeight > 0 ? `(بها ${totalWeight.toFixed(2)} كجم وزن)` : `(${totalItemsCount} قطع)`}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1 font-bold text-[#A8A096]">
                              {sale.paymentMethod === 'cash' ? (
                                <>
                                  <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>نقدي</span>
                                </>
                              ) : sale.paymentMethod === 'card' ? (
                                <>
                                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                                  <span>فيزا</span>
                                </>
                              ) : (
                                <>
                                  <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                                  <span>محفظة</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-sm text-[#D4AF37]">
                            {sale.totalAmount.toFixed(2)} ج.م
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                sale.status === 'completed'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : sale.status === 'refund_requested'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : sale.status === 'refunded'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-red-950 text-red-300 border border-red-800'
                              }`}
                            >
                              {sale.status === 'completed'
                                ? 'مكتملة'
                                : sale.status === 'refund_requested'
                                ? 'طلب استرجاع'
                                : sale.status === 'refunded'
                                ? 'مسترجعة'
                                : 'ملغاة'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInvoice(sale);
                              }}
                              className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-[#222222] hover:bg-[#D4AF37] hover:text-stone-950 text-[#F5EBE6] font-bold text-xs transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>عرض</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Products CRUD Management */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-heading text-[#F5EBE6]">
                إدارة قائمة المنتجات والأسعار
              </h3>
              <p className="text-xs text-[#8C827A]">
                إضافة أصناف جديدة، تعديل أسعار الكيلو أو القطعة، وإدارة صلاحية الحذف
              </p>
            </div>
            <button
              type="button"
              onClick={() => openProductModal()}
              className="cursor-pointer px-4 py-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-[#D4AF37]/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف جديد</span>
            </button>
          </div>

          <div className="bg-[#141414] rounded-3xl border border-[#2A2A2A] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#101010] text-[#A8A096] font-bold border-b border-[#2A2A2A]">
                  <tr>
                    <th className="p-3.5">الصنف</th>
                    <th className="p-3.5">القسم</th>
                    <th className="p-3.5">نوع البيع</th>
                    <th className="p-3.5">السعر</th>
                    <th className="p-3.5">المخزون الحالي</th>
                    <th className="p-3.5">تنبيه الحد الأدنى</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#1C1810] transition">
                      <td className="p-3.5 font-bold text-[#F5EBE6] flex items-center gap-2.5">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-9 h-9 rounded-xl object-cover border border-[#333333]"
                        />
                        <div>
                          <span>{prod.name}</span>
                          {prod.barcode && (
                            <span className="block text-[10px] text-[#8C827A] font-mono">
                              #{prod.barcode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-[#A8A096]">{prod.category}</td>
                      <td className="p-3.5">
                        {prod.unitType === 'weight' ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#282012] text-[#D4AF37] border border-[#5A451A] font-bold text-[10px]">
                            بالوزن (كجم)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#1F1F1F] text-[#E0D8D0] font-bold text-[10px] border border-[#333333]">
                            بالقطعة
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#D4AF37]">
                        {prod.price} {prod.unitType === 'weight' ? 'ج/كجم' : 'ج.م'}
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        <span
                          className={
                            prod.stock <= prod.minStockAlert
                              ? 'text-red-400 font-black'
                              : 'text-[#F5EBE6]'
                          }
                        >
                          {prod.stock} {prod.unitType === 'weight' ? 'كجم' : 'قطعة'}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#8C827A] font-mono">
                        {prod.minStockAlert}
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => toggleProductAvailability(prod.id)}
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] cursor-pointer transition ${
                            prod.isAvailable
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-[#222222] text-[#8C827A] border border-[#333333]'
                          }`}
                        >
                          {prod.isAvailable ? 'متاح للبيع 🟢' : 'معطل ⚪'}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openRecipeModal(prod)}
                            className="p-1.5 text-[#8C827A] hover:text-[#D4AF37] hover:bg-[#222222] rounded-lg transition"
                            title="معايرة وتعديل وصفة الصنف"
                          >
                            <ChefHat className="w-3.5 h-3.5 text-[#D4AF37]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openProductModal(prod)}
                            className="p-1.5 text-[#8C827A] hover:text-[#D4AF37] hover:bg-[#222222] rounded-lg transition"
                            title="تعديل الصنف"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف صنف "${prod.name}" نهائياً؟`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 text-[#8C827A] hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                            title="حذف الصنف (خاص بالمدير فقط)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Raw Materials Management */}
      {activeTab === 'raw_materials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-heading text-[#F5EBE6]">
                إدارة المواد الخام والمخزون التأسيسي
              </h3>
              <p className="text-xs text-[#8C827A]">
                متابعة أرصدة الدقيق، السمن، الخميرة، السكر، وتسجيل التوريدات الجديدة
              </p>
            </div>
            <button
              type="button"
              onClick={() => openRawModal()}
              className="cursor-pointer px-4 py-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-[#D4AF37]/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مادة خام جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rawMaterials.map((raw) => {
              const isLow = raw.currentStock <= raw.minStockAlert;
              return (
                <div
                  key={raw.id}
                  className={`p-4 rounded-3xl bg-[#141414] border transition shadow-xs ${
                    isLow ? 'border-red-800/80 ring-2 ring-red-500/20 bg-red-950/10' : 'border-[#2A2A2A]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-[#F5EBE6] text-sm">{raw.name}</h4>
                      <span className="text-[11px] text-[#8C827A]">
                        المورد: {raw.supplier || 'محلي'}
                      </span>
                    </div>
                    {isLow && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800">
                        مخزون منخفض!
                      </span>
                    )}
                  </div>

                  <div className="my-3 p-3 bg-[#1A1A1A] rounded-2xl flex items-center justify-between border border-[#262626]">
                    <div>
                      <span className="text-[10px] text-[#8C827A] block">الرصيد المتبقي</span>
                      <span className="font-mono font-black text-xl text-[#F5EBE6]">
                        {raw.currentStock} {raw.unit}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-[#8C827A] block">تكلفة الوحدة</span>
                      <span className="font-mono font-bold text-sm text-[#D4AF37]">
                        {raw.costPerUnit} ج/{raw.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#262626] gap-2">
                    <button
                      type="button"
                      onClick={() => setRestockingRaw(raw)}
                      className="cursor-pointer flex-1 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>توريد كمية</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openRawModal(raw)}
                      className="p-1.5 text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#222222] rounded-xl transition"
                      title="تعديل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف مادة ${raw.name}؟`)) {
                          deleteRawMaterial(raw.id);
                        }
                      }}
                      className="p-1.5 text-red-400 hover:bg-red-950/50 rounded-xl transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Recipes & Batch Production */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold font-heading text-[#F5EBE6]">
              ضبط الوصفات وخصم الإنتاج الآلي (Recipes & Batch Production)
            </h3>
            <p className="text-xs text-[#8C827A]">
              تحديد المكونات الخام المستهلكة لكل منتج والخصم التلقائي عند إنتاج دفعة جديدة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((prod) => {
              // Calculate estimated recipe cost per 1 unit
              const recipeCost = (prod.recipe || []).reduce((acc, ing) => {
                const raw = rawMaterials.find((r) => r.id === ing.rawMaterialId);
                return acc + (raw ? raw.costPerUnit * ing.quantityNeeded : 0);
              }, 0);
              const profitMargin =
                prod.price > 0 && recipeCost > 0
                  ? Math.round(((prod.price - recipeCost) / prod.price) * 100)
                  : null;

              return (
                <div
                  key={prod.id}
                  className="bg-[#141414] p-5 rounded-3xl border border-[#2A2A2A] shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-11 h-11 rounded-xl object-cover border border-[#333333]"
                        />
                        <div>
                          <h4 className="font-bold text-[#F5EBE6] text-sm">{prod.name}</h4>
                          <span className="text-[11px] text-[#8C827A]">
                            {prod.unitType === 'weight' ? 'يباع بالوزن (كجم)' : 'يباع بالقطعة'} • سعر البيع:{' '}
                            <strong className="text-[#D4AF37] font-mono">
                              {prod.price} {prod.unitType === 'weight' ? 'ج/كجم' : 'ج.م'}
                            </strong>
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold bg-[#241D12] text-[#D4AF37] px-2.5 py-1 rounded-xl border border-[#5A451A]">
                        رصيد الجاهز: {prod.stock} {prod.unitType === 'weight' ? 'كجم' : 'ق'}
                      </span>
                    </div>

                    {/* Recipe Ingredients List & Cost breakdown */}
                    <div className="space-y-2 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#A8A096]">
                          المكونات لكل 1 {prod.unitType === 'weight' ? 'كجم' : 'قطعة'}:
                        </span>
                        <button
                          type="button"
                          onClick={() => openRecipeModal(prod)}
                          className="cursor-pointer text-[11px] font-bold text-[#D4AF37] hover:text-[#E5C04B] hover:underline inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>تعديل المقادير</span>
                        </button>
                      </div>

                      {prod.recipe && prod.recipe.length > 0 ? (
                        <div className="divide-y divide-[#262626] bg-[#1A1A1A] p-2.5 rounded-2xl border border-[#2A2A2A] text-xs">
                          {prod.recipe.map((ing, idx) => {
                            const raw = rawMaterials.find((r) => r.id === ing.rawMaterialId);
                            const ingCost = raw ? raw.costPerUnit * ing.quantityNeeded : 0;
                            return (
                              <div
                                key={idx}
                                className="py-1.5 first:pt-0 last:pb-0 flex justify-between items-center"
                              >
                                <span className="text-[#E0D8D0]">
                                  🌾 {raw ? raw.name : 'مادة مجهولة'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-[#D4AF37]">
                                    {ing.quantityNeeded} {raw ? raw.unit : 'وحدة'}
                                  </span>
                                  {raw && raw.costPerUnit > 0 && (
                                    <span className="text-[10px] text-[#8C827A] font-mono">
                                      ({ingCost.toFixed(2)} ج)
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Recipe Cost Summary */}
                          <div className="pt-2 mt-1 flex items-center justify-between text-[11px] border-t border-[#333333]">
                            <span className="text-[#8C827A]">تكلفة الخامات التقديرية:</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {recipeCost.toFixed(2)} ج.م
                              {profitMargin !== null && (
                                <span className="text-[10px] text-[#A8A096] mr-1.5">
                                  (هامش ربح ~{profitMargin}%)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-[#1A1A1A] rounded-2xl border border-[#262626] flex items-center justify-between">
                          <p className="text-xs text-[#8C827A] italic">
                            لم يتم تعيين خامات في الوصفة بعد
                          </p>
                          <button
                            type="button"
                            onClick={() => openRecipeModal(prod)}
                            className="cursor-pointer px-2.5 py-1 bg-[#241D12] text-[#D4AF37] hover:bg-[#332715] border border-[#5A451A] rounded-xl text-xs font-bold transition"
                          >
                            + إضافة وصفة
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit Recipe & Batch Produce */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222222]">
                    <button
                      type="button"
                      onClick={() => openRecipeModal(prod)}
                      className="cursor-pointer py-2.5 px-3 rounded-2xl bg-[#202020] hover:bg-[#282828] text-[#F5EBE6] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#333333] transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>تعديل الوصفة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProducingProduct(prod);
                        setProduceQty(prod.unitType === 'weight' ? '5' : '20');
                      }}
                      className="cursor-pointer py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#D4AF37]/20 transition"
                    >
                      <ChefHat className="w-4 h-4 text-stone-950" />
                      <span>خبز وإنتاج دفعة</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: Refund Requests (Owner Approval Matrix) */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold font-heading text-[#F5EBE6]">
              طلبات الاسترجاع والموافقة عن بُعد (Refund Requests)
            </h3>
            <p className="text-xs text-[#8C827A]">
              مصفوفة الصلاحيات: الموظف يطلب فقط، والموافقة واعتماد إرجاع الأموال والمخزون
              من جهاز المدير
            </p>
          </div>

          {refundRequests.length === 0 ? (
            <div className="bg-[#141414] rounded-3xl p-12 text-center border border-[#2A2A2A]">
              <div className="w-14 h-14 rounded-full bg-emerald-950/60 text-emerald-400 flex items-center justify-center mx-auto mb-2 text-xl border border-emerald-800">
                ✓
              </div>
              <h4 className="font-bold text-[#F5EBE6]">لا توجد طلبات استرجاع معلقة</h4>
              <p className="text-xs text-[#8C827A] mt-0.5">
                تظهر هنا أي طلبات استرجاع يرفعها الكاشير مع بيان السبب
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {refundRequests.map((req) => (
                <div
                  key={req.id}
                  className={`p-4 rounded-3xl bg-[#141414] border transition shadow-sm ${
                    req.status === 'pending'
                      ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/20 bg-[#1A1812]'
                      : req.status === 'approved'
                      ? 'border-emerald-800 bg-[#102418]'
                      : 'border-[#2A2A2A] opacity-70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#F5EBE6]">
                          فاتورة #{req.invoiceNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            req.status === 'pending'
                              ? 'bg-[#2E2414] text-[#D4AF37] border border-[#5A451A]'
                              : req.status === 'approved'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}
                        >
                          {req.status === 'pending'
                            ? 'بانتظار موافقتك ⏳'
                            : req.status === 'approved'
                            ? 'تمت الموافقة ✅'
                            : 'تم الرفض ❌'}
                        </span>
                      </div>
                      <p className="text-xs text-[#A8A096] mt-1">
                        طلب من الكاشير:{' '}
                        <strong className="text-[#F5EBE6]">{req.cashierName}</strong> •
                        المبلغ: <strong className="text-[#D4AF37] font-mono">{req.amount} ج.م</strong>
                      </p>
                      <p className="text-xs text-[#E0D8D0] bg-[#1A1A1A] p-2 rounded-xl border border-[#2E2E2E] mt-2">
                        <strong className="text-[#D4AF37]">السبب المسجل:</strong> {req.reason}
                      </p>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => approveRefund(req.id)}
                          className="cursor-pointer flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>موافقة وإعادة للمخزون</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectRefund(req.id)}
                          className="cursor-pointer flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>رفض الطلب</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Staff Management */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-heading text-[#F5EBE6]">
                إدارة الموظفين والصلاحيات والأقسام
              </h3>
              <p className="text-xs text-[#8C827A]">
                تحكم كامل في أقسام الموظفين (كاشير، شيف، مخازن)، مع إضافة وتعيين الموظفين الجدد بحصرية تامة للمدير
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddStaffModalOpen(true)}
              className="cursor-pointer px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 shrink-0 transition active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة موظف جديد (بواسطة المدير)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => {
              const isOwnerUser = user.role === 'owner';
              const isPending = user.status === 'pending';
              const isInactive = user.status === 'inactive' || user.isAccountLocked;
              const isActive = user.status === 'active' && !user.isAccountLocked;

              return (
                <div
                  key={user.id}
                  className={`p-5 rounded-3xl bg-[#141414] border transition shadow-sm flex flex-col justify-between ${
                    isPending
                      ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/20 bg-[#1A1812]'
                      : isInactive
                      ? 'border-stone-800 bg-[#111111] opacity-90'
                      : 'border-[#2A2A2A]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base border ${
                          isInactive
                            ? 'bg-[#1C1C1C] text-stone-500 border-stone-800'
                            : 'bg-[#241D12] text-[#D4AF37] border-[#5A451A]'
                        }`}>
                          {user.avatar || '👤'}
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm ${isInactive ? 'text-stone-400 line-through' : 'text-[#F5EBE6]'}`}>
                            {user.name}
                          </h4>
                          <span className="text-[11px] text-[#8C827A] font-mono">
                            @{user.username}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOwnerUser
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 font-black'
                            : isPending
                            ? 'bg-[#2E2414] text-[#D4AF37] border border-[#5A451A] animate-pulse'
                            : isInactive
                            ? 'bg-red-950/80 text-red-400 border border-red-800/80'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {isOwnerUser
                          ? 'المدير 👑'
                          : isPending
                          ? 'قيد الانتظار ⏳'
                          : isInactive
                          ? 'حساب خامل ⛔'
                          : 'مفعل 🟢'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#A8A096] mb-4 bg-[#1A1A1A] p-3 rounded-xl border border-[#262626]">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">القسم:</span>
                        <span className="font-bold text-[#E0D8D0] bg-[#222222] px-2 py-0.5 rounded-md border border-[#333333]">
                          {user.department || (isOwnerUser ? 'الإدارة العامة' : 'كاشير ومبيعات')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">المسمى الوظيفي:</span>
                        <span className="text-[#D4AF37] font-semibold">
                          {user.jobTitle || (isOwnerUser ? 'المدير العام' : 'كاشير نقطة بيع')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-[#2A2A2A]">
                        <span>الهاتف:</span>
                        <span className="font-mono text-[#F5EBE6]">{user.phone || 'غير مسجل'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>رمز الدخول (PIN):</span>
                        <span className="font-mono font-bold tracking-wider text-[#D4AF37]">{user.pin}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="space-y-2 pt-2 border-t border-[#262626]">
                    {/* Pending Approvals */}
                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => approveStaff(user.id)}
                          className="cursor-pointer flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>موافقة وتفعيل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectStaff(user.id)}
                          className="cursor-pointer flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رفض</span>
                        </button>
                      </div>
                    )}

                    {/* Department & Role Changer */}
                    {!isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaffUser(user);
                            setEditRole(user.role);
                            setEditDepartment(user.department || (user.role === 'owner' ? 'إدارة وإشراف' : 'كاشير ومبيعات'));
                            setEditJobTitle(user.jobTitle || (user.role === 'owner' ? 'المدير العام' : 'كاشير'));
                            setEditPreferredView(
                              user.preferredView === 'kitchen' ||
                                user.department === 'bakery' ||
                                user.department === 'pastry' ||
                                user.department === 'baker' ||
                                user.department === 'pastry_chef' ||
                                user.department === 'مطبخ وإنتاج'
                                ? 'kitchen'
                                : 'pos'
                            );
                          }}
                          className="cursor-pointer flex-1 py-1.5 px-2 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] border border-[#3A3A3A] text-xs font-bold text-[#E0D8D0] flex items-center justify-center gap-1.5 transition"
                        >
                          <Edit2 className="w-3 h-3 text-[#D4AF37]" />
                          <span>تعديل القسم / الصلاحية</span>
                        </button>
                      </div>
                    )}

                    {/* Active non-owner user: Deactivate (Soft-delete) with modal confirmation */}
                    {isActive && !isOwnerUser && (
                      <button
                        type="button"
                        onClick={() => setDeactivatingStaffUser(user)}
                        className="cursor-pointer w-full py-1.5 rounded-xl border border-red-900/60 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span>حذف وتجميد الحساب (جعله خاملاً)</span>
                      </button>
                    )}

                    {/* Inactive user: Reactivate or Permanent Delete */}
                    {isInactive && !isOwnerUser && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => reactivateUser(user.id)}
                          className="cursor-pointer flex-1 py-1.5 rounded-xl bg-emerald-900/40 border border-emerald-700/60 hover:bg-emerald-800/50 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>إعادة تنشيط 🟢</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`تحذير: هل أنت متأكد من الحذف النهائي للموظف "${user.name}"؟ سيتم مسح بياناته نهائياً.`)) {
                              permanentDeleteUser(user.id);
                            }
                          }}
                          className="cursor-pointer px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-800 text-red-400 hover:bg-red-900/60 text-xs font-bold transition"
                          title="حذف نهائي من قاعدة البيانات"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 7: Audit Trail & Security Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-heading text-[#F5EBE6]">
                سجل النشاطات والرقابة (Audit Trail)
              </h3>
              <p className="text-xs text-[#8C827A]">
                توثيق كامل لكل عملية بيع، إلغاء (Void)، تعديل أسعار، توريد، أو موافقة
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="بحث بالسجل..."
                className="text-xs px-3 py-1.5 bg-[#1E1E1E] text-[#F5EBE6] placeholder-[#6C635B] border border-[#333333] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="text-xs px-3 py-1.5 bg-[#1E1E1E] text-[#F5EBE6] border border-[#333333] rounded-xl focus:outline-none font-bold"
              >
                <option value="all">كل العمليات</option>
                <option value="security">أمان وقفل تلقائي ودخول</option>
                <option value="sale">مبيعات</option>
                <option value="void">إلغاءات (Void)</option>
                <option value="refund_approved">استرجاع معتمد</option>
                <option value="stock_change">تغييرات المخزون</option>
                <option value="batch_production">إنتاج دفعات</option>
                <option value="user_approved">الموافقة على موظفين</option>
              </select>
            </div>
          </div>

          <div className="bg-[#141414] rounded-3xl border border-[#2A2A2A] shadow-sm divide-y divide-[#222222] overflow-hidden">
            {filteredAuditLogs.map((log) => {
              const hasDiffs = Array.isArray(log.diffs) && log.diffs.length > 0;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedAuditLogForModal(log)}
                  className="p-4 hover:bg-[#1C1A16] cursor-pointer transition flex items-start gap-3 group"
                  title="اضغط لعرض كافة تفاصيل وفروقات هذه العملية"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 text-xs font-bold transition group-hover:scale-110 ${
                      log.type === 'void'
                        ? 'bg-red-700'
                        : log.type === 'sale'
                        ? 'bg-emerald-700'
                        : log.type === 'refund_approved' || log.type === 'refund_request'
                        ? 'bg-[#B89028] text-stone-950'
                        : log.type === 'batch_production'
                        ? 'bg-purple-700'
                        : log.type === 'stock_change'
                        ? 'bg-amber-700'
                        : 'bg-[#2A2A2A]'
                    }`}
                  >
                    {log.type === 'void'
                      ? '🚫'
                      : log.type === 'sale'
                      ? '💵'
                      : log.type === 'batch_production'
                      ? '🥐'
                      : log.type === 'stock_change'
                      ? '📦'
                      : '📝'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-[#F5EBE6] group-hover:text-[#D4AF37] transition flex items-center gap-2">
                        <span>{log.action}</span>
                        {hasDiffs && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#241D12] text-[#D4AF37] border border-[#5A451A]">
                            🔍 تفاصيل وفروقات ({log.diffs?.length})
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-[#8C827A] font-mono">
                        {new Date(log.timestamp).toLocaleString('ar-EG', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-[#A8A096] mt-0.5">{log.details}</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[10px] font-bold text-[#D4AF37]">
                        بواسطة: {log.userName} ({log.userRole === 'owner' ? 'المدير' : 'كاشير'})
                      </span>
                      <span className="text-[10px] text-[#8C827A] group-hover:text-[#D4AF37] transition flex items-center gap-1">
                        <span>عرض التفاصيل الكاملة</span>
                        <span>←</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 8: Shifts & Cash Drawer Count */}
      {activeTab === 'shifts' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-bold font-heading text-[#F5EBE6]">
              إدارة الورديات وتعداد الخزينة (Shift & Cash Close)
            </h3>
            <p className="text-xs text-[#8C827A]">
              نظام رقابي صارم يمنع تجاوز الوردية لـ 12 ساعة أو بقائها لليوم التالي، مع تسوية نقدية إجبارية واستخراج تقارير Z-Report
            </p>
          </div>

          {/* Active Shift Card */}
          {currentShift ? (
            <div className="bg-gradient-to-br from-[#241D12] via-[#1A1A1A] to-[#121212] text-[#F5EBE6] p-6 rounded-3xl border border-[#5A451A] shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#D4AF37] font-bold">
                      وردية جارية #{getShiftShortId(currentShift.id)}
                    </span>
                    {currentShift.isSuspended || currentShift.status === 'suspended' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 animate-pulse">
                        معلقة مؤقتاً (Suspended) ⏸️
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700">
                        نشطة ومفتوحة 🟢
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[#A8A096] flex-wrap">
                    <span className="font-bold text-[#F5EBE6]">
                      الكاشير: {currentShift.cashierName}
                    </span>
                    <span>•</span>
                    <span>
                      بدأت: {new Date(currentShift.openedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-[#E0D8D0]">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      المدة المنقضية: {getShiftDuration(currentShift.openedAt).formatted}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {currentShift.isSuspended || currentShift.status === 'suspended' ? (
                    <button
                      type="button"
                      onClick={() => resumeCurrentShift()}
                      className="cursor-pointer px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>استئناف الوردية 🔓</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => suspendCurrentShift()}
                      className="cursor-pointer px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-stone-950" />
                      <span>تعليق الوردية مؤقتاً ⏸️</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsCloseShiftModalOpen(true)}
                    className="cursor-pointer px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs shadow-md shadow-[#D4AF37]/20 transition flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-stone-950" />
                    <span>إقفال الشيفت وتسوية الخزينة Z-Report</span>
                  </button>
                </div>
              </div>

              {/* Drawer Cash Stats */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#333333] text-center text-xs">
                <div className="bg-[#141414] p-3 rounded-2xl border border-[#2A2A2A]">
                  <span className="text-[#8C827A] block mb-1">عهدة البداية</span>
                  <span className="font-mono font-bold text-lg text-[#F5EBE6]">{currentShift.startingCash} ج.م</span>
                </div>
                <div className="bg-[#141414] p-3 rounded-2xl border border-[#2A2A2A]">
                  <span className="text-[#8C827A] block mb-1">مبيعات نقدية</span>
                  <span className="font-mono font-bold text-lg text-emerald-400">
                    {currentShift.totalSales.toFixed(2)} ج.م
                  </span>
                </div>
                <div className="bg-[#141414] p-3 rounded-2xl border border-[#2A2A2A]">
                  <span className="text-[#8C827A] block mb-1">المتوقع بالدرج</span>
                  <span className="font-mono font-black text-lg text-[#D4AF37]">
                    {(currentShift.startingCash + currentShift.totalSales).toFixed(2)} ج.م
                  </span>
                </div>
              </div>

              {/* Manager Shift Schedule Timing Controls */}
              <div className="pt-3 border-t border-[#333333] bg-[#121212] p-4 rounded-2xl border border-[#262626] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-bold text-[#E0D8D0]">
                      التحكم في موعد انتهاء الوردية (Shift End Schedule):
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#D4AF37] bg-[#221C11] px-2.5 py-1 rounded-xl border border-[#4A3B1B]">
                    الموعد المجدول الحالي: {currentShift.scheduledEndTime ? new Date(currentShift.scheduledEndTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'غير محدد'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[#8C827A] text-[11px]">تمديد سريع للوردية:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const base = new Date(currentShift.scheduledEndTime || Date.now()).getTime();
                      const target = new Date(Math.max(base, Date.now()) + 15 * 60000).toISOString();
                      updateActiveShiftSchedule(target, 'تمديد 15 دقيقة بواسطة المدير');
                    }}
                    className="cursor-pointer px-2.5 py-1 rounded-xl bg-[#222222] hover:bg-[#333333] border border-[#3A3A3A] text-stone-200 font-bold transition"
                  >
                    +15 دقيقة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const base = new Date(currentShift.scheduledEndTime || Date.now()).getTime();
                      const target = new Date(Math.max(base, Date.now()) + 30 * 60000).toISOString();
                      updateActiveShiftSchedule(target, 'تمديد 30 دقيقة بواسطة المدير');
                    }}
                    className="cursor-pointer px-2.5 py-1 rounded-xl bg-[#222222] hover:bg-[#333333] border border-[#3A3A3A] text-stone-200 font-bold transition"
                  >
                    +30 دقيقة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const base = new Date(currentShift.scheduledEndTime || Date.now()).getTime();
                      const target = new Date(Math.max(base, Date.now()) + 60 * 60000).toISOString();
                      updateActiveShiftSchedule(target, 'تمديد ساعة بواسطة المدير');
                    }}
                    className="cursor-pointer px-2.5 py-1 rounded-xl bg-[#222222] hover:bg-[#333333] border border-[#3A3A3A] text-stone-200 font-bold transition"
                  >
                    +1 ساعة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const base = new Date(currentShift.scheduledEndTime || Date.now()).getTime();
                      const target = new Date(Math.max(base, Date.now()) + 120 * 60000).toISOString();
                      updateActiveShiftSchedule(target, 'تمديد ساعتين بواسطة المدير');
                    }}
                    className="cursor-pointer px-2.5 py-1 rounded-xl bg-[#222222] hover:bg-[#333333] border border-[#3A3A3A] text-stone-200 font-bold transition"
                  >
                    +2 ساعة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Allow closing right now by setting scheduledEndTime to 2 minutes from now
                      const target = new Date(Date.now() + 2 * 60000).toISOString();
                      updateActiveShiftSchedule(target, 'السماح بإغلاق الشفت فوراً بواسطة المدير');
                    }}
                    className="cursor-pointer px-3 py-1 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/60 text-amber-300 font-bold transition"
                  >
                    ⚡ السماح للكاشير بالإغلاق الآن (تفعيل الزر فوراً)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdjustingSchedule(!isAdjustingSchedule)}
                    className="cursor-pointer px-2.5 py-1 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-[#D4AF37] font-bold transition"
                  >
                    {isAdjustingSchedule ? 'إلغاء' : 'تحديد موعد دقيق ⚙️'}
                  </button>
                </div>

                {/* Custom Time Selection Picker */}
                {isAdjustingSchedule && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#262626]">
                    <span className="text-[11px] text-[#A8A096]">أدخل وقت انتهاء الشيفت:</span>
                    <input
                      type="time"
                      value={customScheduleTime}
                      onChange={(e) => setCustomScheduleTime(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] text-[#F5EBE6] text-xs font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!customScheduleTime) return;
                        const [hours, minutes] = customScheduleTime.split(':').map(Number);
                        const targetDate = new Date();
                        targetDate.setHours(hours, minutes, 0, 0);
                        if (targetDate.getTime() < Date.now()) {
                          // Next day
                          targetDate.setDate(targetDate.getDate() + 1);
                        }
                        updateActiveShiftSchedule(targetDate.toISOString(), 'تحديد موعد مخصص بواسطة لوحة المدير');
                        setIsAdjustingSchedule(false);
                      }}
                      className="cursor-pointer px-4 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C04B] text-stone-950 font-black text-xs transition"
                    >
                      تحديث الموعد
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#141414] p-6 sm:p-8 rounded-3xl border border-[#2A2A2A] text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#241A0A] border border-[#4A3B1B] text-[#D4AF37] flex items-center justify-center text-2xl mx-auto shadow-inner">
                🔒
              </div>
              <div>
                <h4 className="font-bold text-base text-[#F5EBE6]">لا يوجد شيفت مفتوح حالياً في المخبز</h4>
                <p className="text-xs text-[#8C827A] max-w-sm mx-auto mt-1">
                  يمكن للمدير فتح شيفت جديد وتحديد الكاشير والمدة المجدولة التي ستغلق عندها الوردية.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStartShiftModalOpen(true)}
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-sm shadow-lg shadow-[#D4AF37]/20 transition active:scale-[0.99]"
              >
                <Unlock className="w-4 h-4 text-stone-950" />
                <span>🔓 فتح شيفت جديد وتحديد وقت الإغلاق</span>
              </button>
            </div>
          )}

          {/* Historical Closed Shifts */}
          {shiftHistory.length > 0 && (
            <div className="bg-[#141414] rounded-3xl border border-[#2A2A2A] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#F5EBE6]">سجل الورديات المقفلة وتقارير Z-Report</h4>
                  <p className="text-[11px] text-[#8C827A]">
                    سجل مالي مفصل للورديات المنتهية مع مدة كل وردية ونتائج التسوية النقدية
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#1E1E1E] text-[#D4AF37] border border-[#333333] font-mono font-bold">
                  {shiftHistory.length} وردية مسجلة
                </span>
              </div>

              <div className="space-y-2.5">
                {shiftHistory.map((shift, idx) => {
                  const duration = getShiftDuration(shift.openedAt, shift.closedAt);
                  const shortId = getShiftShortId(shift.id);
                  const diff = shift.cashDifference ?? 0;

                  return (
                    <div
                      key={`${shift.id}-${shift.closedAt || ''}-${idx}`}
                      className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#262626] hover:border-[#383838] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black font-mono text-[#D4AF37] text-sm">
                            وردية رقم #{shortId}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#242424] text-[#A8A096] border border-[#333333] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#D4AF37]" />
                            مدة الوردية: {duration.formatted}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#8C827A] flex items-center gap-2 flex-wrap">
                          <span>
                            من: {new Date(shift.openedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} ({new Date(shift.openedAt).toLocaleDateString('ar-EG')})
                          </span>
                          <span>⬅</span>
                          <span>
                            إلى: {shift.closedAt ? new Date(shift.closedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'غير محدد'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#262626]">
                        <div className="text-right sm:text-left font-mono">
                          <div className="text-[#E0D8D0] font-bold">
                            مبيعات: {shift.totalSales.toFixed(2)} ج.م
                          </div>
                          <div
                            className={`text-[11px] font-bold ${
                              diff === 0
                                ? 'text-emerald-400'
                                : diff > 0
                                ? 'text-blue-400'
                                : 'text-red-400'
                            }`}
                          >
                            {diff === 0
                              ? 'التسوية: متطابقة تماماً ✅'
                              : diff > 0
                              ? `زيادة: +${diff.toFixed(2)} ج.م`
                              : `عجز: ${diff.toFixed(2)} ج.م`}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setInspectZReportShift(shift)}
                          className="cursor-pointer px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                          title="عرض تقرير Z-Report وطباعته"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>تقرير Z-Report</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8.5: Security & Access Control */}
      {activeTab === 'security' && <SecuritySettingsTab />}

      {/* TAB 9: Security & Backup Center */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-[#1C1810] via-[#141414] to-[#0D0D0D] border border-[#5A451A] p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-stone-950 flex items-center justify-center text-2xl shadow-lg shadow-[#D4AF37]/20 font-black shrink-0">
                <Database className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold font-heading text-[#F5EBE6]">
                    مركز الأمان والنسخ الاحتياطي وحماية البيانات
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    أمان محلي 100%
                  </span>
                </div>
                <p className="text-xs text-[#8C827A] mt-1">
                  حفظ نسخة شاملة من كامل قاعدة بيانات المخبز، واستعادتها في أي وقت بنقرة واحدة بدون إنترنت.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[#A8A096] bg-[#1E1E1E] px-3 py-1.5 rounded-xl border border-[#2E2E2E]">
                حجم قاعدة البيانات الحالية:{' '}
                <strong className="text-[#D4AF37] font-mono">
                  {sales.length} فاتورة • {products.length} صنف • {rawMaterials.length} خامة
                </strong>
              </span>
            </div>
          </div>

          {/* Feedback Alert */}
          {backupFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-md ${
                backupFeedback.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-700'
                  : backupFeedback.type === 'error'
                  ? 'bg-red-950/90 text-red-200 border border-red-700'
                  : 'bg-blue-950/90 text-blue-200 border border-blue-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {backupFeedback.type === 'success' ? (
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span>{backupFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setBackupFeedback(null)}
                className="cursor-pointer p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* 3 Core Backup Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Download JSON Backup */}
            <div className="bg-[#141414] border border-[#2A2A2A] hover:border-[#5A451A] transition-all p-6 rounded-3xl flex flex-col justify-between space-y-5 shadow-lg group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#241D12] border border-[#5A451A] text-[#D4AF37] flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#F5EBE6]">
                    💾 تحميل نسخة احتياطية كاملة (JSON)
                  </h4>
                  <p className="text-xs text-[#8C827A] mt-1.5 leading-relaxed">
                    تنزيل ملف مشفر وشامل يحتوي على كل الأصناف، الأسعار، أرصدة الخامات، الفواتير، حسابات الموظفين، وسجل النشاطات.
                  </p>
                </div>
                <div className="bg-[#1A1A1A] p-3 rounded-2xl border border-[#262626] text-[11px] text-[#A8A096] space-y-1">
                  <div className="flex justify-between">
                    <span>حالة الملف:</span>
                    <span className="text-emerald-400 font-bold">جاهز للتحميل الفوري</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الاستخدام:</span>
                    <span className="text-[#D4AF37]">حفظه على Drive أو فلاشة</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  try {
                    const data = exportBackupJSON();
                    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                      JSON.stringify(data, null, 2)
                    )}`;
                    const downloadAnchor = document.createElement('a');
                    const fileName = `bakery_backup_${new Date().toISOString().slice(0, 10)}.json`;
                    downloadAnchor.setAttribute('href', jsonString);
                    downloadAnchor.setAttribute('download', fileName);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();

                    setBackupFeedback({
                      type: 'success',
                      message: `تم تنزيل النسخة الاحتياطية (${fileName}) بنجاح! احفظها في مكان آمن.`,
                    });
                  } catch (err: any) {
                    setBackupFeedback({
                      type: 'error',
                      message: `فشل التصدير: ${err.message}`,
                    });
                  }
                }}
                className="cursor-pointer w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#D4AF37]/20 transition active:scale-[0.98]"
              >
                <Download className="w-4 h-4 text-stone-950" />
                <span>تحميل ملف النسخة الاحتياطية</span>
              </button>
            </div>

            {/* Card 2: Restore from Backup */}
            <div className="bg-[#141414] border border-[#2A2A2A] hover:border-emerald-700/80 transition-all p-6 rounded-3xl flex flex-col justify-between space-y-5 shadow-lg group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#F5EBE6]">
                    📂 استرجاع البيانات من ملف (Restore)
                  </h4>
                  <p className="text-xs text-[#8C827A] mt-1.5 leading-relaxed">
                    في حال قمت بتغيير جهاز الكمبيوتر أو التابلت، اختر ملف النسخة الاحتياطية وسيعود كل شيء كما كان في ثانية واحدة.
                  </p>
                </div>
                <div className="bg-[#1A1A1A] p-3 rounded-2xl border border-[#262626] text-[11px] text-[#A8A096] space-y-1">
                  <div className="flex justify-between">
                    <span>التوافق:</span>
                    <span className="text-emerald-400 font-bold">ملفات JSON المدعومة</span>
                  </div>
                  <div className="flex justify-between">
                    <span>النتيجة:</span>
                    <span className="text-emerald-300 font-bold">تحديث فوري للسجلات</span>
                  </div>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  id="backup-file-input"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const fileReader = new FileReader();
                    const files = e.target.files;
                    if (!files || files.length === 0) return;

                    setIsRestoring(true);
                    fileReader.readAsText(files[0], 'UTF-8');
                    fileReader.onload = (event) => {
                      try {
                        const parsedData = JSON.parse(event.target?.result as string);
                        const result = restoreBackupJSON(parsedData);
                        if (result.success) {
                          setBackupFeedback({
                            type: 'success',
                            message: result.message,
                          });
                        } else {
                          setBackupFeedback({
                            type: 'error',
                            message: result.message,
                          });
                        }
                      } catch (err: any) {
                        setBackupFeedback({
                          type: 'error',
                          message: 'الملف المختار تالف أو ليس بصيغة JSON صحيحة.',
                        });
                      } finally {
                        setIsRestoring(false);
                        // Reset input
                        e.target.value = '';
                      }
                    };
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('backup-file-input')?.click()}
                  disabled={isRestoring}
                  className="cursor-pointer w-full py-3 px-4 rounded-2xl bg-[#1E1E1E] hover:bg-[#282828] text-emerald-300 hover:text-emerald-200 border border-emerald-700/60 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98] disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>{isRestoring ? 'جاري الاسترجاع...' : 'اختيار ملف واستعادة البيانات'}</span>
                </button>
              </div>
            </div>

            {/* Card 3: Export Sales to Excel / CSV */}
            <div className="bg-[#141414] border border-[#2A2A2A] hover:border-blue-700/80 transition-all p-6 rounded-3xl flex flex-col justify-between space-y-5 shadow-lg group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-700/60 text-blue-400 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#F5EBE6]">
                    📊 تصدير سجل المبيعات (Excel / CSV)
                  </h4>
                  <p className="text-xs text-[#8C827A] mt-1.5 leading-relaxed">
                    استخراج جدول تفصيلي منظم لكافة الفواتير والمبيعات لفتحه في برنامج Microsoft Excel أو إرساله للمحاسب القانوني والضرائب.
                  </p>
                </div>
                <div className="bg-[#1A1A1A] p-3 rounded-2xl border border-[#262626] text-[11px] text-[#A8A096] space-y-1">
                  <div className="flex justify-between">
                    <span>عدد الفواتير الجاهزة:</span>
                    <span className="text-blue-400 font-bold font-mono">{sales.length} فاتورة</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الصيغة:</span>
                    <span className="text-[#F5EBE6] font-mono">CSV (Excel Ready)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  try {
                    const csvContent = exportSalesCSV();
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    const fileName = `bakery_sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
                    link.setAttribute('href', url);
                    link.setAttribute('download', fileName);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    setBackupFeedback({
                      type: 'success',
                      message: `تم تصدير تقرير المبيعات (${fileName}) جاهز لبرنامج Excel بنجاح!`,
                    });
                  } catch (err: any) {
                    setBackupFeedback({
                      type: 'error',
                      message: `فشل تصدير Excel: ${err.message}`,
                    });
                  }
                }}
                className="cursor-pointer w-full py-3 px-4 rounded-2xl bg-[#1E1E1E] hover:bg-[#282828] text-blue-300 hover:text-blue-200 border border-blue-700/60 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98]"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                <span>تصدير تقرير المبيعات Excel</span>
              </button>
            </div>
          </div>

          {/* Cloud Database Integration Card (Supabase PostgreSQL) */}
          <div className="bg-[#141414] border border-[#5A451A] p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-stone-950 flex items-center justify-center text-xl font-black shadow-md shadow-[#D4AF37]/20 shrink-0">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-[#F5EBE6]">
                      قاعدة البيانات السحابية المركزية (Supabase PostgreSQL)
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        supabaseConnected
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                          : 'bg-amber-950/80 text-amber-300 border-amber-700'
                      }`}
                    >
                      {supabaseConnected ? 'متصل سحابياً 🟢' : 'قيد المزامنة 🟡'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8C827A] mt-1">
                    مشروع Supabase معرف: <code className="text-[#D4AF37] font-mono px-1 bg-[#1F180F] rounded">roblzbjqazyhmbeclodo</code> • دعم ACID Transactions والمزامنة اللحظية بين الأجهزة.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDashboardSupabaseSync}
                disabled={isSupabaseSyncing}
                className={`cursor-pointer px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shrink-0 active:scale-95 ${
                  isSupabaseSyncing
                    ? 'bg-[#332A15] text-[#D4AF37] border border-[#5A451A] opacity-70 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#B89028] text-stone-950 hover:brightness-110 shadow-[#D4AF37]/20'
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span>{isSupabaseSyncing ? 'جارٍ المزامنة السحابية...' : 'مزامنة ورفع الأصناف للسحابة ☁️'}</span>
              </button>
            </div>

            {supabaseSyncMsg && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 border ${
                  supabaseSyncMsg.type === 'success'
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700'
                    : 'bg-red-950/90 text-red-200 border-red-700'
                }`}
              >
                <span>{supabaseSyncMsg.text}</span>
                <button
                  type="button"
                  onClick={() => setSupabaseSyncMsg(null)}
                  className="cursor-pointer text-white/60 hover:text-white px-2 py-0.5"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Technical Explanations & Best Practice Guidance Guide */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-[#F5EBE6] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>دليل الممارسات الأفضل لحماية بيانات المخبز:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#8C827A] leading-relaxed">
              <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#262626] space-y-1.5">
                <span className="font-bold text-[#D4AF37] block">1. التنزيل الأسبوعي:</span>
                <p>
                  يُنصح صاحب المخبز بتنزيل ملف النسخة الاحتياطية (JSON) مرة واحدة نهاية كل أسبوع وإرساله لإيميله أو حسابه على Google Drive.
                </p>
              </div>
              <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#262626] space-y-1.5">
                <span className="font-bold text-emerald-400 block">2. الاسترجاع عند تغيير الأجهزة:</span>
                <p>
                  عند شراء جهاز كمبيوتر جديد أو شاشة كاشير جديدة، افتح التطبيق واختر ملف النسخة وسيبدأ البيع فوراً دون الحاجة لإعادة إدخال الأسعار.
                </p>
              </div>
              <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-[#262626] space-y-1.5">
                <span className="font-bold text-blue-400 block">3. تقارير Excel للمحاسب:</span>
                <p>
                  ملف CSV يحتوي على ترميز UTF-8 مع خاصية BOM لفتح النصوص العربية وأسماء الأصناف في برنامج Excel بدون أي رموز غير مفهومة.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 11: Bakery Identity & Receipt Profile Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#241D12] border border-[#5A451A] text-[#D4AF37] flex items-center justify-center text-xl shadow-inner font-bold">
                  🏪
                </div>
                <h3 className="text-lg font-black font-heading text-[#F5EBE6]">
                  إعدادات هوية المخبز والترويسة والفاتورة الضريبية
                </h3>
              </div>
              <p className="text-xs text-[#8C827A]">
                تعديل الاسم التجاري للمخبز، العنوان، رقم الهاتف، والبيانات المطبوعة على كافة الفواتير والإيصالات.
              </p>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-[#1C160E] border border-[#5A451A] text-[11px] text-[#D4AF37] flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>متاح حصرياً للمدير العام / المالك</span>
            </div>
          </div>

          {/* Feedback Message Alert */}
          <AnimatePresence>
            {settingsFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-lg ${
                  settingsFeedback.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
                    : 'bg-red-950/80 border-red-500/80 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {settingsFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                  <span>{settingsFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsFeedback(null)}
                  className="cursor-pointer text-[#8C827A] hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Grid: Form + Live Receipt Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-7 bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 shadow-xl space-y-5">
              <div className="border-b border-[#242424] pb-3">
                <h4 className="text-sm font-bold text-[#F5EBE6] flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>بيانات وهوية المخبز المعتمدة:</span>
                </h4>
                <p className="text-[11px] text-[#8C827A] mt-0.5">
                  * يجب ملء اسم المخبز بشكل صحيح ولا يمكن تركه فارغاً تحت أي ظرف.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Strict Validation: Name cannot be empty
                  const trimmedName = settingsForm.name ? settingsForm.name.trim() : '';
                  if (!trimmedName || trimmedName.length === 0) {
                    setSettingsFeedback({
                      type: 'error',
                      message: 'خطأ: لا يمكن حفظ الإعدادات بدون اسم المخبز! يرجى إدخال اسم صحيح.',
                    });
                    return;
                  }

                  if (trimmedName.length < 3) {
                    setSettingsFeedback({
                      type: 'error',
                      message: 'خطأ: اسم المخبز يجب أن يتكون من 3 أحرف على الأقل.',
                    });
                    return;
                  }

                  const res = updateBakerySettings({
                    name: trimmedName,
                    slogan: settingsForm.slogan.trim(),
                    phone: settingsForm.phone.trim(),
                    taxNumber: settingsForm.taxNumber.trim(),
                    address: settingsForm.address.trim(),
                    logoEmoji: settingsForm.logoEmoji || '🥐',
                    logoUrl: settingsForm.logoUrl ? settingsForm.logoUrl.trim() : undefined,
                  });

                  if (res.success) {
                    setSettingsFeedback({
                      type: 'success',
                      message: res.message,
                    });
                  } else {
                    setSettingsFeedback({
                      type: 'error',
                      message: res.message,
                    });
                  }
                }}
                className="space-y-4 text-xs"
              >
                {/* Bakery Name Field (Strict Required) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#F5EBE6] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>اسم المخبز التجاري الرسمي</span>
                      <span className="text-red-400 font-bold text-sm">*</span>
                    </span>
                    <span className="text-[10px] text-[#D4AF37] font-normal">
                      (يظهر في رأس التطبيق وكافة الفواتير)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={settingsForm.name}
                      onChange={(e) => {
                        setSettingsForm({ ...settingsForm, name: e.target.value });
                        if (settingsFeedback) setSettingsFeedback(null);
                      }}
                      placeholder="مثال: مخبز النور الذهبي، مخبز البركة..."
                      className={`w-full bg-[#1A1A1A] border rounded-2xl px-4 py-3 text-sm text-[#F5EBE6] font-bold placeholder-[#555] focus:outline-none transition ${
                        !settingsForm.name.trim()
                          ? 'border-red-500 focus:border-red-400 bg-red-950/20'
                          : 'border-[#333] focus:border-[#D4AF37]'
                      }`}
                    />
                    {!settingsForm.name.trim() && (
                      <span className="absolute left-3 top-3.5 text-[11px] text-red-400 font-bold">
                        مطلوب ولا يمكن تركه فارغاً!
                      </span>
                    )}
                  </div>
                </div>

                {/* --- Bakery Logo Management Box --- */}
                <div className="p-4 bg-[#181818] border border-[#2B2B2B] rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#282115] border border-[#5A451A] text-[#D4AF37] flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h5 className="font-bold text-[#F5EBE6] text-xs">
                          لوجو وشعار المخبز المعتمد
                        </h5>
                        <p className="text-[10px] text-[#8C827A]">
                          يمكنك رفع صورة من جهازك، إدخال رابط صورة، أو استخدام قوالب اللوجو
                        </p>
                      </div>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="flex items-center gap-1 bg-[#101010] p-1 rounded-xl border border-[#262626] self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setLogoInputMode('upload')}
                        className={`cursor-pointer px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                          logoInputMode === 'upload'
                            ? 'bg-[#D4AF37] text-stone-950 font-black'
                            : 'text-[#8C827A] hover:text-[#F5EBE6]'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>رفع ملف</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoInputMode('url')}
                        className={`cursor-pointer px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                          logoInputMode === 'url'
                            ? 'bg-[#D4AF37] text-stone-950 font-black'
                            : 'text-[#8C827A] hover:text-[#F5EBE6]'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>رابط صورة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoInputMode('emoji')}
                        className={`cursor-pointer px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                          logoInputMode === 'emoji'
                            ? 'bg-[#D4AF37] text-stone-950 font-black'
                            : 'text-[#8C827A] hover:text-[#F5EBE6]'
                        }`}
                      >
                        <span>{settingsForm.logoEmoji || '🥐'}</span>
                        <span>إيموجي</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Logo Visual Showcase & Removal */}
                  <div className="flex items-center gap-3.5 bg-[#121212] p-3 rounded-xl border border-[#222]">
                    <div className="relative group shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#B89028] to-[#6E5005] flex items-center justify-center text-stone-950 shadow-md shadow-[#D4AF37]/20 text-2xl font-black overflow-hidden border border-[#D4AF37]/40">
                        {settingsForm.logoUrl ? (
                          <img
                            src={settingsForm.logoUrl}
                            alt="Logo Preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              // fallback if broken image
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{settingsForm.logoEmoji || '🥐'}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F5EBE6] text-xs truncate">
                          {settingsForm.logoUrl ? 'لوجو بصورة مخصصة' : 'لوجو بأيقونة تعبيرية'}
                        </span>
                        {settingsForm.logoUrl ? (
                          <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-700/60 font-bold">
                            صورة مخصصة نشطة
                          </span>
                        ) : (
                          <span className="text-[9px] bg-[#222] text-[#D4AF37] px-1.5 py-0.5 rounded border border-[#444] font-bold">
                            أيقونة إيموجي
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#8C827A] truncate">
                        {settingsForm.logoUrl
                          ? 'تظهر هذه الصورة في أعلى شريط التطبيق وعلى الفواتير المطبوعة'
                          : 'يمكنك رفع شعار مخصص لجعل الفواتير وهوية المخبز أكثر احترافية'}
                      </p>

                      {settingsForm.logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsForm({ ...settingsForm, logoUrl: '' });
                          }}
                          className="cursor-pointer text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition mt-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>إزالة الصورة والاعتماد على الإيموجي</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Input Mode 1: Upload File with Drag & Drop */}
                  {logoInputMode === 'upload' && (
                    <div className="space-y-2">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(true);
                        }}
                        onDragLeave={() => setIsDraggingLogo(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingLogo(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (loadEvt) => {
                              const result = loadEvt.target?.result as string;
                              if (result) {
                                setSettingsForm({ ...settingsForm, logoUrl: result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition cursor-pointer ${
                          isDraggingLogo
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                            : 'border-[#333] hover:border-[#D4AF37]/60 bg-[#141414]'
                        }`}
                      >
                        <input
                          type="file"
                          id="bakery-logo-upload-input"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (loadEvt) => {
                                const result = loadEvt.target?.result as string;
                                if (result) {
                                  setSettingsForm({ ...settingsForm, logoUrl: result });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="bakery-logo-upload-input"
                          className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#202020] text-[#D4AF37] flex items-center justify-center shadow-inner">
                            <Camera className="w-5 h-5 text-[#D4AF37]" />
                          </div>
                          <span className="font-bold text-[#F5EBE6] text-xs">
                            اسحب الصورة هنا أو اضغط للاختيار من جهازك
                          </span>
                          <span className="text-[10px] text-[#8C827A]">
                            يدعم كافة الصيغ (PNG, JPG, WebP, SVG) بحجم حتى 5 ميجابايت
                          </span>
                        </label>
                      </div>

                      {/* Ready-made Bakery Badge Templates */}
                      <div className="pt-1">
                        <label className="text-[10px] text-[#A8A096] font-bold block mb-1.5">
                          أو اختر نموذج لوجو جاهز ومصمم للمخابز بنقرة واحدة:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            {
                              name: 'مخبز كلاسيكي',
                              url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80',
                            },
                            {
                              name: 'سنابل القمح الذهبية',
                              url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=150&auto=format&fit=crop&q=80',
                            },
                            {
                              name: 'كرواسون ومعجنات',
                              url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=150&auto=format&fit=crop&q=80',
                            },
                            {
                              name: 'حلويات فاخرة',
                              url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150&auto=format&fit=crop&q=80',
                            },
                          ].map((template) => (
                            <button
                              key={template.name}
                              type="button"
                              onClick={() => {
                                setSettingsForm({ ...settingsForm, logoUrl: template.url });
                              }}
                              className="cursor-pointer p-1.5 bg-[#121212] hover:bg-[#202020] border border-[#2D2D2D] hover:border-[#D4AF37] rounded-xl flex items-center gap-2 transition text-right group"
                            >
                              <img
                                src={template.url}
                                alt={template.name}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-lg object-cover border border-[#444]"
                              />
                              <span className="text-[10px] font-bold text-[#8C827A] group-hover:text-[#F5EBE6] truncate">
                                {template.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input Mode 2: Direct Image URL */}
                  {logoInputMode === 'url' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#F5EBE6]">
                        رابط صورة اللوجو (Direct Image URL):
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={settingsForm.logoUrl}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, logoUrl: e.target.value })
                          }
                          placeholder="https://example.com/bakery-logo.png"
                          className="w-full bg-[#121212] border border-[#333] rounded-xl px-3.5 py-2.5 text-[#F5EBE6] font-mono text-xs placeholder-[#555] focus:border-[#D4AF37] focus:outline-none transition"
                        />
                      </div>
                    </div>
                  )}

                  {/* Input Mode 3: Emoji Selector */}
                  {logoInputMode === 'emoji' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#F5EBE6]">
                        اختر أيقونة الإيموجي المناسبة للمخبز:
                      </label>
                      <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
                        {[
                          { emoji: '🥐', label: 'كرواسون' },
                          { emoji: '🥖', label: 'باجيت' },
                          { emoji: '🍞', label: 'توست' },
                          { emoji: '🥯', label: 'بيجل' },
                          { emoji: '🥨', label: 'بريتزل' },
                          { emoji: '🎂', label: 'تورتة' },
                          { emoji: '🧁', label: 'كب كيك' },
                          { emoji: '🌾', label: 'سنابل' },
                          { emoji: '👑', label: 'ملكي' },
                        ].map((item) => (
                          <button
                            key={item.emoji}
                            type="button"
                            onClick={() => {
                              setSettingsForm({
                                ...settingsForm,
                                logoEmoji: item.emoji,
                                logoUrl: '', // clearing logoUrl to activate emoji
                              });
                            }}
                            className={`cursor-pointer py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 border transition ${
                              settingsForm.logoEmoji === item.emoji && !settingsForm.logoUrl
                                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-md'
                                : 'bg-[#121212] border-[#2A2A2A] text-[#8C827A] hover:text-white hover:border-[#444]'
                            }`}
                          >
                            <span className="text-xl">{item.emoji}</span>
                            <span className="text-[9px] font-bold">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Slogan & Additional Notes */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#F5EBE6]">الشعار أو الوصف التجاري المختصر</label>
                  <input
                    type="text"
                    value={settingsForm.slogan}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, slogan: e.target.value })
                    }
                    placeholder="أشهى المخبوزات والحلويات والفطائر الفلاحي"
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-2xl px-3.5 py-2.5 text-[#F5EBE6] placeholder-[#555] focus:border-[#D4AF37] focus:outline-none transition"
                  />
                </div>

                {/* Phone & Tax Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#F5EBE6]">رقم تليفون / هاتف المخبز</label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, phone: e.target.value })
                      }
                      placeholder="01012345678"
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-2xl px-3.5 py-2.5 text-[#F5EBE6] font-mono placeholder-[#555] focus:border-[#D4AF37] focus:outline-none transition text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#F5EBE6]">الرقم الضريبي للمنشأة</label>
                    <input
                      type="text"
                      value={settingsForm.taxNumber}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, taxNumber: e.target.value })
                      }
                      placeholder="394829104"
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-2xl px-3.5 py-2.5 text-[#F5EBE6] font-mono placeholder-[#555] focus:border-[#D4AF37] focus:outline-none transition text-right"
                    />
                  </div>
                </div>

                {/* Address Field */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#F5EBE6]">عنوان الفرع أو المخبز</label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, address: e.target.value })
                    }
                    placeholder="مثال: الفرع الرئيسي - شارع الجمهورية - أمام المحطة"
                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-2xl px-3.5 py-2.5 text-[#F5EBE6] placeholder-[#555] focus:border-[#D4AF37] focus:outline-none transition"
                  />
                </div>

                {/* Submit / Reset Actions */}
                <div className="pt-3 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={!settingsForm.name.trim()}
                    className="cursor-pointer flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 text-stone-950" />
                    <span>حفظ وتعميم التعديلات على النظام والفواتير</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSettingsForm({
                        name: bakerySettings.name,
                        slogan: bakerySettings.slogan,
                        phone: bakerySettings.phone,
                        taxNumber: bakerySettings.taxNumber,
                        address: bakerySettings.address || '',
                        logoEmoji: bakerySettings.logoEmoji || '🥐',
                        logoUrl: bakerySettings.logoUrl || '',
                      });
                      setSettingsFeedback(null);
                    }}
                    className="cursor-pointer py-3 px-4 rounded-2xl bg-[#1E1E1E] hover:bg-[#282828] text-[#8C827A] hover:text-[#F5EBE6] font-bold text-xs border border-[#333] transition"
                  >
                    إلغاء التغييرات
                  </button>
                </div>
              </form>
            </div>

            {/* Live Preview Column (Real-time printed ticket inspection + Header preview) */}
            <div className="lg:col-span-5 space-y-4">
              {/* 1. App Header Preview Badge */}
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-4 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#F5EBE6] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>معاينة شريط التطبيق العلوي:</span>
                  </h4>
                  <span className="text-[10px] text-[#A8A096]">الشريط الرئيسي</span>
                </div>

                <div className="p-3 bg-[#0C0C0C] rounded-2xl border border-[#222] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] via-[#B89028] to-[#6E5005] flex items-center justify-center text-stone-950 shadow-md shadow-[#D4AF37]/20 text-base font-black shrink-0 overflow-hidden border border-[#D4AF37]/40">
                      {settingsForm.logoUrl ? (
                        <img
                          src={settingsForm.logoUrl}
                          alt="Header Logo"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <span>{settingsForm.logoEmoji || '🥐'}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-[#F5EBE6]">
                        {settingsForm.name.trim() || 'مخبز النور الذهبي'}
                      </span>
                      <span className="text-[9px] text-[#8C827A]">
                        {settingsForm.slogan || 'لوحة تحكم ونقاط البيع'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] text-[#D4AF37] bg-[#241D12] px-2 py-0.5 rounded-lg border border-[#5A451A] font-bold">
                    معتمد
                  </span>
                </div>
              </div>

              {/* 2. Thermal Receipt Simulator */}
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#F5EBE6] flex items-center gap-2">
                    <Printer className="w-4 h-4 text-[#D4AF37]" />
                    <span>معاينة حية لشكل الفاتورة المطبوعة:</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-700/60 font-bold">
                    تحديث فوري
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-2xl border border-stone-300 text-stone-900 font-mono text-xs leading-relaxed max-w-sm mx-auto">
                  {/* Receipt Header Preview */}
                  <div className="text-center pb-3 border-b-2 border-dashed border-stone-300">
                    {settingsForm.logoUrl ? (
                      <div className="flex justify-center mb-1.5">
                        <img
                          src={settingsForm.logoUrl}
                          alt="Receipt Logo"
                          referrerPolicy="no-referrer"
                          className="max-h-12 max-w-[120px] object-contain mx-auto rounded"
                        />
                      </div>
                    ) : (
                      <div className="text-2xl mb-1">{settingsForm.logoEmoji || '🥐'}</div>
                    )}
                    <h2 className="text-base font-black font-heading text-stone-900">
                      {settingsForm.name.trim() || 'اسم المخبز هنا'}
                    </h2>
                    {settingsForm.slogan && (
                      <p className="text-[10px] text-stone-600 font-sans mt-0.5">
                        {settingsForm.slogan}
                      </p>
                    )}
                    <p className="text-[10px] text-stone-500 font-sans mt-0.5">
                      تليفون: {settingsForm.phone || '—'} - الرقم الضريبي:{' '}
                      {settingsForm.taxNumber || '—'}
                    </p>
                    {settingsForm.address && (
                      <p className="text-[9px] text-stone-400 font-sans mt-0.5">
                        {settingsForm.address}
                      </p>
                    )}
                  </div>

                  {/* Sample Receipt Body */}
                  <div className="py-2.5 text-[10px] border-b border-dashed border-stone-300 space-y-0.5 text-stone-600 font-sans">
                    <div className="flex justify-between">
                      <span>رقم الفاتورة:</span>
                      <span className="font-mono font-bold text-stone-900">INV-1099</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الكاشير:</span>
                      <span className="text-stone-800 font-bold">
                        {currentUser?.name || 'كاشير الصباح'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>التاريخ:</span>
                      <span className="font-mono">{new Date().toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>

                  {/* Sample Items */}
                  <div className="py-2 space-y-1 border-b-2 border-dashed border-stone-300 text-[11px]">
                    <div className="flex justify-between font-bold text-stone-800">
                      <span>عيش فينو ك (10 ق)</span>
                      <span>30.00 ج.م</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-800">
                      <span>بقسماط سمسم (0.5 كجم)</span>
                      <span>40.00 ج.م</span>
                    </div>
                  </div>

                  {/* Sample Total */}
                  <div className="py-2 space-y-1">
                    <div className="flex justify-between text-sm font-black text-stone-950">
                      <span>الإجمالي المطلوب:</span>
                      <span>70.00 ج.م</span>
                    </div>
                  </div>

                  {/* Receipt Footer */}
                  <div className="pt-2 text-center text-[10px] text-stone-500 font-sans border-t border-dashed border-stone-300">
                    <p className="font-bold text-stone-700">شكراً لزيارتكم ونتمنى لكم يوماً سعيداً!</p>
                    <p className="text-[9px] text-stone-400 mt-0.5 font-mono">
                      فاتورة إلكترونية معتمدة من نظام كاشير المخبز
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all"
          onClick={() => setIsProductModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] rounded-3xl max-w-lg w-full max-h-[85vh] max-h-[85dvh] border border-[#2A2A2A] shadow-2xl flex flex-col text-[#E0D8D0] overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base sm:text-lg font-heading text-[#F5EBE6]">
                {editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف مخبوزات جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="cursor-pointer p-1.5 rounded-xl text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#222222]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-3 text-xs overflow-y-auto flex-1">
              <div>
                <label className="font-bold text-[#A8A096] block mb-1">اسم الصنف:</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="مثال: منين عجوة، عيش بلدي، فطير..."
                  className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#F5EBE6] placeholder-[#6C635B] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#A8A096] block mb-1">القسم / التصنيف:</label>
                  <input
                    type="text"
                    required
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#F5EBE6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#A8A096] block mb-1">آلية البيع:</label>
                  <select
                    value={prodUnitType}
                    onChange={(e) => setProdUnitType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#F5EBE6] rounded-xl focus:outline-none font-bold"
                  >
                    <option value="piece">بالقطعة (Piece)</option>
                    <option value="weight">بالوزن (سعر الكيلو - Weight)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-[#A8A096] block mb-1">
                    {prodUnitType === 'weight' ? 'سعر الكيلو (ج.م):' : 'سعر القطعة (ج.م):'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#D4AF37] rounded-xl focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#A8A096] block mb-1">
                    الرصيد الابتدائي:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#F5EBE6] rounded-xl focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#A8A096] block mb-1">حد تنبيه النقص:</label>
                  <input
                    type="number"
                    required
                    value={prodMinAlert}
                    onChange={(e) => setProdMinAlert(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#F5EBE6] rounded-xl focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Product Image Section: Local Upload, URL, or Presets */}
              <div className="space-y-2.5 pt-2 border-t border-[#262626]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="font-bold text-[#A8A096] flex items-center gap-1.5 text-xs">
                    <Camera className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>صورة المنتج:</span>
                  </label>

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center gap-1 bg-[#101010] p-0.5 rounded-xl border border-[#262626] self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setProdImageMode('upload')}
                      className={`cursor-pointer px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                        prodImageMode === 'upload'
                          ? 'bg-[#D4AF37] text-stone-950 font-black shadow-xs'
                          : 'text-[#8C827A] hover:text-[#F5EBE6]'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>رفع من الجهاز</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdImageMode('url')}
                      className={`cursor-pointer px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                        prodImageMode === 'url'
                          ? 'bg-[#D4AF37] text-stone-950 font-black shadow-xs'
                          : 'text-[#8C827A] hover:text-[#F5EBE6]'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>رابط URL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdImageMode('preset')}
                      className={`cursor-pointer px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                        prodImageMode === 'preset'
                          ? 'bg-[#D4AF37] text-stone-950 font-black shadow-xs'
                          : 'text-[#8C827A] hover:text-[#F5EBE6]'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>صور جاهزة</span>
                    </button>
                  </div>
                </div>

                {/* Preview & Current Status */}
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#121212] border border-[#262626]">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#1A1A1A] border border-[#333] shrink-0 flex items-center justify-center">
                    {prodImage ? (
                      <img
                        src={prodImage}
                        alt="Product Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <span className="text-xl">🥐</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-[#F5EBE6] truncate">
                        {prodName || 'معاينة صورة الصنف'}
                      </span>
                      {prodImage.startsWith('data:') ? (
                        <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-700/60 font-bold">
                          صورة محلية من الجهاز ✓
                        </span>
                      ) : prodImage ? (
                        <span className="text-[9px] bg-[#222] text-[#D4AF37] px-1.5 py-0.5 rounded border border-[#444] font-bold">
                          رابط إنترنت
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-[#8C827A] mt-0.5 truncate">
                      تظهر هذه الصورة في شاشة الكاشير والمبيعات وقائمة المنتجات
                    </p>
                    {prodImage && (
                      <button
                        type="button"
                        onClick={() => setProdImage('')}
                        className="cursor-pointer text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition mt-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>إزالة الصورة والاعتماد على صورة افتراضية</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload Error Banner */}
                {imageUploadError && (
                  <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{imageUploadError}</span>
                  </div>
                )}

                {/* Mode 1: Upload from Device (File Picker + Drag & Drop) */}
                {prodImageMode === 'upload' && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingProdImage(true);
                    }}
                    onDragLeave={() => setIsDraggingProdImage(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingProdImage(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleProductImageFile(file);
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition cursor-pointer ${
                      isDraggingProdImage
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                        : 'border-[#333] hover:border-[#D4AF37]/60 bg-[#141414]'
                    }`}
                  >
                    <input
                      type="file"
                      id="product-image-upload-input"
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProductImageFile(file);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="product-image-upload-input"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-[#202020] text-[#D4AF37] flex items-center justify-center shadow-inner">
                        {isOptimizingImage ? (
                          <RefreshCw className="w-5 h-5 animate-spin text-[#D4AF37]" />
                        ) : (
                          <Camera className="w-5 h-5 text-[#D4AF37]" />
                        )}
                      </div>
                      <span className="font-bold text-[#F5EBE6] text-xs">
                        {isOptimizingImage
                          ? 'جاري ضغط ومعالجة الصورة للاستخدام السريع...'
                          : 'اضغط لاختيار صورة من جهازك أو اسحبها هنا'}
                      </span>
                      <span className="text-[10px] text-[#8C827A]">
                        يدعم الصور من الهاتف والكمبيوتر (PNG, JPG, WebP) بحجم حتى 10 ميجابايت
                      </span>
                    </label>
                  </div>
                )}

                {/* Mode 2: External Image URL */}
                {prodImageMode === 'url' && (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      value={prodImage}
                      onChange={(e) => {
                        setProdImage(e.target.value);
                        setImageUploadError(null);
                      }}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-2.5 bg-[#1E1E1E] border border-[#333333] text-[#F5EBE6] placeholder-[#6C635B] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-[#8C827A]">
                      يمكنك لصق رابط مباشر لصورة من الإنترنت أو Unsplash
                    </p>
                  </div>
                )}

                {/* Mode 3: Quick Preset Bakery Images */}
                {prodImageMode === 'preset' && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-[#8C827A] block">
                      اختر صورة فورية للمخبوزات بنقرة واحدة:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {BAKERY_PRESET_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setProdImage(preset.url);
                            setImageUploadError(null);
                          }}
                          className={`group cursor-pointer relative rounded-xl overflow-hidden border p-1 text-center transition flex flex-col items-center gap-1 ${
                            prodImage === preset.url
                              ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-[#241D12]'
                              : 'border-[#2A2A2A] hover:border-[#444] bg-[#141414]'
                          }`}
                        >
                          <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#1A1A1A]">
                            <img
                              src={preset.url}
                              alt={preset.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            />
                          </div>
                          <span className="text-[9px] font-bold text-[#E0D8D0] truncate max-w-full">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 border-t border-[#262626] flex items-center justify-end gap-2 shrink-0 bg-[#101010]">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 text-[#8C827A] hover:bg-[#222222] hover:text-[#F5EBE6] rounded-xl font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="cursor-pointer px-5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black rounded-xl shadow-md shadow-[#D4AF37]/20"
              >
                حفظ الصنف
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Raw Material Add / Edit Modal */}
      {isRawModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all"
          onClick={() => setIsRawModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] rounded-3xl max-w-md w-full max-h-[85vh] max-h-[85dvh] border border-[#2A2A2A] shadow-2xl flex flex-col text-[#E0D8D0] overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base sm:text-lg font-heading text-[#F5EBE6]">
                {editingRaw ? 'تعديل المادة الخام' : 'إضافة مادة خام جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRawModalOpen(false)}
                className="cursor-pointer p-1.5 rounded-xl text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#222222]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRaw} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-3 text-xs overflow-y-auto flex-1">
                <div>
                  <label className="font-bold text-[#A8A096] block mb-1">اسم المادة الخام:</label>
                  <input
                    type="text"
                    required
                    value={rawName}
                    onChange={(e) => setRawName(e.target.value)}
                    placeholder="مثال: دقيق فاخر 72%، سمن بلدي..."
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#F5EBE6] placeholder-[#6C635B] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-[#A8A096] block mb-1">وحدة القياس:</label>
                    <select
                      value={rawUnit}
                      onChange={(e) => setRawUnit(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#F5EBE6] rounded-xl focus:outline-none font-bold"
                    >
                      <option value="kg">كيلوجرام (kg)</option>
                      <option value="liter">لتر (liter)</option>
                      <option value="gram">جرام (gram)</option>
                      <option value="piece">قطعة (piece)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#A8A096] block mb-1">الرصيد الحالي:</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={rawStock}
                      onChange={(e) => setRawStock(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#F5EBE6] rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-[#A8A096] block mb-1">سعر التكلفة للوحدة:</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={rawCost}
                      onChange={(e) => setRawCost(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#D4AF37] rounded-xl focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#A8A096] block mb-1">حد تنبيه النقص:</label>
                    <input
                      type="number"
                      required
                      value={rawMinAlert}
                      onChange={(e) => setRawMinAlert(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#F5EBE6] rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#A8A096] block mb-1">اسم المورد:</label>
                  <input
                    type="text"
                    value={rawSupplier}
                    onChange={(e) => setRawSupplier(e.target.value)}
                    placeholder="شركة المطاحن..."
                    className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#333333] text-[#F5EBE6] placeholder-[#6C635B] rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 border-t border-[#262626] flex items-center justify-end gap-2 shrink-0 bg-[#101010]">
                <button
                  type="button"
                  onClick={() => setIsRawModalOpen(false)}
                  className="px-4 py-2 text-[#8C827A] hover:bg-[#222222] hover:text-[#F5EBE6] rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black rounded-xl shadow-md shadow-[#D4AF37]/20"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Material Modal */}
      {restockingRaw && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all"
          onClick={() => setRestockingRaw(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] rounded-3xl max-w-sm w-full p-6 border border-emerald-700/80 shadow-2xl space-y-4 max-h-[85vh] max-h-[85dvh] overflow-y-auto text-[#E0D8D0]"
          >
            <h3 className="font-bold text-lg font-heading text-[#F5EBE6]">
              توريد وتغذية مخزون: {restockingRaw.name}
            </h3>
            <p className="text-xs text-[#8C827A]">
              الرصيد الحالي: {restockingRaw.currentStock} {restockingRaw.unit}
            </p>

            <div>
              <label className="text-xs font-bold text-[#A8A096] block mb-1">
                الكمية الموردة الجديدة ({restockingRaw.unit}):
              </label>
              <input
                type="number"
                step="1"
                min="0.5"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                className="w-full text-xl font-mono font-black p-3 bg-[#1E1E1E] text-emerald-400 rounded-xl border border-emerald-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockingRaw(null)}
                className="px-4 py-2 text-xs font-bold text-[#8C827A] hover:bg-[#222222] hover:text-[#F5EBE6] rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="cursor-pointer px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl shadow-md"
              >
                تأكيد التوريد وإضافة للرصيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Produce Modal */}
      {producingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all"
          onClick={() => setProducingProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] rounded-3xl max-w-md w-full p-6 border border-[#5A451A] shadow-2xl space-y-4 max-h-[85vh] max-h-[85dvh] overflow-y-auto text-[#E0D8D0]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#241D12] text-[#D4AF37] rounded-xl border border-[#5A451A]">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#F5EBE6] font-heading">
                  خبز وإنتاج دفعة: {producingProduct.name}
                </h3>
                <span className="text-xs text-[#8C827A]">
                  سيتم خصم المواد الخام تلقائيًا بناءً على الوصفة
                </span>
              </div>
            </div>

            {produceFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold ${
                  produceFeedback.type === 'success'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-red-950 text-red-300 border border-red-800'
                }`}
              >
                {produceFeedback.message}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#A8A096] block mb-1">
                الكمية المراد إنتاجها (
                {producingProduct.unitType === 'weight' ? 'كجم' : 'قطعة'}):
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={produceQty}
                onChange={(e) => setProduceQty(e.target.value)}
                className="w-full text-2xl font-mono font-black p-3 bg-[#1E1E1E] text-[#D4AF37] rounded-xl border border-[#5A451A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-left"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProducingProduct(null)}
                className="px-4 py-2 text-xs font-bold text-[#8C827A] hover:bg-[#222222] hover:text-[#F5EBE6] rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isProducing}
                onClick={handleExecuteProduce}
                className={`cursor-pointer px-5 py-2 text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 ${
                  isProducing
                    ? 'opacity-50 cursor-not-allowed bg-stone-700 text-stone-300'
                    : 'text-stone-950 bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] shadow-[#D4AF37]/20'
                }`}
              >
                {isProducing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                    <span>جاري الإنتاج والخصم...</span>
                  </>
                ) : (
                  <span>تأكيد الإنتاج والخصم</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal with Cash Reconciliation & Z-Report Flow */}
      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
      />

      {/* Historical Z-Report Modal Inspector */}
      <ZReportModal
        isOpen={!!inspectZReportShift}
        shift={inspectZReportShift}
        onClose={() => setInspectZReportShift(null)}
      />

      {/* Invoice Detailed Inspection Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-all"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] rounded-3xl max-w-lg w-full max-h-[85vh] max-h-[85dvh] flex flex-col border border-[#2A2A2A] shadow-2xl overflow-hidden text-[#E0D8D0]"
          >
            {/* Header */}
            <div className="bg-[#101010] p-4 sm:p-5 flex items-center justify-between border-b border-[#262626] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#241D12] text-[#D4AF37] rounded-xl border border-[#5A451A]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-[#F5EBE6] font-mono">
                      فاتورة #{selectedInvoice.invoiceNumber}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedInvoice.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : selectedInvoice.status === 'refund_requested'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : selectedInvoice.status === 'refunded'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}
                    >
                      {selectedInvoice.status === 'completed'
                        ? 'مكتملة'
                        : selectedInvoice.status === 'refund_requested'
                        ? 'طلب استرجاع معلق'
                        : selectedInvoice.status === 'refunded'
                        ? 'مسترجعة'
                        : 'ملغاة'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C827A]">
                    {new Date(selectedInvoice.timestamp).toLocaleString('ar-EG', {
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="cursor-pointer p-2 text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#222222] rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Cashier & Meta Info */}
              <div className="grid grid-cols-2 gap-2 bg-[#1A1A1A] p-3 rounded-2xl border border-[#262626]">
                <div>
                  <span className="text-[#8C827A] block text-[11px]">الكاشير المسؤول:</span>
                  <span className="font-bold text-[#F5EBE6]">{selectedInvoice.cashierName}</span>
                </div>
                <div>
                  <span className="text-[#8C827A] block text-[11px]">طريقة السداد:</span>
                  <span className="font-bold text-[#D4AF37] flex items-center gap-1">
                    {selectedInvoice.paymentMethod === 'cash'
                      ? '💵 نقدي (كاش)'
                      : selectedInvoice.paymentMethod === 'card'
                      ? '💳 بطاقة بنكية'
                      : '📱 محفظة إلكترونية'}
                  </span>
                </div>
                {selectedInvoice.cashGiven !== undefined && (
                  <div>
                    <span className="text-[#8C827A] block text-[11px]">المدفوع نقداً:</span>
                    <span className="font-mono font-bold text-[#F5EBE6]">
                      {selectedInvoice.cashGiven.toFixed(2)} ج.م
                    </span>
                  </div>
                )}
                {selectedInvoice.changeDue !== undefined && (
                  <div>
                    <span className="text-[#8C827A] block text-[11px]">الباقي للعميل:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {selectedInvoice.changeDue.toFixed(2)} ج.م
                    </span>
                  </div>
                )}
                {selectedInvoice.isRetroactive && (
                  <div className="col-span-2 text-amber-400 bg-amber-950/30 p-2 rounded-xl border border-amber-800/60 mt-1">
                    ⚠️ عملية مسجلة بأثر رجعي: {selectedInvoice.retroactiveNote || 'بدون ملاحظات'}
                  </div>
                )}
              </div>

              {/* Items Breakdown */}
              <div>
                <label className="font-bold text-[#A8A096] uppercase tracking-wider block mb-2 text-[11px]">
                  الأصناف والبنود المباعة ({selectedInvoice.items.length}):
                </label>
                <div className="bg-[#181818] rounded-2xl border border-[#2A2A2A] divide-y divide-[#242424] overflow-hidden">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#F5EBE6] text-xs">
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-[#8C827A]">
                          {item.unitType === 'weight' ? (
                            <span>
                              وزن: <strong className="text-[#D4AF37]">{item.weightKg} كجم</strong> ×{' '}
                              {item.unitPrice} ج/كجم
                            </span>
                          ) : (
                            <span>
                              عدد: <strong className="text-[#D4AF37]">{item.quantity} قطعة</strong> ×{' '}
                              {item.unitPrice} ج.م
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-left font-mono font-bold text-[#D4AF37] text-sm">
                        {item.subtotal.toFixed(2)} ج.م
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-gradient-to-br from-[#241B0E] to-[#120E08] border border-[#4A3B1B] p-4 rounded-2xl flex items-center justify-between">
                <span className="text-sm font-bold text-[#A8A096]">إجمالي الفاتورة:</span>
                <span className="text-2xl font-mono font-black text-[#D4AF37]">
                  {selectedInvoice.totalAmount.toFixed(2)}{' '}
                  <span className="text-xs font-sans text-[#AA820A]">ج.م</span>
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#101010] p-4 border-t border-[#262626] flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="cursor-pointer px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-[#F5EBE6] font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4 text-[#D4AF37]" />
                <span>طباعة نسخة</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="cursor-pointer px-5 py-2 bg-[#D4AF37] hover:bg-[#E5C04B] text-stone-950 font-black rounded-xl text-xs transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Recipe Formulation Editor Modal */}
      {editingRecipeProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-all"
          onClick={() => setEditingRecipeProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] rounded-3xl max-w-lg w-full max-h-[85vh] max-h-[85dvh] flex flex-col border border-[#2A2A2A] shadow-2xl overflow-hidden text-[#E0D8D0]"
          >
            {/* Header */}
            <div className="bg-[#101010] p-4 sm:p-5 flex items-center justify-between border-b border-[#262626] flex-shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={editingRecipeProduct.image}
                  alt={editingRecipeProduct.name}
                  className="w-10 h-10 rounded-xl object-cover border border-[#333333]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-[#F5EBE6]">
                      معايرة وصفة: {editingRecipeProduct.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#8C827A]">
                    المقادير المقررة لإنتاج 1{' '}
                    {editingRecipeProduct.unitType === 'weight' ? 'كيلوجرام' : 'قطعة'} (سعر البيع:{' '}
                    {editingRecipeProduct.price} ج.م)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecipeProduct(null)}
                className="cursor-pointer p-2 text-[#8C827A] hover:text-[#F5EBE6] hover:bg-[#222222] rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form & Body */}
            <form onSubmit={handleSaveRecipe} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="bg-[#1C1810] border border-[#4A3B1B] p-3 rounded-2xl text-[11px] text-[#D4AF37] flex items-center gap-2">
                  <ChefHat className="w-4 h-4 flex-shrink-0" />
                  <span>
                    عند خبز أي دفعة من هذا الصنف، سيقوم النظام تلقائياً بخصم هذه النسب من أرصدة مخزن
                    الخامات.
                  </span>
                </div>

                {/* Ingredients List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#A8A096] uppercase tracking-wider text-[11px]">
                      المواد الخام المكونة للوصفة ({recipeIngredients.length}):
                    </label>
                    <button
                      type="button"
                      onClick={handleAddRecipeIngredient}
                      className="cursor-pointer text-xs font-bold text-[#D4AF37] hover:text-[#E5C04B] hover:bg-[#241D12] px-2.5 py-1 rounded-xl border border-[#5A451A] inline-flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة مادة خام</span>
                    </button>
                  </div>

                  {recipeIngredients.length === 0 ? (
                    <div className="p-6 text-center bg-[#181818] rounded-2xl border border-dashed border-[#333333]">
                      <Boxes className="w-8 h-8 text-[#8C827A] mx-auto mb-1.5 opacity-50" />
                      <p className="text-xs text-[#8C827A]">لم تتم إضافة أي مادة خام للوصفة بعد</p>
                      <button
                        type="button"
                        onClick={handleAddRecipeIngredient}
                        className="cursor-pointer mt-2 px-3 py-1.5 bg-[#D4AF37] text-stone-950 font-bold rounded-xl text-xs"
                      >
                        + إضافة أول مادة
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recipeIngredients.map((ing, idx) => {
                        const raw = rawMaterials.find((r) => r.id === ing.rawMaterialId);
                        const ingCost = raw ? raw.costPerUnit * ing.quantityNeeded : 0;

                        return (
                          <div
                            key={idx}
                            className="bg-[#181818] p-3 rounded-2xl border border-[#2A2A2A] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 justify-between"
                          >
                            {/* Raw Material Select */}
                            <div className="flex-1">
                              <select
                                value={ing.rawMaterialId}
                                onChange={(e) =>
                                  handleUpdateRecipeIngredient(
                                    idx,
                                    e.target.value,
                                    ing.quantityNeeded
                                  )
                                }
                                className="w-full px-2.5 py-1.5 bg-[#222222] border border-[#383838] text-[#F5EBE6] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-bold"
                              >
                                {rawMaterials.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name} ({r.costPerUnit} ج/{r.unit}) - متوفر: {r.currentStock}{' '}
                                    {r.unit}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Quantity Needed Input */}
                            <div className="flex items-center gap-2">
                              <div className="relative w-24">
                                <input
                                  type="number"
                                  step="0.001"
                                  min="0.001"
                                  required
                                  value={ing.quantityNeeded}
                                  onChange={(e) =>
                                    handleUpdateRecipeIngredient(
                                      idx,
                                      ing.rawMaterialId,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full px-2.5 py-1.5 bg-[#222222] border border-[#383838] text-[#D4AF37] rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                                />
                              </div>
                              <span className="text-[11px] text-[#8C827A] font-bold w-8">
                                {raw ? raw.unit : ''}
                              </span>

                              {/* Estimated Sub-cost */}
                              <div className="w-16 text-left font-mono text-[11px] text-emerald-400 font-bold">
                                {ingCost > 0 ? `${ingCost.toFixed(2)} ج` : '0.00 ج'}
                              </div>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveRecipeIngredient(idx)}
                                className="cursor-pointer p-1.5 text-[#8C827A] hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                                title="إزالة هذه المادة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Total Cost & Margin Breakdown */}
                {(() => {
                  const totalRawCost = recipeIngredients.reduce((sum, ing) => {
                    const raw = rawMaterials.find((r) => r.id === ing.rawMaterialId);
                    return sum + (raw ? raw.costPerUnit * ing.quantityNeeded : 0);
                  }, 0);
                  const price = editingRecipeProduct.price;
                  const grossProfit = price - totalRawCost;
                  const marginPct =
                    price > 0 && totalRawCost > 0 ? Math.round((grossProfit / price) * 100) : 0;

                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1C1810] to-[#120E08] border border-[#4A3B1B] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8C827A]">
                          إجمالي تكلفة الخامات لكل 1{' '}
                          {editingRecipeProduct.unitType === 'weight' ? 'كجم' : 'قطعة'}:
                        </span>
                        <span className="font-mono font-bold text-sm text-emerald-400">
                          {totalRawCost.toFixed(2)} ج.م
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#332715]">
                        <span className="text-[#8C827A]">سعر البيع للجمهور:</span>
                        <span className="font-mono font-bold text-sm text-[#D4AF37]">
                          {price.toFixed(2)} ج.م
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#332715]">
                        <span className="text-[#F5EBE6] font-bold">هامش الربح الإجمالي:</span>
                        <span
                          className={`font-mono font-black text-sm ${
                            grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {grossProfit.toFixed(2)} ج.م ({marginPct}%)
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="bg-[#101010] p-4 border-t border-[#262626] flex items-center justify-end gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingRecipeProduct(null)}
                  className="cursor-pointer px-4 py-2 text-[#8C827A] hover:bg-[#222222] hover:text-[#F5EBE6] rounded-xl font-bold text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black rounded-xl text-xs shadow-md shadow-[#D4AF37]/20 transition"
                >
                  حفظ واعتماد الوصفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Shift Modal */}
      <StartShiftModal
        isOpen={isStartShiftModalOpen}
        onClose={() => setIsStartShiftModalOpen(false)}
      />

      {/* Close Shift Modal */}
      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
      />

      {/* Z-Report Modal */}
      <ZReportModal
        isOpen={!!inspectZReportShift}
        onClose={() => setInspectZReportShift(null)}
        shift={inspectZReportShift}
      />

      {/* Staff Department & Role Edit Modal */}
      {editingStaffUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#3A2E14] text-[#E0D8D0] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#241D12] text-[#D4AF37] border border-[#5A451A] flex items-center justify-center font-bold">
                  {editingStaffUser.avatar || '👤'}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#F5EBE6]">تعديل قسم وصلاحيات الموظف</h3>
                  <p className="text-xs text-[#8C827A]">{editingStaffUser.name} (@{editingStaffUser.username})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaffUser(null)}
                className="text-stone-400 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUserDepartment(editingStaffUser.id, editRole, editDepartment, editJobTitle, editPreferredView);
                setEditingStaffUser(null);
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1.5">
                <label className="font-bold text-[#D4AF37] block">نوع الدور الأساسي (Role):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('staff')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editRole === 'staff'
                        ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37]'
                        : 'bg-[#1C1C1C] border-[#333333] text-stone-300'
                    }`}
                  >
                    <span>موظف تشغيلي (Staff)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRole('owner')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editRole === 'owner'
                        ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37]'
                        : 'bg-[#1C1C1C] border-[#333333] text-stone-300'
                    }`}
                  >
                    <span>مدير وإشراف (Owner)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#D4AF37] block">القسم الإداري (Department):</label>
                <select
                  value={editDepartment}
                  onChange={(e) => {
                    setEditDepartment(e.target.value);
                    if (e.target.value === 'كاشير ومبيعات') {
                      setEditJobTitle('كاشير نقطة بيع');
                    } else if (e.target.value === 'مطبخ وإنتاج') {
                      setEditJobTitle('شيف مخبوزات وحلويات');
                      setEditPreferredView('kitchen');
                    } else if (e.target.value === 'مستودع ومخازن') {
                      setEditJobTitle('أمين مخزن ومشتريات');
                    } else if (e.target.value === 'إدارة وإشراف') {
                      setEditJobTitle('مشرف وردية');
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#1C1C1C] border border-[#3A3A3A] text-stone-200 text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="كاشير ومبيعات">كاشير ومبيعات</option>
                  <option value="مطبخ وإنتاج">مطبخ وإنتاج (شيف مخبوزات)</option>
                  <option value="مستودع ومخازن">مستودع ومخازن (أمين مخزن)</option>
                  <option value="إدارة وإشراف">إدارة وإشراف (مشرف وردية)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#D4AF37] block">المسمى الوظيفي الدقيق (Job Title):</label>
                <input
                  type="text"
                  required
                  value={editJobTitle}
                  onChange={(e) => setEditJobTitle(e.target.value)}
                  placeholder="مثال: كاشير نقطة بيع، شيف بيتزا ومخبوزات..."
                  className="w-full p-2.5 rounded-xl bg-[#1C1C1C] border border-[#3A3A3A] text-stone-200 text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Default landing interface toggle */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#D4AF37] block">
                  واجهة العمل الافتراضية عند تسجيل الدخول:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPreferredView('pos')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editPreferredView === 'pos'
                        ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37]'
                        : 'bg-[#1C1C1C] border-[#333333] text-stone-300'
                    }`}
                  >
                    <span>نقطة البيع (POS) 🛒</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPreferredView('kitchen')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editPreferredView === 'kitchen'
                        ? 'bg-[#D4AF37] text-stone-950 border-[#D4AF37]'
                        : 'bg-[#1C1C1C] border-[#333333] text-stone-300'
                    }`}
                  >
                    <span>شاشة الشيف وخبز الدفعات 👨‍🍳</span>
                  </button>
                </div>
                <span className="text-[10px] text-stone-400 block mt-1">
                  عندما يكتب الموظف كلمة مروره أو رمزه السري، ستفتح له هذه الواجهة مباشرة. يمكنه التبديل في أي وقت من الشريط العلوي.
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#181818] border border-[#2A2A2A] text-[11px] text-[#A8A096]">
                ℹ️ شاشة الشيف تتيح طلب مقادير المواد الخام لخبز دفعات جديدة (بالكيلو أو بالقطعة) وحسمها فورياً من المخزن، مع حظر تعديل أسعار البيع أو نسب الوصفات.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setEditingStaffUser(null)}
                  className="px-4 py-2 text-stone-400 hover:text-white rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B89028] hover:from-[#E5C04B] hover:to-[#C59B30] text-stone-950 font-black rounded-xl shadow-md transition"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Deactivation Confirmation Modal */}
      {deactivatingStaffUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-red-800/80 text-[#E0D8D0] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-700 text-red-400 flex items-center justify-center font-bold text-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-red-200">تأكيد تعطيل وتجميد حساب الموظف</h3>
                <p className="text-xs text-[#8C827A]">
                  الموظف: <span className="text-white font-bold">{deactivatingStaffUser.name}</span> (@{deactivatingStaffUser.username})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/60 text-xs text-red-200/90 leading-relaxed space-y-2">
              <p>
                ⚠️ <strong>تنبيه الصلاحيات:</strong> عند الموافقة، سيصبح هذا الحساب <strong>خاملاً تماماً وبدون أي صلاحيات</strong> على النظام.
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-red-300/80">
                <li>لن يتمكن الموظف من تسجيل الدخول أو استخدام شاشة الكاشير.</li>
                <li>ستبقى بياناته ومعاملاته السابقة محفوظة بالكامل في سجلاتك.</li>
                <li>سيبقى الموظف في قائمة المدير، ويمكنك إعادة تنشيط حسابه فوراً في أي وقت بنقرة واحدة.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setDeactivatingStaffUser(null)}
                className="px-4 py-2 text-stone-400 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  deactivateUser(deactivatingStaffUser.id);
                  setDeactivatingStaffUser(null);
                }}
                className="cursor-pointer px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white font-black rounded-xl text-xs shadow-lg shadow-red-950 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>نعم، تجميد الحساب الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
      />

      {/* Audit Log Details & Diffs Modal */}
      <AuditLogDetailsModal
        log={selectedAuditLogForModal}
        onClose={() => setSelectedAuditLogForModal(null)}
      />
    </div>
  );
};
