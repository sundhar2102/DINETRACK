import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  Sparkles, 
  CalendarCheck, 
  ShoppingBag, 
  ArrowLeft, 
  UtensilsCrossed, 
  MessageSquare,
  Compass,
  AlertCircle,
  Heart,
  Share2,
  Navigation,
  Tag,
  CheckCircle2,
  Calendar,
  Ticket
} from 'lucide-react';
import { restaurantApi, reviewApi, eventsApi, offersApi } from '../api';
import { useLocation } from '../context/LocationContext';
import { useSocket } from '../context/SocketContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import TableGrid from '../components/restaurant/TableGrid';
import MenuSection from '../components/restaurant/MenuSection';

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { coordinates } = useLocation();
  const { socket, joinRestaurantRoom, leaveRestaurantRoom } = useSocket();
  const { totalItemsCount, setIsDrawerOpen } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tables'); // 'tables', 'menu', 'offers', 'events', 'reviews'
  const [selectedPartySize, setSelectedPartySize] = useState(2);
  const [waitInfo, setWaitInfo] = useState(null);
  const [events, setEvents] = useState([]);
  const [offers, setOffers] = useState([]);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchRestaurantData = async () => {
    try {
      const [res, evRes, offRes] = await Promise.all([
        restaurantApi.getById(id, coordinates.lat, coordinates.lng),
        eventsApi.getUpcoming(id).catch(() => ({ data: [] })),
        offersApi.getActive(id).catch(() => ({ data: [] }))
      ]);
      setRestaurant(res.data);
      setWaitInfo(res.data.waitInfo);
      setEvents(evRes.data || []);
      setOffers(offRes.data || []);
    } catch (err) {
      console.error('Failed to fetch restaurant:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantData();
    joinRestaurantRoom(id);

    return () => {
      leaveRestaurantRoom(id);
    };
  }, [id, coordinates]);

  // Real-time table updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleTableStatusChanged = (updatedTable) => {
      setRestaurant(prev => {
        if (!prev) return prev;
        const updatedTables = prev.tables.map(t => t.id === updatedTable.id ? updatedTable : t);
        return { ...prev, tables: updatedTables };
      });
    };

    const handleWaitTimeUpdated = (newWaitData) => {
      setWaitInfo(newWaitData);
    };

    socket.on('table_status_changed', handleTableStatusChanged);
    socket.on('wait_time_updated', handleWaitTimeUpdated);

    return () => {
      socket.off('table_status_changed', handleTableStatusChanged);
      socket.off('wait_time_updated', handleWaitTimeUpdated);
    };
  }, [socket]);

  const handlePartySizeChange = async (size) => {
    setSelectedPartySize(size);
    try {
      const res = await restaurantApi.getWaitTime(id, size);
      setWaitInfo(res.data);
    } catch (e) {
      console.error('Failed to update wait time:', e);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    try {
      await reviewApi.create({
        restaurantId: id,
        rating: newRating,
        comment: newComment.trim()
      });
      setNewComment('');
      fetchRestaurantData();
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-[#161F30] rounded-3xl h-96 animate-pulse border border-gray-800" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-rose-500" />
        <h2 className="text-xl font-bold text-white">Restaurant Not Found</h2>
        <Link to="/restaurants" className="mt-4 inline-block text-[#FF6A00] font-bold text-sm hover:underline">
          Return to restaurants
        </Link>
      </div>
    );
  }

  const favorited = isFavorite(restaurant.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 bg-[#0B0F19]">
      
      {/* 1. Header Card (Dark Theme Layout) */}
      <div className="bg-[#161F30] rounded-3xl border border-gray-800 shadow-xl overflow-hidden">
        
        {/* Cover Photo */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-900">
          <img
            src={restaurant.cover_image_url || restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 shadow-sm flex items-center gap-1.5 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Bottom Title on Image */}
          <div className="absolute bottom-4 left-4 sm:left-8 right-4 sm:right-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#FF6A00] text-white text-xs font-bold px-2.5 py-0.5 rounded-md">
                  {restaurant.cuisine}
                </span>
                <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-0.5 rounded-md">
                  {restaurant.price_range || '₹₹'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{restaurant.name}</h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-xl shadow-md">
                <Star className="w-4 h-4 fill-white" />
                <span>{restaurant.rating}</span>
                <span className="text-xs text-emerald-100 font-normal">({restaurant.rating_count} reviews)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Metadata & Actions Bar */}
        <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#161F30] border-t border-gray-800">
          
          <div className="space-y-2 text-xs sm:text-sm text-gray-300">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-gray-200 font-medium">
                <MapPin className="w-4 h-4 text-[#FF6A00]" />
                {restaurant.location?.address1}, {restaurant.location?.city}
              </span>
              <span className="flex items-center gap-1.5 text-gray-200 font-medium">
                <Clock className="w-4 h-4 text-blue-400" />
                {restaurant.opening_time} - {restaurant.closing_time}
              </span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">
              {restaurant.description || 'Experience authentic gourmet cuisine prepared with fresh local ingredients in a premium dining ambiance.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => toggleFavorite(restaurant)}
              className={`p-3 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                favorited 
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/40' 
                  : 'bg-[#1E293B] text-gray-300 border-gray-700 hover:bg-[#334155]'
              }`}
              title="Save to Favorites"
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden sm:inline">{favorited ? 'Saved' : 'Favorite'}</span>
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.location?.latitude || '13.0827'},${restaurant.location?.longitude || '80.2707'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-gray-200 border border-gray-700 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="Get Directions"
            >
              <Navigation className="w-4 h-4 text-[#FF6A00]" />
              <span className="hidden sm:inline">Directions</span>
            </a>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: restaurant.name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="p-3 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-gray-200 border border-gray-700 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <Link
              to={`/restaurant/${restaurant.id}/reserve`}
              className="py-3 px-6 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Reserve Table</span>
            </Link>
          </div>

        </div>

      </div>

      {/* 2. AI Wait-Time & Seating Status Card */}
      <div className="bg-orange-950/30 border border-orange-500/30 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Real-Time Table Seating & Wait-Time Engine
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white">
              ~{waitInfo?.estimatedWaitTime ?? 10} Mins
            </span>
            <span className="text-xs text-gray-400 font-medium">
              (Estimated wait window: {waitInfo?.minimumWaitTime ?? 5}-{waitInfo?.maximumWaitTime ?? 15} mins)
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Calculated dynamically based on real-time occupied table turnover and party fit.
          </p>
        </div>

        {/* Party Size Selector */}
        <div className="flex items-center gap-2 bg-[#161F30] p-2 rounded-2xl border border-gray-700 shrink-0">
          <span className="text-xs font-bold text-gray-300 px-1">Party:</span>
          {[1, 2, 4, 6, 8].map(size => (
            <button
              key={size}
              onClick={() => handlePartySizeChange(size)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                selectedPartySize === size
                  ? 'bg-[#FF6A00] text-white shadow-xs'
                  : 'bg-[#0F172A] text-gray-400 hover:text-white'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="bg-[#161F30] p-1.5 rounded-2xl border border-gray-800 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { key: 'tables', label: 'Live Tables & Floor Plan', icon: Users },
          { key: 'menu', label: 'Digital Menu & Pre-Order', icon: UtensilsCrossed },
          { key: 'offers', label: 'Promotions & Deals', icon: Tag },
          { key: 'events', label: 'Dining Events', icon: Calendar },
          { key: 'reviews', label: 'Customer Reviews', icon: MessageSquare }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-[#FF6A00] text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Body Content */}
      <div className="space-y-6">
        
        {/* Tab: Tables */}
        {activeTab === 'tables' && (
          <div className="bg-[#161F30] p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Live Table Seating Matrix</h3>
                <p className="text-xs text-gray-400 mt-0.5">Real-time status updated live via restaurant host desk</p>
              </div>
              <Link
                to={`/restaurant/${restaurant.id}/reserve`}
                className="py-2.5 px-5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Book This Table</span>
                <CalendarCheck className="w-3.5 h-3.5" />
              </Link>
            </div>

            <TableGrid tables={restaurant.tables} selectedPartySize={selectedPartySize} />
          </div>
        )}

        {/* Tab: Menu */}
        {activeTab === 'menu' && (
          <div className="bg-[#161F30] p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-sm">
            <MenuSection 
              menu={restaurant.menu || restaurant.menuCategories || []} 
              categories={restaurant.menuCategories || restaurant.menu || []}
              items={restaurant.menuItems || restaurant.items || []}
              restaurantId={restaurant.id} 
              restaurant={restaurant} 
            />
          </div>
        )}


        {/* Tab: Offers */}
        {activeTab === 'offers' && (
          <div className="bg-[#161F30] p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-white">Available Dining Promotions</h3>
            {offers.length === 0 ? (
              <p className="text-xs text-gray-400">No active offers available for this restaurant right now.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offers.map(off => (
                  <div key={off.id} className="p-4 rounded-2xl border border-orange-500/30 bg-orange-950/30 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xl font-black text-[#FF6A00]">{off.discount_value}% OFF</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{off.description}</h4>
                      <p className="text-[11px] text-gray-400 font-mono mt-1">Code: <strong>{off.code}</strong></p>
                    </div>
                    <Link
                      to={`/restaurant/${restaurant.id}/reserve`}
                      className="py-2 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-xs shrink-0"
                    >
                      Apply
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Events */}
        {activeTab === 'events' && (
          <div className="bg-[#161F30] p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-white">Upcoming Dining Events</h3>
            {events.length === 0 ? (
              <p className="text-xs text-gray-400">No upcoming events scheduled at this restaurant.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map(ev => (
                  <div key={ev.id} className="rounded-2xl border border-gray-800 overflow-hidden bg-[#0F172A] shadow-xs">
                    <img src={ev.banner_url} alt={ev.title} className="h-40 w-full object-cover" />
                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-bold text-white">{ev.title}</h4>
                      <p className="text-xs text-gray-400">{ev.description}</p>
                      <div className="pt-2 flex items-center justify-between text-xs text-gray-300">
                        <span>{ev.event_date} • {ev.event_time}</span>
                        <span className="font-bold text-[#FF6A00]">{Number(ev.ticket_price) > 0 ? `₹${ev.ticket_price}` : 'Free Entry'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Reviews */}
        {activeTab === 'reviews' && (
          <div className="bg-[#161F30] p-6 sm:p-8 rounded-3xl border border-gray-800 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Verified Customer Reviews</h3>
                <p className="text-xs text-gray-400 mt-0.5">{restaurant.rating_count} authentic dining reviews</p>
              </div>
            </div>

            {/* Write a Review Form */}
            <form onSubmit={handleReviewSubmit} className="p-5 rounded-2xl bg-[#0F172A] border border-gray-700 space-y-4">
              <span className="text-xs font-bold text-gray-200">Leave Your Dining Review</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1"
                  >
                    <Star className={`w-5 h-5 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience regarding food, service and ambience..."
                className="w-full bg-[#161F30] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
                rows="3"
                required
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="py-2.5 px-6 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-xs"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>

            {/* Reviews List */}
            <div className="space-y-4">
              {restaurant.reviews?.map(rev => (
                <div key={rev.id} className="p-4 rounded-2xl bg-[#0F172A] border border-gray-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rev.user_name || 'Verified Diner'}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {rev.rating}★
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
