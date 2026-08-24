import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Compass, 
  UtensilsCrossed,
  Star,
  Tag,
  AlertCircle,
  RefreshCw,
  Calendar,
  Gift,
  CheckCircle2,
  ChevronRight,
  Smile,
  Check,
  CreditCard,
  ThumbsUp,
  Phone,
  ShieldCheck,
  Layers,
  Utensils
} from 'lucide-react';
import { restaurantApi, offersApi } from '../api';
import { useLocation, PRESET_LOCATIONS } from '../context/LocationContext';
import RestaurantCard from '../components/restaurant/RestaurantCard';

const CUISINE_OPTIONS = [
  'All Cuisines',
  'North Indian',
  'South Indian',
  'Pan-Asian',
  'Italian',
  'Continental',
  'Mughlai',
  'Fast Food',
  'Cafe',
  'Desserts',
  'Barbeque',
  'Vegetarian',
  'Seafood'
];

const CITIES = [
  'Chennai',
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad'
];

const CITY_AREAS = {
  'Chennai': ['Nungambakkam', 'T. Nagar', 'Velachery', 'Anna Nagar', 'Mylapore', 'Adyar', 'OMR', 'Alwarpet', 'Besant Nagar'],
  'Bengaluru': ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'JP Nagar', 'MG Road'],
  'Mumbai': ['Bandra West', 'Juhu', 'Andheri East', 'Powai', 'Lower Parel', 'Colaba'],
  'Delhi NCR': ['Connaught Place', 'Hauz Khas', 'Cyber Hub Gurgaon', 'Noida Sec 18', 'Saket'],
  'Hyderabad': ['Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Madhapur', 'Hitec City']
};

export default function Home() {
  const { 
    coordinates, 
    locationName, 
    permissionStatus, 
    requestLiveLocation, 
    setManualLocation,
    loading: locLoading 
  } = useLocation();

  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [featuredOffers, setFeaturedOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Category / Mode Tab
  const [activeTab, setActiveTab] = useState('table_booking'); 
  // Tabs: 'online_order', 'table_booking', 'queue_manager', 'hire_caterer', 'trending', 'food_ingredient'

  // Multi-Field Search Bar State (Matching Reference Screenshot)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('19:30');
  const [peopleCount, setPeopleCount] = useState('2');
  const [selectedCuisine, setSelectedCuisine] = useState('All Cuisines');
  const [selectedCity, setSelectedCity] = useState('Chennai');
  const [selectedArea, setSelectedArea] = useState('Nungambakkam');

  // Ingredient modal state for 'Food Ingredient' tab
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [ingredientQuery, setIngredientQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [rRes, oRes] = await Promise.all([
          restaurantApi.getNearby({
            lat: coordinates.lat,
            lng: coordinates.lng,
            radiusKm: 15
          }),
          offersApi.getAll().catch(() => ({ data: [] }))
        ]);
        setNearbyRestaurants(rRes.data || []);
        setFeaturedOffers((oRes.data || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [coordinates]);

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'hire_caterer') {
      navigate('/banquets');
    } else if (tabKey === 'queue_manager') {
      navigate('/restaurants?filter=available');
    } else if (tabKey === 'trending') {
      navigate('/restaurants?sort=rating');
    } else if (tabKey === 'food_ingredient') {
      setIsIngredientModalOpen(true);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCuisine && selectedCuisine !== 'All Cuisines') params.append('cuisine', selectedCuisine);
    if (selectedDate) params.append('date', selectedDate);
    if (selectedTime) params.append('time', selectedTime);
    if (peopleCount) params.append('guests', peopleCount);
    if (selectedCity) params.append('city', selectedCity);
    if (selectedArea) params.append('area', selectedArea);

    if (activeTab === 'online_order') {
      params.append('preOrder', 'true');
    }
    
    navigate(`/restaurants?${params.toString()}`);
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    const areas = CITY_AREAS[city] || [];
    if (areas.length > 0) {
      setSelectedArea(areas[0]);
    }
  };

  return (
    <div className="space-y-16 pb-20 bg-[#0B0F19]">
      
      {/* 1. Location Alert Banner if Denied */}
      {permissionStatus === 'denied' && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-300 font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Location access is disabled. Selected location: <strong>{selectedArea}, {selectedCity}</strong></span>
            </div>
            <button 
              onClick={requestLiveLocation}
              className="px-3 py-1.5 rounded-lg bg-[#C81E1E] hover:bg-[#A11414] text-white font-bold flex items-center gap-1 shadow-xs"
            >
              <RefreshCw className="w-3 h-3" />
              Enable Live GPS
            </button>
          </div>
        </div>
      )}

      {/* 2. Hero Section with Exact Backdrop & Layout from Reference Image */}
      <section className="relative min-h-[560px] sm:min-h-[620px] flex flex-col items-center justify-center pt-8 pb-12 px-3 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Authentic Indian Feast Backdrop Image with subtle dark vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1920&q=80"
            alt="Culinary Feast Backdrop"
            className="w-full h-full object-cover object-center filter brightness-[0.52] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0B0F19]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-6xl mx-auto text-center space-y-7">
          
          {/* Main Title in Cursive/Script Typography */}
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-script tracking-wide text-white drop-shadow-md">
              Experience Food like Never Before
            </h1>
          </div>

          {/* 6 Category Tab Buttons Bar */}
          <div className="flex items-center justify-center flex-wrap gap-1 sm:gap-1.5 max-w-4xl mx-auto">
            {[
              { id: 'online_order', label: 'Online Order' },
              { id: 'table_booking', label: 'Table Booking' },
              { id: 'queue_manager', label: 'Queue Manager' },
              { id: 'hire_caterer', label: 'Hire Caterer' },
              { id: 'trending', label: 'Trending' },
              { id: 'food_ingredient', label: 'Food Ingredient' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-sm ${
                    isActive 
                      ? 'bg-[#C81E1E] text-white shadow-md' 
                      : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Multi-Field Search Bar Compartments (Matching Reference Image) */}
          <div className="max-w-5xl mx-auto w-full">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-none shadow-2xl flex flex-col md:flex-row items-stretch border border-gray-300 divide-y md:divide-y-0 md:divide-x divide-gray-200"
            >
              
              {/* Field 1: Select Date */}
              <div className="flex-1 px-3 py-2 sm:py-2.5 flex items-center gap-2 text-left bg-white">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none">Select Date</span>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Field 2: Time */}
              <div className="w-full md:w-32 px-3 py-2 sm:py-2.5 flex items-center gap-2 text-left bg-white">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none">Time</span>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer p-0"
                  >
                    {['12:00', '12:30', '13:00', '13:30', '14:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 3: No. of people */}
              <div className="w-full md:w-36 px-3 py-2 sm:py-2.5 flex items-center gap-2 text-left bg-white">
                <Users className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none">No. of people</span>
                  <select
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer p-0"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => (
                      <option key={n} value={n}>{n} People</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 4: Cuisines */}
              <div className="flex-1 px-3 py-2 sm:py-2.5 flex items-center gap-2 text-left bg-white">
                <UtensilsCrossed className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none">Cuisines</span>
                  <select
                    value={selectedCuisine}
                    onChange={(e) => setSelectedCuisine(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer p-0"
                  >
                    {CUISINE_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 5: City */}
              <div className="w-full md:w-32 px-3 py-2 sm:py-2.5 flex items-center gap-2 text-left bg-white">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none">City</span>
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer p-0"
                  >
                    {CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 6: City Area */}
              <div className="flex-1 px-3 py-2 sm:py-2.5 flex items-center gap-2 text-left bg-white">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none">City Area</span>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer p-0"
                  >
                    {(CITY_AREAS[selectedCity] || []).map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Red Search Button */}
              <button
                type="submit"
                className="bg-[#C81E1E] hover:bg-[#A11414] text-white px-6 py-3 md:py-0 flex items-center justify-center transition-colors shrink-0"
                title="Search Available Tables"
              >
                <Search className="w-5 h-5 text-white stroke-[2.5]" />
              </button>

            </form>
          </div>

          {/* 4. "Get your favourite food in 4 simple steps" Process / Workflow Journey */}
          <div className="pt-4 sm:pt-6 space-y-4 max-w-4xl mx-auto w-full">
            
            {/* Step Subheading in Script Font */}
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-script text-white drop-shadow">
              Get your favourite food in 4 simple steps
            </h2>

            {/* Steps Visual Arc */}
            <div className="relative flex items-center justify-between gap-1 sm:gap-4 px-2 sm:px-6 py-3">
              
              {/* Left Indicator: Hungry?? */}
              <div className="flex flex-col items-center text-white/90 shrink-0">
                <span className="text-[11px] sm:text-xs font-script tracking-wide">Hungry??</span>
                <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center mt-1">
                  <Utensils className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Dotted connecting line 1 */}
              <div className="flex-1 border-t-2 border-dashed border-white/60 mx-1 sm:mx-2" />

              {/* Step 1: Search */}
              <div 
                onClick={() => navigate('/restaurants')}
                className="flex flex-col items-center group cursor-pointer shrink-0"
              >
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-dashed border-white p-1 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#C81E1E]">
                      <Search className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                    </div>
                  </div>
                  <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#C81E1E] text-white text-[10px] font-bold flex items-center justify-center shadow">
                    1
                  </span>
                </div>
                <span className="text-sm sm:text-lg font-script text-white mt-1 group-hover:text-amber-300 transition-colors">
                  Search
                </span>
              </div>

              {/* Dotted connecting line 2 */}
              <div className="flex-1 border-t-2 border-dashed border-white/60 mx-1 sm:mx-2" />

              {/* Step 2: Order */}
              <div 
                onClick={() => navigate('/restaurants?filter=available')}
                className="flex flex-col items-center group cursor-pointer shrink-0"
              >
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-dashed border-white p-1 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#C81E1E]">
                      <UtensilsCrossed className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                    </div>
                  </div>
                  <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#C81E1E] text-white text-[10px] font-bold flex items-center justify-center shadow">
                    2
                  </span>
                </div>
                <span className="text-sm sm:text-lg font-script text-white mt-1 group-hover:text-amber-300 transition-colors">
                  Order
                </span>
              </div>

              {/* Dotted connecting line 3 */}
              <div className="flex-1 border-t-2 border-dashed border-white/60 mx-1 sm:mx-2" />

              {/* Step 3: Pay */}
              <div 
                onClick={() => navigate('/bookings')}
                className="flex flex-col items-center group cursor-pointer shrink-0"
              >
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-dashed border-white p-1 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#C81E1E]">
                      <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                    </div>
                  </div>
                  <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#C81E1E] text-white text-[10px] font-bold flex items-center justify-center shadow">
                    3
                  </span>
                </div>
                <span className="text-sm sm:text-lg font-script text-white mt-1 group-hover:text-amber-300 transition-colors">
                  Pay
                </span>
              </div>

              {/* Dotted connecting line 4 */}
              <div className="flex-1 border-t-2 border-dashed border-white/60 mx-1 sm:mx-2" />

              {/* Step 4: Enjoy */}
              <div 
                onClick={() => navigate('/bookings')}
                className="flex flex-col items-center group cursor-pointer shrink-0"
              >
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-dashed border-white p-1 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#C81E1E]">
                      <ThumbsUp className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                    </div>
                  </div>
                  <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#C81E1E] text-white text-[10px] font-bold flex items-center justify-center shadow">
                    4
                  </span>
                </div>
                <span className="text-sm sm:text-lg font-script text-white mt-1 group-hover:text-amber-300 transition-colors">
                  Enjoy
                </span>
              </div>

              {/* Dotted connecting line 5 */}
              <div className="flex-1 border-t-2 border-dashed border-white/60 mx-1 sm:mx-2" />

              {/* Right Indicator: Happy!! */}
              <div className="flex flex-col items-center text-white/90 shrink-0">
                <span className="text-[11px] sm:text-xs font-script tracking-wide">Happy!!</span>
                <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center mt-1">
                  <Smile className="w-4 h-4 text-white" />
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. Section: Restaurants Near You */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-gray-800 pb-4">
          <div>
            <span className="text-xs font-bold text-[#C81E1E] uppercase tracking-wider">Top Dine-In Spots</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              Restaurants in {selectedArea}, {selectedCity}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Live table availability & instant reservations around your selected area</p>
          </div>

          <Link
            to={`/restaurants?city=${selectedCity}&area=${selectedArea}`}
            className="text-xs sm:text-sm font-bold text-[#C81E1E] hover:underline flex items-center gap-1 group shrink-0"
          >
            <span>View All & Map</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#161F30] rounded-3xl h-80 animate-pulse border border-gray-800" />
            ))}
          </div>
        ) : nearbyRestaurants.length === 0 ? (
          <div className="bg-[#161F30] rounded-3xl p-12 text-center text-gray-400 border border-gray-800">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <h3 className="text-base font-bold text-white">No restaurants found in {selectedArea}</h3>
            <p className="text-xs text-gray-400 mt-1">Try selecting another area from the top search bar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyRestaurants.slice(0, 6).map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Section: Exclusive Dining Offers */}
      {featuredOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-end justify-between border-b border-gray-800 pb-4">
            <div>
              <span className="text-xs font-bold text-[#C81E1E] uppercase tracking-wider">Dining Deals</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                Exclusive Table Discounts
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Book your table now and apply coupon codes at checkout</p>
            </div>

            <Link
              to="/offers"
              className="text-xs sm:text-sm font-bold text-[#C81E1E] hover:underline flex items-center gap-1 group shrink-0"
            >
              <span>View All Offers</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredOffers.map((offer) => (
              <div
                key={offer.id}
                className="p-6 rounded-3xl bg-[#161F30] border border-gray-800 shadow-sm hover:shadow-xl hover:border-red-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <span className="text-2xl font-black text-[#C81E1E]">
                    {offer.discount_value}% OFF
                  </span>
                  <h3 className="font-bold text-sm text-white mt-1">{offer.restaurant_name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{offer.description}</p>
                </div>

                <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    {offer.code}
                  </span>
                  <Link
                    to={`/restaurant/${offer.restaurant_id}/reserve`}
                    className="py-1.5 px-3.5 rounded-xl bg-[#C81E1E] hover:bg-[#A11414] text-white font-bold text-xs"
                  >
                    Claim Deal
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ingredient Filter Modal */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white">Find Dishes by Ingredient & Diet</h3>
              <button 
                onClick={() => setIsIngredientModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-300">
                Filter gourmet dishes containing specific ingredients (e.g. Paneer, Mushroom, Cheese, Saffron, Garlic-free, Jain, Vegan):
              </p>
              <input
                type="text"
                value={ingredientQuery}
                onChange={(e) => setIngredientQuery(e.target.value)}
                placeholder="Enter ingredients (e.g. Paneer, Truffle)..."
                className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C81E1E]"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Paneer', 'Mushroom', 'Cheese', 'Garlic-Free (Jain)', 'Vegan', 'Organic', 'Gluten-Free'].map(ing => (
                  <button
                    key={ing}
                    onClick={() => setIngredientQuery(ing)}
                    className="px-2.5 py-1 rounded-lg bg-[#0F172A] hover:bg-gray-800 text-gray-300 text-xs border border-gray-700"
                  >
                    {ing}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsIngredientModalOpen(false);
                  navigate(`/restaurants?q=${encodeURIComponent(ingredientQuery || 'Special')}`);
                }}
                className="w-full py-3 rounded-xl bg-[#C81E1E] hover:bg-[#A11414] text-white font-bold text-xs shadow-sm transition-all"
              >
                Find Matching Dishes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
