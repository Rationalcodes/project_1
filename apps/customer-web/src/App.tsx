import React, { useState, Suspense, lazy } from 'react';
import { CustomerProvider, useCustomer } from './context/CustomerContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { NotificationToast } from './components/common/NotificationToast';
import { HomeScreen } from './components/customer/HomeScreen';
import { OnboardingScreen } from './components/customer/OnboardingScreen';
import { LocationPermissionBanner } from './components/common/LocationPermissionBanner';

// Code-split secondary screens & heavy modals (Phase 4 Optimization)
const ExploreScreen = lazy(() =>
  import('./components/customer/ExploreScreen').then((m) => ({ default: m.ExploreScreen })),
);
const MapScreen = lazy(() =>
  import('./components/customer/MapScreen').then((m) => ({ default: m.MapScreen })),
);
const SalonDetailScreen = lazy(() =>
  import('./components/customer/SalonDetailScreen').then((m) => ({ default: m.SalonDetailScreen })),
);
const FavouritesScreen = lazy(() =>
  import('./components/customer/FavouritesScreen').then((m) => ({ default: m.FavouritesScreen })),
);
const ProfileScreen = lazy(() =>
  import('./components/customer/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
);
const OffersScreen = lazy(() =>
  import('./components/customer/OffersScreen').then((m) => ({ default: m.OffersScreen })),
);
const ExpressWalkinScreen = lazy(() =>
  import('./components/customer/ExpressWalkinScreen').then((m) => ({ default: m.ExpressWalkinScreen })),
);
const CompareModal = lazy(() =>
  import('./components/common/CompareModal').then((m) => ({ default: m.CompareModal })),
);
const WriteReviewModal = lazy(() =>
  import('./components/customer/WriteReviewModal').then((m) => ({ default: m.WriteReviewModal })),
);

const ScreenFallback = () => (
  <div className="flex items-center justify-center min-h-[300px] w-full py-12">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-stone-500 font-medium">Loading view...</span>
    </div>
  </div>
);

const CustomerMainContent: React.FC = () => {
  const {
    customerTab,
    selectedSalonForDetail,
    setSelectedSalonForDetail,
    genderFilter,
    isExpressWalkin,
    setIsExpressWalkin,
    showOnboarding,
    completeOnboarding,
  } = useCustomer();

  const isWomen = genderFilter === 'women';

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const renderContent = () => {
    // If opened via Express Walk-in Link or QR Code (?salon=...&walkin=true)
    if (isExpressWalkin) {
      return (
        <Suspense fallback={<ScreenFallback />}>
          <ExpressWalkinScreen
            salon={selectedSalonForDetail}
            onDismiss={() => setIsExpressWalkin(false)}
            onViewSalonDetails={() => setIsExpressWalkin(false)}
          />
        </Suspense>
      );
    }

    if (selectedSalonForDetail) {
      return (
        <Suspense fallback={<ScreenFallback />}>
          <SalonDetailScreen
            onBack={() => setSelectedSalonForDetail(null)}
            onOpenReviewModal={() => setIsReviewModalOpen(true)}
            onOpenDirectionsModal={() => {}}
          />
        </Suspense>
      );
    }

    switch (customerTab) {
      case 'home':
        return <HomeScreen />;
      case 'explore':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <ExploreScreen />
          </Suspense>
        );
      case 'map':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <MapScreen />
          </Suspense>
        );
      case 'favourites':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <FavouritesScreen />
          </Suspense>
        );
      case 'offers':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <OffersScreen />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<ScreenFallback />}>
            <ProfileScreen />
          </Suspense>
        );
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans w-full max-w-full overflow-x-hidden transition-colors duration-300 ${
        isWomen
          ? 'bg-[#FFF8F5] text-stone-900 selection:bg-rose-500/20 selection:text-rose-950'
          : 'bg-[#FAF7F2] text-stone-900 selection:bg-orange-500/20 selection:text-orange-950'
      }`}
    >
      {/* Interactive Mobile Onboarding Experience (Matching Reference) */}
      {showOnboarding && (
        <OnboardingScreen
          onFinish={completeOnboarding}
          isWomen={isWomen}
        />
      )}

      {/* Universal Responsive Header */}
      <Header />

      {/* Mandatory Precise Browser Geolocation Banner */}
      <LocationPermissionBanner />

      {/* Fluid Responsive Main Content (No artificial phone bezel frame) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="w-full">{renderContent()}</div>
      </main>

      {/* Mobile Navigation */}
      <BottomNav />

      {/* Global Modals & Notifications */}
      <NotificationToast />

      <Suspense fallback={null}>
        <CompareModal />
        <WriteReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
        />
      </Suspense>
    </div>
  );
};

export function App() {
  return (
    <CustomerProvider>
      <CustomerMainContent />
    </CustomerProvider>
  );
}

export default App;
