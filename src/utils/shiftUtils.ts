import { ShiftSession } from '../types';

export const MAX_SHIFT_HOURS = 12;

export interface ShiftDurationResult {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  formatted: string;
  formattedShort: string;
}

/**
 * Calculates duration between shift opening and closing (or current time if open)
 */
export function getShiftDuration(
  openedAt: string,
  closedAt?: string | null
): ShiftDurationResult {
  const start = new Date(openedAt).getTime();
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = +(diffMs / (1000 * 60 * 60)).toFixed(1);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  let formatted = '';
  if (hours === 0 && minutes === 0) {
    formatted = `${seconds} ثانية (بدأت للتو)`;
  } else if (hours === 0) {
    formatted = `${minutes} دقيقة و ${seconds} ثانية`;
  } else if (minutes === 0) {
    const hoursPart = hours === 1 ? 'ساعة واحدة' : hours === 2 ? 'ساعتان' : `${hours} ساعات`;
    formatted = `${hoursPart} و ${seconds} ثانية`;
  } else {
    const hoursPart = hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتان' : `${hours} ساعات`;
    formatted = `${hoursPart} و ${minutes} دقيقة`;
  }

  const formattedShort =
    hours > 0
      ? `${hours}س ${minutes}د`
      : minutes > 0
      ? `${minutes}د ${seconds}ث`
      : `${seconds}ث`;

  return {
    hours,
    minutes,
    seconds,
    totalSeconds,
    totalMinutes,
    totalHours,
    formatted,
    formattedShort,
  };
}

/**
 * Checks if a shift can be closed by the cashier:
 * The "Close Shift" button is locked until 5 minutes before scheduled end time.
 * If user is owner or manager approval is granted, allowed immediately.
 */
export function checkShiftCloseAllowed(
  shift: ShiftSession | null,
  isOwner: boolean
): {
  canClose: boolean;
  minutesRemainingToUnlock: number;
  scheduledEndFormatted: string;
  isEarly: boolean;
  reason?: string;
} {
  if (!shift || shift.status !== 'open') {
    return {
      canClose: false,
      minutesRemainingToUnlock: 0,
      scheduledEndFormatted: '',
      isEarly: false,
      reason: 'لا يوجد شفت نشط حالياً للإغلاق',
    };
  }

  // Only owners/managers can close anytime without restrictions
  if (isOwner) {
    return {
      canClose: true,
      minutesRemainingToUnlock: 0,
      scheduledEndFormatted: '',
      isEarly: false,
    };
  }

  // Calculate scheduled end time with strict validation
  const openedMs = new Date(shift.openedAt).getTime() || Date.now();
  let scheduledEndMs: number;
  if (shift.scheduledEndTime) {
    const parsed = new Date(shift.scheduledEndTime).getTime();
    // Validate: must be a valid timestamp and at least 5 minutes after openedAt
    if (!isNaN(parsed) && parsed > openedMs + 5 * 60 * 1000) {
      scheduledEndMs = parsed;
    } else {
      const defaultHours = (shift.shiftDurationHours && shift.shiftDurationHours > 0) ? shift.shiftDurationHours : 8;
      scheduledEndMs = openedMs + defaultHours * 60 * 60 * 1000;
    }
  } else {
    const defaultHours = (shift.shiftDurationHours && shift.shiftDurationHours > 0) ? shift.shiftDurationHours : 8;
    scheduledEndMs = openedMs + defaultHours * 60 * 60 * 1000;
  }

  const scheduledEndDate = new Date(scheduledEndMs);
  const scheduledEndFormatted = scheduledEndDate.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const now = Date.now();
  // Allowed to close starting strictly 5 minutes before scheduled end time
  const unlockWindowMs = scheduledEndMs - 5 * 60 * 1000;
  const unlockTimeFormatted = new Date(unlockWindowMs).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (now >= unlockWindowMs) {
    return {
      canClose: true,
      minutesRemainingToUnlock: 0,
      scheduledEndFormatted,
      isEarly: false,
    };
  }

  // Not yet in the 5-minute window
  const diffMs = unlockWindowMs - now;
  const minutesRemainingToUnlock = Math.max(1, Math.ceil(diffMs / (60 * 1000)));

  return {
    canClose: false,
    minutesRemainingToUnlock,
    scheduledEndFormatted,
    isEarly: true,
    reason: `لا يمكن إغلاق الشفت قبل موعده. متاح الإغلاق بدءاً من ${unlockTimeFormatted} (قبل موعد الانتهاء بـ 5 دقائق). للإغلاق الآن يتطلب إذن المدير.`,
  };
}

/**
 * Checks whether a shift has expired
 * Note: Disabled hard expiration blocking per user requirement so shifts are never locked or blocked
 */
export function isShiftExpired(shift: ShiftSession | null): {
  isExpired: boolean;
  hoursElapsed: number;
  isPastFinancialDay: boolean;
  reason: string;
} {
  if (!shift || shift.status !== 'open') {
    return {
      isExpired: false,
      hoursElapsed: 0,
      isPastFinancialDay: false,
      reason: '',
    };
  }

  const openedDate = new Date(shift.openedAt);
  const now = new Date();
  const hoursElapsed = (now.getTime() - openedDate.getTime()) / (1000 * 60 * 60);

  // Return non-expired so sales and closing are never blocked
  return {
    isExpired: false,
    hoursElapsed: +hoursElapsed.toFixed(1),
    isPastFinancialDay: false,
    reason: '',
  };
}

/**
 * Formats a short legible Shift reference code
 */
export function getShiftShortId(shiftId: string, index?: number): string {
  if (!shiftId) return 'SH-01';
  // If it has digits at the end
  const digits = shiftId.replace(/\D/g, '');
  if (digits.length >= 3) {
    return `SH-${digits.slice(-3)}`;
  }
  if (typeof index === 'number') {
    return `SH-${String(index + 1).padStart(2, '0')}`;
  }
  return `SH-${shiftId.replace('shift-', '').slice(0, 6)}`;
}
