import React, { useState } from 'react';
import { Users, MapPin, Calendar, Phone, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Star } from 'lucide-react';

const BANQUETS = [
  {
    id: 'bq-001',
    name: 'The Royal Grand Ballroom',
    restaurant: 'Sangeetha Veg Gourmet',
    capacity: '150 - 400 Guests',
    location: 'Nungambakkam, Chennai',
    pricePerPlate: '₹650',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
    amenities: ['Central AC', 'Stage & Audio Setup', 'Valet Parking', 'Bridal Room', 'Pure Veg Kitchen']
  },
  {
    id: 'bq-002',
    name: 'Skyline Terrace & Banquet',
    restaurant: 'Annalakshmi Heritage Hall',
    capacity: '80 - 250 Guests',
    location: 'Mylapore, Chennai',
    pricePerPlate: '₹850',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    amenities: ['Open Air Terrace', 'DJ & Lighting', 'Live Counters', 'AC Dining Hall', 'Private Bar']
  },
  {
    id: 'bq-003',
    name: 'Emerald Corporate & Celebration Suite',
    restaurant: 'Copper Chimney Banquet',
    capacity: '50 - 150 Guests',
    location: 'Cathedral Road, Chennai',
    pricePerPlate: '₹950',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
    amenities: ['Projector & AV Support', 'Buffet Stations', 'Conference Layout', 'Valet Parking', 'Cocktail Lounge']
  }
];

export default function Banquets() {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [guestCount, setGuestCount] = useState('100');
  const [eventDate, setEventDate] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  const handleEnquirySubmit = (e) => {
    e.preventDefault();
    setEnquirySuccess(true);
    setTimeout(() => {
      setEnquirySuccess(false);
      setSelectedVenue(null);
      alert('Your banquet enquiry has been submitted! The banquet manager will contact you within 2 business hours.');
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 bg-[#0B0F19]">
      
      {/* Hero Banner */}
      <div className="bg-[#161F30] rounded-3xl p-8 sm:p-12 border border-gray-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-[#FF6A00] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Banquet Halls & Private Dining</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          Book Banquets for Weddings, Birthdays & Corporate Events
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
          Find premier party halls, celebration lawns, and corporate conference venues with customized gourmet catering.
        </p>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BANQUETS.map((venue) => (
          <div
            key={venue.id}
            className="bg-[#161F30] rounded-3xl overflow-hidden border border-gray-800 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all flex flex-col group"
          >
            <div className="relative h-52 w-full overflow-hidden bg-gray-900">
              <img
                src={venue.image}
                alt={venue.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-orange-300 border border-white/10">
                <Users className="w-3.5 h-3.5" />
                <span>{venue.capacity}</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6A00]" />
                  {venue.location}
                </span>
                <span className="font-bold text-amber-300 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full">
                  From {venue.pricePerPlate}/plate
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#FF6A00] transition-colors leading-tight">
                  {venue.name}
                </h3>
                <p className="text-xs text-gray-400">{venue.restaurant}</p>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {venue.amenities.map((am, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-[#0F172A] text-[11px] text-gray-300 border border-gray-800">
                      {am}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedVenue(venue)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>Request Callback & Quote</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enquiry Modal */}
      {selectedVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-700 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#FF6A00] uppercase tracking-wider">Banquet Booking Enquiry</span>
                <h3 className="text-lg font-bold text-white">{selectedVenue.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedVenue(null)}
                className="text-gray-400 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            {enquirySuccess ? (
              <div className="text-center py-6 space-y-2 text-emerald-400">
                <CheckCircle2 className="w-10 h-10 mx-auto" />
                <p className="font-bold text-sm">Enquiry Submitted Successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Phone / WhatsApp Number</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Tentative Date</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-300 font-semibold">Expected Guests</label>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#FF6A00]"
                    >
                      <option value="50" className="bg-[#0F172A] text-white">50 - 100 Guests</option>
                      <option value="150" className="bg-[#0F172A] text-white">100 - 250 Guests</option>
                      <option value="300" className="bg-[#0F172A] text-white">250 - 500 Guests</option>
                      <option value="500" className="bg-[#0F172A] text-white">500+ Guests</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold shadow-sm transition-all mt-2"
                >
                  Send Enquiry to Banquet Manager
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
