import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  User,
  Product,
  RawMaterial,
  CartItem,
  SaleRecord,
  RefundRequest,
  AuditLog,
  AuditDiffItem,
  ShiftSession,
  PaymentMethod,
  UserRole,
  EmployeeDepartment,
  ShiftCashDenominations,
  ShiftCashierSignature,
  BakeryBackupData,
  BakerySettings,
  SecuritySettings,
  FailedLoginLog,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_RAW_MATERIALS,
  INITIAL_SHIFT,
} from '../data/initialData';
import { sounds } from '../utils/sound';
import { isShiftExpired, checkShiftCloseAllowed } from '../utils/shiftUtils';
import {
  validatePassword,
  isPasswordExpired,
  getDeviceInfo,
  generateSessionToken,
} from '../utils/securityUtils';

interface BakeryContextType {
  // Auth & Session
  currentUser: User | null;
  users: User[];
  isLocked: boolean;
  lockTerminal: () => void;
  turnOffScreen: () => void;
  unlockTerminal: (pin: string, userId?: string) => { success: boolean; message?: string; isPending?: boolean; pendingUser?: User };
  login: (userOrId: string, pinOrPass?: string, remember?: boolean) => { success: boolean; message?: string; isPending?: boolean; pendingUser?: User; isLocked?: boolean };
  loginUserDirectly: (user: User, remember?: boolean) => { success: boolean; user?: User };
  logout: () => void;
  registerStaff: (name: string, username: string, pin: string, phone: string) => { success: boolean; message: string; newUser?: User };
  addStaffUserByManager: (userData: {
    name: string;
    username: string;
    pin: string;
    phone?: string;
    role: UserRole;
    department?: EmployeeDepartment;
    jobTitle?: string;
  }) => { success: boolean; message: string; newUser?: User };
  approveStaff: (userId: string) => void;
  rejectStaff: (userId: string) => void;
  deleteUser: (userId: string) => void;
  deactivateUser: (userId: string) => void;
  reactivateUser: (userId: string) => void;
  permanentDeleteUser: (userId: string) => void;
  updateUserDepartment: (userId: string, department: EmployeeDepartment, jobTitle?: string, role?: UserRole, preferredView?: 'pos' | 'kitchen' | 'dashboard') => void;
  verifyOwnerPin: (pin: string) => boolean;
  verifyManagerCredentials: (secret: string) => { success: boolean; managerUser?: User; message?: string };
  authorizeAndActivatePendingUser: (
    targetUserId: string,
    managerSecret: string,
    loginMode?: 'as_manager' | 'as_user' | 'activate_only'
  ) => { success: boolean; message: string; user?: User };

  // Security Settings & Access Control
  securitySettings: SecuritySettings;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  failedLoginLogs: FailedLoginLog[];
  clearFailedLoginLogs: () => void;
  unlockUserAccount: (userId: string) => void;
  changeUserPassword: (userId: string, newPass: string, autoActivate?: boolean) => { success: boolean; message: string; updatedUser?: User };
  autoLockTerminal: () => void;
  recordFailedLogin: (usernameOrId: string, reason: string) => void;
  sessionTerminatedNotice: string | null;
  clearSessionTerminatedNotice: () => void;
  lockedOutUser: User | null;
  setLockedOutUser: (user: User | null) => void;
  clearLockedOutUser: () => void;
  isStandbyScreenOpen: boolean;
  setIsStandbyScreenOpen: (open: boolean) => void;
  terminalFailedAttempts: number;
  unlockTerminalOverride: (managerSecret: string) => { success: boolean; message: string };
  resetTerminalLockout: () => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => { success: boolean; message?: string };
  toggleProductAvailability: (id: string) => void;

  // Raw Materials
  rawMaterials: RawMaterial[];
  addRawMaterial: (material: Omit<RawMaterial, 'id' | 'lastUpdated'>) => void;
  updateRawMaterial: (id: string, updates: Partial<RawMaterial>) => void;
  deleteRawMaterial: (id: string) => void;
  restockRawMaterial: (id: string, addedAmount: number, cost?: number) => void;
  produceBatch: (productId: string, quantityToProduce: number) => { success: boolean; message: string };

  // POS & Cart
  cart: CartItem[];
  addToCartPiece: (product: Product, qty?: number) => void;
  addToCartWeight: (product: Product, weightKg: number, subtotal: number) => void;
  updateCartItemQty: (itemId: string, qty: number) => void;
  updateCartItemWeight: (itemId: string, weightKg: number, subtotal: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  voidCurrentCart: (reason: string) => void;
  checkoutCart: (params: {
    paymentMethod: PaymentMethod;
    cashGiven?: number;
    changeDue?: number;
    isRetroactive?: boolean;
    retroactiveNote?: string;
  }) => { success: boolean; saleRecord?: SaleRecord; message?: string };

  // Sales & Refunds
  sales: SaleRecord[];
  refundRequests: RefundRequest[];
  requestRefund: (saleId: string, reason: string) => { success: boolean; message: string };
  approveRefund: (requestId: string, note?: string) => { success: boolean; message: string };
  rejectRefund: (requestId: string, note?: string) => { success: boolean; message: string };

  // Shifts
  currentShift: ShiftSession | null;
  shiftHistory: ShiftSession[];
  startShift: (
    startingCash: number,
    scheduledDurationHours?: number,
    managerSecret?: string,
    targetCashierId?: string,
    customScheduledEndTime?: string
  ) => { success: boolean; message: string };
  closeShift: (
    actualCash: number,
    notes?: string,
    managerSecret?: string,
    isEarlyClose?: boolean,
    earlyCloseReason?: string,
    cashDenominations?: ShiftCashDenominations,
    cashierSignature?: ShiftCashierSignature
  ) => { success: boolean; message: string };
  updateActiveShiftSchedule: (
    scheduledEndTime: string,
    notes?: string
  ) => { success: boolean; message: string };
  suspendCurrentShift: () => void;
  resumeCurrentShift: () => void;

  // Audit Logs
  auditLogs: AuditLog[];
  logAuditAction: (
    action: string,
    details: string,
    type: AuditLog['type'],
    diffs?: AuditDiffItem[],
    metadata?: Record<string, any>
  ) => void;

  // Alerts & Notifications
  lowStockProducts: Product[];
  lowStockRawMaterials: RawMaterial[];
  pendingRefundsCount: number;
  pendingUsersCount: number;

  // Permissions helper
  canPerform: (action: PermissionAction) => boolean;

  // Bakery Profile & Settings
  bakerySettings: BakerySettings;
  updateBakeryName: (name: string) => { success: boolean; message: string };
  updateBakerySettings: (settings: Partial<BakerySettings>) => { success: boolean; message: string };

  // Audio Toggle
  soundEnabled: boolean;
  toggleSound: () => void;

  // Theme (Dark / Light)
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Backup & Data Safety
  exportBackupJSON: () => BakeryBackupData;
  restoreBackupJSON: (backupData: BakeryBackupData) => { success: boolean; message: string };
  exportSalesCSV: () => string;
}

export type PermissionAction =
  | 'sell'
  | 'add_edit_products'
  | 'delete_products'
  | 'adjust_stock_manually'
  | 'configure_recipes'
  | 'void_transaction'
  | 'request_refund'
  | 'approve_refund'
  | 'close_shift'
  | 'add_retroactive_sale'
  | 'view_reports'
  | 'view_audit_logs'
  | 'manage_raw_materials'
  | 'manage_staff';

const BakeryContext = createContext<BakeryContextType | undefined>(undefined);

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  autoLockSeconds: 120, // 2 minutes (120 seconds)
  ownerExtendedLockSeconds: 1800, // 30 minutes for owner
  ownerExtendedEnabled: true,
  warningSeconds: 30, // 30 seconds before auto-locking
  require2FAForManagers: true,
  passwordMinLength: 8,
  passwordExpiryDays: 30,
  maxFailedAttempts: 3,
};

export const BakeryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Security settings & Access control policy
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem('bakery_security_settings');
    return saved ? { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SECURITY_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('bakery_security_settings', JSON.stringify(securitySettings));
  }, [securitySettings]);

  const [failedLoginLogs, setFailedLoginLogs] = useState<FailedLoginLog[]>(() => {
    const saved = localStorage.getItem('bakery_failed_logins');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('bakery_failed_logins', JSON.stringify(failedLoginLogs));
  }, [failedLoginLogs]);

  const [sessionTerminatedNotice, setSessionTerminatedNotice] = useState<string | null>(null);
  const [lockedOutUser, setLockedOutUser] = useState<User | null>(null);
  const [isStandbyScreenOpen, setIsStandbyScreenOpen] = useState<boolean>(false);

  // Terminal-level failed attempts counter (persisted across refreshes to prevent brute-force attacks)
  const [terminalFailedAttempts, setTerminalFailedAttempts] = useState<number>(() => {
    const saved = localStorage.getItem('bakery_terminal_failed_attempts');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  const resetTerminalLockout = useCallback(() => {
    setTerminalFailedAttempts(0);
    localStorage.removeItem('bakery_terminal_failed_attempts');
    setLockedOutUser(null);
    setIsStandbyScreenOpen(false);
  }, []);

  const clearLockedOutUser = useCallback(() => {
    if (terminalFailedAttempts >= (securitySettings.maxFailedAttempts || 3)) {
      sounds.playWarning();
      return;
    }
    setLockedOutUser(null);
    setIsStandbyScreenOpen(false);
  }, [terminalFailedAttempts, securitySettings.maxFailedAttempts]);

  // Load initial state with localStorage fallbacks
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('bakery_users');
    const parsed: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    return parsed.map((u) => {
      let pin = u.pin;
      if (pin === '1234') pin = '123456';
      else if (pin === '1111') pin = '111111';
      else if (pin === '2222') pin = '222222';
      else if (pin === '3333') pin = '333333';
      else if (pin && pin.length < 6) pin = pin.padEnd(6, '0');

      let name = u.name.replace(/\s*\([^)]*\)/g, '').trim();
      const defaultPass =
        u.role === 'owner'
          ? 'Owner@2026!'
          : `${u.username.charAt(0).toUpperCase() + u.username.slice(1)}@2026!`;

      return {
        ...u,
        pin,
        name,
        password: u.password || defaultPass,
        passwordUpdatedAt: u.passwordUpdatedAt || u.createdAt || new Date().toISOString(),
        previousPasswords: u.previousPasswords || [],
        failedLoginAttempts: u.failedLoginAttempts || 0,
        isAccountLocked: u.isAccountLocked || false,
        twoFactorEnabled: u.role === 'owner' ? (u.twoFactorEnabled ?? true) : false,
      };
    });
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('bakery_current_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return INITIAL_USERS[0]; // default to owner if parse fails
      }
    }
    // Default to Owner on fresh run so the user can immediately experience the app
    return INITIAL_USERS[0];
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem('bakery_is_locked');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('bakery_is_locked', JSON.stringify(isLocked));
  }, [isLocked]);

  // Single active session: Detect if user logged into another device/tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bakery_active_session_sync' && e.newValue && currentUser) {
        try {
          const syncData = JSON.parse(e.newValue);
          const myToken = sessionStorage.getItem('bakery_my_session_token');
          if (syncData.userId === currentUser.id && syncData.token && syncData.token !== myToken) {
            setCurrentUser(null);
            setIsLocked(true);
            setSessionTerminatedNotice(
              '⚠️ تم إنهاء جلستك: تم تسجيل الدخول إلى هذا الحساب من جهاز أو نافذة أخرى. لحماية أمان وبيانات المخبز، يُسمح بجلسة نشطة واحدة فقط لكل مستخدم.'
            );
            sounds.playWarning();
          }
        } catch {
          // ignore parsing error
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  const [bakerySettings, setBakerySettings] = useState<BakerySettings>(() => {
    const saved = localStorage.getItem('bakery_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && parsed.name.trim().length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return {
      name: 'مخبز النور الذهبي',
      slogan: 'أشهى المخبوزات والحلويات والفطائر الفلاحي',
      phone: '01012345678',
      taxNumber: '394829104',
      address: 'فرع المخبز الرئيسي',
      logoEmoji: '🥐',
    };
  });

  useEffect(() => {
    localStorage.setItem('bakery_settings', JSON.stringify(bakerySettings));
  }, [bakerySettings]);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('bakery_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => {
    const saved = localStorage.getItem('bakery_raw_materials');
    return saved ? JSON.parse(saved) : INITIAL_RAW_MATERIALS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('bakery_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('bakery_sales');
    if (saved) return JSON.parse(saved);
    // Initial sample sale for immediate preview
    return [
      {
        id: 'sale-init-1',
        invoiceNumber: 'INV-1001',
        cashierId: 'user-staff-1',
        cashierName: 'أحمد حسني (كاشير الصباح)',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        items: [
          {
            productId: 'prod-fino-lg',
            productName: 'عيش فينو ك',
            unitType: 'piece',
            unitPrice: 3,
            quantity: 10,
            subtotal: 30,
          },
          {
            productId: 'prod-buqsamat',
            productName: 'بقسماط',
            unitType: 'weight',
            unitPrice: 80,
            quantity: 1,
            weightKg: 0.5,
            subtotal: 40,
          },
        ],
        totalAmount: 70,
        paymentMethod: 'cash',
        cashGiven: 100,
        changeDue: 30,
        status: 'completed',
      },
    ];
  });

  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>(() => {
    const saved = localStorage.getItem('bakery_refund_requests');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('bakery_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'audit-init-1',
        userId: 'user-owner-1',
        userName: 'إبراهيم النور (المدير)',
        userRole: 'owner',
        action: 'تسجيل دخول ناجح',
        details: 'بدء جلسة العمل الإدارية وتحديث قائمة الأسعار',
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
        type: 'login',
      },
      {
        id: 'audit-init-2',
        userId: 'user-staff-1',
        userName: 'أحمد حسني (كاشير الصباح)',
        userRole: 'staff',
        action: 'عملية بيع #INV-1001',
        details: 'إتمام بيع فينو وبقسماط بقيمة 70 ج.م نقدًا',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'sale',
      },
    ];
  });

  const [currentShift, setCurrentShift] = useState<ShiftSession | null>(() => {
    const saved = localStorage.getItem('bakery_current_shift');
    if (saved === 'closed' || saved === 'none') return null;
    if (!saved) {
      // If history exists, user has previously closed shifts so do not resurrect INITIAL_SHIFT
      const historySaved = localStorage.getItem('bakery_shift_history');
      if (historySaved !== null) return null;
      return INITIAL_SHIFT;
    }
    try {
      const parsed: ShiftSession = JSON.parse(saved);
      if (parsed && parsed.status === 'open') {
        const openedMs = new Date(parsed.openedAt).getTime() || Date.now();
        const schedMs = parsed.scheduledEndTime ? new Date(parsed.scheduledEndTime).getTime() : 0;
        // If scheduledEndTime is in the past, invalid, or corrupted (e.g. 1970 timestamp), repair it:
        if (isNaN(schedMs) || schedMs <= openedMs + 5 * 60 * 1000) {
          const hours = (parsed.shiftDurationHours && parsed.shiftDurationHours > 0) ? parsed.shiftDurationHours : 8;
          parsed.scheduledEndTime = new Date(openedMs + hours * 60 * 60 * 1000).toISOString();
        }
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [shiftHistory, setShiftHistory] = useState<ShiftSession[]>(() => {
    const saved = localStorage.getItem('bakery_shift_history');
    if (!saved) return [];
    try {
      const parsed: ShiftSession[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Deduplicate shifts by ensuring globally unique IDs
      const seenIds = new Set<string>();
      const sanitized: ShiftSession[] = [];
      parsed.forEach((shift, index) => {
        let uniqueId = shift.id || `shift-${Date.now()}-${index}`;
        if (seenIds.has(uniqueId)) {
          uniqueId = `${uniqueId}-${index}`;
          shift = { ...shift, id: uniqueId };
        }
        seenIds.add(uniqueId);
        sanitized.push(shift);
      });
      return sanitized;
    } catch {
      return [];
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('bakery_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('bakery_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('bakery_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    sounds.playClick();
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('bakery_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bakery_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('bakery_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('bakery_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('bakery_raw_materials', JSON.stringify(rawMaterials));
  }, [rawMaterials]);

  useEffect(() => {
    localStorage.setItem('bakery_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('bakery_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('bakery_refund_requests', JSON.stringify(refundRequests));
  }, [refundRequests]);

  useEffect(() => {
    localStorage.setItem('bakery_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (currentShift) {
      localStorage.setItem('bakery_current_shift', JSON.stringify(currentShift));
    } else {
      localStorage.setItem('bakery_current_shift', 'closed');
    }
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem('bakery_shift_history', JSON.stringify(shiftHistory));
  }, [shiftHistory]);

  useEffect(() => {
    localStorage.setItem('bakery_sound_enabled', JSON.stringify(soundEnabled));
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Log an audit trail item
  const logAuditAction = useCallback(
    (
      action: string,
      details: string,
      type: AuditLog['type'],
      diffs?: AuditDiffItem[],
      metadata?: Record<string, any>
    ) => {
      const newLog: AuditLog = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: currentUser?.id || 'system',
        userName: currentUser?.name || 'النظام التلقائي',
        userRole: currentUser?.role || 'staff',
        action,
        details,
        timestamp: new Date().toISOString(),
        type,
        diffs,
        metadata,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [currentUser]
  );

  // Sound toggle
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      sounds.enabled = next;
      return next;
    });
  }, []);

  // Permissions Matrix Check
  const canPerform = useCallback(
    (action: PermissionAction): boolean => {
      if (!currentUser) return false;
      const isOwner = currentUser.role === 'owner';

      switch (action) {
        case 'sell':
        case 'void_transaction':
        case 'add_retroactive_sale':
          return true; // Both Owner and Staff can do these
        case 'add_edit_products':
          return true; // Planned: staff can do if verified
        case 'request_refund':
          return true; // Staff can request, Owner can approve/execute
        case 'delete_products':
        case 'adjust_stock_manually':
        case 'configure_recipes':
        case 'approve_refund':
        case 'close_shift':
        case 'view_reports':
        case 'view_audit_logs':
        case 'manage_raw_materials':
        case 'manage_staff':
          return isOwner;
        default:
          return false;
      }
    },
    [currentUser]
  );

  // Security & Audit: Record failed login attempt and enforce 3-attempt lockout
  const recordFailedLogin = useCallback(
    (usernameOrId: string, reason: string) => {
      const timestamp = new Date().toISOString();
      const deviceInfo = getDeviceInfo();

      // Update terminal-level failed attempts counter
      const prevTerminal = parseInt(localStorage.getItem('bakery_terminal_failed_attempts') || '0', 10) || 0;
      const nextTerminal = prevTerminal + 1;
      localStorage.setItem('bakery_terminal_failed_attempts', String(nextTerminal));
      setTerminalFailedAttempts(nextTerminal);

      const isTerminalLockout = nextTerminal >= (securitySettings.maxFailedAttempts || 3);

      // Find user
      const userIndex = users.findIndex(
        (u) =>
          u.id === usernameOrId ||
          u.username.toLowerCase() === usernameOrId.toLowerCase() ||
          u.pin === usernameOrId
      );

      let attemptNum = nextTerminal;
      let isUserLockout = false;
      let targetUserObj: User | null = null;

      if (userIndex !== -1) {
        targetUserObj = users[userIndex];
        const nextAttempts = (targetUserObj.failedLoginAttempts || 0) + 1;
        attemptNum = nextAttempts;
        isUserLockout = nextAttempts >= (securitySettings.maxFailedAttempts || 3);

        const updatedUser: User = {
          ...targetUserObj,
          failedLoginAttempts: nextAttempts,
          isAccountLocked: isUserLockout ? true : targetUserObj.isAccountLocked,
          lockedAt: isUserLockout ? timestamp : targetUserObj.lockedAt,
        };

        setUsers((prev) => prev.map((u, i) => (i === userIndex ? updatedUser : u)));

        if (isUserLockout && !targetUserObj.isAccountLocked) {
          setLockedOutUser(updatedUser);
          setIsStandbyScreenOpen(true);
          setIsLocked(true);
          logAuditAction(
            'قفل حساب موظف تلقائياً',
            `تم قفل حساب ${targetUserObj.name} (@${targetUserObj.username}) بعد ${nextAttempts} محاولات دخول فاشلة متتالية من جهاز: ${deviceInfo}`,
            'account_locked'
          );
        }
      }

      if (isTerminalLockout) {
        setIsStandbyScreenOpen(true);
        setIsLocked(true);
        if (targetUserObj) {
          setLockedOutUser(targetUserObj);
        }
        logAuditAction(
          'قفل محطة نقاط البيع أمنياً',
          `تم إيقاف وقفل محطة نقاط البيع بالكامل بعد ${nextTerminal} محاولات دخول فاشلة متتالية (${reason}) - جهاز: ${deviceInfo}`,
          'account_locked'
        );
      }

      const newLog: FailedLoginLog = {
        id: `fail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp,
        username: targetUserObj ? targetUserObj.username : usernameOrId,
        reason,
        deviceInfo,
        attemptNumber: attemptNum,
      };

      setFailedLoginLogs((prev) => [newLog, ...prev.slice(0, 99)]);
      logAuditAction(
        'محاولة دخول فاشلة',
        `محاولة دخول غير ناجحة للمستخدم "${newLog.username}" (${reason}) - محاولة ${attemptNum} من ${securitySettings.maxFailedAttempts || 3} - جهاز: ${deviceInfo}`,
        'failed_login'
      );
      sounds.playWarning();
    },
    [users, securitySettings.maxFailedAttempts, logAuditAction]
  );

  const unlockUserAccount = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, isAccountLocked: false, failedLoginAttempts: 0, lockedAt: undefined }
            : u
        )
      );

      if (lockedOutUser?.id === userId) {
        setLockedOutUser(null);
        setIsStandbyScreenOpen(false);
      }

      logAuditAction(
        'إلغاء قفل حساب موظف',
        `قام المدير ${currentUser?.name || 'المدير'} بإلغاء قفل حساب الموظف ${user.name} (@${user.username}) وتصفير عداد المحاولات الفاشلة يدوياً`,
        'account_unlocked'
      );
      sounds.playSuccess();
    },
    [users, currentUser, logAuditAction]
  );

  const changeUserPassword = useCallback(
    (userId: string, newPass: string, autoActivate: boolean = true) => {
      const validation = validatePassword(newPass);
      if (!validation.isValid) {
        return { success: false, message: 'كلمة المرور لا تستوفي المعايير الأمنية المطلوبة' };
      }

      const user = users.find((u) => u.id === userId);
      if (!user) return { success: false, message: 'المستخدم غير موجود' };

      if (user.password === newPass || user.previousPasswords?.includes(newPass)) {
        return { success: false, message: 'لا يمكن إعادة استخدام كلمة المرور الحالية أو السابقة' };
      }

      const updatedHistory = [...(user.previousPasswords || []), user.password || ''].filter(Boolean);

      const updatedUser: User = {
        ...user,
        password: newPass,
        passwordUpdatedAt: new Date().toISOString(),
        previousPasswords: updatedHistory,
        failedLoginAttempts: 0,
        isAccountLocked: false,
        status: autoActivate && user.status === 'pending' ? 'active' : user.status,
      };

      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
      }

      logAuditAction(
        'تحديث كلمة المرور',
        `تم تحديث كلمة المرور للمستخدم ${user.name} بنجاح وفق السياسة الأمنية`,
        'password_changed'
      );
      sounds.playSuccess();
      return { success: true, message: 'تم تحديث كلمة المرور بنجاح!', updatedUser };
    },
    [users, currentUser, logAuditAction]
  );

  const autoLockTerminal = useCallback(() => {
    setIsLocked(true);
    const timeoutDuration =
      currentUser?.role === 'owner' && securitySettings.ownerExtendedEnabled
        ? securitySettings.ownerExtendedLockSeconds
        : securitySettings.autoLockSeconds;

    logAuditAction(
      'قفل تلقائي للشاشة (خمول)',
      `تم قفل شاشة النظام تلقائياً بعد خمول تام لمدة ${timeoutDuration} ثانية لحساب ${currentUser?.name || 'المستخدم'} بالوقت: ${new Date().toLocaleTimeString('ar-EG')}`,
      'auto_lock'
    );
    sounds.playWarning();
  }, [currentUser, securitySettings, logAuditAction]);

  const clearFailedLoginLogs = useCallback(() => {
    setFailedLoginLogs([]);
    localStorage.removeItem('bakery_failed_logins');
  }, []);

  const updateSecuritySettings = useCallback((settings: Partial<SecuritySettings>) => {
    setSecuritySettings((prev) => ({ ...prev, ...settings }));
    sounds.playSuccess();
  }, []);

  const clearSessionTerminatedNotice = useCallback(() => {
    setSessionTerminatedNotice(null);
  }, []);

  // Authentication methods
  const loginUserDirectly = useCallback(
    (userObj: User, remember: boolean = true) => {
      if (userObj.status === 'inactive') {
        sounds.playWarning();
        return {
          success: false,
          user: userObj,
        };
      }
      const sessionToken = generateSessionToken(userObj.id);
      const updatedUser: User = {
        ...userObj,
        status: userObj.status,
        failedLoginAttempts: 0,
        isAccountLocked: false,
        activeSessionToken: sessionToken,
      };

      // Reset terminal-level failed attempts counter on any successful authorized login
      setTerminalFailedAttempts(0);
      localStorage.removeItem('bakery_terminal_failed_attempts');
      setLockedOutUser(null);
      setIsStandbyScreenOpen(false);

      setUsers((prev) => prev.map((u) => (u.id === userObj.id ? updatedUser : u)));
      setCurrentUser(updatedUser);
      setIsLocked(false);

      sessionStorage.setItem('bakery_my_session_token', sessionToken);
      localStorage.setItem(
        'bakery_active_session_sync',
        JSON.stringify({ userId: userObj.id, token: sessionToken, timestamp: Date.now() })
      );

      if (remember) {
        localStorage.setItem('bakery_remember_user', userObj.id);
      }

      const deviceInfo = getDeviceInfo();
      const timeStr = new Date().toLocaleTimeString('ar-EG');
      logAuditAction(
        'تسجيل دخول ناجح',
        `قام ${userObj.name} بتسجيل الدخول للنظام بالوقت (${timeStr}) من جهاز: ${deviceInfo}`,
        'login'
      );
      sounds.playSuccess();
      return { success: true, user: updatedUser };
    },
    [logAuditAction]
  );

  const login = useCallback(
    (userOrId: string, pinOrPass?: string, remember: boolean = true) => {
      const targetUser = users.find(
        (u) => u.id === userOrId || u.username.toLowerCase() === userOrId.toLowerCase()
      );

      if (!targetUser) {
        recordFailedLogin(userOrId, 'اسم المستخدم غير موجود بالنظام');
        return { success: false, message: 'اسم المستخدم غير موجود بالنظام' };
      }

      // Check inactive account
      if (targetUser.status === 'inactive') {
        sounds.playWarning();
        return {
          success: false,
          message: '⚠️ هذا الحساب خامل وموقوف من قِبل إدارة المخبز. ليس لديك أي صلاحية للوصول إلى النظام.',
        };
      }

      // Check account lockout
      if (targetUser.isAccountLocked) {
        recordFailedLogin(targetUser.username, 'محاولة دخول إلى حساب مقفول أمنياً');
        setLockedOutUser(targetUser);
        setIsStandbyScreenOpen(true);
        setIsLocked(true);
        return {
          success: false,
          isLocked: true,
          message: '⚠️ هذا الحساب مقفول بقرار أمني لتجاوز 3 محاولات دخول خاطئة متتالية! يُرجى مراجعة صاحب المخبز (المدير) لفك القفل يدويًا.',
        };
      }

      if (targetUser.status === 'pending') {
        return {
          success: false,
          isPending: true,
          pendingUser: targetUser,
          message: 'حسابك ما زال قيد المراجعة، في انتظار موافقة صاحب المخبز (المدير)',
        };
      }

      if (targetUser.status === 'rejected') {
        return { success: false, message: 'تم رفض هذا الحساب من قِبل إدارة المخبز' };
      }

      // Check PIN or Password
      const isPinMatch = pinOrPass && targetUser.pin === pinOrPass;
      const isPassMatch = pinOrPass && targetUser.password && targetUser.password === pinOrPass;

      if (pinOrPass && !isPinMatch && !isPassMatch) {
        const remaining = Math.max(0, (securitySettings.maxFailedAttempts || 3) - ((targetUser.failedLoginAttempts || 0) + 1));
        recordFailedLogin(targetUser.username, 'كلمة المرور أو رمز الـ PIN غير صحيح');
        return {
          success: false,
          message:
            remaining > 0
              ? `بيانات الدخول غير صحيحة! متبقي ${remaining} محاولات قبل قفل الحساب نهائياً.`
              : '⚠️ تم قفل هذا الحساب لتجاوز 3 محاولات فاشلة! يُرجى مراجعة المدير لفك القفل.',
        };
      }

      return loginUserDirectly(targetUser, remember);
    },
    [users, securitySettings.maxFailedAttempts, recordFailedLogin, loginUserDirectly]
  );

  const lockTerminal = useCallback(() => {
    setIsStandbyScreenOpen(true);
    setIsLocked(true);
    sounds.playClick();
  }, []);

  const turnOffScreen = useCallback(() => {
    setIsStandbyScreenOpen(true);
    setIsLocked(true);
    sounds.playClick();
  }, []);

  const unlockTerminal = useCallback(
    (pin: string, userId?: string) => {
      const trimmedInput = pin.trim();
      // Check terminal lockout first!
      if (terminalFailedAttempts >= (securitySettings.maxFailedAttempts || 3)) {
        setIsStandbyScreenOpen(true);
        setIsLocked(true);
        sounds.playWarning();
        return {
          success: false,
          message: '⚠️ تم إيقاف وقفل المحطة أمنياً لتجاوز 3 محاولات غير صحيحة! يتطلب فك القفل إذن واعتماد المدير العام.',
        };
      }

      let targetUser: User | undefined;
      if (userId) {
        targetUser = users.find((u) => u.id === userId || u.username.toLowerCase() === userId.toLowerCase());
      } else {
        // Anonymous or quick login: match active user by their PIN or password (numbers or letters)
        targetUser = users.find(
          (u) =>
            u.status === 'active' &&
            (u.pin === trimmedInput ||
              u.password === trimmedInput ||
              (u.pin && u.pin.toLowerCase() === trimmedInput.toLowerCase()))
        );
        if (!targetUser) {
          const nonActive = users.find(
            (u) =>
              u.pin === trimmedInput ||
              u.password === trimmedInput ||
              (u.pin && u.pin.toLowerCase() === trimmedInput.toLowerCase())
          );
          if (nonActive?.status === 'inactive') {
            sounds.playWarning();
            return {
              success: false,
              message: '⚠️ هذا الحساب خامل وموقوف من قِبل إدارة المخبز. ليس لديك صلاحية دخول.',
            };
          }
          if (nonActive?.status === 'pending') {
            return {
              success: false,
              isPending: true,
              pendingUser: nonActive,
              message: 'هذا الحساب ما زال قيد المراجعة والموافقة من قِبل إدارة المخبز',
            };
          }
          if (nonActive?.status === 'rejected') {
            return { success: false, message: 'تم رفض هذا الحساب من قِبل إدارة المخبز' };
          }
          const prevTerminal = parseInt(localStorage.getItem('bakery_terminal_failed_attempts') || '0', 10) || 0;
          const nextCount = prevTerminal + 1;
          recordFailedLogin(`رمز: ${trimmedInput}`, 'رمز دخول غير صحيح في شاشة الدخول الموحدة');
          const remaining = Math.max(0, (securitySettings.maxFailedAttempts || 3) - nextCount);
          return {
            success: false,
            message:
              remaining > 0
                ? `رمز الدخول أو كلمة المرور غير صحيحة! متبقي ${remaining} محاولات قبل قفل المحطة بالكامل.`
                : '⚠️ تم قفل وإيقاف المحطة بالكامل لتجاوز 3 محاولات خاطئة! يتطلب الأمر إذن المدير.',
          };
        }
      }

      if (!targetUser) {
        recordFailedLogin(userId || 'غير معروف', 'المستخدم غير موجود');
        return { success: false, message: 'المستخدم غير موجود بالنظام' };
      }

      // Check inactive account
      if (targetUser.status === 'inactive') {
        sounds.playWarning();
        return {
          success: false,
          message: '⚠️ هذا الحساب خامل وموقوف من قِبل إدارة المخبز. تم إلغاء كافة صلاحيات الوصول للنظام.',
        };
      }

      if (targetUser.isAccountLocked) {
        recordFailedLogin(targetUser.username, 'محاولة فتح حساب مقفول');
        setLockedOutUser(targetUser);
        setIsStandbyScreenOpen(true);
        return {
          success: false,
          message: '⚠️ هذا الحساب مقفول بقرار أمني لتجاوز 3 محاولات خاطئة متتالية! يرجى مراجعة المدير لفك القفل يدويًا.',
        };
      }

      if (targetUser.status === 'pending') {
        return {
          success: false,
          isPending: true,
          pendingUser: targetUser,
          message: 'هذا الحساب ما زال قيد المراجعة والموافقة من المدير',
        };
      }
      if (targetUser.status === 'rejected') {
        return { success: false, message: 'تم رفض هذا الحساب من قِبل إدارة المخبز' };
      }

      const isCredentialMatch =
        targetUser.pin === trimmedInput ||
        targetUser.password === trimmedInput ||
        (targetUser.pin && targetUser.pin.toLowerCase() === trimmedInput.toLowerCase());

      if (!isCredentialMatch) {
        const userNext = (targetUser.failedLoginAttempts || 0) + 1;
        const prevTerminal = parseInt(localStorage.getItem('bakery_terminal_failed_attempts') || '0', 10) || 0;
        const worstCount = Math.max(userNext, prevTerminal + 1);
        const remaining = Math.max(0, (securitySettings.maxFailedAttempts || 3) - worstCount);
        recordFailedLogin(targetUser.username, 'رمز دخول أو كلمة مرور غير صحيحة');
        return {
          success: false,
          message:
            remaining > 0
              ? `رمز الدخول أو كلمة المرور غير صحيحة! متبقي ${remaining} محاولات قبل قفل الحساب والمحطة.`
              : '⚠️ تم قفل الحساب والمحطة لتجاوز 3 محاولات فاشلة! يُرجى مراجعة المدير.',
        };
      }

      setTerminalFailedAttempts(0);
      localStorage.removeItem('bakery_terminal_failed_attempts');
      return loginUserDirectly(targetUser, true);
    },
    [users, terminalFailedAttempts, securitySettings.maxFailedAttempts, recordFailedLogin, loginUserDirectly]
  );

  const verifyManagerCredentials = useCallback(
    (secret: string) => {
      const owner = users.find((u) => u.role === 'owner');
      if (!owner) {
        return { success: false, message: 'حساب المدير العام غير موجود بالنظام' };
      }
      const trimmed = secret.trim();
      const isMatch = owner.pin === trimmed || (owner.password && owner.password === trimmed);
      if (isMatch) {
        return { success: true, managerUser: owner };
      }
      recordFailedLogin(owner.username, 'محاولة غير مصرح بها للتحقق ببيانات المدير');
      return { success: false, message: 'رمز الـ PIN أو كلمة المرور للمدير غير صحيحة' };
    },
    [users, recordFailedLogin]
  );

  // Direct override by Manager to unlock terminal and reset failed attempts
  const unlockTerminalOverride = useCallback(
    (managerSecret: string) => {
      const verifyRes = verifyManagerCredentials(managerSecret);
      if (!verifyRes.success) {
        sounds.playWarning();
        return {
          success: false,
          message: '⚠️ رمز الـ PIN أو كلمة المرور للمدير غير صحيحة! لا يمكن فك القفل.',
        };
      }

      setTerminalFailedAttempts(0);
      localStorage.removeItem('bakery_terminal_failed_attempts');
      setLockedOutUser(null);
      setIsStandbyScreenOpen(false);
      setIsLocked(true);

      // Unlock any locked user accounts
      setUsers((prev) =>
        prev.map((u) =>
          u.isAccountLocked
            ? { ...u, isAccountLocked: false, failedLoginAttempts: 0, lockedAt: undefined }
            : u
        )
      );

      logAuditAction(
        'فك قفل المحطة بواسطة المدير',
        `قام المدير العام (${verifyRes.managerUser?.name || 'المدير'}) بفك تعليق المحطة وتصفير عداد المحاولات الفاشلة بنجاح`,
        'account_unlocked'
      );
      sounds.playSuccess();
      return {
        success: true,
        message: 'تم فك قفل المحطة وتنشيط النظام بنجاح! 🔓',
      };
    },
    [verifyManagerCredentials, logAuditAction]
  );

  const logout = useCallback(() => {
    if (currentShift && (currentShift.status === 'open' || !currentShift.status)) {
      // Shift left open without proper closing & drawer handover -> Suspend it!
      setCurrentShift((prev) => (prev ? { ...prev, isSuspended: true, status: 'suspended' } : null));
      logAuditAction(
        'تعليق الوردية عند الخروج (Session Lock)',
        `قام الكاشير (${currentUser?.name || currentShift.cashierName}) بتسجيل الخروج دون إغلاق الوردية، فتم تعليق الوردية وقفل المحطة لحين تسوية العهدة`,
        'shift_close'
      );
    }
    if (currentUser) {
      logAuditAction('تسجيل خروج', `قام ${currentUser.name} بتسجيل الخروج من النظام`, 'login');
    }
    setCurrentUser(null);
    localStorage.removeItem('bakery_current_user');
    localStorage.removeItem('bakery_remember_user');
  }, [currentUser, currentShift, logAuditAction]);

  const registerStaff = useCallback(
    (name: string, username: string, pin: string, phone: string) => {
      const exists = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
      if (exists) {
        return { success: false, message: 'اسم المستخدم مسجل بالفعل، اختر اسماً آخر' };
      }
      if (!/^\d{6}$/.test(pin)) {
        return { success: false, message: 'يجب أن يتكون رمز الـ PIN من 6 أرقام بالضبط' };
      }
      const pinTaken = users.some((u) => u.pin === pin);
      if (pinTaken) {
        return { success: false, message: 'رمز الـ PIN هذا مستخدم بالفعل من قِبل موظف آخر، يرجى اختيار رمز آخر' };
      }

      const cleanName = name.replace(/\s*\([^)]*\)/g, '').trim();
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: cleanName,
        username,
        pin,
        phone,
        role: 'staff',
        department: 'cashier',
        jobTitle: 'كاشير نقطة بيع',
        status: 'pending', // Must wait for Owner approval!
        createdAt: new Date().toISOString(),
        avatar: '🧑‍💼',
      };

      setUsers((prev) => [...prev, newUser]);
      logAuditAction(
        'طلب تسجيل موظف جديد',
        `تم تسجيل طلب حساب جديد للموظف ${cleanName} برمز PIN (6 أرقام) وهو بانتظار موافقة المدير`,
        'user_registered'
      );
      sounds.playAdd();
      return {
        success: true,
        message: 'تم تسجيل طلبك بنجاح! سيتم تفعيل حسابك بمجرد موافقة صاحب المخبز.',
      };
    },
    [users, logAuditAction]
  );

  const addStaffUserByManager = useCallback(
    (userData: {
      name: string;
      username: string;
      pin: string;
      phone?: string;
      role: UserRole;
      department?: EmployeeDepartment;
      jobTitle?: string;
    }) => {
      const exists = users.some(
        (u) => u.username.toLowerCase() === userData.username.toLowerCase().trim()
      );
      if (exists) {
        return { success: false, message: 'اسم المستخدم مسجل بالفعل، اختر اسماً آخر' };
      }
      if (!userData.pin || userData.pin.trim().length < 3) {
        return { success: false, message: 'يجب ألا يقل رمز الدخول / كلمة المرور عن 3 خانات' };
      }
      const pinTaken = users.some((u) => u.pin === userData.pin.trim() || u.password === userData.pin.trim());
      if (pinTaken) {
        return { success: false, message: 'رمز الدخول أو الـ PIN هذا مستخدم بالفعل من قِبل موظف آخر، اختر رمزاً فريداً' };
      }

      const cleanName = userData.name.trim();
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: cleanName,
        username: userData.username.trim(),
        pin: userData.pin.trim(),
        password: userData.pin.trim(),
        phone: userData.phone?.trim() || '',
        role: userData.role || 'staff',
        department: userData.department || 'cashier',
        jobTitle: userData.jobTitle?.trim() || (userData.role === 'owner' ? 'المدير العام' : 'كاشير نقطة بيع'),
        status: 'active', // Activated immediately by the Manager!
        createdAt: new Date().toISOString(),
        avatar: userData.role === 'owner' ? '👑' : '🧑‍💼',
      };

      setUsers((prev) => [...prev, newUser]);
      logAuditAction(
        'إضافة موظف جديد',
        `قام المدير العام بإضافة الموظف (${cleanName}) بحساب نشط ومباشر وتعيين القسم (${newUser.department})`,
        'user_added',
        undefined,
        { targetUserId: newUser.id, targetUserName: newUser.name }
      );
      sounds.playSuccess();
      return {
        success: true,
        message: `تم إضافة وتفعيل حساب الموظف (${cleanName}) بنجاح!`,
        newUser,
      };
    },
    [users, logAuditAction]
  );

  const approveStaff = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'active', department: u.department || 'cashier' } : u))
      );
      logAuditAction('الموافقة على موظف', `تمت الموافقة وتفعيل حساب الموظف ${user.name}`, 'user_approved');
      sounds.playSuccess();
    },
    [users, logAuditAction]
  );

  const rejectStaff = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' } : u))
      );
      logAuditAction('رفض حساب موظف', `تم رفض طلب انضمام الموظف ${user.name}`, 'user_rejected');
      sounds.playWarning();
    },
    [users, logAuditAction]
  );

  // Soft-Delete (Deactivate / Freeze Account)
  const deactivateUser = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user || user.role === 'owner') return;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: 'inactive', isAccountLocked: true, activeSessionToken: undefined }
            : u
        )
      );
      logAuditAction(
        'تعطيل حساب موظف (خامل)',
        `قام المدير بتعطيل حساب الموظف ${user.name} وتحويله إلى حالة (خامل) وسحب صلاحيات الوصول للنظام`,
        'user_deactivated'
      );
      sounds.playWarning();
    },
    [users, logAuditAction]
  );

  // Re-activate previously deactivated user
  const reactivateUser = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: 'active', isAccountLocked: false, failedLoginAttempts: 0 }
            : u
        )
      );
      logAuditAction(
        'إعادة تنشيط حساب موظف',
        `قام المدير بإعادة تنشيط وتفعيل حساب الموظف ${user.name} بنجاح`,
        'user_reactivated'
      );
      sounds.playSuccess();
    },
    [users, logAuditAction]
  );

  // Hard permanent deletion from database
  const permanentDeleteUser = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user || user.role === 'owner') return;
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      logAuditAction('حذف نهائي للموظف', `تم حذف حساب الموظف ${user.name} نهائياً وبشكل قطعي`, 'user_rejected');
      sounds.playWarning();
    },
    [users, logAuditAction]
  );

  // Delete user wrapper: defaults to deactivation/freeze for safety as requested
  const deleteUser = useCallback(
    (userId: string) => {
      deactivateUser(userId);
    },
    [deactivateUser]
  );

  // Edit employee department & job title & role & preferredView
  const updateUserDepartment = useCallback(
    (
      userId: string,
      arg2: any,
      arg3?: any,
      arg4?: any,
      preferredView?: 'pos' | 'kitchen' | 'dashboard'
    ) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      const prevDept = user.department || 'غير محدد';

      // Support both signatures:
      // (userId, role, department, jobTitle, preferredView)
      // and (userId, department, jobTitle, role, preferredView)
      let resolvedRole: UserRole = user.role;
      let resolvedDept: EmployeeDepartment = user.department || 'cashier';
      let resolvedTitle: string = user.jobTitle || '';
      let resolvedPreferredView: 'pos' | 'kitchen' | 'dashboard' | undefined = preferredView;

      if (arg2 === 'owner' || arg2 === 'staff') {
        resolvedRole = arg2;
        resolvedDept = arg3 || resolvedDept;
        resolvedTitle = arg4 !== undefined ? arg4 : resolvedTitle;
      } else {
        resolvedDept = arg2 || resolvedDept;
        resolvedTitle = arg3 !== undefined ? arg3 : resolvedTitle;
        if (arg4 === 'owner' || arg4 === 'staff') {
          resolvedRole = arg4;
        }
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            const updated: User = {
              ...u,
              department: resolvedDept,
              jobTitle: resolvedTitle,
              role: resolvedRole,
              preferredView: resolvedPreferredView !== undefined ? resolvedPreferredView : u.preferredView,
            };
            if (currentUser?.id === userId) {
              setCurrentUser(updated);
            }
            return updated;
          }
          return u;
        })
      );
      logAuditAction(
        'تعديل قسم الموظف والمسمى الوظيفي',
        `قام المدير بتعديل بيانات الموظف ${user.name}: نقل من قسم (${prevDept}) إلى (${resolvedDept}) - مسمى: ${resolvedTitle || 'موظف'} - دور: ${resolvedRole}`,
        'user_department_changed'
      );
      sounds.playSuccess();
    },
    [users, currentUser, logAuditAction]
  );

  const verifyOwnerPin = useCallback(
    (pin: string) => {
      const owner = users.find((u) => u.role === 'owner');
      return owner?.pin === pin;
    },
    [users]
  );

  const authorizeAndActivatePendingUser = useCallback(
    (
      targetUserId: string,
      managerSecret: string,
      loginMode: 'as_manager' | 'as_user' | 'activate_only' = 'as_user'
    ) => {
      const owner = users.find((u) => u.role === 'owner');
      if (!owner) {
        return { success: false, message: 'حساب المدير العام غير موجود' };
      }

      const trimmed = managerSecret.trim();
      const isMatch = owner.pin === trimmed || (owner.password && owner.password === trimmed);

      if (!isMatch) {
        sounds.playWarning();
        recordFailedLogin(owner.username, 'محاولة غير مصرح بها لتفعيل حساب معلق ببيانات مدير غير صحيحة');
        return { success: false, message: '⚠️ بيانات اعتماد المدير (PIN أو كلمة المرور) غير صحيحة!' };
      }

      const targetUser = users.find(
        (u) => u.id === targetUserId || u.username.toLowerCase() === targetUserId.toLowerCase()
      );
      if (!targetUser) {
        return { success: false, message: 'الموظف المراد تفعيله غير موجود' };
      }

      const activatedUser: User = {
        ...targetUser,
        status: 'active',
        isAccountLocked: false,
        failedLoginAttempts: 0,
        lockedAt: undefined,
      };

      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? activatedUser : u)));

      logAuditAction(
        'تفعيل واعتماد حساب فوري',
        `قام المدير ${owner.name} باعتماد وتفعيل حساب الموظف ${targetUser.name} (@${targetUser.username}) فورياً وتجاوز التعليق`,
        'user_approved'
      );
      sounds.playSuccess();

      if (loginMode === 'as_manager') {
        loginUserDirectly(owner);
        return { success: true, message: 'تم تفعيل الحساب وتسجيل الدخول كمدير عام بنجاح! 👑', user: owner };
      } else if (loginMode === 'as_user') {
        loginUserDirectly(activatedUser);
        return { success: true, message: `تم تفعيل حساب ${activatedUser.name} وتسجيل الدخول بنجاح! 🎉`, user: activatedUser };
      }

      return { success: true, message: `تم تفعيل حساب ${activatedUser.name} بنجاح!`, user: activatedUser };
    },
    [users, recordFailedLogin, logAuditAction, loginUserDirectly]
  );

  // Products CRUD
  const addProduct = useCallback(
    (productData: Omit<Product, 'id'>) => {
      const newProd: Product = {
        ...productData,
        id: `prod-${Date.now()}`,
      };
      setProducts((prev) => [newProd, ...prev]);
      logAuditAction(
        'إضافة صنف جديد',
        `تمت إضافة صنف ${newProd.name} بسعر ${newProd.price} ج.م (${newProd.unitType === 'weight' ? 'بالكيلو' : 'بالقطعة'})`,
        'product_change'
      );
      sounds.playSuccess();
    },
    [logAuditAction]
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) => {
      setProducts((prev) => {
        const existing = prev.find((p) => p.id === id);
        if (!existing) return prev;

        const diffs: AuditDiffItem[] = [];
        if (updates.name !== undefined && updates.name !== existing.name) {
          diffs.push({
            field: 'name',
            fieldLabel: 'اسم الصنف',
            oldValue: existing.name,
            newValue: updates.name,
          });
        }
        if (updates.price !== undefined && Number(updates.price) !== Number(existing.price)) {
          diffs.push({
            field: 'price',
            fieldLabel: 'سعر البيع',
            oldValue: `${existing.price} ج.م`,
            newValue: `${updates.price} ج.م`,
          });
        }
        if (updates.category !== undefined && updates.category !== existing.category) {
          diffs.push({
            field: 'category',
            fieldLabel: 'التصنيف',
            oldValue: existing.category,
            newValue: updates.category,
          });
        }
        if (updates.unitType !== undefined && updates.unitType !== existing.unitType) {
          diffs.push({
            field: 'unitType',
            fieldLabel: 'طريقة البيع والوزن',
            oldValue: existing.unitType === 'weight' ? 'وزن (كجم)' : 'بالقطعة',
            newValue: updates.unitType === 'weight' ? 'وزن (كجم)' : 'بالقطعة',
          });
        }
        if (updates.stock !== undefined && Number(updates.stock) !== Number(existing.stock)) {
          diffs.push({
            field: 'stock',
            fieldLabel: 'الرصيد المتاح',
            oldValue: `${existing.stock}`,
            newValue: `${updates.stock}`,
          });
        }
        if (updates.minStockAlert !== undefined && Number(updates.minStockAlert) !== Number(existing.minStockAlert)) {
          diffs.push({
            field: 'minStockAlert',
            fieldLabel: 'حد أمان المخزون',
            oldValue: `${existing.minStockAlert}`,
            newValue: `${updates.minStockAlert}`,
          });
        }

        const detailsText =
          diffs.length > 0
            ? `تم تحديث صنف "${existing.name}": ` +
              diffs.map((d) => `${d.fieldLabel} (${d.oldValue} ⬅ ${d.newValue})`).join(' ، ')
            : `تم تحديث بيانات الصنف "${existing.name}"`;

        logAuditAction('تعديل صنف', detailsText, 'product_change', diffs, {
          productId: existing.id,
          productName: existing.name,
        });

        return prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      });
      sounds.playSuccess();
    },
    [logAuditAction]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const prod = products.find((p) => p.id === id);
      if (!prod) return { success: false, message: 'الصنف غير موجود' };
      setProducts((prev) => prev.filter((p) => p.id !== id));
      logAuditAction('حذف صنف', `تم حذف الصنف ${prod.name} من قائمة المنتجات`, 'product_delete');
      return { success: true };
    },
    [products, logAuditAction]
  );

  const toggleProductAvailability = useCallback(
    (id: string) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isAvailable: !p.isAvailable } : p))
      );
    },
    []
  );

  // Raw Materials CRUD
  const addRawMaterial = useCallback(
    (matData: Omit<RawMaterial, 'id' | 'lastUpdated'>) => {
      const newMat: RawMaterial = {
        ...matData,
        id: `raw-${Date.now()}`,
        lastUpdated: new Date().toISOString(),
      };
      setRawMaterials((prev) => [newMat, ...prev]);
      logAuditAction(
        'إضافة مادة خام',
        `تمت إضافة مادة خام ${newMat.name} بمخزون أولي ${newMat.currentStock} ${newMat.unit}`,
        'raw_material_change'
      );
      sounds.playSuccess();
    },
    [logAuditAction]
  );

  const updateRawMaterial = useCallback(
    (id: string, updates: Partial<RawMaterial>) => {
      setRawMaterials((prev) => {
        const existing = prev.find((m) => m.id === id);
        if (!existing) return prev;

        const diffs: AuditDiffItem[] = [];
        if (updates.name !== undefined && updates.name !== existing.name) {
          diffs.push({
            field: 'name',
            fieldLabel: 'اسم المادة الخام',
            oldValue: existing.name,
            newValue: updates.name,
          });
        }
        if (updates.unit !== undefined && updates.unit !== existing.unit) {
          diffs.push({
            field: 'unit',
            fieldLabel: 'وحدة القياس',
            oldValue: existing.unit,
            newValue: updates.unit,
          });
        }
        if (
          updates.currentStock !== undefined &&
          Number(updates.currentStock) !== Number(existing.currentStock)
        ) {
          diffs.push({
            field: 'currentStock',
            fieldLabel: 'رصيد المخزون',
            oldValue: `${existing.currentStock} ${existing.unit}`,
            newValue: `${updates.currentStock} ${updates.unit || existing.unit}`,
          });
        }
        if (
          updates.minStockAlert !== undefined &&
          Number(updates.minStockAlert) !== Number(existing.minStockAlert)
        ) {
          diffs.push({
            field: 'minStockAlert',
            fieldLabel: 'حد أمان التنبيه',
            oldValue: `${existing.minStockAlert} ${existing.unit}`,
            newValue: `${updates.minStockAlert} ${updates.unit || existing.unit}`,
          });
        }
        if (
          updates.costPerUnit !== undefined &&
          Number(updates.costPerUnit) !== Number(existing.costPerUnit)
        ) {
          diffs.push({
            field: 'costPerUnit',
            fieldLabel: 'سعر تكلفة الوحدة',
            oldValue: `${existing.costPerUnit} ج.م`,
            newValue: `${updates.costPerUnit} ج.م`,
          });
        }

        const detailsText =
          diffs.length > 0
            ? `تم تحديث مادة "${existing.name}": ` +
              diffs.map((d) => `${d.fieldLabel} (${d.oldValue} ⬅ ${d.newValue})`).join(' ، ')
            : `تم تحديث بيانات مادة "${existing.name}"`;

        logAuditAction(
          'تعديل مادة خام',
          detailsText,
          'raw_material_change',
          diffs,
          { rawMaterialId: existing.id, rawMaterialName: existing.name }
        );

        return prev.map((m) =>
          m.id === id ? { ...m, ...updates, lastUpdated: new Date().toISOString() } : m
        );
      });
      sounds.playSuccess();
    },
    [logAuditAction]
  );

  const deleteRawMaterial = useCallback(
    (id: string) => {
      const mat = rawMaterials.find((m) => m.id === id);
      if (!mat) return;
      setRawMaterials((prev) => prev.filter((m) => m.id !== id));
      logAuditAction('حذف مادة خام', `تم حذف مادة خام ${mat.name}`, 'raw_material_change');
    },
    [rawMaterials, logAuditAction]
  );

  const restockRawMaterial = useCallback(
    (id: string, addedAmount: number, cost?: number) => {
      setRawMaterials((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            const newStock = +(m.currentStock + addedAmount).toFixed(3);
            const diffs: AuditDiffItem[] = [
              {
                field: 'currentStock',
                fieldLabel: 'الرصيد بالمخزن',
                oldValue: `${m.currentStock} ${m.unit}`,
                newValue: `${newStock} ${m.unit}`,
              },
            ];
            if (cost !== undefined && cost !== m.costPerUnit) {
              diffs.push({
                field: 'costPerUnit',
                fieldLabel: 'سعر تكلفة الوحدة',
                oldValue: `${m.costPerUnit} ج.م`,
                newValue: `${cost} ج.م`,
              });
            }
            logAuditAction(
              'توريد مادة خام',
              `تم توريد وتغذية مخزون ${m.name} بإضافة ${addedAmount} ${m.unit} (من ${m.currentStock} إلى ${newStock} ${m.unit})`,
              'stock_change',
              diffs,
              { rawMaterialId: m.id, rawMaterialName: m.name, addedAmount }
            );
            return {
              ...m,
              currentStock: newStock,
              costPerUnit: cost !== undefined ? cost : m.costPerUnit,
              lastUpdated: new Date().toISOString(),
            };
          }
          return m;
        })
      );
      sounds.playSuccess();
    },
    [logAuditAction]
  );

  // Batch Production: consumes raw materials per recipe and increases product stock
  const lastBatchProductionRef = useRef<{ productId: string; timestamp: number } | null>(null);

  const produceBatch = useCallback(
    (productId: string, quantityToProduce: number) => {
      const now = Date.now();
      if (
        lastBatchProductionRef.current &&
        lastBatchProductionRef.current.productId === productId &&
        now - lastBatchProductionRef.current.timestamp < 2000
      ) {
        sounds.playWarning();
        return {
          success: false,
          message: '⚠️ تم حظر الضغطة المتزامنة! جاري تنفيذ الدفعة الأولى بالفعل، يرجى الانتظار لحين اكتمال المعالجة.',
        };
      }
      lastBatchProductionRef.current = { productId, timestamp: now };

      const product = products.find((p) => p.id === productId);
      if (!product) return { success: false, message: 'المنتج غير موجود' };

      if (!product.recipe || product.recipe.length === 0) {
        return {
          success: false,
          message: 'لا توجد وصفة مواد خام محددة لهذا المنتج! يرجى ضبط الوصفة أولاً.',
        };
      }

      // Check ingredient availability
      for (const ingredient of product.recipe) {
        const requiredAmount = ingredient.quantityNeeded * quantityToProduce;
        const raw = rawMaterials.find((r) => r.id === ingredient.rawMaterialId);
        if (!raw || raw.currentStock < requiredAmount) {
          const rawName = raw ? raw.name : 'مادة مجهولة';
          const available = raw ? `${raw.currentStock} ${raw.unit}` : 'غير متوفرة';
          return {
            success: false,
            message: `عفوًا! رصيد المادة الخام (${rawName}) غير كافٍ. المطلوب: ${requiredAmount.toFixed(2)}، المتوفر: ${available}`,
          };
        }
      }

      // Deduct raw materials
      setRawMaterials((prev) =>
        prev.map((raw) => {
          const ingredient = product.recipe.find((ing) => ing.rawMaterialId === raw.id);
          if (ingredient) {
            const consumed = ingredient.quantityNeeded * quantityToProduce;
            return {
              ...raw,
              currentStock: Math.max(0, +(raw.currentStock - consumed).toFixed(3)),
              lastUpdated: new Date().toISOString(),
            };
          }
          return raw;
        })
      );

      // Increase product stock
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return {
              ...p,
              stock: +(p.stock + quantityToProduce).toFixed(2),
            };
          }
          return p;
        })
      );

      const unitText = product.unitType === 'weight' ? 'كجم' : 'قطعة';
      logAuditAction(
        'إنتاج دفعة مخبوزات',
        `تم إنتاج ${quantityToProduce} ${unitText} من ${product.name} وخصم المواد الخام تلقائيًا حسب الوصفة`,
        'batch_production'
      );

      sounds.playSuccess();
      return {
        success: true,
        message: `تم إنتاج ${quantityToProduce} ${unitText} من ${product.name} بنجاح وتحديث المخزون والمواد الخام!`,
      };
    },
    [products, rawMaterials, logAuditAction]
  );

  // Cart Management
  // Cart Management with strict stock validation & shift enforcement
  const addToCartPiece = useCallback(
    (product: Product, qty: number = 1): { success: boolean; message?: string } => {
      if (!currentShift) {
        sounds.playWarning();
        return {
          success: false,
          message: 'عفواً! لا يمكن إضافة أصناف للسلة لعدم وجود شيفت مفتوح. يجب فتح شيفت كاشير أولاً.',
        };
      }

      // Find latest product data from state
      const currentProd = products.find((p) => p.id === product.id) || product;

      if (currentProd.stock <= 0) {
        sounds.playWarning();
        return {
          success: false,
          message: `عفواً! صنف (${currentProd.name}) نفذت كميته من المخزن بالكامل (الرصيد: 0).`,
        };
      }

      let result = { success: true, message: '' };

      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.productId === currentProd.id && item.unitType === 'piece'
        );

        if (existingIndex > -1) {
          const updated = [...prev];
          const item = updated[existingIndex];
          const availableStock = currentProd.stock;

          if (item.quantity >= availableStock) {
            sounds.playWarning();
            result = {
              success: false,
              message: `عفواً! تم وضع كامل الرصيد المتوفر بالمخزن (${availableStock} قطعة) في السلة بالفعل.`,
            };
            return prev;
          }

          const targetQty = item.quantity + qty;
          const finalQty = Math.min(targetQty, availableStock);

          if (targetQty > availableStock) {
            result = {
              success: true,
              message: `تمت إضافة المتبقي فقط (${finalQty - item.quantity} قطعة) للوصول لأقصى رصيد متاح بالمخزن (${availableStock} ق).`,
            };
          }

          updated[existingIndex] = {
            ...item,
            quantity: finalQty,
            subtotal: +(finalQty * item.unitPrice).toFixed(2),
          };
          sounds.playAdd();
          return updated;
        } else {
          const availableStock = currentProd.stock;
          const finalQty = Math.min(qty, availableStock);

          if (qty > availableStock) {
            result = {
              success: true,
              message: `تمت إضافة (${finalQty} قطعة) فقط نظراً لأن الرصيد المتوفر بالمخزن هو ${availableStock} قطعة.`,
            };
          }

          const newItem: CartItem = {
            id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: currentProd.id,
            productName: currentProd.name,
            unitType: 'piece',
            unitPrice: currentProd.price,
            quantity: finalQty,
            subtotal: +(finalQty * currentProd.price).toFixed(2),
            image: currentProd.image,
          };
          sounds.playAdd();
          return [...prev, newItem];
        }
      });

      return result;
    },
    [products]
  );

  // Weight-based selling: add with weightKg and subtotal calculated from current pricePerKg
  const addToCartWeight = useCallback(
    (product: Product, weightKg: number, subtotal: number): { success: boolean; message?: string } => {
      if (!currentShift) {
        sounds.playWarning();
        return {
          success: false,
          message: 'عفواً! لا يمكن إضافة أصناف للسلة لعدم وجود شيفت مفتوح. يجب فتح شيفت كاشير أولاً.',
        };
      }

      const currentProd = products.find((p) => p.id === product.id) || product;

      if (currentProd.stock <= 0) {
        sounds.playWarning();
        return {
          success: false,
          message: `عفواً! صنف (${currentProd.name}) نفذت كميته من المخزن بالكامل.`,
        };
      }

      // Check current cart weight
      const existingCartWeight = cart
        .filter((c) => c.productId === currentProd.id && c.unitType === 'weight')
        .reduce((sum, c) => sum + (c.weightKg || 0), 0);

      const totalRequestedWeight = +(existingCartWeight + weightKg).toFixed(3);
      if (totalRequestedWeight > currentProd.stock) {
        sounds.playWarning();
        return {
          success: false,
          message: `عفواً! الوزن المطلوب (${weightKg} كجم) يتجاوز الرصيد المتاح بالمخزن. المتوفر حالياً: ${Math.max(
            0,
            +(currentProd.stock - existingCartWeight).toFixed(3)
          )} كجم فقط.`,
        };
      }

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: currentProd.id,
        productName: currentProd.name,
        unitType: 'weight',
        unitPrice: currentProd.price, // pricePerKg
        quantity: 1,
        weightKg: +weightKg.toFixed(3),
        subtotal: +subtotal.toFixed(2),
        image: currentProd.image,
      };

      setCart((prev) => [...prev, newItem]);
      sounds.playAdd();
      return { success: true };
    },
    [products, cart]
  );

  const updateCartItemQty = useCallback(
    (itemId: string, qty: number): { success: boolean; message?: string } => {
      if (qty <= 0) {
        setCart((prev) => prev.filter((i) => i.id !== itemId));
        return { success: true };
      }

      let result = { success: true, message: '' };

      setCart((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const prod = products.find((p) => p.id === item.productId);
            const maxStock = prod ? prod.stock : 9999;

            if (qty > maxStock) {
              sounds.playWarning();
              result = {
                success: false,
                message: `الحد الأقصى المتاح من (${item.productName}) بالمخزن هو ${maxStock} قطعة فقط.`,
              };
              return {
                ...item,
                quantity: maxStock,
                subtotal: +(maxStock * item.unitPrice).toFixed(2),
              };
            }

            return {
              ...item,
              quantity: qty,
              subtotal: +(qty * item.unitPrice).toFixed(2),
            };
          }
          return item;
        })
      );

      return result;
    },
    [products]
  );

  const updateCartItemWeight = useCallback(
    (itemId: string, weightKg: number, subtotal: number) => {
      setCart((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              weightKg: +weightKg.toFixed(3),
              subtotal: +subtotal.toFixed(2),
            };
          }
          return item;
        })
      );
    },
    []
  );

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Void transaction (إلغاء عملية قبل إتمامها)
  const voidCurrentCart = useCallback(
    (reason: string) => {
      if (cart.length === 0) return;
      const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
      const itemsSummary = cart
        .map((i) => `${i.productName} (${i.unitType === 'weight' ? `${i.weightKg} كجم` : `${i.quantity} ق`})`)
        .join(', ');

      logAuditAction(
        'إلغاء سلة مشتريات (Void)',
        `تم إلغاء سلة بقيمة ${totalAmount.toFixed(2)} ج.م. السبب: ${reason || 'إلغاء العميل'}. المحتويات: ${itemsSummary}`,
        'void'
      );
      setCart([]);
      sounds.playWarning();
    },
    [cart, logAuditAction]
  );

  // Checkout sale with strict stock verification
  const checkoutCart = useCallback(
    ({
      paymentMethod,
      cashGiven,
      changeDue,
      isRetroactive = false,
      retroactiveNote,
    }: {
      paymentMethod: PaymentMethod;
      cashGiven?: number;
      changeDue?: number;
      isRetroactive?: boolean;
      retroactiveNote?: string;
    }) => {
      if (!currentShift) {
        sounds.playWarning();
        return {
          success: false,
          message: 'عفواً! لا يمكن تسجيل عملية بيع لعدم وجود شيفت مفتوح. يجب فتح شيفت كاشير أولاً.',
        };
      }

      if (cart.length === 0) {
        return { success: false, message: 'السلة فارغة' };
      }

      // Check all items against current stock before proceeding
      for (const item of cart) {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) continue;

        let totalRequestedForProduct = 0;
        if (prod.unitType === 'weight') {
          totalRequestedForProduct = cart
            .filter((c) => c.productId === prod.id)
            .reduce((sum, c) => sum + (c.weightKg || 0), 0);
        } else {
          totalRequestedForProduct = cart
            .filter((c) => c.productId === prod.id)
            .reduce((sum, c) => sum + c.quantity, 0);
        }

        if (totalRequestedForProduct > prod.stock) {
          sounds.playWarning();
          const unitText = prod.unitType === 'weight' ? 'كجم' : 'قطعة';
          return {
            success: false,
            message: `عفواً لا يمكن إتمام الفاتورة! الكمية المطلوبة من (${prod.name}) هي ${totalRequestedForProduct} ${unitText} بينما المتوفر بالمخزن حالياً هو ${prod.stock} ${unitText} فقط. يرجى تعديل الكمية أو تسجيل إنتاج دفعة جديدة.`,
          };
        }
      }

      const totalAmount = +cart.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2);
      const invoiceNumber = `INV-${1000 + sales.length + 1}`;

      // Snapshot items with freeze of prices and weights
      const itemsSnapshot = cart.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        unitType: i.unitType,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        weightKg: i.weightKg,
        subtotal: i.subtotal,
      }));

      const newSale: SaleRecord = {
        id: `sale-${Date.now()}`,
        invoiceNumber,
        cashierId: currentUser?.id || 'staff',
        cashierName: currentUser?.name || 'كاشير المخبز',
        timestamp: new Date().toISOString(),
        items: itemsSnapshot,
        totalAmount,
        paymentMethod,
        cashGiven,
        changeDue,
        isRetroactive,
        retroactiveNote,
        status: 'completed',
      };

      // Deduct products stock
      setProducts((prev) =>
        prev.map((prod) => {
          const cartItemsForProd = cart.filter((c) => c.productId === prod.id);
          if (cartItemsForProd.length === 0) return prod;

          let deductAmount = 0;
          if (prod.unitType === 'weight') {
            deductAmount = cartItemsForProd.reduce((sum, c) => sum + (c.weightKg || 0), 0);
          } else {
            deductAmount = cartItemsForProd.reduce((sum, c) => sum + c.quantity, 0);
          }

          const newStock = Math.max(0, +(prod.stock - deductAmount).toFixed(2));
          return {
            ...prod,
            stock: newStock,
          };
        })
      );

      // Update current shift stats
      let totalWeightInThisSale = 0;
      cart.forEach((c) => {
        if (c.unitType === 'weight' && c.weightKg) {
          totalWeightInThisSale += c.weightKg;
        }
      });

      setCurrentShift((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          totalSales: +(prev.totalSales + totalAmount).toFixed(2),
          totalTransactions: prev.totalTransactions + 1,
          totalWeightSoldKg: +(prev.totalWeightSoldKg + totalWeightInThisSale).toFixed(3),
        };
      });

      // Add to sales list
      setSales((prev) => [newSale, ...prev]);

      // Audit Log
      const noteStr = isRetroactive ? ` (إضافة يدوية لاحقة: ${retroactiveNote})` : '';
      logAuditAction(
        `إتمام بيع فاتورة #${invoiceNumber}`,
        `قيمة: ${totalAmount} ج.م - طريقة الدفع: ${paymentMethod === 'cash' ? 'نقدًا' : paymentMethod === 'card' ? 'فيزا/بطاقة' : 'محفظة إلكترونية'}${noteStr}`,
        'sale'
      );

      // Clear cart and play sound
      setCart([]);
      sounds.playSuccess();

      return { success: true, saleRecord: newSale };
    },
    [cart, sales.length, currentUser, currentShift, logAuditAction]
  );

  // Refund Management
  // Staff requests refund
  const requestRefund = useCallback(
    (saleId: string, reason: string) => {
      const sale = sales.find((s) => s.id === saleId);
      if (!sale) return { success: false, message: 'الفاتورة غير موجودة' };
      if (sale.status === 'refund_requested') {
        return { success: false, message: 'يوجد طلب استرجاع معلق لهذه الفاتورة بالفعل' };
      }
      if (sale.status === 'refunded') {
        return { success: false, message: 'هذه الفاتورة تم استرجاعها مسبقاً' };
      }

      const newRequest: RefundRequest = {
        id: `refund-req-${Date.now()}`,
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        cashierId: currentUser?.id || 'staff',
        cashierName: currentUser?.name || 'كاشير',
        reason,
        amount: sale.totalAmount,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      setRefundRequests((prev) => [newRequest, ...prev]);
      setSales((prev) =>
        prev.map((s) =>
          s.id === saleId
            ? {
                ...s,
                status: 'refund_requested',
                refundReason: reason,
                refundRequestedAt: new Date().toISOString(),
              }
            : s
        )
      );

      logAuditAction(
        'طلب استرجاع فاتورة',
        `رفع الموظف ${currentUser?.name} طلب استرجاع لفاتورة #${sale.invoiceNumber} بمبلغ ${sale.totalAmount} ج.م. السبب: ${reason}`,
        'refund_request'
      );

      sounds.playWarning();
      return {
        success: true,
        message: 'تم إرسال طلب الاسترجاع إلى لوحة تحكم المدير للموافقة عليه عن بُعد.',
      };
    },
    [sales, currentUser, logAuditAction]
  );

  // Owner approves refund
  const approveRefund = useCallback(
    (requestId: string, note: string = 'تمت الموافقة من قِبل المدير') => {
      const req = refundRequests.find((r) => r.id === requestId);
      if (!req) return { success: false, message: 'الطلب غير موجود' };

      // Update refund request status
      setRefundRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: 'approved',
                reviewNote: note,
                reviewedBy: currentUser?.name || 'المدير',
                reviewedAt: new Date().toISOString(),
              }
            : r
        )
      );

      // Update sale status
      setSales((prev) =>
        prev.map((s) => {
          if (s.id === req.saleId) {
            // Restore inventory
            s.items.forEach((item) => {
              setProducts((prodList) =>
                prodList.map((p) => {
                  if (p.id === item.productId) {
                    const addBack = item.unitType === 'weight' ? item.weightKg || 0 : item.quantity;
                    return { ...p, stock: +(p.stock + addBack).toFixed(2) };
                  }
                  return p;
                })
              );
            });

            return {
              ...s,
              status: 'refunded',
              refundApprovedBy: currentUser?.name || 'المدير',
              refundApprovedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );

      logAuditAction(
        'الموافقة على استرجاع فاتورة',
        `وافق المدير ${currentUser?.name} على استرجاع فاتورة #${req.invoiceNumber} بقيمة ${req.amount} ج.م وإعادة الكميات للمخزون`,
        'refund_approved'
      );

      sounds.playSuccess();
      return {
        success: true,
        message: `تمت الموافقة على استرجاع الفاتورة #${req.invoiceNumber} واسترداد الأصناف للمخزون بنجاح.`,
      };
    },
    [refundRequests, currentUser, logAuditAction]
  );

  // Owner rejects refund
  const rejectRefund = useCallback(
    (requestId: string, note: string = 'تم رفض الطلب') => {
      const req = refundRequests.find((r) => r.id === requestId);
      if (!req) return { success: false, message: 'الطلب غير موجود' };

      setRefundRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: 'rejected',
                reviewNote: note,
                reviewedBy: currentUser?.name || 'المدير',
                reviewedAt: new Date().toISOString(),
              }
            : r
        )
      );

      setSales((prev) =>
        prev.map((s) =>
          s.id === req.saleId ? { ...s, status: 'completed' } : s
        )
      );

      logAuditAction(
        'رفض طلب استرجاع',
        `رفض المدير ${currentUser?.name} استرجاع فاتورة #${req.invoiceNumber}. ملاحظة: ${note}`,
        'refund_rejected'
      );

      sounds.playWarning();
      return { success: true, message: 'تم رفض طلب الاسترجاع.' };
    },
    [refundRequests, currentUser, logAuditAction]
  );

  // Shift & Cash Drawer Management
  const startShift = useCallback(
    (
      startingCash: number,
      scheduledDurationHours: number = 8,
      managerSecret?: string,
      targetCashierId?: string,
      customScheduledEndTime?: string
    ) => {
      // Mandatory Closure Check: Cannot start a new shift if one is already open or suspended
      if (currentShift && (currentShift.status === 'open' || currentShift.status === 'suspended')) {
        sounds.playWarning();
        return {
          success: false,
          message: `عفواً! يوجد شيفت حالياً للكاشير (${currentShift.cashierName}) لم يتم إغلاقه وتسويته. لا يمكن لكاشير جديد فتح كود البيع إلا بعد إقفال الشيفت السابق وتسليم الدرج عبر تقرير Z-Report أولاً.`,
        };
      }

      const isOwner = currentUser?.role === 'owner';
      let authorizedByManagerName = isOwner ? currentUser?.name || 'المدير' : '';

      // If non-manager opens shift, verify managerSecret:
      if (!isOwner) {
        if (!managerSecret || !managerSecret.trim()) {
          sounds.playWarning();
          return {
            success: false,
            message: '⚠️ يرجى إدخال رمز الـ PIN أو كلمة المرور الخاصة بالمدير العام للاعتماد وفتح الوردية.',
          };
        }
        const verifyRes = verifyManagerCredentials(managerSecret.trim());
        if (!verifyRes.success) {
          sounds.playWarning();
          return {
            success: false,
            message: '⚠️ رمز اعتماد المدير غير صحيح! تعذر فتح الشيفت.',
          };
        }
        authorizedByManagerName = verifyRes.managerUser?.name || 'المدير العام';
      }

      const assignedUser = (isOwner && targetCashierId)
        ? users.find((u) => u.id === targetCashierId) || currentUser
        : currentUser;

      const openedAt = new Date().toISOString();
      const validHours = (typeof scheduledDurationHours === 'number' && scheduledDurationHours > 0)
        ? scheduledDurationHours
        : (parseInt(String(scheduledDurationHours), 10) || 8);

      let scheduledEndTime: string;
      if (
        customScheduledEndTime &&
        typeof customScheduledEndTime === 'string' &&
        !isNaN(new Date(customScheduledEndTime).getTime()) &&
        new Date(customScheduledEndTime).getTime() > Date.now() + 5 * 60 * 1000
      ) {
        scheduledEndTime = new Date(customScheduledEndTime).toISOString();
      } else {
        scheduledEndTime = new Date(Date.now() + validHours * 60 * 60 * 1000).toISOString();
      }

      const newShift: ShiftSession = {
        id: `shift-${Date.now()}`,
        cashierId: assignedUser?.id || 'staff',
        cashierName: assignedUser?.name || 'كاشير',
        openedAt,
        scheduledEndTime,
        shiftDurationHours: validHours,
        startingCash,
        totalSales: 0,
        totalTransactions: 0,
        totalWeightSoldKg: 0,
        status: 'open',
        isSuspended: false,
        authorizedByManager: isOwner ? undefined : authorizedByManagerName,
      };

      setCurrentShift(newShift);
      logAuditAction(
        'فتح شيفت جديد',
        `تم فتح شيفت جديد للكاشير (${newShift.cashierName}) بعهدة افتتاحية ${startingCash} ج.م وموعد إغلاق مجدول: ${new Date(scheduledEndTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
        'login'
      );
      sounds.playSuccess();
      return {
        success: true,
        message: `تم فتح الشيفت بنجاح بعهدة نقدية ${startingCash} ج.م! نتمنى لك وردية موفقة.`,
      };
    },
    [currentShift, currentUser, users, logAuditAction, verifyManagerCredentials]
  );

  const closeShift = useCallback(
    (
      actualCash: number,
      notes: string = '',
      managerSecret?: string,
      isEarlyClose: boolean = false,
      earlyCloseReason?: string,
      cashDenominations?: ShiftCashDenominations,
      cashierSignature?: ShiftCashierSignature
    ) => {
      if (!currentShift) return { success: false, message: 'لا يوجد شيفت نشط حالياً' };

      const isOwner = currentUser?.role === 'owner';
      let authorizedByManagerName = isOwner ? currentUser?.name || 'المدير' : '';

      // Check timing constraints:
      const checkResult = checkShiftCloseAllowed(currentShift, isOwner);
      const isEarly = isEarlyClose || checkResult.isEarly;

      // If user is a cashier and closing early, require Manager Approval password:
      if (!isOwner && isEarly) {
        if (!managerSecret || !managerSecret.trim()) {
          sounds.playWarning();
          recordFailedLogin(currentUser?.username || 'كاشير', 'محاولة إغلاق شيفت مبكر دون موافقة وباسورد المدير');
          return {
            success: false,
            message: '⚠️ لا يمكن إغلاق الشفت قبل موعده إلا بموافقة واعتماد المدير العام (Admin Approval) وإدخال كلمة المرور لظرف طارئ.',
          };
        }

        const verifyRes = verifyManagerCredentials(managerSecret.trim());
        if (!verifyRes.success) {
          sounds.playWarning();
          return {
            success: false,
            message: '⚠️ موافقة المدير مرفوضة: رمز الـ PIN أو كلمة المرور للمدير غير صحيحة! لا يمكن الإغلاق المبكر للشيفت.',
          };
        }
        authorizedByManagerName = verifyRes.managerUser?.name || 'المدير العام';
      }

      const expectedCash = +(currentShift.startingCash + currentShift.totalSales).toFixed(2);
      const cashDifference = +(actualCash - expectedCash).toFixed(2);

      const uniqueClosedId = currentShift.id.startsWith('closed-')
        ? currentShift.id
        : `closed-${currentShift.id}-${Date.now()}`;

      const closedSession: ShiftSession = {
        ...currentShift,
        id: uniqueClosedId,
        closedAt: new Date().toISOString(),
        expectedCash,
        actualCash,
        cashDifference,
        status: 'closed',
        isSuspended: false,
        notes: isEarly && !isOwner
          ? `${notes ? notes + ' | ' : ''}إغلاق مبكر استثنائي بموافقة المدير: ${authorizedByManagerName} (${earlyCloseReason || 'ظرف طارئ'})`
          : notes,
        authorizedByManager: isEarly ? authorizedByManagerName : currentShift.authorizedByManager,
        earlyCloseApproved: isEarly,
        earlyCloseReason: isEarly ? (earlyCloseReason || 'ظرف طارئ') : undefined,
        cashDenominations,
        cashierSignature,
      };

      setShiftHistory((prev) => {
        const filtered = prev.filter((s) => s.id !== uniqueClosedId && s.id !== currentShift.id);
        return [closedSession, ...filtered];
      });
      setCurrentShift(null);

      const diffText =
        cashDifference === 0
          ? 'مطابق تماماً'
          : cashDifference > 0
          ? `زيادة ${cashDifference} ج.م`
          : `عجز ${Math.abs(cashDifference)} ج.م`;

      if (isEarly && !isOwner) {
        logAuditAction(
          'إغلاق استثنائي مبكر للشيفت بموافقة المدير',
          `تم إغلاق الشيفت مبكراً للكاشير (${currentShift.cashierName}) بموافقة المدير (${authorizedByManagerName}). السبب: ${earlyCloseReason || 'ظرف طارئ'}. النقدية المتوقعة: ${expectedCash} ج.م، الفعلية: ${actualCash} ج.م (${diffText})`,
          'shift_early_close'
        );
      } else {
        logAuditAction(
          'إغلاق الشيفت وتعداد الخزينة',
          isOwner
            ? `تم إغلاق الشيفت بواسطة المدير ${currentUser?.name}. النقدية المتوقعة: ${expectedCash} ج.م، الفعلية: ${actualCash} ج.م (${diffText})`
            : `تم إغلاق الشيفت بواسطة الكاشير ${currentUser?.name} بتعداد الفئات وتوقيع العهدة. المتوقع: ${expectedCash} ج.م، الفعلي: ${actualCash} ج.م (${diffText})`,
          'shift_close'
        );
      }

      sounds.playSuccess();
      return {
        success: true,
        message: `تم إقفال الشيفت بنجاح وتوليد تقرير الـ Z-Report وتسوية الخزينة (${diffText}).`,
      };
    },
    [currentShift, currentUser, logAuditAction, verifyManagerCredentials, recordFailedLogin]
  );

  const updateActiveShiftSchedule = useCallback(
    (newEndTime: string, notes?: string) => {
      if (!currentShift) return { success: false, message: 'لا يوجد شيفت نشط حالياً' };
      setCurrentShift((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          scheduledEndTime: newEndTime,
          notes: notes ? `${prev.notes ? prev.notes + ' | ' : ''}تعديل توقيت الإقفال من الإدارة: ${notes}` : prev.notes,
        };
      });
      logAuditAction(
        'تعديل موعد إغلاق الشيفت من الإدارة',
        `قام المدير بتعديل موعد إغلاق شيفت الكاشير (${currentShift.cashierName}) إلى ${new Date(newEndTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
        'shift_close'
      );
      sounds.playSuccess();
      return { success: true, message: 'تم تعديل موعد إغلاق الشيفت بنجاح.' };
    },
    [currentShift, logAuditAction]
  );

  const suspendCurrentShift = useCallback(() => {
    if (currentShift && (currentShift.status === 'open' || !currentShift.status)) {
      setCurrentShift((prev) => (prev ? { ...prev, isSuspended: true, status: 'suspended' } : null));
      logAuditAction('تعليق الوردية', `تم تعليق وردية الكاشير (${currentShift.cashierName}) وحظر المبيعات مؤقتاً`, 'auto_lock');
      sounds.playWarning();
    }
  }, [currentShift, logAuditAction]);

  const resumeCurrentShift = useCallback(() => {
    if (currentShift && (currentShift.status === 'suspended' || currentShift.isSuspended)) {
      setCurrentShift((prev) => (prev ? { ...prev, isSuspended: false, status: 'open' } : null));
      logAuditAction('استئناف الوردية', `تم استئناف وردية الكاشير (${currentShift.cashierName}) وفتح المبيعات مجدداً`, 'login');
      sounds.playSuccess();
    }
  }, [currentShift, logAuditAction]);

  // Low Stock Calculations
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStockAlert && p.isAvailable);
  }, [products]);

  const lowStockRawMaterials = useMemo(() => {
    return rawMaterials.filter((r) => r.currentStock <= r.minStockAlert);
  }, [rawMaterials]);

  const pendingRefundsCount = useMemo(() => {
    return refundRequests.filter((r) => r.status === 'pending').length;
  }, [refundRequests]);

  const pendingUsersCount = useMemo(() => {
    return users.filter((u) => u.status === 'pending').length;
  }, [users]);

  // Update Bakery Profile & Settings with Non-Empty Strict Validation
  const updateBakeryName = useCallback(
    (newName: string): { success: boolean; message: string } => {
      const trimmed = newName ? newName.trim() : '';
      if (!trimmed || trimmed.length === 0) {
        sounds.playWarning();
        return {
          success: false,
          message: 'خطأ: لا يمكن ترك اسم المخبز فارغاً! يجب إدخال اسم صحيح ومعتمد.',
        };
      }

      if (trimmed.length < 3) {
        sounds.playWarning();
        return {
          success: false,
          message: 'خطأ: اسم المخبز يجب أن يتكون من 3 أحرف على الأقل.',
        };
      }

      const oldName = bakerySettings.name;
      setBakerySettings((prev) => ({
        ...prev,
        name: trimmed,
      }));

      logAuditAction(
        'تعديل اسم المخبز',
        `قام المدير ${currentUser?.name || 'المدير'} بتعديل الاسم التجاري للمخبز من "${oldName}" إلى "${trimmed}" وتحديثه في كامل الفواتير والواجهة`,
        'product_change'
      );

      sounds.playSuccess();
      return {
        success: true,
        message: `تم تعديل اسم المخبز بنجاح إلى "${trimmed}" وتم تعميمه على كامل الفواتير المطبوعة والإدارية!`,
      };
    },
    [bakerySettings.name, currentUser, logAuditAction]
  );

  const updateBakerySettings = useCallback(
    (settings: Partial<BakerySettings>): { success: boolean; message: string } => {
      if (settings.name !== undefined) {
        const trimmed = settings.name ? settings.name.trim() : '';
        if (!trimmed || trimmed.length === 0) {
          sounds.playWarning();
          return {
            success: false,
            message: 'خطأ: لا يمكن ترك اسم المخبز فارغاً! يرجى إدخال اسم صالح.',
          };
        }
      }

      setBakerySettings((prev) => ({
        ...prev,
        ...settings,
        name: settings.name !== undefined ? settings.name.trim() : prev.name,
      }));

      logAuditAction(
        'تحديث بيانات وملف المخبز',
        `قام المدير ${currentUser?.name || 'المدير'} بتحديث بيانات وهوية المخبز والفاتورة الضريبية`,
        'product_change'
      );

      sounds.playSuccess();
      return {
        success: true,
        message: 'تم حفظ وتحديث بيانات وهوية المخبز والفاتورة بنجاح!',
      };
    },
    [currentUser, logAuditAction]
  );

  // Backup & Data Safety Implementations
  const exportBackupJSON = useCallback((): BakeryBackupData => {
    const backup: BakeryBackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      bakeryName: bakerySettings.name,
      bakerySettings,
      users,
      products,
      rawMaterials,
      sales,
      refundRequests,
      shiftHistory,
      auditLogs,
    };

    logAuditAction(
      'تصدير نسخة احتياطية',
      `قام المدير ${currentUser?.name} بتصدير ملف نسخة احتياطية شاملة للنظام (${sales.length} فاتورة، ${products.length} صنف)`,
      'backup_export'
    );

    return backup;
  }, [bakerySettings, users, products, rawMaterials, sales, refundRequests, shiftHistory, auditLogs, currentUser, logAuditAction]);

  const restoreBackupJSON = useCallback(
    (backupData: BakeryBackupData): { success: boolean; message: string } => {
      try {
        if (!backupData || !backupData.version) {
          return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو تالف.' };
        }

        if (backupData.bakerySettings && backupData.bakerySettings.name) {
          setBakerySettings(backupData.bakerySettings);
          localStorage.setItem('bakery_settings', JSON.stringify(backupData.bakerySettings));
        } else if (backupData.bakeryName && backupData.bakeryName.trim()) {
          setBakerySettings((prev) => ({
            ...prev,
            name: backupData.bakeryName.trim(),
          }));
        }

        if (Array.isArray(backupData.products)) {
          setProducts(backupData.products);
          localStorage.setItem('bakery_products', JSON.stringify(backupData.products));
        }

        if (Array.isArray(backupData.rawMaterials)) {
          setRawMaterials(backupData.rawMaterials);
          localStorage.setItem('bakery_raw_materials', JSON.stringify(backupData.rawMaterials));
        }

        if (Array.isArray(backupData.users)) {
          setUsers(backupData.users);
          localStorage.setItem('bakery_users', JSON.stringify(backupData.users));
        }

        if (Array.isArray(backupData.sales)) {
          setSales(backupData.sales);
          localStorage.setItem('bakery_sales', JSON.stringify(backupData.sales));
        }

        if (Array.isArray(backupData.refundRequests)) {
          setRefundRequests(backupData.refundRequests);
          localStorage.setItem('bakery_refund_requests', JSON.stringify(backupData.refundRequests));
        }

        if (Array.isArray(backupData.shiftHistory)) {
          setShiftHistory(backupData.shiftHistory);
          localStorage.setItem('bakery_shift_history', JSON.stringify(backupData.shiftHistory));
        }

        if (Array.isArray(backupData.auditLogs)) {
          const updatedLogs = [
            {
              id: `audit-${Date.now()}`,
              userId: currentUser?.id || 'owner-1',
              userName: currentUser?.name || 'المدير',
              userRole: (currentUser?.role || 'owner') as UserRole,
              action: 'استرجاع نسخة احتياطية بالكامل',
              details: `تمت استعادة البيانات بنجاح من ملف مصدر بتاريخ ${new Date(
                backupData.exportedAt || Date.now()
              ).toLocaleString('ar-EG')}`,
              timestamp: new Date().toISOString(),
              type: 'backup_restore' as const,
            },
            ...backupData.auditLogs,
          ];
          setAuditLogs(updatedLogs);
          localStorage.setItem('bakery_audit_logs', JSON.stringify(updatedLogs));
        }

        sounds.playSuccess();
        return {
          success: true,
          message: 'تم استرجاع كامل بيانات المخبز بنجاح وتحديث كافة السجلات!',
        };
      } catch (err: any) {
        sounds.playWarning();
        return {
          success: false,
          message: `حدث خطأ أثناء استرجاع الملف: ${err.message || 'بيانات غير متوافقة'}`,
        };
      }
    },
    [currentUser]
  );

  const exportSalesCSV = useCallback((): string => {
    // Generate CSV Header
    const headers = [
      'رقم الفاتورة',
      'التاريخ والوقت',
      'اسم الكاشير',
      'عدد البنود',
      'الأصناف المباعة',
      'طريقة الدفع',
      'المبلغ الإجمالي (ج.م)',
      'الحالة',
      'المدفوع نقداً',
      'الباقي للعميل',
      'ملاحظات',
    ];

    const rows = sales.map((sale) => {
      const itemsDetail = sale.items
        .map(
          (i) =>
            `${i.productName} (${
              i.unitType === 'weight' ? `${i.weightKg} كجم` : `${i.quantity} ق`
            })`
        )
        .join(' + ');

      const paymentMethodArabic =
        sale.paymentMethod === 'cash'
          ? 'نقدي'
          : sale.paymentMethod === 'card'
          ? 'بطاقة بنكية'
          : 'محفظة إلكترونية';

      const statusArabic =
        sale.status === 'completed'
          ? 'مكتملة'
          : sale.status === 'refunded'
          ? 'مسترجعة'
          : sale.status === 'refund_requested'
          ? 'طلب استرجاع معلق'
          : 'ملغاة';

      return [
        `"${sale.invoiceNumber}"`,
        `"${new Date(sale.timestamp).toLocaleString('ar-EG')}"`,
        `"${sale.cashierName}"`,
        sale.items.length,
        `"${itemsDetail}"`,
        `"${paymentMethodArabic}"`,
        sale.totalAmount.toFixed(2),
        `"${statusArabic}"`,
        sale.cashGiven ? sale.cashGiven.toFixed(2) : '0.00',
        sale.changeDue ? sale.changeDue.toFixed(2) : '0.00',
        `"${sale.retroactiveNote || ''}"`,
      ].join(',');
    });

    logAuditAction(
      'تصدير فواتير Excel/CSV',
      `تم تصدير سجل المبيعات والفواتير بالكامل بصيغة جدول Excel/CSV (${sales.length} عملية)`,
      'backup_export'
    );

    return '\uFEFF' + [headers.join(','), ...rows].join('\n');
  }, [sales, logAuditAction]);

  return (
    <BakeryContext.Provider
      value={{
        currentUser,
        users,
        isLocked,
        lockTerminal,
        turnOffScreen,
        unlockTerminal,
        login,
        loginUserDirectly,
        logout,
        registerStaff,
        addStaffUserByManager,
        approveStaff,
        rejectStaff,
        deleteUser,
        deactivateUser,
        reactivateUser,
        permanentDeleteUser,
        updateUserDepartment,
        verifyOwnerPin,
        verifyManagerCredentials,
        authorizeAndActivatePendingUser,

        securitySettings,
        updateSecuritySettings,
        failedLoginLogs,
        clearFailedLoginLogs,
        unlockUserAccount,
        changeUserPassword,
        autoLockTerminal,
        recordFailedLogin,
        sessionTerminatedNotice,
        clearSessionTerminatedNotice,

        lockedOutUser,
        setLockedOutUser,
        clearLockedOutUser,
        isStandbyScreenOpen,
        setIsStandbyScreenOpen,
        terminalFailedAttempts,
        unlockTerminalOverride,
        resetTerminalLockout,

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

        cart,
        addToCartPiece,
        addToCartWeight,
        updateCartItemQty,
        updateCartItemWeight,
        removeFromCart,
        clearCart,
        voidCurrentCart,
        checkoutCart,

        sales,
        refundRequests,
        requestRefund,
        approveRefund,
        rejectRefund,

        currentShift,
        shiftHistory,
        startShift,
        closeShift,
        updateActiveShiftSchedule,
        suspendCurrentShift,
        resumeCurrentShift,

        auditLogs,
        logAuditAction,

        lowStockProducts,
        lowStockRawMaterials,
        pendingRefundsCount,
        pendingUsersCount,

        canPerform,

        bakerySettings,
        updateBakeryName,
        updateBakerySettings,

        soundEnabled,
        toggleSound,

        theme,
        toggleTheme,

        exportBackupJSON,
        restoreBackupJSON,
        exportSalesCSV,
      }}
    >
      {children}
    </BakeryContext.Provider>
  );
};

export const useBakery = () => {
  const context = useContext(BakeryContext);
  if (!context) {
    throw new Error('useBakery must be used within a BakeryProvider');
  }
  return context;
};
