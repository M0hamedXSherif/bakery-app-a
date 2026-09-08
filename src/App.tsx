import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { BakeryProvider, useBakery } from './context/BakeryContext';
import { Header } from './components/common/Header';
import { POSScreen } from './components/pos/POSScreen';
import { OwnerDashboard } from './components/dashboard/OwnerDashboard';
import { KitchenProductionScreen } from './components/kitchen/KitchenProductionScreen';
import { AuthModal } from './components/auth/AuthModal';
import { StaffRefundModal } from './components/staff/StaffRefundModal';
import { PinLockScreen } from './components/auth/PinLockScreen';
import { AutoLockWarningBanner } from './components/auth/AutoLockWarningBanner';
import { PasswordExpiryModal } from './components/auth/PasswordExpiryModal';
import { LockedOutScreen } from './components/auth/LockedOutScreen';
import { useIdleTimer } from './hooks/useIdleTimer';
import { isPasswordExpired } from './utils/securityUtils';

function BakeryApp() {
  const {
    currentUser,
    isLocked,
    theme,
    cart,
    securitySettings,
    autoLockTerminal,
    sessionTerminatedNotice,
    clearSessionTerminatedNotice,
    changeUserPassword,
    lockedOutUser,
    clearLockedOutUser,
    isStandbyScreenOpen,
  } = useBakery();

  const [currentView, setCurrentView] = useState<'pos' | 'dashboard' | 'kitchen'>('pos');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isRefundOpen, setIsRefundOpen] = useState<boolean>(false);

  // Role-based screen redirection upon login:
  // Director/Owner -> Dashboard, Chef/Baker -> Kitchen, Cashier -> POS
  useEffect(() => {
    if (!currentUser || isLocked) return;

    // 1. Owner / Manager: Direct to Owner Dashboard
    if (currentUser.role === 'owner') {
      setCurrentView('dashboard');
      return;
    }

    // 2. Chef / Baker: Direct to Kitchen Production Screen
    const isChef =
      currentUser.preferredView === 'kitchen' ||
      currentUser.department === 'baker' ||
      currentUser.department === 'pastry_chef' ||
      currentUser.department === 'bakery' ||
      currentUser.department === 'pastry' ||
      currentUser.department === 'kitchen' ||
      currentUser.department === 'مطبخ وإنتاج' ||
      currentUser.jobTitle?.includes('شيف') ||
      currentUser.jobTitle?.includes('مخبوزات') ||
      currentUser.jobTitle?.includes('خبز') ||
      currentUser.jobTitle?.includes('إنتاج');

    if (isChef) {
      setCurrentView('kitchen');
      return;
    }

    // 3. Cashier / Sales: Direct to POS Screen
    setCurrentView('pos');
  }, [
    currentUser?.id,
    currentUser?.role,
    currentUser?.department,
    currentUser?.jobTitle,
    currentUser?.preferredView,
    isLocked,
  ]);

  // Hook for Inactivity / Auto-Lock tracking (120s default, warning at 30s)
  // Protects screen if invoice is open (cart.length > 0)
  const {
    remainingSeconds,
    isWarningActive,
    isOpenCartProtected,
    resetTimer,
  } = useIdleTimer({
    currentUser,
    isLocked,
    hasOpenCart: cart.length > 0,
    securitySettings,
    onTimeout: autoLockTerminal,
  });

  // Check if current logged-in user needs mandatory password reset
  const isExpired = currentUser
    ? isPasswordExpired(currentUser.passwordUpdatedAt, securitySettings.passwordExpiryDays)
    : false;

  // If active user is not owner and view is dashboard, reset to kitchen or pos based on role
  const effectiveView: 'pos' | 'dashboard' | 'kitchen' =
    currentUser?.role === 'owner'
      ? currentView
      : currentView === 'dashboard'
      ? currentUser?.department === 'baker' ||
        currentUser?.department === 'pastry_chef' ||
        currentUser?.department === 'bakery'
        ? 'kitchen'
        : 'pos'
      : currentView;

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden flex flex-col selection:bg-[#D4AF37]/30 selection:text-[#FFF8E7] transition-colors duration-250 ${
        theme === 'light' ? 'bg-[#F8F5F0] text-[#1F1B16]' : 'bg-[#0A0A0A] text-[#E0D8D0]'
      }`}
    >
      {/* Auto-Lock Inactivity Warning Banner (warns 30s before locking) */}
      <AutoLockWarningBanner
        isVisible={isWarningActive}
        remainingSeconds={remainingSeconds}
        onStayActive={resetTimer}
        isOpenCartProtected={isOpenCartProtected}
      />

      {/* Cross-Tab Session Terminated Notice */}
      {sessionTerminatedNotice && !isLocked && (
        <div className="fixed top-20 right-4 left-4 z-40 max-w-2xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-amber-950/95 to-amber-900/95 border border-amber-500 text-amber-200 shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-200">تنبيه أمان الجلسة:</h4>
              <p className="text-[11px] text-amber-300/90">{sessionTerminatedNotice}</p>
            </div>
          </div>
          <button
            onClick={clearSessionTerminatedNotice}
            className="p-1.5 rounded-lg hover:bg-amber-900/50 text-amber-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Navigation */}
      <Header
        currentView={effectiveView}
        onViewChange={setCurrentView}
        onOpenAuth={() => {
          setAuthMode('login');
          setIsAuthOpen(true);
        }}
        onOpenRefundModal={() => setIsRefundOpen(true)}
      />

      {/* Main View Area with Smooth Transitions */}
      <main className="flex-1 pt-16 sm:pt-20 pb-12">
        <AnimatePresence mode="wait">
          {effectiveView === 'pos' && (
            <motion.div
              key="pos"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <POSScreen />
            </motion.div>
          )}

          {effectiveView === 'kitchen' && (
            <motion.div
              key="kitchen"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <KitchenProductionScreen />
            </motion.div>
          )}

          {effectiveView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <OwnerDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* PIN Keypad Lock Screen Overlay */}
      <AnimatePresence>
        {(isLocked || !currentUser) && !(isStandbyScreenOpen || lockedOutUser) && (
          <motion.div
            key="pin-lock-overlay"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50"
          >
            <PinLockScreen
              onOpenFullLogin={() => {
                setAuthMode('login');
                setIsAuthOpen(true);
              }}
              onOpenRegister={() => {
                setAuthMode('register');
                setIsAuthOpen(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Locked Out Standby Screen Overlay */}
      <AnimatePresence>
        {(isStandbyScreenOpen || !!lockedOutUser) && (
          <motion.div
            key="locked-out-screen-overlay"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50"
          >
            <LockedOutScreen
              onReturnToLogin={() => {
                clearLockedOutUser();
                setAuthMode('login');
                setIsAuthOpen(true);
              }}
              onOpenPinKeypad={() => {
                clearLockedOutUser();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth & Registration Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Staff Refund Request Modal */}
      <StaffRefundModal
        isOpen={isRefundOpen}
        onClose={() => setIsRefundOpen(false)}
      />

      {/* Mandatory Password Expiration Modal */}
      {currentUser && isExpired && (
        <PasswordExpiryModal
          isOpen={isExpired}
          username={currentUser.username}
          previousPasswords={currentUser.previousPasswords}
          currentPinOrPass={currentUser.password || currentUser.pin}
          onSuccess={(newPass) => {
            changeUserPassword(currentUser.id, newPass);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BakeryProvider>
      <BakeryApp />
    </BakeryProvider>
  );
}
