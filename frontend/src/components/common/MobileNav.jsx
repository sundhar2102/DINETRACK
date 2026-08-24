import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, CalendarCheck, Heart, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileNav() {
  const location = useLocation();
  const { isOwner, isStaff } = useAuth();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Explore', path: '/search', icon: Compass },
    { label: 'Bookings', path: '/reservations', icon: CalendarCheck },
    { label: 'Favorites', path: '/favorites', icon: Heart },
    ...(isOwner || isStaff ? [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] : []),
    { label: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-gray-800 px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={idx}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-orange-500 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[9px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
