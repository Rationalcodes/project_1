import React, { useState, Suspense, lazy } from 'react';
import { SalonProvider, useSalon } from './context/SalonContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { NotificationToast } from './components/common/NotificationToast';
import { HomeScreen } from './components/customer/HomeScreen';

// Code-split heavy portals, secondary screens and modals (Phase 4 Optimization)
const PartnerPortal = lazy(() =>
  import('./components/partner/PartnerPortal').then((m) => ({ default: m.PartnerPortal })),
);
const AdminApp = lazy(() =>
  import('./components/admin/AdminApp').then((m) => ({ default: m.AdminApp })),
);
const ExploreScreen = lazy(() =>
  import('./components/customer/ExploreScreen').then((m) => ({ default: m.ExploreScreen })),
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
const CompareModal = lazy(() =>
  import('./components/common/CompareModal').then((m) => ({ default: m.CompareModal })),
);
const WriteReviewModal = lazy(() =>
  import('./components/customer/WriteReviewModal').then((m) => ({ default: m.WriteReviewModal })),
);
const DirectionsModal = lazy(() =>
  import('./components/customer/DirectionsModal').then((m) => ({ default: m.DirectionsModal })),
);

const ScreenFallback = () => (
  <div className="flex items-center justify-center min-h-[300px] w-full py-12">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-stone-500 font-medium">Loading view...</span>
    </div>
  </div>
);

const MainContent: React.FC = () => {
  const {
    portal,
    customerTab,
    selectedSalonForDetail,
    setSelectedSalonForDetail,
    genderFilter,
  } = useSalon();

  const isWomen = genderFilter === 'women';

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDirectionsModalOpen, setIsDirectionsModalOpen] = useState(false);

  // Render Customer Screen based on current navigation or selected salon detail
  const renderCustomerContent = () => {
    if (selectedSalonForDetail) {
      return (
        <Suspense fallback={<ScreenFallback />}>
          <SalonDetailScreen
            onBack={() => setSelectedSalonForDetail(null)}
            onOpenReviewModal={() => setIsReviewModalOpen(true)}
            onOpenDirectionsModal={() => setIsDirectionsModalOpen(true)}
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
        return <HomeScreen />;
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
      {/* Universal Responsive Header */}
      <Header />

      {/* Fluid Responsive Main Content (No artificial phone bezel frame) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8 overflow-x-hidden">
        {portal === 'customer' ? (
          <div className="w-full">{renderCustomerContent()}</div>
        ) : portal === 'partner' ? (
          <Suspense fallback={<ScreenFallback />}>
            <PartnerPortal />
          </Suspense>
        ) : (
          <Suspense fallback={<ScreenFallback />}>
            <AdminApp />
          </Suspense>
        )}
      </main>

      {/* Mobile Navigation */}
      {portal === 'customer' && <BottomNav />}

      {/* Global Modals & Notifications */}
      <NotificationToast />

      <Suspense fallback={null}>
        <CompareModal />
        <WriteReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
        />
        <DirectionsModal
          isOpen={isDirectionsModalOpen}
          onClose={() => setIsDirectionsModalOpen(false)}
        />
      </Suspense>
    </div>
  );
};

export function App() {
  return (
    <SalonProvider>
      <MainContent />
    </SalonProvider>
  );
}

export default App;
