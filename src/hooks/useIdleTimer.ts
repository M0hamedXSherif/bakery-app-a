import { useState, useEffect, useRef, useCallback } from 'react';
import { SecuritySettings, User } from '../types';

interface UseIdleTimerProps {
  currentUser: User | null;
  isLocked: boolean;
  hasOpenCart: boolean;
  securitySettings: SecuritySettings;
  onTimeout: () => void;
}

export interface UseIdleTimerReturn {
  remainingSeconds: number;
  isWarningActive: boolean;
  isOpenCartProtected: boolean;
  resetTimer: () => void;
  totalDurationSeconds: number;
}

export function useIdleTimer({
  currentUser,
  isLocked,
  hasOpenCart,
  securitySettings,
  onTimeout,
}: UseIdleTimerProps): UseIdleTimerReturn {
  // Determine effective timeout in seconds
  const isOwner = currentUser?.role === 'owner';
  const totalDurationSeconds =
    isOwner && securitySettings.ownerExtendedEnabled
      ? securitySettings.ownerExtendedLockSeconds
      : securitySettings.autoLockSeconds;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(totalDurationSeconds);
  const lastActivityRef = useRef<number>(Date.now());
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingSeconds(totalDurationSeconds);
  }, [totalDurationSeconds]);

  // Activity listeners
  useEffect(() => {
    if (isLocked || !currentUser) return;

    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleUserActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
      }, 500); // 500ms throttle

      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [isLocked, currentUser]);

  // Countdown timer loop
  useEffect(() => {
    if (isLocked || !currentUser) {
      return;
    }

    // If owner has set extended lock to 0 (Keep Alive Forever), do not count down
    if (isOwner && securitySettings.ownerExtendedEnabled && totalDurationSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      // Check if open cart protects against auto-lock
      if (hasOpenCart) {
        lastActivityRef.current = Date.now();
        setRemainingSeconds(totalDurationSeconds);
        return;
      }

      const elapsedSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, totalDurationSeconds - elapsedSec);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeoutRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isLocked,
    currentUser,
    hasOpenCart,
    totalDurationSeconds,
    isOwner,
    securitySettings.ownerExtendedEnabled,
  ]);

  const isWarningActive =
    !isLocked &&
    !!currentUser &&
    !hasOpenCart &&
    remainingSeconds <= securitySettings.warningSeconds &&
    remainingSeconds > 0;

  return {
    remainingSeconds,
    isWarningActive,
    isOpenCartProtected: hasOpenCart,
    resetTimer,
    totalDurationSeconds,
  };
}
