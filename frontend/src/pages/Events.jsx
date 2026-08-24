import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Sparkles, ArrowRight, Music, Users, Ticket, Store } from 'lucide-react';
import { eventsApi } from '../api';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventsApi.getAll();
        setEvents(res.data || []);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 bg-[#0B0F19]">
      
      {/* Header Banner */}
      <div className="bg-[#161F30] rounded-3xl p-8 sm:p-12 border border-gray-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-[#FF6A00] text-xs font-bold">
          <Music className="w-3.5 h-3.5" />
          <span>Live Dining & Food Festivals</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          Culinary Events & Live Music Nights
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
          Experience classical live music, weekend buffets, chef's tasting menus, and festive dining celebrations at top restaurants.
        </p>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#161F30] rounded-3xl h-80 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-[#161F30] rounded-3xl p-12 text-center text-gray-400 border border-gray-800">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <h3 className="text-base font-bold text-white">No upcoming dining events</h3>
          <p className="text-xs text-gray-400 mt-1">Stay tuned for new live music nights and food festivals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-[#161F30] rounded-3xl overflow-hidden border border-gray-800 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all flex flex-col group"
            >
              {/* Event Banner */}
              <div className="relative h-48 w-full overflow-hidden bg-gray-900">
                <img
                  src={event.banner_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800'}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-300 border border-white/10">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{event.event_date}</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#FF6A00]" />
                    {event.event_time}
                  </span>
                  <span className="font-bold text-emerald-400 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full">
                    {Number(event.ticket_price) > 0 ? `₹${Number(event.ticket_price).toFixed(0)} / Person` : 'Free with Booking'}
                  </span>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#FF6A00] transition-colors leading-tight">
                    {event.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {event.description || 'Join us for an unforgettable dining ambiance with authentic specialties.'}
                  </p>

                  <div className="p-3 rounded-2xl bg-[#0F172A] border border-gray-800 flex items-center gap-2 mt-2">
                    <Store className="w-4 h-4 text-[#FF6A00] shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{event.restaurant_name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{event.restaurant_address || 'Chennai'}</p>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/restaurant/${event.restaurant_id}/reserve`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Reserve Table for Event</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
