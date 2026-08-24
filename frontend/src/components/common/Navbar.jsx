import React, { useState } from 'react';
import { Link, useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import { 
  Utensils, 
  MapPin, 
  Search, 
  ShoppingBag, 
  Bell, 
  User, 
  LogOut, 
  LayoutDashboard, 
  CalendarCheck, 
  ChevronDown,
  Sparkles,
  RefreshCw,
  Heart,
  Store,
  Compass,
  Menu as MenuIcon,
  X,
  Clock,
  Tag,
  Calendar,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, PRESET_LOCATIONS } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationModal from './NotificationModal';

export default function Navbar() {
  const { user, isAuthenticated, logout, switchDemoUser, isOwner, isStaff, isAdmin } = useAuth();

  const { locationName, setManualLocation, requestLiveLocation, loading: locationLoading } = useLocation();
  const { totalItemsCount, setIsDrawerOpen } = useCart();
  const { unreadCount } = useNotifications();
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerNavOpen] = useState(false);
  const [topSearch, setTopSearch] = useState('');
  
  const navigate = useNavigate();
  const routeLocation = useRouteLocation();

  // Determine if currently in Owner / Staff console context
  const isOwnerRoute = routeLocation.pathname.startsWith('/restaurant');

  const handleRoleSwitch = async (roleKey) => {
    const switchedUser = await switchDemoUser(roleKey);
    const role = switchedUser?.role?.toUpperCase();
    if (role === 'OWNER' || role === 'STAFF' || role === 'ADMIN') {
      navigate('/restaurant/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleTopSearchSubmit = (e) => {
    e.preventDefault();
    if (topSearch.trim()) {
      navigate(`/restaurants?q=${encodeURIComponent(topSearch.trim())}`);
    } else {
      navigate('/restaurants');
    }
  };

  const navLinks = isOwnerRoute ? [
    { label: 'Live Console', path: '/restaurant/dashboard' },
    { label: 'View Customer Site', path: '/' }
  ] : [
    { label: 'Home', path: '/' },
    { label: 'Restaurants', path: '/restaurants' },
    { label: 'Offers', path: '/offers', badge: 'DEALS' },
    { label: 'Events', path: '/events' },
    { label: 'Banquets', path: '/banquets' },
    { label: 'Membership', path: '/membership', badge: 'VIP' },
    { label: 'Blog', path: '/blog' }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#111827]/95 border-b border-gray-800 shadow-md backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            
            {/* 1. Hamburger Menu & Brand Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Hamburger Button (Red square with 3 horizontal bars as seen in reference image) */}
              <button
                onClick={() => setIsDrawerNavOpen(true)}
                className="w-10 h-10 rounded-lg bg-white/95 hover:bg-white border border-gray-300 flex flex-col items-center justify-center gap-1 shadow-sm transition-transform active:scale-95 group shrink-0"
                title="Open Navigation Menu"
              >
                <span className="w-5 h-[3px] bg-[#C81E1E] rounded-full group-hover:w-6 transition-all" />
                <span className="w-5 h-[3px] bg-[#C81E1E] rounded-full transition-all" />
                <span className="w-5 h-[3px] bg-[#C81E1E] rounded-full group-hover:w-6 transition-all" />
              </button>

              {/* Brand Logo */}
              <Link to={isOwnerRoute ? "/restaurant/dashboard" : "/"} className="flex items-center gap-2 group shrink-0">
                <img src="/logo.png" alt="Smart Table" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-md group-hover:scale-105 transition-transform object-cover" />
                <div className="flex flex-col">
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center">
                    Smart Table<span className="text-[#C81E1E]">.</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider -mt-1 hidden sm:block">
                    {isOwnerRoute ? 'Owner Console' : 'Table Booking'}
                  </span>
                </div>
              </Link>
            </div>

            {/* 2. Top Center / Right Global Search Bar (ONLY for Customer discovery pages, HIDDEN on Owner Console) */}
            {!isOwnerRoute ? (
              <div className="flex-1 max-w-xl mx-2 sm:mx-4">
                <form onSubmit={handleTopSearchSubmit} className="flex items-center w-full">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={topSearch}
                      onChange={(e) => setTopSearch(e.target.value)}
                      placeholder="Search your favourite food or restaurant here"
                      className="w-full bg-white text-gray-900 placeholder-gray-500 rounded-l-md px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-0 focus:outline-none focus:ring-2 focus:ring-red-600 shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#C81E1E] hover:bg-[#A11414] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-r-md flex items-center justify-center transition-colors shadow-sm shrink-0"
                    title="Search"
                  >
                    <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white stroke-[2.5]" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 hidden md:flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/40 border border-red-500/30 text-xs font-bold text-red-400">
                  <Store className="w-4 h-4 text-[#C81E1E]" />
                  <span>Restaurant Operations & Kitchen Console</span>
                </div>
              </div>
            )}

            {/* 3. Action Icons & Profile Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* Geolocation Selector Pill (ONLY on Customer pages) */}
              {!isOwnerRoute && (
                <div className="relative hidden xl:block">
                  <button
                    onClick={() => setIsLocDropdownOpen(!isLocDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E293B] hover:bg-[#334155] border border-gray-700 text-xs text-gray-200 font-semibold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#C81E1E] shrink-0" />
                    <span className="max-w-[100px] truncate">{locationName}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {isLocDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#161F30] rounded-2xl p-2 shadow-2xl border border-gray-700 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
                        <span className="text-xs font-bold text-gray-200">Select City Area</span>
                        <button 
                          onClick={() => { requestLiveLocation(); setIsLocDropdownOpen(false); }}
                          className="text-[11px] text-[#C81E1E] hover:underline flex items-center gap-1 font-bold"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${locationLoading ? 'animate-spin' : ''}`} />
                          Live GPS
                        </button>
                      </div>
                      <div className="py-1 space-y-0.5 max-h-56 overflow-y-auto">
                        {PRESET_LOCATIONS.map((preset, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setManualLocation(preset);
                              setIsLocDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#1E293B] hover:text-[#C81E1E] transition-colors flex items-center gap-2"
                          >
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notification Bell */}
              <button
                onClick={() => setIsNotifOpen(true)}
                className="relative p-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-gray-700 text-gray-300 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C81E1E] text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Pre-Order Cart (ONLY for Customers) */}
              {!isOwnerRoute && (
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="relative p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-[#C81E1E] transition-all flex items-center gap-1"
                  title="View Pre-Order Basket"
                >
                  <ShoppingBag className="w-4 h-4 text-red-400" />
                  {totalItemsCount > 0 && (
                    <span className="text-[10px] font-bold px-1 rounded-full bg-[#C81E1E] text-white">
                      {totalItemsCount}
                    </span>
                  )}
                </button>
              )}

              {/* User Avatar & Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-gray-700 transition-colors"
                  >
                    <img
                      src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={user?.name}
                      className="w-7 h-7 rounded-lg object-cover border border-red-500/40"
                    />
                    <span className="text-xs font-bold text-gray-200 hidden sm:block max-w-[80px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-[#161F30] rounded-2xl p-2 shadow-2xl border border-gray-700 z-50 animate-in fade-in space-y-1">
                      <div className="px-3 py-2 border-b border-gray-800">
                        <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.2 rounded-full bg-red-950 text-red-400 border border-red-500/30">
                          {user?.role}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#1E293B] hover:text-white flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>Profile & Roles</span>
                      </Link>

                      {!isOwnerRoute ? (
                        <>
                          <Link
                            to="/bookings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="w-full px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#1E293B] hover:text-white flex items-center gap-2"
                          >
                            <CalendarCheck className="w-3.5 h-3.5 text-gray-400" />
                            <span>My Bookings</span>
                          </Link>

                          <Link
                            to="/favorites"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="w-full px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#1E293B] hover:text-white flex items-center gap-2"
                          >
                            <Heart className="w-3.5 h-3.5 text-rose-400" />
                            <span>Saved Favorites</span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          to="/"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#1E293B] hover:text-white flex items-center gap-2"
                        >
                          <Utensils className="w-3.5 h-3.5 text-gray-400" />
                          <span>Customer Discovery</span>
                        </Link>
                      )}

                      {(isOwner || isStaff) && !isOwnerRoute && (
                        <Link
                          to="/restaurant/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full px-3 py-2 rounded-xl text-xs text-red-400 bg-red-950/40 hover:bg-red-900/60 flex items-center gap-2 font-bold"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Owner Console</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full px-3 py-2 rounded-xl text-xs text-blue-400 bg-blue-950/40 hover:bg-blue-900/60 flex items-center gap-2 font-bold border border-blue-500/30"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span>App Super Admin Hub</span>
                        </Link>
                      )}


                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          navigate('/login');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="py-1.5 px-3 rounded-xl bg-[#C81E1E] hover:bg-[#A11414] text-white text-xs font-bold shadow-sm transition-all"
                  >
                    Sign In
                  </Link>
                </div>
              )}

            </div>

          </div>
        </div>
      </header>

      {/* Side Navigation Drawer (Opened via Top Hamburger Button) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsDrawerNavOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] bg-[#161F30] border-r border-gray-800 h-full p-6 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Smart Table" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
                  <span className="font-black text-lg text-white">Smart Table</span>
                </div>
                <button
                  onClick={() => setIsDrawerNavOpen(false)}
                  className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 block">Navigation</span>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsDrawerNavOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-gray-200 hover:bg-[#1E293B] hover:text-[#C81E1E] transition-colors"
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-500/30 font-bold">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Quick Role Switcher */}
              <div className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Testing Persona Switcher:
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    onClick={() => { handleRoleSwitch('CUSTOMER'); setIsDrawerNavOpen(false); }}
                    className="p-2 rounded-lg bg-[#161F30] hover:bg-gray-800 text-gray-200 font-bold border border-gray-700 text-center"
                  >
                    Diner (Alex)
                  </button>
                  <button
                    onClick={() => { handleRoleSwitch('OWNER'); setIsDrawerNavOpen(false); }}
                    className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900/70 text-red-400 font-bold border border-red-500/40 text-center"
                  >
                    Owner
                  </button>
                  <button
                    onClick={async () => {
                      await switchDemoUser('ADMIN');
                      setIsDrawerNavOpen(false);
                      navigate('/admin/dashboard');
                    }}
                    className="p-2 rounded-lg bg-blue-950/60 hover:bg-blue-900/70 text-blue-400 font-bold border border-blue-500/40 text-center"
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-gray-800 space-y-2">
              <Link
                to="/admin/dashboard"
                onClick={() => setIsDrawerNavOpen(false)}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-950/50 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>App Super Admin Hub</span>
              </Link>
              <Link
                to={isOwnerRoute ? "/" : "/restaurant/login"}
                onClick={() => setIsDrawerNavOpen(false)}
                className="w-full py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Store className="w-4 h-4 text-[#C81E1E]" />
                <span>{isOwnerRoute ? "Go to Customer Site" : "Restaurant Partner Login"}</span>
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* Notifications Modal */}
      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </>
  );
}
