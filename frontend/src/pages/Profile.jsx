import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Shield, Sparkles, LogOut, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout, switchDemoUser, isOwner, isStaff } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-gray-400">
        <p>Please sign in to view your profile.</p>
        <Link to="/login" className="text-[#FF6A00] font-bold text-sm mt-2 inline-block">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20 bg-[#0B0F19]">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Your Account & Profile</h1>
        <p className="text-xs sm:text-sm text-gray-400">Manage credentials and role permissions</p>
      </div>

      {/* User Info Card */}
      <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-6">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={user.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500/40 shadow-sm"
          />
          <div>
            <h3 className="text-xl font-bold text-white">{user.name}</h3>
            <p className="text-xs text-gray-400">{user.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-950 text-[#FF6A00] border border-orange-500/30 uppercase">
              Role: {user.role} {user.restaurant?.staffRole ? `(${user.restaurant.staffRole})` : ''}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-800 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-gray-800 flex items-center gap-3">
            <Mail className="w-4 h-4 text-[#FF6A00]" />
            <div>
              <span className="text-gray-400 block text-[10px]">Email Address</span>
              <span className="text-white font-bold">{user.email}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-gray-800 flex items-center gap-3">
            <Phone className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-gray-400 block text-[10px]">Phone</span>
              <span className="text-white font-bold">{user.phone || '+91 98765 43210'}</span>
            </div>
          </div>
        </div>

        {/* Demo Role Switcher Section */}
        <div className="p-5 rounded-2xl bg-orange-950/30 border border-orange-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Quick Testing / Demo Role Switcher</span>
          </div>
          <p className="text-xs text-gray-400">
            Switch your active persona instantly to test customer booking, restaurant owner floor management, and kitchen prep queues.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => switchDemoUser('CUSTOMER')}
              className="py-1.5 px-3.5 rounded-xl bg-[#0F172A] hover:bg-gray-800 text-gray-200 text-xs font-bold border border-gray-700 shadow-xs"
            >
              Customer (Alex)
            </button>
            <button
              onClick={() => switchDemoUser('OWNER')}
              className="py-1.5 px-3.5 rounded-xl bg-orange-950/60 hover:bg-orange-900/80 text-[#FF6A00] text-xs font-bold border border-orange-500/40 shadow-xs"
            >
              Restaurant Owner (Sangeetha)
            </button>
            <button
              onClick={() => switchDemoUser('KITCHEN')}
              className="py-1.5 px-3.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-400 text-xs font-bold border border-amber-500/40 shadow-xs"
            >
              Kitchen Chef (Suresh)
            </button>
            <button
              onClick={() => switchDemoUser('WAITER')}
              className="py-1.5 px-3.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-blue-400 text-xs font-bold border border-blue-500/40 shadow-xs"
            >
              Floor Waiter (Rahul)
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          {(isOwner || isStaff) && (
            <Link
              to="/restaurant/dashboard"
              className="py-2.5 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Partner Dashboard</span>
            </Link>
          )}

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

    </div>
  );
}
