import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Utensils, Mail, Lock, Sparkles, ArrowRight, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('alex@smarttable.com');
  const [password, setPassword] = useState('Password123!');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login, switchDemoUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await login(email, password);
      const userRole = res.user?.role?.toUpperCase();

      const redirectFrom = location.state?.from?.pathname;
      if (redirectFrom && redirectFrom !== '/login') {
        navigate(redirectFrom);
      } else if (userRole === 'OWNER' || userRole === 'STAFF' || userRole === 'ADMIN') {
        navigate('/restaurant/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (roleType) => {
    setError('');
    const user = await switchDemoUser(roleType);
    if (!user) {
      setError('Failed to switch demo account.');
      return;
    }
    const userRole = user?.role?.toUpperCase();
    if (userRole === 'OWNER' || userRole === 'STAFF' || userRole === 'ADMIN') {
      navigate('/restaurant/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#0B0F19]">
      <div className="w-full max-w-md bg-[#161F30] rounded-3xl p-8 sm:p-10 border border-gray-800 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Smart Table" className="w-12 h-12 rounded-2xl shadow-md mx-auto mb-3 object-cover" />
          <h2 className="text-2xl font-black text-white">Sign In to Smart Table</h2>
          <p className="text-xs text-gray-400">Book tables, manage orders and track live reservations</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
              placeholder="e.g. alex@smarttable.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
              placeholder="Password123!"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div className="pt-2 border-t border-gray-800 space-y-2">
          <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            1-Click Demo Accounts:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('CUSTOMER')}
              className="p-2.5 rounded-xl bg-orange-950/40 hover:bg-orange-900/60 text-[#FF6A00] font-bold border border-orange-500/30 text-center transition-colors"
            >
              🍽️ Diner (Alex Morgan)
            </button>
            <Link
              to="/restaurant/login"
              className="p-2.5 rounded-xl bg-[#0F172A] hover:bg-gray-800 text-gray-200 font-bold border border-gray-700 text-center transition-colors flex items-center justify-center gap-1"
            >
              <Store className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>👑 All 5 Restaurant Portals</span>
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 pt-2 space-y-2">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="text-[#FF6A00] font-bold hover:underline">
              Sign Up
            </Link>
          </p>
          <p>
            Are you a Restaurant Partner?{' '}
            <Link to="/restaurant/login" className="text-[#FF6A00] font-bold hover:underline inline-flex items-center gap-1">
              <Store className="w-3 h-3" />
              <span>Multi-Restaurant Partner Login Portal</span>
            </Link>
          </p>
        </div>


      </div>
    </div>
  );
}
