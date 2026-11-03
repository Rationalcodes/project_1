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
import { DirectionsModal } from './components/customer/DirectionsModal';
import { Smartphone, Wifi, Battery, Signal } from 'lucide-react';

const CustomerMainContent: React.FC = () => {
  const {
    customerTab,
    selectedSalonForDetail,
    setSelectedSalonForDetail,
    deviceViewMode,
  } = useCustomer();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDirectionsModalOpen, setIsDirectionsModalOpen] = useState(false);

  const renderContent = () => {
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
      <Header />

      <main className="flex-1 w-full px-3 py-4 sm:px-6 max-w-7xl mx-auto">
        {deviceViewMode === 'mobile-frame' ? (
          <div className="flex flex-col items-center justify-center py-2 sm:py-6">
            <div className="w-full max-w-[420px] bg-[#0c0c11] border-[5px] border-zinc-800 rounded-[44px] shadow-2xl overflow-hidden relative min-h-[780px] flex flex-col ring-1 ring-zinc-700/50">
              {/* Mobile Top Status Bar */}
              <div className="pt-3 px-6 pb-2 flex items-center justify-between text-[11px] text-zinc-400 font-semibold select-none bg-[#0c0c11] z-20">
                <span>9:41</span>
                <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-zinc-800" />
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Mobile Content Scroll View */}
              <div className="flex-1 overflow-y-auto px-4 pt-2 pb-16 no-scrollbar">
                {renderContent()}
              </div>

              {/* Fixed Bottom Home Indicator & Nav */}
              <div className="relative">
                <BottomNav />
                <div className="w-32 h-1 bg-zinc-600 rounded-full mx-auto my-1.5 opacity-60" />
              </div>
            </div>

            <div className="mt-3 text-center text-xs text-zinc-400 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Customer Mobile Discovery View • Switch to desktop responsive via top right button</span>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto pb-24">
            {renderContent()}
            <BottomNav />
          </div>
        )}
      </main>

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
    <CustomerProvider>
      <CustomerMainContent />
    </CustomerProvider>
  );
}

export default App;
