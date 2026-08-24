import React from 'react';
import { Utensils, Heart, Mail, Phone, MapPin, ShieldCheck, Sparkles, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#111827] text-gray-300 mt-20 pb-24 md:pb-12 pt-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Smart Table" className="w-10 h-10 rounded-xl shadow-lg object-cover" />
              <span className="text-2xl font-black text-white tracking-tight">
                Smart Table<span className="text-[#FF6A00]">.</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              India's premier online restaurant booking and table reservation platform. Discover top dine-in spots, check real-time table availability, and book instantly with exclusive dining discounts.
            </p>
            <div className="pt-2 flex flex-col gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6A00]" /> Chennai • Mumbai • Bengaluru • Delhi NCR</span>
              <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#FF6A00]" /> support@smarttable.com</span>
            </div>
          </div>

          {/* Diners Col */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">For Diners</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link to="/restaurants" className="hover:text-[#FF6A00] transition-colors">Book Restaurants</Link></li>
              <li><Link to="/offers" className="hover:text-[#FF6A00] transition-colors">Offers & Coupons</Link></li>
              <li><Link to="/events" className="hover:text-[#FF6A00] transition-colors">Food Events</Link></li>
              <li><Link to="/banquets" className="hover:text-[#FF6A00] transition-colors">Banquet Halls</Link></li>
              <li><Link to="/membership" className="hover:text-[#FF6A00] transition-colors">VIP Membership</Link></li>
            </ul>
          </div>

          {/* Partners Col */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">For Restaurants</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link to="/restaurant/login" className="hover:text-[#FF6A00] font-bold text-[#FF6A00] transition-colors">Restaurant Partner Login</Link></li>
              <li><Link to="/register" className="hover:text-[#FF6A00] transition-colors">List Your Restaurant</Link></li>
              <li><Link to="/restaurant/dashboard" className="hover:text-[#FF6A00] transition-colors">Table Management System</Link></li>
              <li><Link to="/restaurant/dashboard" className="hover:text-[#FF6A00] transition-colors">KDS Kitchen Display</Link></li>
              <li><Link to="/restaurant/dashboard" className="hover:text-[#FF6A00] transition-colors">POS & Financial Analytics</Link></li>
            </ul>
          </div>

          {/* Company & Blog */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Company</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link to="/blog" className="hover:text-[#FF6A00] transition-colors">Dining Journal & Guides</Link></li>
              <li><Link to="/profile" className="hover:text-[#FF6A00] transition-colors">My Profile</Link></li>
              <li><Link to="/bookings" className="hover:text-[#FF6A00] transition-colors">Booking History</Link></li>
              <li><Link to="/favorites" className="hover:text-[#FF6A00] transition-colors">Saved Restaurants</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 Smart Table Platform India. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">Crafted with excellence for food lovers <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 ml-1" /></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
