import React, { useState } from 'react';
import { SalonProvider, useSalon } from './context/SalonContext';
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
import { OffersScreen } from './components/customer/OffersScreen';
import { WriteReviewModal } from './components/customer/WriteReviewModal';
import { DirectionsModal } from './components/customer/DirectionsModal';
import { PartnerPortal } from './components/partner/PartnerPortal';
import { AdminApp } from './components/admin/AdminApp';

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
        <SalonDetailScreen
          onBack={() => setSelectedSalonForDetail(null)}
          onOpenReviewModal={() => setIsReviewModalOpen(true)}
          onOpenDirectionsModal={() => setIsDirectionsModalOpen(true)}
        />
      );
    }

    switch (customerTab) {
      case 'home':
        return <HomeScreen />;
      case 'explore':
        return <ExploreScreen />;
      case 'map':
        return <HomeScreen />;
      case 'favourites':
        return <FavouritesScreen />;
      case 'offers':
        return <OffersScreen />;
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

      {/* Fluid Responsive Main Content (No artificial phone bezel frame) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8 overflow-x-hidden">
        {portal === 'customer' ? (
          <div className="w-full">
            {renderCustomerContent()}
          </div>
        ) : portal === 'partner' ? (
          <PartnerPortal />
        ) : (
          <AdminApp />
        )}
      </main>

      {/* Mobile Navigation */}
      {portal === 'customer' && <BottomNav />}

      {/* Global Modals & Notifications */}
      <NotificationToast />
      <CompareModal />
      <WriteReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
      <DirectionsModal
        isOpen={isDirectionsModalOpen}
        onClose={() => setIsDirectionsModalOpen(false)}
      />
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
