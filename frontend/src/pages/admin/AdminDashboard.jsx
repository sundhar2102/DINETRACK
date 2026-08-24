import React, { useEffect, useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Store, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  X, 
  RefreshCw, 
  Sparkles, 
  FileText, 
  BadgeCheck, 
  ChefHat,
  Search,
  ExternalLink,
  Layers,
  TrendingUp,
  DollarSign,
  Activity,
  CreditCard,
  Utensils,
  ArrowUpRight,
  UserCheck,
  Building2,
  Calendar,
  Eye,
  Percent
} from 'lucide-react';
import { adminApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Active Tab: 'approvals' | 'revenue' | 'users' | 'overview'
  const [activeTab, setActiveTab] = useState('approvals');

  // Overview Data
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Restaurants Data
  const [restaurants, setRestaurants] = useState([]);
  const [restLoading, setRestLoading] = useState(true);
  const [restFilter, setRestFilter] = useState('ALL');
  const [restSearch, setRestSearch] = useState('');

  // Revenue Breakdown Data
  const [revenueData, setRevenueData] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueSearch, setRevenueSearch] = useState('');

  // Users Directory Data
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');

  // Modals & Action Notices
  const [actionNotice, setActionNotice] = useState('');
  const [rejectModalRest, setRejectModalRest] = useState(null);
  const [rejectReason, setRejectReason] = useState('Missing FSSAI license verification or incomplete menu details');
  const [inspectRest, setInspectRest] = useState(null);

  // Fetch Overview Stats
  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await adminApi.getOverview();
      setOverview(res.data || null);
    } catch (e) {
      console.error('Failed to fetch overview stats:', e);
    } finally {
      setOverviewLoading(false);
    }
  };

  // Fetch Restaurants
  const fetchRestaurants = async () => {
    try {
      setRestLoading(true);
      const res = await adminApi.getRestaurants();
      setRestaurants(res.data || []);
    } catch (e) {
      console.error('Failed to fetch admin restaurants:', e);
    } finally {
      setRestLoading(false);
    }
  };

  // Fetch Revenue Breakdown
  const fetchRevenue = async () => {
    try {
      setRevenueLoading(true);
      const res = await adminApi.getRevenueBreakdown('today');
      setRevenueData(res.data || null);
    } catch (e) {
      console.error('Failed to fetch revenue breakdown:', e);
    } finally {
      setRevenueLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await adminApi.getUsers();
      setUsersList(res.data || []);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setUsersLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchOverview(),
      fetchRestaurants(),
      fetchRevenue(),
      fetchUsers()
    ]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Real-time socket events for admin
  useEffect(() => {
    if (!socket) return;

    const handleRestUpdated = (updatedRest) => {
      setRestaurants(prev => prev.map(r => r.id === updatedRest.id ? { ...r, ...updatedRest } : r));
      fetchOverview();
      fetchRevenue();
    };

    socket.on('restaurant_approved', handleRestUpdated);
    socket.on('restaurant_updated', handleRestUpdated);
    socket.on('order_created', () => { fetchRevenue(); fetchOverview(); });
    socket.on('order_status_changed', () => { fetchRevenue(); fetchOverview(); });

    return () => {
      socket.off('restaurant_approved', handleRestUpdated);
      socket.off('restaurant_updated', handleRestUpdated);
      socket.off('order_created');
      socket.off('order_status_changed');
    };
  }, [socket]);

  const showNotification = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4500);
  };

  const handleApprove = async (id, name) => {
    try {
      await adminApi.approveRestaurant(id, 'Verified & Approved by Smart Table App Admin');
      showNotification(`🎉 "${name}" has been APPROVED and is now LIVE for customer bookings!`);
      await refreshAll();
    } catch (e) {
      alert(e.message || 'Failed to approve restaurant');
    }
  };

  const handleOpenRejectModal = (rest) => {
    setRejectModalRest(rest);
    setRejectReason('Missing FSSAI license verification or incomplete contact details');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalRest) return;
    try {
      await adminApi.rejectRestaurant(rejectModalRest.id, rejectReason);
      showNotification(`❌ "${rejectModalRest.name}" marked as REJECTED.`);
      setRejectModalRest(null);
      await refreshAll();
    } catch (e) {
      alert(e.message || 'Failed to reject restaurant');
    }
  };

  // Filtered Lists
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => {
      const matchesFilter = restFilter === 'ALL' || r.verification_status === restFilter;
      const matchesSearch = r.name.toLowerCase().includes(restSearch.toLowerCase()) ||
        r.cuisine?.toLowerCase().includes(restSearch.toLowerCase()) ||
        r.owner_name?.toLowerCase().includes(restSearch.toLowerCase()) ||
        r.fssai_license?.toLowerCase().includes(restSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [restaurants, restFilter, restSearch]);

  const filteredRevenue = useMemo(() => {
    if (!revenueData?.restaurantsRevenue) return [];
    return revenueData.restaurantsRevenue.filter(r => {
      return r.restaurantName.toLowerCase().includes(revenueSearch.toLowerCase()) ||
        r.owner.name.toLowerCase().includes(revenueSearch.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(revenueSearch.toLowerCase());
    });
  }, [revenueData, revenueSearch]);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearch));
      return matchesRole && matchesSearch;
    });
  }, [usersList, userRoleFilter, userSearch]);

  const pendingCount = restaurants.filter(r => r.verification_status === 'UNDER_VERIFICATION').length;
  const approvedCount = restaurants.filter(r => r.verification_status === 'APPROVED').length;
  const rejectedCount = restaurants.filter(r => r.verification_status === 'REJECTED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 bg-[#0B0F19]">
      
      {/* 1. Header & Live Admin Metrics */}
      <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Smart Table Platform Developer & Super Admin Console
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Platform Administration & Revenue Center</h1>
            <p className="text-xs text-gray-400">
              Manage restaurant verification, track active online users, and inspect daily revenue generated by individual owners.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refreshAll}
              className="py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-gray-800 text-gray-200 text-xs font-bold border border-gray-700 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>Live Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Core Top Metrics Required by User */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* 1. Live Logged-in Users */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#161F30] border border-emerald-500/30 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Live Online Users</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {overview?.users?.onlineNow || 1}
              </span>
              <span className="text-[10px] text-emerald-300 font-semibold">Active Sessions</span>
            </div>
            <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-800/80 truncate">
              {overview?.users?.diners || 0} Diners • {overview?.users?.owners || 0} Owners
            </p>
          </div>

          {/* 2. Registered Restaurants */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#161F30] border border-blue-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Registered Restaurants</span>
              <Store className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {overview?.restaurants?.total || restaurants.length}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">{approvedCount} Live</span>
            </div>
            <p className="text-[10px] text-amber-400 font-semibold pt-1 border-t border-gray-800/80">
              ⏳ {pendingCount} Pending Verification
            </p>
          </div>

          {/* 3. Today's Gross Platform Revenue */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#161F30] border border-[#FF6A00]/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#FF6A00] uppercase tracking-wider block">Today's Revenue</span>
              <DollarSign className="w-4 h-4 text-[#FF6A00]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                ₹{Number(overview?.financials?.todayRevenue || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400">{overview?.financials?.todayOrders || 0} orders</span>
            </div>
            <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-800/80">
              All-Time: <strong className="text-white font-mono">₹{Number(overview?.financials?.totalRevenue || 0).toLocaleString()}</strong>
            </p>
          </div>

          {/* 4. Total Registered Users */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#161F30] border border-purple-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Total User Accounts</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {overview?.users?.total || usersList.length}
              </span>
              <span className="text-[10px] text-purple-300 font-semibold">Registered</span>
            </div>
            <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-800/80 truncate">
              {overview?.financials?.todayReservations || 0} Table Bookings Today
            </p>
          </div>

        </div>

        {/* Global Toast */}
        {actionNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-3 overflow-x-auto">
        {[
          { id: 'approvals', label: '🏢 Restaurant Approvals & Verification', count: pendingCount > 0 ? `${pendingCount} PENDING` : null },
          { id: 'revenue', label: '💰 Individual Owner Revenue Breakdown', count: 'DAILY' },
          { id: 'users', label: '👥 Live Users & Logged-In Diners', count: overview?.users?.onlineNow || 1 },
          { id: 'overview', label: '📊 Platform Insights & Summary', count: null }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#FF6A00] text-white shadow-md shadow-[#FF6A00]/20'
                : 'bg-[#161F30] text-gray-300 hover:bg-gray-800 border border-gray-700'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count && (
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                tab.id === 'approvals' && pendingCount > 0
                  ? 'bg-amber-400 text-black animate-pulse'
                  : 'bg-black/30 text-gray-200'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RESTAURANT APPROVALS & VERIFICATION HUB                            */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { key: 'ALL', label: `All (${restaurants.length})` },
                { key: 'UNDER_VERIFICATION', label: `⏳ Under Verification (${pendingCount})` },
                { key: 'APPROVED', label: `✅ Live & Approved (${approvedCount})` },
                { key: 'REJECTED', label: `❌ Rejected (${rejectedCount})` }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRestFilter(tab.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    restFilter === tab.key
                      ? 'bg-[#FF6A00] text-white shadow-xs'
                      : 'bg-[#161F30] text-gray-300 hover:bg-gray-800 border border-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={restSearch}
                onChange={(e) => setRestSearch(e.target.value)}
                placeholder="Search restaurant, owner, FSSAI..."
                className="w-full bg-[#161F30] border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
          </div>

          {/* Restaurant Cards */}
          {restLoading ? (
            <div className="bg-[#161F30] rounded-3xl h-64 animate-pulse border border-gray-800" />
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-16 bg-[#161F30] rounded-3xl border border-gray-800 space-y-2">
              <Store className="w-12 h-12 text-gray-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No applications matching filter ({restFilter})</h3>
              <p className="text-xs text-gray-400">Newly registered restaurants will automatically appear here for your review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredRestaurants.map((rest) => {
                const isPending = rest.verification_status === 'UNDER_VERIFICATION';
                const isApproved = rest.verification_status === 'APPROVED';
                const isRejected = rest.verification_status === 'REJECTED';

                return (
                  <div
                    key={rest.id}
                    className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                      isPending
                        ? 'bg-[#161F30] border-amber-500/50 ring-1 ring-amber-500/30'
                        : isApproved
                        ? 'bg-[#161F30] border-gray-800 hover:border-gray-700'
                        : 'bg-[#161F30] border-rose-500/40 opacity-85'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Bar: Thumbnail, Name & Verification Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={rest.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200'}
                            alt={rest.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-gray-700 shrink-0"
                          />
                          <div>
                            <h3 className="text-base font-black text-white leading-tight">{rest.name}</h3>
                            <p className="text-xs text-gray-400">{rest.cuisine}</p>
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                          isPending
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse'
                            : isApproved
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        }`}>
                          {isPending ? '⏳ Under Verification' : isApproved ? '✅ Verified & Live' : '❌ Rejected'}
                        </span>
                      </div>

                      {/* License & Details Matrix */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#0F172A] p-3 rounded-2xl border border-gray-800">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3 text-[#FF6A00]" />
                            FSSAI License:
                          </span>
                          <p className="font-mono font-bold text-white text-xs">{rest.fssai_license || 'FSSAI-998877665544'}</p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            Owner / Manager:
                          </span>
                          <p className="font-semibold text-white text-xs truncate">{rest.owner_name || 'Partner Owner'}</p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            Contact Phone:
                          </span>
                          <p className="text-gray-300 font-mono text-xs">{rest.phone || rest.owner_phone || '+91 44 2827 1234'}</p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            Location:
                          </span>
                          <p className="text-gray-300 text-xs truncate">{rest.city || 'Chennai'}, Tamil Nadu</p>
                        </div>
                      </div>

                      {/* Tables & Items Stats */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 px-1">
                        <span>Floor: <strong className="text-white">{rest.table_count || 8} Tables</strong></span>
                        <span>•</span>
                        <span>Menu: <strong className="text-white">{rest.menu_item_count || 10} Items</strong></span>
                        <span>•</span>
                        <span>Hours: <strong className="text-gray-300">{rest.opening_time || '11:00'} - {rest.closing_time || '23:00'}</strong></span>
                      </div>

                      {rest.admin_notes && (
                        <div className="p-2.5 rounded-xl bg-[#0F172A] border border-gray-800 text-xs text-gray-300 space-y-0.5">
                          <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Admin Notes:</span>
                          <p className="italic text-gray-300">"{rest.admin_notes}"</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-gray-800 flex items-center gap-3">
                      {!isApproved && (
                        <button
                          onClick={() => handleApprove(rest.id, rest.name)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Approve & Make Live</span>
                        </button>
                      )}

                      {!isRejected && (
                        <button
                          onClick={() => handleOpenRejectModal(rest)}
                          className="py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-500/40 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>{isApproved ? 'Suspend' : 'Reject Application'}</span>
                        </button>
                      )}

                      {isApproved && (
                        <a
                          href={`/restaurant/${rest.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-[#0F172A] hover:bg-gray-800 border border-gray-700 text-center text-xs font-bold text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#FF6A00]" />
                          <span>View Diner Page</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INDIVIDUAL RESTAURANT DAILY REVENUE BREAKDOWN                       */}
      {/* ========================================================================= */}
      {activeTab === 'revenue' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Revenue Top Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#161F30] to-[#0F172A] border border-gray-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#FF6A00] uppercase tracking-wider block">Financial Performance</span>
                <h2 className="text-xl sm:text-2xl font-black text-white">Daily Revenue per Restaurant Owner</h2>
                <p className="text-xs text-gray-400">Itemized gross volume, 5% platform commission, and 95% net payout per partner restaurant.</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-3 rounded-2xl bg-[#0B0F19] border border-gray-700 text-right">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Today's Platform Share (5%)</span>
                  <span className="text-lg font-black text-[#FF6A00] font-mono">
                    ₹{Number(revenueData?.summary?.totalTodayPlatformCommission || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-right">
                  <span className="text-[10px] font-bold text-emerald-400 block uppercase">Today's Total Gross</span>
                  <span className="text-lg font-black text-emerald-300 font-mono">
                    ₹{Number(revenueData?.summary?.totalTodayPlatformRevenue || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={revenueSearch}
                onChange={(e) => setRevenueSearch(e.target.value)}
                placeholder="Search restaurant, owner name or cuisine..."
                className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
          </div>

          {/* Individual Revenue Table / Cards */}
          {revenueLoading ? (
            <div className="bg-[#161F30] rounded-3xl h-64 animate-pulse border border-gray-800" />
          ) : filteredRevenue.length === 0 ? (
            <div className="text-center py-16 bg-[#161F30] rounded-3xl border border-gray-800 space-y-2">
              <DollarSign className="w-12 h-12 text-gray-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No restaurant revenue records found</h3>
              <p className="text-xs text-gray-400">When customers place pre-orders or dine-in orders, revenue is credited here in real time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRevenue.map((item) => {
                return (
                  <div
                    key={item.restaurantId}
                    className="p-5 sm:p-6 rounded-3xl bg-[#161F30] border border-gray-800 hover:border-gray-700 transition-all space-y-4 shadow-md"
                  >
                    {/* Header Row: Restaurant Info & Today's Total */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200'}
                          alt={item.restaurantName}
                          className="w-14 h-14 rounded-2xl object-cover border border-gray-700 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-white">{item.restaurantName}</h3>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.verificationStatus === 'APPROVED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950/60 text-amber-400'
                            }`}>
                              {item.verificationStatus}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.cuisine} • <span className="text-gray-300 font-semibold">{item.city}</span>
                          </p>
                          <p className="text-xs text-gray-300 mt-1 flex items-center gap-2">
                            <span className="font-semibold text-white">👤 {item.owner.name}</span>
                            <span className="text-gray-500">•</span>
                            <span className="font-mono text-gray-400">📞 {item.owner.phone || 'No phone'}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">✉️ {item.owner.email}</span>
                          </p>
                        </div>
                      </div>

                      {/* Today Gross Total Badge */}
                      <div className="text-right bg-[#0F172A] p-3.5 rounded-2xl border border-gray-700 shrink-0">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                          Today's Gross Sales
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                          ₹{item.metrics.todayGrossRevenue.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {item.metrics.todayOrders} Orders Today
                        </span>
                      </div>
                    </div>

                    {/* Metric Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      
                      <div className="p-3 rounded-xl bg-[#0F172A] border border-gray-800 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          5% Smart Table Fee
                        </span>
                        <p className="font-bold text-[#FF6A00] font-mono text-sm">
                          ₹{item.metrics.platformCommissionToday.toFixed(0)}
                        </p>
                        <span className="text-[10px] text-gray-500">Platform Commission</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0F172A] border border-gray-800 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          Owner Net Payout
                        </span>
                        <p className="font-bold text-white font-mono text-sm">
                          ₹{item.metrics.ownerNetPayoutToday.toFixed(0)}
                        </p>
                        <span className="text-[10px] text-emerald-400/80">95% Daily Settlement</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0F172A] border border-gray-800 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          All-Time Volume
                        </span>
                        <p className="font-bold text-white font-mono text-sm">
                          ₹{item.metrics.allTimeGrossRevenue.toLocaleString()}
                        </p>
                        <span className="text-[10px] text-gray-400">{item.metrics.allTimeOrders} total orders</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0F172A] border border-gray-800 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Average Order Value
                        </span>
                        <p className="font-bold text-white font-mono text-sm">
                          ₹{item.metrics.averageOrderValue.toFixed(0)}
                        </p>
                        <span className="text-[10px] text-gray-400">{item.metrics.todayReservations} bookings today</span>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE USERS & LOGGED IN DINERS DIRECTORY                             */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Controls & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { key: 'ALL', label: `All Users (${usersList.length})` },
                { key: 'CUSTOMER', label: '🍽️ Diners' },
                { key: 'RESTAURANT_OWNER', label: '🏪 Restaurant Owners' },
                { key: 'ADMIN', label: '🛡️ Admins' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setUserRoleFilter(tab.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    userRoleFilter === tab.key
                      ? 'bg-[#FF6A00] text-white shadow-xs'
                      : 'bg-[#161F30] text-gray-300 hover:bg-gray-800 border border-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name, email, phone..."
                className="w-full bg-[#161F30] border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
          </div>

          {/* Users Table */}
          {usersLoading ? (
            <div className="bg-[#161F30] rounded-3xl h-64 animate-pulse border border-gray-800" />
          ) : (
            <div className="bg-[#161F30] rounded-3xl border border-gray-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#0F172A] text-gray-400 uppercase tracking-wider font-bold border-b border-gray-800">
                    <tr>
                      <th className="py-3.5 px-4">User Details</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Status / Session</th>
                      <th className="py-3.5 px-4">Activity</th>
                      <th className="py-3.5 px-4">Spend / Volume</th>
                      <th className="py-3.5 px-4">Registered On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredUsers.map((u) => {
                      const isOwner = u.role === 'RESTAURANT_OWNER';
                      const isAdmin = u.role === 'ADMIN';

                      return (
                        <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-xs">
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{u.name}</span>
                                <span className="text-[11px] text-gray-400">{u.email}</span>
                                {u.phone && <span className="text-[10px] text-gray-500 font-mono block">{u.phone}</span>}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isAdmin ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40' :
                              isOwner ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40' :
                              'bg-gray-800 text-gray-300'
                            }`}>
                              {isAdmin ? '🛡️ Super Admin' : isOwner ? '🏪 Restaurant Owner' : '🍽️ Diner'}
                            </span>
                            {u.owned_restaurant_name && (
                              <span className="text-[10px] text-gray-400 block mt-0.5 truncate max-w-[140px]">
                                {u.owned_restaurant_name}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {u.is_online ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Online Now
                              </span>
                            ) : (
                              <span className="text-gray-500 text-[11px]">Offline</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5 text-[11px]">
                              <span>{u.reservation_count || 0} Bookings</span>
                              <span className="text-gray-500 block">• {u.order_count || 0} Orders</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            ₹{Number(u.total_spent || 0).toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PLATFORM SUMMARY & INSIGHTS                                        */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <div className="p-6 rounded-3xl bg-[#161F30] border border-gray-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-400" />
                <span>Restaurant Ecosystem</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Total Registered Restaurants</span>
                  <span className="font-bold text-white">{restaurants.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Approved & Live</span>
                  <span className="font-bold text-emerald-400">{approvedCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Pending Verification</span>
                  <span className="font-bold text-amber-400">{pendingCount}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Rejected / Suspended</span>
                  <span className="font-bold text-rose-400">{rejectedCount}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#161F30] border border-gray-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>User Demographics</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Active Online Users</span>
                  <span className="font-bold text-emerald-400 font-mono">{overview?.users?.onlineNow || 1}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Registered Diners</span>
                  <span className="font-bold text-white">{overview?.users?.diners || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Restaurant Owners & Staff</span>
                  <span className="font-bold text-white">{overview?.users?.owners || 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Platform Admins</span>
                  <span className="font-bold text-purple-400">{overview?.users?.admins || 0}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#161F30] border border-gray-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#FF6A00]" />
                <span>Financial Highlights</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Today's Gross Sales</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ₹{Number(overview?.financials?.todayRevenue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">All-Time Platform Volume</span>
                  <span className="font-bold text-white font-mono">
                    ₹{Number(overview?.financials?.totalRevenue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Total Pre-Orders Placed</span>
                  <span className="font-bold text-white">{overview?.financials?.totalOrders || 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Total Table Bookings</span>
                  <span className="font-bold text-white">{overview?.financials?.totalReservations || 0}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Reject Modal */}
      {rejectModalRest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#161F30] rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  Admin Action Required
                </span>
                <h3 className="text-lg font-bold text-white">
                  Reject "{rejectModalRest.name}" Application
                </h3>
              </div>
              <button
                onClick={() => setRejectModalRest(null)}
                className="text-gray-400 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-gray-300 font-semibold">Reason for Rejection / Required Updates *</label>
                <textarea
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. FSSAI License invalid or food safety documentation missing..."
                  className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 resize-none h-24"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalRest(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-sm transition-all flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
