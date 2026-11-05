import React, { useState } from 'react';
import { CustomerProvider, useCustomer } from './context/CustomerContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { NotificationToast } from './components/common/NotificationToast';
import { CompareModal } from './components/common/CompareModal';
import { HomeScreen } from './components/customer/HomeScreen';
import { ExploreScreen } from './components/customer/ExploreScreen';
import { MapScreen } from './components/customer/MapScreen';
import { SalonDetailScreen } from './components/customer/SalonDetailScreen';
import { FavouritesScreen } from './components/customer/FavouritesScreen';
import { ProfileScreen } from './components/customer/ProfileScreen';
import { WriteReviewModal } from './components/customer/WriteReviewModal';
import { LocationPermissionBanner } from './components/common/LocationPermissionBanner';
import { ExpressWalkinScreen } from './components/customer/ExpressWalkinScreen';

const CustomerMainContent: React.FC = () => {
  const {
    customerTab,
    selectedSalonForDetail,
    setSelectedSalonForDetail,
    genderFilter,
    isExpressWalkin,
    setIsExpressWalkin,
  } = useCustomer();

  const isWomen = genderFilter === 'women';

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const renderContent = () => {
    // If opened via Express Walk-in Link or QR Code (?salon=...&walkin=true)
    if (isExpressWalkin) {
      return (
        <ExpressWalkinScreen
          salon={selectedSalonForDetail}
          onDismiss={() => setIsExpressWalkin(false)}
          onViewSalonDetails={() => setIsExpressWalkin(false)}
        />
      );
    }

    if (selectedSalonForDetail) {
      return (
        <SalonDetailScreen
          onBack={() => setSelectedSalonForDetail(null)}
          onOpenReviewModal={() => setIsReviewModalOpen(true)}
          onOpenDirectionsModal={() => {}}
        />
      );
    }

    switch (customerTab) {
      case 'home':
        return <HomeScreen />;
      case 'explore':
        return <ExploreScreen />;
      case 'map':
        return <MapScreen />;
      case 'favourites':
        return <FavouritesScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans w-full max-w-full overflow-x-hidden transition-colors duration-300 ${
      isWomen
        ? 'bg-[#FFF8F5] text-stone-900 selection:bg-rose-500/20 selection:text-rose-950'
        : 'bg-[#FAF7F2] text-stone-900 selection:bg-orange-500/20 selection:text-orange-950'
    }`}>
      {/* Universal Responsive Header */}
      <Header />

      {/* Fluid Responsive Main Content (Mobile-first, No artificial phone bezel frame) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <LocationPermissionBanner />
        {renderContent()}
      </main>

      {/* Bottom Nav for Mobile Screens (< md breakpoint) */}
      <BottomNav />

      {/* Floating System Modals */}
      <NotificationToast />
      <CompareModal />
      <WriteReviewModal
        isOpen={isReviewModalOpen}
        salon={selectedSalonForDetail}
        onClose={() => setIsReviewModalOpen(false)}
      />
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
