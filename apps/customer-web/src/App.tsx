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

const CustomerMainContent: React.FC = () => {
  const {
    customerTab,
    selectedSalonForDetail,
    setSelectedSalonForDetail,
  } = useCustomer();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const renderContent = () => {
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
    <div className="min-h-screen bg-[#09090c] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300">
      {/* Universal Responsive Header */}
      <Header />

      {/* Fluid Responsive Main Content (No artificial phone bezel frame) */}
      <main className="flex-1 w-full px-3 py-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
