import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { restaurantApi } from '../api';
import RestaurantCard from '../components/restaurant/RestaurantCard';

export default function Favorites() {
  const { favorites } = useFavorites();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchFavoriteRestaurants = async () => {
      setLoading(true);
      try {
        const res = await restaurantApi.getNearby({});
        const all = res.data || [];
        const favList = all.filter(r => favorites.some(f => (typeof f === 'string' ? f === r.id : f.id === r.id)));
        setRestaurants(favList);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteRestaurants();
  }, [favorites]);

  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#0B0F19] pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-950/60 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Your Saved Favorites</h1>
              <p className="text-xs text-gray-400">Quickly re-book your go-to dining spots and check live availability</p>
            </div>
          </div>
        </div>

        {restaurants.length > 0 && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search within favorites..."
              className="w-full bg-[#161F30] border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#161F30] rounded-3xl h-80 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="bg-[#161F30] rounded-3xl p-12 text-center text-gray-400 border border-gray-800 max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-950/60 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Favorite Restaurants Yet</h3>
            <p className="text-xs text-gray-400 mt-1">
              Tap the heart icon on any restaurant card to save your favorite spots here for instant table reservations.
            </p>
          </div>
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-sm transition-all"
          >
            <span>Explore Restaurants</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#161F30] rounded-3xl p-12 text-center text-gray-400 border border-gray-800">
          <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 text-gray-500" />
          <h4 className="text-sm font-bold text-white">No matching favorites</h4>
          <p className="text-xs text-gray-400 mt-1">Try another search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}

    </div>
  );
}
