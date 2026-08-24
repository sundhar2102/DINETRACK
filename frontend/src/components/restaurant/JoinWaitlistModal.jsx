import React, { useState } from 'react';
import { 
  Clock, 
  Users, 
  Phone, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  QrCode, 
  X, 
  ArrowRight, 
  ChefHat, 
  Flame,
  BellRing
} from 'lucide-react';
import { waitlistApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function JoinWaitlistModal({ 
  isOpen, 
  onClose, 
  restaurant, 
  onJoined 
}) {
  const { user } = useAuth();

  const [partySize, setPartySize] = useState(2);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinedPass, setJoinedPass] = useState(null);

  if (!isOpen || !restaurant) return null;

  const estimatedWait = restaurant.estimatedWaitTime || 25;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Please provide your contact phone number for table alert.');
      return;
    }

    setLoading(true);
    try {
      const res = await waitlistApi.join({
        restaurantId: restaurant.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        partySize: parseInt(partySize, 10) || 2
      });

      setJoinedPass(res.data);
      if (onJoined) onJoined(res.data);
    } catch (err) {
      setError(err.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-[#161F30] rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-700 space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!joinedPass ? (
          <>
            {/* Header: Tables Full Banner */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>All Tables Currently Occupied</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Join Live Waitlist at {restaurant.name}
              </h2>
              
              <p className="text-xs text-gray-400 leading-relaxed">
                Tables are currently full. Join our live digital queue to secure the next available table. We will alert you the moment your table is cleaned and ready!
              </p>
            </div>

            {/* Estimated Wait Time Pill Card */}
            <div className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">AI Estimated Wait</span>
                  <span className="text-lg font-black text-white">~{estimatedWait} Minutes</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Queue Status</span>
                <span className="text-xs font-bold text-gray-300">Live Auto-Alert Active 🔔</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Party Size Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#C81E1E]" />
                  <span>Number of Guests in Party *</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPartySize(num)}
                      className={`py-2.5 rounded-xl font-bold transition-all ${
                        partySize === num
                          ? 'bg-[#C81E1E] text-white shadow-sm ring-2 ring-[#C81E1E]/40'
                          : 'bg-[#0F172A] text-gray-300 hover:bg-gray-800 border border-gray-700'
                      }`}
                    >
                      {num === 6 ? '6+ Guests' : `${num} ${num === 1 ? 'Person' : 'Guests'}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>Your Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Hemasunder"
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C81E1E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>Mobile Number (for Alert) *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C81E1E]"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#C81E1E] hover:bg-[#A11414] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 transition-all mt-2"
              >
                <BellRing className="w-4 h-4" />
                <span>{loading ? 'Securing Your Spot in Line...' : 'Get Live Waitlist Pass & Enter Queue'}</span>
              </button>
            </form>
          </>
        ) : (
          /* Success Live Queue Pass */
          <div className="space-y-6 text-center py-2 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Spot Confirmed</span>
              <h3 className="text-2xl font-black text-white">You Are on the Live Waitlist!</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Your place in line is secured at <strong className="text-white">{restaurant.name}</strong>.
              </p>
            </div>

            {/* Virtual Pass Card */}
            <div className="p-5 rounded-2xl bg-[#0F172A] border border-gray-800 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Queue Position</span>
                  <div className="text-2xl font-black text-[#C81E1E]">
                    #{joinedPass.queue_position || 1} in Line
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Est. Wait</span>
                  <div className="text-lg font-black text-white">
                    ~{joinedPass.estimated_wait_minutes || estimatedWait} Mins
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Guest Name:</span>
                  <span className="font-bold text-white">{joinedPass.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Party Size:</span>
                  <span className="font-bold text-white">{joinedPass.party_size} Guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pass Token:</span>
                  <span className="font-mono text-emerald-400 font-bold">QUE-{joinedPass.id?.slice(0, 6)?.toUpperCase()}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#161F30] border border-gray-800 text-[11px] text-gray-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>You will receive an instant notification on this screen as soon as your table is cleaned and ready.</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs transition-colors"
            >
              Done / Return to Restaurants
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
