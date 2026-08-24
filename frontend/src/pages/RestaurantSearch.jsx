import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  Map as MapIcon, 
  Grid, 
  Clock, 
  Star, 
  Users, 
  RefreshCw,
  X,
  Tag,
  Check,
  Percent,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { restaurantApi } from '../api';
import { useLocation, RADIUS_OPTIONS } from '../context/LocationContext';
import RestaurantCard from '../components/restaurant/RestaurantCard';
import RestaurantMap from '../components/map/RestaurantMap';

const CUISINES = [
  'ALL',
  'South Indian',
  'North Indian',
  'Pan-Asian',
  'Italian',
  'Mexican',
  'Japanese',
  'Cafe',
  'Fast Food',
  'Barbeque',
  'Vegetarian',
  'Seafood',
  'Desserts'
];

export default function RestaurantSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { coordinates, locationName, searchRadius, setSearchRadius } = useLocation();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'grid', 'map'
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCuisine, setSelectedCuisine] = useState(searchParams.get('cuisine') || 'ALL');
  const [minRating, setMinRating] = useState(0);
  const [maxWaitTime, setMaxWaitTime] = useState('');
  const [priceFilter, setPriceFilter] = useState('ALL'); // 'ALL', '₹', '₹₹', '₹₹₹'
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyOffers, setOnlyOffers] = useState(searchParams.get('filter') === 'offers');
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended', 'distance', 'rating', 'price_low', 'price_high'
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await restaurantApi.getNearby({
        lat: coordinates.lat,
        lng: coordinates.lng,
        radiusKm: searchRadius,
        search,
        cuisine: selectedCuisine,
        minRating: minRating > 0 ? minRating : undefined,
        maxWaitTime: maxWaitTime || undefined,
        sortBy: sortBy === 'recommended' ? 'distance' : sortBy
      });

      let data = res.data || [];

      // Filter by availability
      if (onlyAvailable) {
        data = data.filter(r => (r.availableTablesCount || 0) > 0);
      }

      // Filter by Price tier
      if (priceFilter !== 'ALL') {
        data = data.filter(r => r.price_range === priceFilter);
      }

      // Sort calculation
      if (sortBy === 'recommended') {
        data.sort((a, b) => {
          const scoreA = (a.rating * 2) + ((a.availableTablesCount || 0) > 0 ? 3 : 0) - ((a.distanceKm || 1) * 0.5);
          const scoreB = (b.rating * 2) + ((b.availableTablesCount || 0) > 0 ? 3 : 0) - ((b.distanceKm || 1) * 0.5);
          return scoreB - scoreA;
        });
      } else if (sortBy === 'price_low') {
        data.sort((a, b) => (a.price_range?.length || 2) - (b.price_range?.length || 2));
      } else if (sortBy === 'price_high') {
        data.sort((a, b) => (b.price_range?.length || 2) - (a.price_range?.length || 2));
      }

      setRestaurants(data);
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [coordinates, selectedCuisine, minRating, maxWaitTime, priceFilter, onlyAvailable, onlyOffers, sortBy, searchRadius]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#0B0F19]">
      
      {/* Top Search & Controls Bar (Dark Theme Bar) */}
      <div className="bg-[#161F30] p-4 rounded-3xl border border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by restaurant name, cuisine, or food item..."
            className="w-full bg-[#0F172A] border border-gray-700 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm font-medium text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
          />
        </form>

        {/* View Toggle & Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-300">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="recommended" className="bg-[#0F172A] text-white">Recommended</option>
              <option value="distance" className="bg-[#0F172A] text-white">Nearest Distance</option>
              <option value="rating" className="bg-[#0F172A] text-white">Highest Rated</option>
              <option value="price_low" className="bg-[#0F172A] text-white">Price: Low to High</option>
              <option value="price_high" className="bg-[#0F172A] text-white">Price: High to Low</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-[#0F172A] border border-gray-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'split' ? 'bg-[#FF6A00] text-white shadow-xs' : 'text-gray-400 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-[#FF6A00] text-white shadow-xs' : 'text-gray-400 hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'map' ? 'bg-[#FF6A00] text-white shadow-xs' : 'text-gray-400 hover:text-white'
              }`}
            >
              Map
            </button>
          </div>

          {/* Mobile Filter Trigger Button */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-[#0F172A] border border-gray-700 text-gray-200 font-bold text-xs flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#FF6A00]" />
            <span>Filters</span>
          </button>
        </div>

      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Filter Sidebar (Desktop) */}
        <aside className="hidden lg:block bg-[#161F30] p-5 rounded-3xl border border-gray-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-[#FF6A00]" />
              Filters
            </span>
            <button
              onClick={() => {
                setSelectedCuisine('ALL');
                setMinRating(0);
                setPriceFilter('ALL');
                setOnlyAvailable(false);
                setOnlyOffers(false);
                setSearchRadius(5);
              }}
              className="text-xs text-[#FF6A00] hover:underline font-semibold"
            >
              Reset All
            </button>
          </div>

          {/* 1. Distance Radius */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300">Distance Radius</label>
            <div className="grid grid-cols-4 gap-1">
              {RADIUS_OPTIONS.map((km) => (
                <button
                  key={km}
                  onClick={() => setSearchRadius(km)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    searchRadius === km
                      ? 'bg-[#FF6A00] text-white border-[#FF6A00]'
                      : 'bg-[#0F172A] text-gray-300 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  {km}km
                </button>
              ))}
            </div>
          </div>

          {/* 2. Cuisines */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300">Cuisine</label>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCuisine(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    selectedCuisine === c
                      ? 'bg-[#FF6A00] text-white border-[#FF6A00]'
                      : 'bg-[#0F172A] text-gray-300 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Rating */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300">Minimum Rating</label>
            <div className="grid grid-cols-4 gap-1">
              {[0, 3.5, 4.0, 4.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setMinRating(rate)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                    minRating === rate
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-[#0F172A] text-gray-300 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  {rate === 0 ? 'Any' : `${rate}★`}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Quick Toggles */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-300">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 accent-[#FF6A00] rounded"
              />
              <span>Tables Available Right Now</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-300">
              <input
                type="checkbox"
                checked={onlyOffers}
                onChange={(e) => setOnlyOffers(e.target.checked)}
                className="w-4 h-4 accent-[#FF6A00] rounded"
              />
              <span>Discounts & Offers Only</span>
            </label>
          </div>
        </aside>

        {/* Right Content Area: Split View / Grid / Map */}
        <main className={`lg:col-span-3 space-y-6 ${viewMode === 'map' ? 'h-[650px]' : ''}`}>
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">
              Showing <strong className="text-white">{restaurants.length}</strong> restaurants near {locationName}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-[#161F30] rounded-3xl h-80 animate-pulse border border-gray-800" />
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="bg-[#161F30] rounded-3xl p-12 text-center text-gray-400 border border-gray-800">
              <Search className="w-10 h-10 mx-auto mb-3 text-gray-500" />
              <h3 className="text-base font-bold text-white">No restaurants match your filters</h3>
              <p className="text-xs text-gray-400 mt-1">Try expanding the search radius or resetting cuisine filters.</p>
            </div>
          ) : viewMode === 'map' ? (
            <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-gray-800 shadow-sm">
              <RestaurantMap
                restaurants={restaurants}
                selectedRestaurantId={selectedRestaurantId}
                onSelectRestaurant={setSelectedRestaurantId}
              />
            </div>
          ) : viewMode === 'split' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                {restaurants.map(r => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
              <div className="h-[750px] rounded-2xl overflow-hidden border border-gray-800 shadow-sm sticky top-24 hidden xl:block">
                <RestaurantMap
                  restaurants={restaurants}
                  selectedRestaurantId={selectedRestaurantId}
                  onSelectRestaurant={setSelectedRestaurantId}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {restaurants.map(r => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          )}

        </main>

      </div>

    </div>
  );
}
