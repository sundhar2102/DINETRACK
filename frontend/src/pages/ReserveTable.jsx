import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  Utensils, 
  CreditCard, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Gift 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { restaurantApi, reservationApi, offersApi } from '../api';
import { useLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import TableGrid from '../components/restaurant/TableGrid';

const SPECIAL_REQUEST_PRESETS = [
  { label: 'Birthday Celebration 🎂', text: 'Birthday celebration setup' },
  { label: 'Anniversary 🥂', text: 'Anniversary special table' },
  { label: 'Window Table 🪟', text: 'Window seat preferred' },
  { label: 'Quiet Corner 🕯️', text: 'Quiet table away from entrance' },
  { label: 'Wheelchair Accessible ♿', text: 'Wheelchair accessible ground floor seating' },
  { label: 'High Chair Needed 👶', text: 'Baby high chair required' }
];

export default function ReserveTable() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { coordinates } = useLocation();
  const { cartItems, subtotal, tax, total, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [reservationDate, setReservationDate] = useState(new Date().toISOString().split('T')[0]);
  const [reservationTime, setReservationTime] = useState('19:30');
  const [allocationMode, setAllocationMode] = useState('auto'); // 'auto' or 'manual'
  const [selectedTableId, setSelectedTableId] = useState(searchParams.get('tableId') || '');
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [customRequestText, setCustomRequestText] = useState('');
  const [estimatedArrivalMinutes, setEstimatedArrivalMinutes] = useState(20);
  const [paymentMethod, setPaymentMethod] = useState('RESERVE_PAY_AT_RESTAURANT');
  const [submitting, setSubmitting] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState('');

  const totalGuests = Number(adultsCount) + Number(childrenCount);

  const togglePreset = (preset) => {
    if (selectedPresets.includes(preset.label)) {
      setSelectedPresets(prev => prev.filter(p => p !== preset.label));
    } else {
      setSelectedPresets(prev => [...prev, preset.label]);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await offersApi.validate(id, couponCode, subtotal || 50);
      setDiscountAmount(res.data.discountAmount);
      setCouponSuccess(`Coupon applied! Saved ₹${res.data.discountAmount.toFixed(0)} 🎉`);
    } catch (err) {
      alert(err.message || 'Invalid or expired coupon');
      setDiscountAmount(0);
      setCouponSuccess('');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const bookingFee = 0; // Free reservation for MVP
  const finalTotal = Math.max(0, (total || 0) - discountAmount + bookingFee);

  useEffect(() => {
    const fetchRest = async () => {
      try {
        const res = await restaurantApi.getById(id, coordinates.lat, coordinates.lng);
        setRestaurant(res.data);
      } catch (err) {
        console.error('Failed to load restaurant:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRest();
  }, [id, coordinates]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please sign in to confirm your booking.');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const combinedNotes = [
        ...selectedPresets,
        customRequestText.trim()
      ].filter(Boolean).join(' • ');

      const payload = {
        restaurantId: id,
        guestCount: totalGuests,
        reservationDate,
        reservationTime,
        tableId: allocationMode === 'manual' ? (selectedTableId || null) : null,
        specialRequests: combinedNotes,
        estimatedArrivalMinutes: parseInt(estimatedArrivalMinutes, 10),
        preOrderItems: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          prep_time_minutes: item.prep_time_minutes,
          customization: item.customization
        })),
        paymentMethod
      };

      const res = await reservationApi.create(payload);
      
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      clearCart();
      navigate(`/tracking/${res.data.id}`);
    } catch (err) {
      alert(err.message || 'Failed to complete reservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-[#161F30] rounded-3xl h-96 animate-pulse border border-gray-800" />
      </div>
    );
  }

  if (restaurant?.verification_status === 'UNDER_VERIFICATION') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 bg-[#0B0F19]">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto text-2xl animate-pulse">
          ⏳
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-950/80 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/40">
            Under Verification by Admin • Bookings Closed
          </span>
          <h2 className="text-2xl font-black text-white">{restaurant.name}</h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            This restaurant is currently completing platform verification with Smart Table App Admin. Online table bookings and pre-orders are temporarily locked until approved.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[#161F30] border border-gray-800 text-xs text-gray-300">
          <span>Registered FSSAI: <strong className="text-white font-mono">{restaurant.fssai_license || 'FSSAI-220011993344'}</strong></span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="py-3 px-6 rounded-xl bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold text-xs transition-colors"
        >
          Explore Live Verified Restaurants
        </button>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20 bg-[#0B0F19]">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-[#161F30] border border-gray-800 text-gray-300 hover:text-white shadow-xs transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Table Reservation & Dine-In Details</h1>
          <p className="text-xs sm:text-sm text-gray-400">At <strong className="text-[#FF6A00]">{restaurant?.name}</strong> • {restaurant?.cuisine}</p>
        </div>
      </div>

      <form onSubmit={handleBookingSubmit} className="space-y-6">
        
        {/* Step 1: Guests, Date & Time */}
        <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-[#FF6A00] text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Step 1: Party & Slot Selection</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Adults */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                Adults
              </label>
              <select
                value={adultsCount}
                onChange={(e) => setAdultsCount(e.target.value)}
                className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-[#FF6A00]"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => (
                  <option key={n} value={n} className="bg-[#0F172A] text-white">{n} Adults</option>
                ))}
              </select>
            </div>

            {/* Children */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Children
              </label>
              <select
                value={childrenCount}
                onChange={(e) => setChildrenCount(e.target.value)}
                className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-[#FF6A00]"
              >
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n} className="bg-[#0F172A] text-white">{n} Children</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Date
              </label>
              <input
                type="date"
                required
                value={reservationDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setReservationDate(e.target.value)}
                className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-[#FF6A00]"
              />
            </div>

            {/* Time Slot */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                Time Slot
              </label>
              <select
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-[#FF6A00]"
              >
                {['12:00', '12:30', '13:00', '13:30', '14:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].map(t => (
                  <option key={t} value={t} className="bg-[#0F172A] text-white">{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Table Allocation Mode */}
        <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Step 2: Table Allocation</span>
            </div>

            <div className="flex bg-[#0F172A] rounded-xl p-1 text-xs border border-gray-700">
              <button
                type="button"
                onClick={() => { setAllocationMode('auto'); setSelectedTableId(''); }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  allocationMode === 'auto' ? 'bg-[#FF6A00] text-white shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                Auto-Assign Best Table
              </button>
              <button
                type="button"
                onClick={() => setAllocationMode('manual')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  allocationMode === 'manual' ? 'bg-[#FF6A00] text-white shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                Choose from Floor Plan
              </button>
            </div>
          </div>

          {allocationMode === 'auto' ? (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300">
                <strong>Intelligent Table Placement:</strong> Our engine will automatically assign the best matching available table for your party size ({totalGuests} guests) when you confirm.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-gray-400">
                Click any available table below to lock your preferred seat.
              </p>
              <TableGrid
                tables={restaurant?.tables || []}
                selectedTableId={selectedTableId}
                onSelectTable={(tbl) => setSelectedTableId(tbl.id === selectedTableId ? '' : tbl.id)}
              />
            </div>
          )}
        </div>

        {/* Step 3: Special Requests & Occasions */}
        <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Gift className="w-4 h-4" />
            <span>Step 3: Occasion & Special Requests</span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {SPECIAL_REQUEST_PRESETS.map((preset, idx) => {
              const active = selectedPresets.includes(preset.label);
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => togglePreset(preset)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    active
                      ? 'bg-purple-950 text-purple-300 border-purple-500/50 shadow-xs'
                      : 'bg-[#0F172A] text-gray-300 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-gray-300">
              Additional Notes for the Host / Kitchen
            </label>
            <input
              type="text"
              value={customRequestText}
              onChange={(e) => setCustomRequestText(e.target.value)}
              placeholder="e.g. Mild spice, food allergy notes, candle on dessert..."
              className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
            />
          </div>
        </div>

        {/* Step 4: Pre-Ordered Food Review */}
        <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Utensils className="w-4 h-4" />
              <span>Step 4: Pre-Order Summary ({cartItems.length} Items)</span>
            </div>

            <Link
              to={`/restaurant/${id}`}
              className="text-xs font-bold text-[#FF6A00] hover:underline"
            >
              + Browse Menu
            </Link>
          </div>

          {cartItems.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800 text-center text-xs text-gray-400">
              No dishes pre-ordered. You can order directly from the digital menu at your table, or add dishes now to have food ready on arrival.
            </div>
          ) : (
            <div className="space-y-2.5">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800 text-xs">
                  <div>
                    <span className="font-bold text-white">{item.quantity}x {item.name}</span>
                    {item.customization && (
                      <p className="text-[10px] text-gray-400 italic">"{item.customization}"</p>
                    )}
                  </div>
                  <span className="font-bold text-[#FF6A00]">
                    ₹{(Number(item.price) * item.quantity).toFixed(0)}
                  </span>
                </div>
              ))}

              {/* Promo Code Box */}
              <div className="pt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Coupon (e.g. WELCOME50)..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#0F172A] border border-gray-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="py-2 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-xs transition-all"
                >
                  {applyingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>

              {couponSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  {couponSuccess}
                </div>
              )}

              <div className="pt-2 text-xs space-y-1 text-gray-400">
                <div className="flex justify-between">
                  <span>Pre-Order Subtotal</span>
                  <span className="text-white font-medium">₹{subtotal.toFixed(0)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount Applied ({couponCode})</span>
                    <span>-₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxes (5% GST)</span>
                  <span className="text-white font-medium">₹{tax.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-gray-800">
                  <span>Total Amount</span>
                  <span className="text-[#FF6A00] font-black">₹{finalTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 5: Payment Preference */}
        <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-4">
          <label className="text-xs font-semibold text-gray-300 block uppercase tracking-wider">
            Step 5: Payment Preference
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'RESERVE_PAY_AT_RESTAURANT', label: 'Reserve Free, Pay at Restaurant', icon: ShieldCheck },
              { id: 'UPI', label: 'Instant UPI Pre-Payment', icon: Sparkles },
              { id: 'ONLINE_CARD', label: 'Credit / Debit Card', icon: CreditCard }
            ].map(m => {
              const Icon = m.icon;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center text-center gap-1.5 transition-all ${
                    paymentMethod === m.id
                      ? 'bg-orange-950/60 text-[#FF6A00] border-orange-500/40 shadow-xs'
                      : 'bg-[#0F172A] text-gray-300 border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5 text-[#FF6A00]" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Confirmation Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{submitting ? 'Confirming Your Reservation...' : `Confirm Table for ${totalGuests} Guests`}</span>
        </button>

      </form>
    </div>
  );
}
