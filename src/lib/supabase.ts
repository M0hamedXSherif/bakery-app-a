import { createClient } from '@supabase/supabase-js';
import { Product, RawMaterial, SaleRecord, ShiftSession } from '../types';

// Supabase project credentials
export const SUPABASE_PROJECT_ID = 'roblzbjqazyhmbeclodo';
export const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_PK4ngNDuU5k6XNbkfW4oFw_gxZOEMAF';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Checks connection to Supabase
 */
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  message: string;
  hasFunction?: boolean;
}> {
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'متصل بنجاح بقاعدة بيانات Supabase' };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'تعذر الاتصال بالسيرفر' };
  }
}

export interface ProcessSaleParams {
  invoiceNumber: string;
  shiftId?: string;
  cashierId: string;
  cashierName: string;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'wallet';
  cashGiven?: number;
  changeDue?: number;
  items: Array<{
    productId: string;
    productName: string;
    unitType: 'piece' | 'weight';
    unitPrice: number;
    quantity: number;
    weightKg?: number;
    subtotal: number;
  }>;
}

/**
 * Executes the ACID Transaction on PostgreSQL via Supabase RPC.
 * If RPC function is not yet created, falls back gracefully to standard table inserts.
 */
export async function executeSaleTransaction(params: ProcessSaleParams): Promise<{
  success: boolean;
  saleId?: string;
  error?: string;
  isFallback?: boolean;
}> {
  try {
    // 1. Try calling the PostgreSQL ACID Transaction Stored Procedure
    const { data, error } = await supabase.rpc('process_pos_sale', {
      p_invoice_number: params.invoiceNumber,
      p_shift_id: params.shiftId || null,
      p_cashier_id: params.cashierId,
      p_cashier_name: params.cashierName,
      p_total_amount: params.totalAmount,
      p_payment_method: params.paymentMethod,
      p_cash_given: params.cashGiven || null,
      p_change_due: params.changeDue || null,
      p_items: params.items,
    });

    if (!error) {
      return { success: true, saleId: data as string };
    }

    // If function does not exist or has signature difference, fallback to direct table insert
    console.warn('Supabase RPC process_pos_sale warning, falling back to direct table insert:', error.message);

    // 2. Direct table insert fallback
    const { data: saleData, error: saleErr } = await supabase
      .from('sales')
      .insert({
        invoice_number: params.invoiceNumber,
        shift_id: params.shiftId || null,
        cashier_id: params.cashierId,
        cashier_name: params.cashierName,
        total_amount: params.totalAmount,
        payment_method: params.paymentMethod,
        cash_given: params.cashGiven || null,
        change_due: params.changeDue || null,
        status: 'completed',
      })
      .select('id')
      .single();

    if (saleErr) {
      return { success: false, error: saleErr.message };
    }

    const saleId = saleData.id;

    // Insert sale items
    const saleItemsPayload = params.items.map((it) => ({
      sale_id: saleId,
      product_id: it.productId,
      product_name: it.productName,
      unit_type: it.unitType,
      unit_price: it.unitPrice,
      quantity: it.unitType === 'weight' ? it.weightKg || it.quantity : it.quantity,
      subtotal: it.subtotal,
    }));

    await supabase.from('sale_items').insert(saleItemsPayload);

    return { success: true, saleId, isFallback: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'حدث خطأ أثناء معالجة الفاتورة سحابياً' };
  }
}

export interface FullSyncPayload {
  users: any[];
  rawMaterials: any[];
  products: any[];
  bakerySettings: any;
  currentShift?: any;
  shiftHistory?: any[];
  sales?: any[];
  refundRequests?: any[];
  auditLogs?: any[];
}

/**
 * Full database sync across all tables in Supabase:
 * (users, raw_materials, products, product_recipes, bakery_settings, shift_sessions, sales, refund_requests, audit_logs)
 */
export async function syncAllBakeryDataToSupabase(payload: FullSyncPayload): Promise<{
  success: boolean;
  message: string;
  details?: {
    usersCount: number;
    materialsCount: number;
    productsCount: number;
    recipesCount: number;
    settingsUpdated: boolean;
    shiftsCount: number;
    salesCount: number;
    refundsCount: number;
    auditCount: number;
  };
}> {
  try {
    // 1. Sync Users
    const usersPayload = (payload.users || []).map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      pin: u.pin,
      role: u.role,
      department: u.department || null,
      job_title: u.jobTitle || null,
      status: u.status,
      phone: u.phone || null,
      avatar: u.avatar || null,
    }));
    const { error: userErr } = await supabase.from('users').upsert(usersPayload);
    if (userErr) throw new Error(`فشل رفع المستخدمين: ${userErr.message}`);

    // 2. Sync Raw Materials
    const matPayload = (payload.rawMaterials || []).map((m) => ({
      id: m.id,
      name: m.name,
      current_stock: m.currentStock,
      unit: m.unit,
      min_stock_alert: m.minStockAlert,
      cost_per_unit: m.costPerUnit,
      supplier: m.supplier || null,
    }));
    const { error: matErr } = await supabase.from('raw_materials').upsert(matPayload);
    if (matErr) throw new Error(`فشل رفع المواد الخام: ${matErr.message}`);

    // 3. Sync Products
    const prodPayload = (payload.products || []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      unit_type: p.unitType,
      price: p.price,
      stock: p.stock,
      min_stock_alert: p.minStockAlert,
      image_url: p.image,
      barcode: p.barcode || null,
      description: p.description || null,
      is_available: p.isAvailable,
    }));
    const { error: prodErr } = await supabase.from('products').upsert(prodPayload);
    if (prodErr) throw new Error(`فشل رفع المنتجات: ${prodErr.message}`);

    // 4. Sync Recipes
    const recipePayload: any[] = [];
    (payload.products || []).forEach((p) => {
      p.recipe?.forEach((r: any) => {
        if (r.rawMaterialId && r.quantityNeeded > 0) {
          recipePayload.push({
            product_id: p.id,
            raw_material_id: r.rawMaterialId,
            quantity_needed: r.quantityNeeded,
          });
        }
      });
    });
    let recipesCount = 0;
    if (recipePayload.length > 0) {
      const { error: recErr } = await supabase.from('product_recipes').upsert(recipePayload);
      if (recErr) console.warn('Recipe upsert warning:', recErr.message);
      else recipesCount = recipePayload.length;
    }

    // 5. Sync Bakery Settings
    if (payload.bakerySettings) {
      await supabase.from('bakery_settings').upsert({
        id: 'default',
        name: payload.bakerySettings.name || 'مخبز النور الذهبي',
        phone: payload.bakerySettings.phone || null,
        address: payload.bakerySettings.address || null,
        tax_number: payload.bakerySettings.taxNumber || null,
        commercial_reg: payload.bakerySettings.commercialReg || null,
        receipt_footer: payload.bakerySettings.receiptFooter || null,
        logo_emoji: payload.bakerySettings.logoEmoji || '🥐',
        logo_url: payload.bakerySettings.logoUrl || null,
      });
    }

    // 6. Sync Shift Sessions (if any)
    const allShifts = [
      ...(payload.currentShift ? [payload.currentShift] : []),
      ...(payload.shiftHistory || []),
    ];
    let shiftsCount = 0;
    if (allShifts.length > 0) {
      const shiftRows = allShifts.map((s) => ({
        id: s.id,
        user_id: s.cashierId || (payload.users[0]?.id ?? 'user-staff-1'),
        user_name: s.cashierName || 'كاشير المخبز',
        start_time: s.startTime,
        end_time: s.endTime || null,
        starting_cash: s.startingCash || 0,
        expected_cash: s.expectedCash || 0,
        actual_cash: s.actualCash || null,
        cash_difference: s.cashDifference || 0,
        total_sales: s.totalSales || 0,
        total_weight_kg: s.totalWeightSoldKg || 0,
        status: s.status || 'open',
      }));
      const { error: shiftErr } = await supabase.from('shift_sessions').upsert(shiftRows);
      if (!shiftErr) shiftsCount = shiftRows.length;
    }

    // 7. Sync Sales (if any)
    let salesCount = 0;
    if (payload.sales && payload.sales.length > 0) {
      for (const sale of payload.sales) {
        const { data: sData } = await supabase
          .from('sales')
          .upsert({
            id: sale.id,
            invoice_number: sale.invoiceNumber,
            cashier_id: sale.cashierId || (payload.users[0]?.id ?? 'user-staff-1'),
            cashier_name: sale.cashierName || 'كاشير المخبز',
            total_amount: sale.total,
            payment_method: sale.paymentMethod || 'cash',
            cash_given: sale.cashGiven || null,
            change_due: sale.changeDue || null,
            status: sale.isRefunded ? 'refunded' : 'completed',
          })
          .select('id')
          .single();

        if (sData?.id && sale.items && sale.items.length > 0) {
          const itemRows = sale.items.map((it: any) => ({
            sale_id: sData.id,
            product_id: it.productId,
            product_name: it.productName,
            unit_type: it.unitType,
            unit_price: it.unitPrice,
            quantity: it.unitType === 'weight' ? it.weightKg || it.quantity : it.quantity,
            subtotal: it.subtotal,
          }));
          await supabase.from('sale_items').upsert(itemRows);
        }
        salesCount++;
      }
    }

    // 8. Sync Refund Requests (if any)
    let refundsCount = 0;
    if (payload.refundRequests && payload.refundRequests.length > 0) {
      const refundRows = payload.refundRequests.map((r: any) => ({
        id: r.id,
        invoice_number: r.invoiceNumber,
        sale_id: r.saleId || null,
        amount: r.amount || 0,
        reason: r.reason || 'طلب استرجاع',
        requested_by: r.requestedBy || 'الكاشير',
        status: r.status || 'pending',
        reviewed_by: r.reviewedBy || null,
        reviewed_at: r.reviewedAt || null,
      }));
      const { error: refErr } = await supabase.from('refund_requests').upsert(refundRows);
      if (!refErr) refundsCount = refundRows.length;
    }

    // 9. Sync Audit Logs (recent 50 logs)
    let auditCount = 0;
    if (payload.auditLogs && payload.auditLogs.length > 0) {
      const recentLogs = payload.auditLogs.slice(-50).map((l: any) => ({
        action: l.action,
        details: l.details,
        user_id: l.userId || null,
        user_name: l.userName || null,
        category: l.category || 'general',
        created_at: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
      }));
      const { error: logErr } = await supabase.from('audit_logs').insert(recentLogs);
      if (!logErr) auditCount = recentLogs.length;
    }

    return {
      success: true,
      message: `تمت المزامنة الشاملة لسحابة Supabase بنجاح! (${prodPayload.length} صنف، ${matPayload.length} مادة خام، ${usersPayload.length} موظفين، سجل التدقيق، وهوية المخبز) ☁️`,
      details: {
        usersCount: usersPayload.length,
        materialsCount: matPayload.length,
        productsCount: prodPayload.length,
        recipesCount,
        settingsUpdated: !!payload.bakerySettings,
        shiftsCount,
        salesCount,
        refundsCount,
        auditCount,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'حدث خطأ أثناء المزامنة الشاملة',
    };
  }
}
