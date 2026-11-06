import React from 'react';
import { Tag } from 'lucide-react';
import { useSalon } from '../../context/SalonContext';

export const OffersScreen: React.FC = () => {
  const { genderFilter, setCustomerTab } = useSalon();
  const isWomen = genderFilter === 'women';

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-5 pb-24 text-center">
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
          isWomen ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'
        }`}
      >
        <Tag className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-black text-stone-900">Offers</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">
        No offers just yet. When salons share a deal, you’ll find it here.
      </p>
      <button
        type="button"
        onClick={() => setCustomerTab('explore')}
        className={`mt-5 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors ${
          isWomen ? 'bg-rose-600 hover:bg-rose-700' : 'bg-orange-600 hover:bg-orange-700'
        }`}
      >
        Explore salons
      </button>
    </div>
  );
};
