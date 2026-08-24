import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Users, Heart, ArrowRight, Tag, Utensils, CheckCircle2, AlertCircle, BellRing } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';
import JoinWaitlistModal from './JoinWaitlistModal';

export default function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(restaurant.id);

  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  const waitMins = restaurant.estimatedWaitTime ?? 25;
  const tablesLeft = restaurant.availableTablesCount ?? 0;
  const totalTables = restaurant.totalTablesCount ?? 10;
  const crowd = restaurant.crowdLevel || 'LOW';

  const handleHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(restaurant);
  };

  return (
    <>
      <div className="overflow-hidden flex flex-col group relative bg-[#161F30] border border-gray-800 hover:border-gray-700 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200">
        
        {/* 1. Cover Image & Live Badges */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gray-900">
          <img
            src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          />
          
          {/* Top Left Badge: Offer Tag */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-[#C81E1E] text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md">
              <Tag className="w-3 h-3" />
              <span>20% OFF</span>
            </span>
          </div>

          {/* Top Right: Favorite Button */}
          <div className="absolute top-3 right-3">
            <button
              onClick={handleHeartClick}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md text-gray-300 hover:text-rose-500 hover:scale-110 shadow-sm transition-all"
              title={favorited ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500 text-rose-500' : 'text-gray-300'}`} />
            </button>
          </div>

          {/* Bottom Live Available Tables Floating Badge directly on Image */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
            <span className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-white">
              <MapPin className="w-3 h-3 text-[#C81E1E]" />
              {restaurant.distanceKm !== undefined ? `${restaurant.distanceKm} km away` : restaurant.location?.city || 'Chennai'}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold backdrop-blur-md shadow-md ${
              tablesLeft > 0 
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
                : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${tablesLeft > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{tablesLeft > 0 ? `${tablesLeft} Tables Available Live` : '🔴 Tables Full • Live Queue'}</span>
            </span>
          </div>
        </div>

        {/* 2. Card Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
          
          <div>
            {/* Rating & Cuisine Row */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-xs">
                <Star className="w-3 h-3 fill-white" />
                <span>{restaurant.rating}</span>
              </span>

              <span className="text-xs text-gray-400 font-semibold truncate">
                {restaurant.cuisine_types || restaurant.cuisine || 'Multi-Cuisine'} • {restaurant.price_range || '₹₹'}
              </span>
            </div>

            {/* Restaurant Title */}
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#C81E1E] transition-colors leading-tight mt-2">
              {restaurant.name}
            </h3>

            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
              {restaurant.location?.address1 || restaurant.address || 'Nungambakkam'}, {restaurant.location?.city || restaurant.city || 'Chennai'}
            </p>
          </div>

          {/* Live Table Availability & Wait Pill Box */}
          <div className="p-2.5 rounded-2xl bg-[#0F172A] border border-gray-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold">
              <span className={`w-2.5 h-2.5 rounded-full ${tablesLeft > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className={tablesLeft > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {tablesLeft > 0 ? `${tablesLeft} Tables Available Live` : 'Tables Full • Join Queue'}
              </span>
            </div>

            <span className="text-gray-400 font-medium flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3 text-gray-500" />
              {tablesLeft > 0 ? '~0m Instant Seating' : `~${waitMins}m wait`}
            </span>
          </div>

          {/* Dual Actions: View Details & (Book Table OR Tables Full Waitlist) */}
          <div className="pt-1 flex items-center gap-2">
            <Link
              to={`/restaurant/${restaurant.id}`}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-gray-200 font-bold text-xs flex items-center justify-center transition-colors border border-gray-700"
            >
              <span>View Details</span>
            </Link>

            {tablesLeft > 0 ? (
              <Link
                to={`/restaurant/${restaurant.id}/reserve`}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#C81E1E] hover:bg-[#A11414] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                <span>Book Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                onClick={() => setIsWaitlistModalOpen(true)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-[#C81E1E] hover:from-amber-500 hover:to-[#A11414] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md transition-all"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Wait For Table</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Tables Full Live Waitlist Modal */}
      <JoinWaitlistModal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        restaurant={restaurant}
      />
    </>
  );
}
