import React, { useState, useEffect } from 'react';
import { eventsApi } from '../../api';
import { Sparkles, Calendar, Clock, DollarSign, Users, Plus, Trash2 } from 'lucide-react';

export default function EventsManager({ restaurantId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('19:00');
  const [ticketPrice, setTicketPrice] = useState('0');
  const [totalSeats, setTotalSeats] = useState('40');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800');
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await eventsApi.getByRestaurant(restaurantId);
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [restaurantId]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await eventsApi.create(restaurantId, {
        title,
        description,
        event_date: eventDate,
        event_time: eventTime,
        ticket_price: parseFloat(ticketPrice || 0),
        total_seats: parseInt(totalSeats, 10),
        banner_url: bannerUrl
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this event?')) {
      await eventsApi.delete(id);
      fetchEvents();
    }
  };

  if (loading) {
    return <div className="glass-card rounded-3xl h-72 animate-pulse bg-gray-800/40" />;
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <span>Special Events & Dining Masterclasses</span>
          </h2>
          <p className="text-xs text-gray-400">Host live music nights, chef tasting masterclasses, and holiday festival buffets</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="glass-card rounded-3xl overflow-hidden border border-gray-800 flex flex-col justify-between"
          >
            {ev.banner_url && (
              <img
                src={ev.banner_url}
                alt={ev.title}
                className="w-full h-44 object-cover border-b border-gray-800"
              />
            )}

            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">{ev.title}</h3>
                <span className="font-black text-orange-400 text-sm">
                  {Number(ev.ticket_price) > 0 ? `$${Number(ev.ticket_price).toFixed(2)}` : 'Free Entry'}
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">{ev.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-800/80">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  {ev.event_date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {ev.event_time}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  {ev.booked_seats} / {ev.total_seats} Booked
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-900/60 border-t border-gray-800 flex justify-end">
              <button
                onClick={() => handleDelete(ev.id)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-rose-400 text-xs flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Event</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreateEvent} className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">Create Restaurant Event</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Event Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Carnatic Flute & Royal Thali Night"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details, menu highlights, artists..."
                className="w-full glass-input rounded-xl p-3 text-xs resize-none h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Event Date</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Start Time</label>
                <input
                  type="time"
                  required
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Ticket Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full glass-input rounded-xl p-3 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Total Seat Capacity</label>
                <input
                  type="number"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Banner Photo URL</label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-glow"
              >
                {submitting ? 'Publishing...' : 'Publish Event'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
