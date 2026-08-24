import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, Phone, User, CheckCircle2, ArrowLeft, Sparkles, Bell } from 'lucide-react';
import { restaurantApi, waitlistApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function WaitlistPage() {
  const { id } = useParams(); // restaurantId
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [restaurant, setRestaurant] = useState(null);
  const [partySize, setPartySize] = useState(2);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+91 98765 43210');
  const [waitInfo, setWaitInfo] = useState(null);
  const [joinedEntry, setJoinedEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await restaurantApi.getById(id);
        setRestaurant(res.data);
        const wRes = await restaurantApi.getWaitTime(id, partySize);
        setWaitInfo(wRes.data);
      } catch (e) {
        console.error('Waitlist fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const handleWaitlistUpdated = (entry) => {
      if (joinedEntry && entry.id === joinedEntry.id) {
        setJoinedEntry(entry);
      }
    };
    socket.on('waitlist_entry_updated', handleWaitlistUpdated);
    return () => socket.off('waitlist_entry_updated', handleWaitlistUpdated);
  }, [socket, joinedEntry]);

  const handlePartySizeChange = async (size) => {
    setPartySize(size);
    try {
      const res = await restaurantApi.getWaitTime(id, size);
      setWaitInfo(res.data);
    } catch (e) {}
  };

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await waitlistApi.join({
        restaurantId: id,
        customerName,
        customerPhone,
        partySize: parseInt(partySize, 10)
      });
      setJoinedEntry(res.data);
    } catch (err) {
      alert(err.message || 'Failed to join waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="glass-card rounded-3xl h-96 animate-pulse bg-gray-800/40" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20">
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl glass-panel hover:bg-gray-800 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white">Join Live Waitlist</h1>
          <p className="text-xs text-gray-400">At {restaurant?.name}</p>
        </div>
      </div>

      {joinedEntry ? (
        <div className="glass-card rounded-3xl p-8 border border-orange-500/30 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-orange-500/20 text-orange-400 mx-auto flex items-center justify-center animate-bounce-subtle">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">You are in queue</span>
            <h2 className="text-4xl font-black text-white">#{joinedEntry.queue_position} in Line</h2>
            <p className="text-xs text-gray-400 mt-1">
              Estimated wait: ~{joinedEntry.estimated_wait_minutes} minutes
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 text-xs text-gray-300 space-y-1">
            <p>Party Name: <strong className="text-white">{joinedEntry.customer_name}</strong></p>
            <p>Party Size: <strong className="text-white">{joinedEntry.party_size} Guests</strong></p>
            <p className="text-emerald-400 font-bold pt-2 flex items-center justify-center gap-1">
              <Bell className="w-4 h-4" />
              You'll receive an in-app notification when your table is ready!
            </p>
          </div>

          <button
            onClick={() => navigate(`/restaurant/${id}`)}
            className="w-full py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs"
          >
            Explore Menu While Waiting
          </button>
        </div>
      ) : (
        <form onSubmit={handleJoinWaitlist} className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6">
          
          {/* Estimated Wait Preview Card */}
          <div className="p-4 rounded-2xl bg-orange-950/30 border border-orange-500/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-orange-400">Current Est. Wait</span>
              <p className="text-xl font-black text-white">~{waitInfo?.estimatedWaitTime ?? 15} Mins</p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-500/30">
              Confidence: {waitInfo?.confidence || 'HIGH'}
            </span>
          </div>

          {/* Party Size Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Party Size</label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 4, 6, 8].map(size => (
                <button
                  type="button"
                  key={size}
                  onClick={() => handlePartySizeChange(size)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    partySize === size ? 'bg-orange-500 text-white shadow-glow' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {size} {size === 1 ? 'Guest' : 'Guests'}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Your Full Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Phone Number for Notification</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow transition-all"
          >
            {submitting ? 'Adding to Queue...' : 'Join Waitlist Now'}
          </button>
        </form>
      )}

    </div>
  );
}
