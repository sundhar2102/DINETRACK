import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../../api';
import { GitBranch, MapPin, Check, Plus, ExternalLink } from 'lucide-react';

export default function MultiOutletSwitcher({ currentRestaurantId, onSelectOutlet }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await restaurantApi.getNearby({ lat: 13.0604, lng: 80.2437, radiusKm: 50 });
        setRestaurants(res.data || []);
      } catch (err) {
        console.error('Failed to load outlets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-orange-400" />
          <span>Multi-Outlet & Branch Franchise Management</span>
        </h2>
        <p className="text-xs text-gray-400">Switch active restaurant branch context, manage menus across outlets, and compare location performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map((r) => {
          const isCurrent = r.id === currentRestaurantId;
          return (
            <div
              key={r.id}
              onClick={() => onSelectOutlet(r.id)}
              className={`glass-card rounded-3xl p-6 border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                isCurrent
                  ? 'border-orange-500 bg-orange-950/20 shadow-glow'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isCurrent
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {isCurrent ? 'Active Outlet' : 'Branch'}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">Rating: {r.rating} ⭐</span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-white">{r.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>{r.address_line1 || r.cuisine}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                <span className="text-gray-400">Est. Wait: ~{r.estimatedWaitTime || 15}m</span>
                <span className={`font-bold ${isCurrent ? 'text-orange-400' : 'text-gray-400'}`}>
                  {isCurrent ? 'Viewing Console ✓' : 'Switch Context →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
