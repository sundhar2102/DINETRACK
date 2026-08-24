import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, ChefHat, UserCheck, UtensilsCrossed, Flame, Pizza } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RESTAURANT_PARTNERS = [
  {
    id: 'rest-001',
    name: 'Sangeetha Veg Gourmet',
    cuisine: 'South Indian & Vegetarian',
    email: 'owner@sangeetha.com',
    ownerName: 'Sangeetha Ramanathan',
    demoKey: 'OWNER_SANGEETHA',
    icon: '🥬',
    color: 'emerald'
  },
  {
    id: 'rest-002',
    name: 'Barbeque Nation Grill',
    cuisine: 'Over-The-Table Charcoal Grills',
    email: 'owner@bbqnation.com',
    ownerName: 'Vikram Sethi',
    demoKey: 'OWNER_BBQNATION',
    icon: '🥩',
    color: 'rose'
  },
  {
    id: 'rest-003',
    name: 'Toscano Italian Trattoria',
    cuisine: 'Wood-fired Pizza & Artisanal Pasta',
    email: 'owner@toscano.com',
    ownerName: 'Marco Rossi',
    demoKey: 'OWNER_TOSCANO',
    icon: '🍕',
    color: 'amber'
  },
  {
    id: 'rest-004',
    name: 'Mainland China Imperial',
    cuisine: 'Pan-Asian & Steamed Dimsums',
    email: 'owner@mainlandchina.com',
    ownerName: 'Chef Chen Wei',
    demoKey: 'OWNER_CHINA',
    icon: '🥢',
    color: 'red'
  },
  {
    id: 'rest-005',
    name: 'The Coastal Catch Seafood',
    cuisine: 'Fresh Catch & Coastal Curries',
    email: 'owner@coastalcatch.com',
    ownerName: 'Captain Rajesh Nair',
    demoKey: 'OWNER_COASTAL',
    icon: '🦐',
    color: 'cyan'
  },
  {
    id: 'rest-006',
    name: 'Paradise Biryani Hub (Under Review ⏳)',
    cuisine: 'Hyderabadi Dum Biryani & Kebabs',
    email: 'owner@paradise.com',
    ownerName: 'Farhan Qureshi',
    demoKey: 'OWNER_PARADISE',
    icon: '🍗',
    color: 'amber'
  }
];


export default function RestaurantLogin() {
  const [selectedPartner, setSelectedPartner] = useState(RESTAURANT_PARTNERS[0]);
  const [email, setEmail] = useState(RESTAURANT_PARTNERS[0].email);
  const [password, setPassword] = useState('Password123!');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login, switchDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleSelectPartner = (partner) => {
    setSelectedPartner(partner);
    setEmail(partner.email);
    setPassword('Password123!');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/restaurant/dashboard');
    } catch (err) {
      setError(err.message || 'Restaurant login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (roleType) => {
    setError('');
    const u = await switchDemoUser(roleType);
    if (u) {
      navigate('/restaurant/dashboard');
    } else {
      setError('Failed to switch restaurant account.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#0B0F19]">
      <div className="w-full max-w-2xl bg-[#161F30] rounded-3xl p-6 sm:p-10 border border-gray-800 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-orange-950/60 text-[#FF6A00] flex items-center justify-center shadow-md mx-auto mb-3 border border-orange-500/30">
            <Store className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-orange-950 text-[#FF6A00] border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
            Multi-Restaurant Partner Portal
          </div>
          <h2 className="text-2xl font-black text-white">Owner & Manager Sign In</h2>
          <p className="text-xs text-gray-400">Select any partner restaurant or enter credentials to open its owner dashboard</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* 1. Quick Restaurant Selection Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
            <span>Choose Restaurant Branch to Manage:</span>
            <span className="text-[10px] text-gray-400 font-normal">5 Active Partners</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {RESTAURANT_PARTNERS.map((partner) => {
              const isSelected = selectedPartner.id === partner.id;

              return (
                <button
                  type="button"
                  key={partner.id}
                  onClick={() => handleSelectPartner(partner)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-orange-950/40 border-[#FF6A00] ring-1 ring-[#FF6A00]'
                      : 'bg-[#0F172A] border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <span className="text-xl shrink-0 p-1 bg-[#161F30] rounded-xl border border-gray-800">
                    {partner.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-[#FF6A00]' : 'text-white'}`}>
                      {partner.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 truncate">{partner.cuisine}</p>
                    <span className="text-[9px] font-mono text-gray-500 block truncate mt-0.5">{partner.email}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                Owner Business Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
                placeholder="owner@restaurant.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                Security Password
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
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>{submitting ? 'Authenticating...' : `Enter ${selectedPartner.name} Dashboard`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 3. 1-Click Fast Instant Login Buttons */}
        <div className="pt-3 border-t border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              1-Click Instant Owner Access:
            </span>
            <button
              type="button"
              onClick={async () => {
                await switchDemoUser('ADMIN');
                navigate('/admin/dashboard');
              }}
              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-500/30"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              App Super Admin Portal →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {RESTAURANT_PARTNERS.map((p) => (
              <button
                key={p.demoKey}
                type="button"
                onClick={() => handleQuickDemo(p.demoKey)}
                className="p-2 rounded-xl bg-[#0F172A] hover:bg-gray-800 text-gray-300 hover:text-white font-bold border border-gray-700 text-center transition-colors truncate text-[11px]"
                title={`Log in as ${p.name}`}
              >
                {p.icon} {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 pt-2 flex items-center justify-between border-t border-gray-800">
          <Link to="/" className="text-gray-400 hover:text-white font-semibold">
            ← Back to Customer Website
          </Link>
          <Link to="/login" className="text-[#FF6A00] hover:underline font-bold">
            Customer Login →
          </Link>
        </div>


      </div>
    </div>
  );
}
