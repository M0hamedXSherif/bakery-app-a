export type UserRole = 'owner' | 'staff';
export type UserStatus = 'active' | 'pending' | 'rejected' | 'inactive';
export type EmployeeDepartment =
  | 'cashier'
  | 'baker'
  | 'pastry_chef'
  | 'bakery'
  | 'pastry'
  | 'kitchen'
  | 'supervisor'
  | 'inventory'
  | 'manager'
  | 'admin';
export type ProductUnit = 'piece' | 'weight';
export type PaymentMethod = 'cash' | 'card' | 'wallet';

export interface User {
  id: string;
  name: string;
  username: string;
  pin: string; // 6-digit PIN
  password?: string; // Strong password (min 8 chars, uppercase, lowercase, numbers, symbols)
  passwordUpdatedAt?: string;
  previousPasswords?: string[];
  role: UserRole;
  department?: EmployeeDepartment;
  jobTitle?: string;
  preferredView?: 'pos' | 'kitchen' | 'dashboard';
  status: UserStatus;
  createdAt: string;
  avatar?: string;
  phone?: string;
  // Security & Account Lockout
  failedLoginAttempts?: number;
  isAccountLocked?: boolean;
  lockedAt?: string;
  // Single active session
  activeSessionToken?: string;
  // Two-Factor Authentication for managers
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

export interface SecuritySettings {
  autoLockSeconds: number; // 60 to 300 (1 to 5 mins), default 120 (2 mins)
  ownerExtendedLockSeconds: number; // e.g. 1800 (30 mins), 3600 (60 mins), or 0 (keep alive)
  ownerExtendedEnabled: boolean;
  warningSeconds: number; // 30 seconds before locking
  require2FAForManagers: boolean; // 2FA (OTP / Biometric) for managers
  passwordMinLength: number; // 8
  passwordExpiryDays: number; // 30 days
  maxFailedAttempts: number; // 3
}

export interface FailedLoginLog {
  id: string;
  timestamp: string;
  username: string;
  reason: string;
  deviceInfo: string;
  attemptNumber: number;
}

export interface RecipeIngredient {
  rawMaterialId: string;
  quantityNeeded: number; // e.g., 0.05 kg flour per piece, or 0.8 kg flour per 1 kg breadsticks
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unitType: ProductUnit;
  price: number; // price per piece OR price per kg
  stock: number; // in pieces or in kg
  minStockAlert: number;
  image: string;
  recipe: RecipeIngredient[];
  isAvailable: boolean;
  barcode?: string;
  description?: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  currentStock: number;
  unit: 'kg' | 'liter' | 'gram' | 'piece';
  minStockAlert: number;
  costPerUnit: number; // EGP
  supplier?: string;
  lastUpdated: string;
}

export interface CartItem {
  id: string; // unique item entry in cart
  productId: string;
  productName: string;
  unitType: ProductUnit;
  unitPrice: number; // unit price at time of adding
  quantity: number; // for piece (1, 2, 3...)
  weightKg?: number; // for weight (e.g. 0.25, 0.5, 1.25)
  subtotal: number;
  image?: string;
  notes?: string;
}

export interface SaleItemSnapshot {
  productId: string;
  productName: string;
  unitType: ProductUnit;
  unitPrice: number;
  quantity: number;
  weightKg?: number;
  subtotal: number;
}

export interface SaleRecord {
  id: string;
  invoiceNumber: string;
  cashierId: string;
  cashierName: string;
  timestamp: string;
  items: SaleItemSnapshot[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  cashGiven?: number;
  changeDue?: number;
  isRetroactive?: boolean;
  retroactiveNote?: string;
  status: 'completed' | 'voided' | 'refund_requested' | 'refunded';
  refundReason?: string;
  refundRequestedAt?: string;
  refundApprovedBy?: string;
  refundApprovedAt?: string;
}

export interface RefundRequest {
  id: string;
  saleId: string;
  invoiceNumber: string;
  cashierId: string;
  cashierName: string;
  reason: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuditDiffItem {
  field: string;
  fieldLabel: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
  type:
    | 'sale'
    | 'void'
    | 'refund_request'
    | 'refund_approved'
    | 'refund_rejected'
    | 'stock_change'
    | 'recipe_change'
    | 'product_change'
    | 'product_delete'
    | 'raw_material_change'
    | 'user_approved'
    | 'user_rejected'
    | 'user_registered'
    | 'user_added'
    | 'shift_close'
    | 'shift_early_close'
    | 'user_deactivated'
    | 'user_reactivated'
    | 'user_department_changed'
    | 'batch_production'
    | 'backup_export'
    | 'backup_restore'
    | 'login'
    | 'auto_lock'
    | 'account_locked'
    | 'account_unlocked'
    | 'password_changed'
    | 'security_alert'
    | 'failed_login'
    | 'two_factor_auth';
  entityId?: string;
  entityName?: string;
  diffs?: AuditDiffItem[];
  metadata?: Record<string, any>;
}

export interface ShiftCashDenominations {
  bill200: number;
  bill100: number;
  bill50: number;
  bill20: number;
  bill10: number;
  bill5: number;
  coins: number;
  totalCounted: number;
}

export interface ShiftCashierSignature {
  signedAt: string;
  signatureName: string;
  pinConfirmed: boolean;
  statement: string;
}

export interface ShiftSession {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  scheduledEndTime?: string; // Scheduled shift finish time ISO
  shiftDurationHours?: number; // e.g. 8 hours
  startingCash: number;
  expectedCash?: number;
  actualCash?: number;
  cashDifference?: number;
  totalSales: number;
  totalTransactions: number;
  totalWeightSoldKg: number;
  status: 'open' | 'closed' | 'suspended';
  isSuspended?: boolean;
  notes?: string;
  authorizedByManager?: string;
  earlyCloseApproved?: boolean;
  earlyCloseReason?: string;
  cashDenominations?: ShiftCashDenominations;
  cashierSignature?: ShiftCashierSignature;
}

export interface BakerySettings {
  name: string;
  slogan: string;
  phone: string;
  taxNumber: string;
  address?: string;
  logoEmoji?: string;
  logoUrl?: string;
  securitySettings?: SecuritySettings;
}

export interface BakeryBackupData {
  version: string;
  exportedAt: string;
  bakeryName: string;
  bakerySettings?: BakerySettings;
  users: User[];
  products: Product[];
  rawMaterials: RawMaterial[];
  sales: SaleRecord[];
  refundRequests: RefundRequest[];
  shiftHistory: ShiftSession[];
  auditLogs: AuditLog[];
  failedLoginLogs?: FailedLoginLog[];
}

