import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Utensils, 
  CreditCard, 
  Sparkles, 
  QrCode, 
  Search, 
  Check, 
  X, 
  DollarSign, 
  RefreshCw, 
  CalendarCheck, 
  Layers, 
  Flame, 
  ChefHat, 
  AlertCircle,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCheck,
  Plus,
  Trash2,
  Edit2,
  UtensilsCrossed,
  Tag,
  Leaf,
  Sparkle,
  Coffee,
  CheckSquare,
  BellRing,
  Phone,
  UserCheck
} from 'lucide-react';
import { 
  restaurantApi, 
  tableApi, 
  reservationApi, 
  orderApi, 
  menuApi,
  waitlistApi,
  analyticsApi 
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { socket, joinRestaurantRoom } = useSocket();

  const [activeRestaurantId, setActiveRestaurantId] = useState(user?.restaurant?.id || 'rest-001');
  const [restaurantName, setRestaurantName] = useState(user?.restaurant?.name || 'Sangeetha Veg Gourmet');
  const [restaurantDetails, setRestaurantDetails] = useState(null);

  // Dashboard Data
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [menuData, setMenuData] = useState({ categories: [], items: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [reservationFilter, setReservationFilter] = useState('ALL');
  const [orderFilter, setOrderFilter] = useState('ALL');

  // Verification Code State
  const [verifyCode, setVerifyCode] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  // Menu Management State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemPrepTime, setItemPrepTime] = useState('15');
  const [itemCatId, setItemCatId] = useState('');
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemSpice, setItemSpice] = useState('MILD');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('ALL');

  const fetchDashboardData = async () => {
    try {
      const [restRes, rRes, oRes, tRes, mRes, wRes] = await Promise.all([
        restaurantApi.getById(activeRestaurantId).catch(() => ({ data: null })),
        reservationApi.getByRestaurant(activeRestaurantId),
        orderApi.getByRestaurant(activeRestaurantId),
        tableApi.getByRestaurant(activeRestaurantId),
        menuApi.getByRestaurant(activeRestaurantId).catch(() => ({ data: { categories: [], items: [] } })),
        waitlistApi.getByRestaurant(activeRestaurantId).catch(() => ({ data: [] }))
      ]);

      if (restRes.data) {
        setRestaurantDetails(restRes.data);
      }
      setReservations(rRes.data || []);
      setOrders(oRes.data || []);
      setTables(tRes.data || []);
      setMenuData(mRes.data || { categories: [], items: [] });
      setWaitlist(wRes.data || []);
    } catch (e) {
      console.error('Failed to load owner dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (user?.restaurant?.id) {
      setActiveRestaurantId(user.restaurant.id);
      if (user.restaurant.name) setRestaurantName(user.restaurant.name);
    }
  }, [user?.restaurant]);

  useEffect(() => {
    fetchDashboardData();
    joinRestaurantRoom(activeRestaurantId);
  }, [activeRestaurantId]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleTableStatusChanged = (updatedTable) => {
      setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
    };

    const handleReservationCreated = (newRes) => {
      setReservations(prev => [newRes, ...prev]);
    };

    const handleReservationUpdated = (updatedRes) => {
      setReservations(prev => prev.map(r => r.id === updatedRes.id ? { ...r, ...updatedRes } : r));
    };

    const handleOrderCreated = (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
    };

    const handleOrderStatusChanged = (updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
    };

    const handleOrderCancelled = (cancelledOrder) => {
      setOrders(prev => prev.map(o => o.id === cancelledOrder.id ? { ...o, ...cancelledOrder } : o));
    };

    const handleReceiptUpdated = () => {
      fetchDashboardData();
    };

    const handleWaitlistUpdated = (entry) => {
      setWaitlist(prev => {
        const exists = prev.find(w => w.id === entry.id);
        if (exists) {
          return prev.map(w => w.id === entry.id ? entry : w);
        }
        return [...prev, entry];
      });
    };

    socket.on('table_status_changed', handleTableStatusChanged);
    socket.on('reservation_created', handleReservationCreated);
    socket.on('reservation_updated', handleReservationUpdated);
    socket.on('order_created', handleOrderCreated);
    socket.on('order_status_changed', handleOrderStatusChanged);
    socket.on('order_cancelled', handleOrderCancelled);
    socket.on('receipt_updated', handleReceiptUpdated);
    socket.on('waitlist_updated', handleWaitlistUpdated);

    return () => {
      socket.off('table_status_changed', handleTableStatusChanged);
      socket.off('reservation_created', handleReservationCreated);
      socket.off('reservation_updated', handleReservationUpdated);
      socket.off('order_created', handleOrderCreated);
      socket.off('order_status_changed', handleOrderStatusChanged);
      socket.off('order_cancelled', handleOrderCancelled);
      socket.off('receipt_updated', handleReceiptUpdated);
      socket.off('waitlist_updated', handleWaitlistUpdated);
    };
  }, [socket]);

  const showNotification = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4500);
  };

  // =========================================================================
  // 1. STAGE 1: CONFIRM OR DECLINE TABLE / ORDER
  // =========================================================================
  const handleConfirmReservation = async (resId) => {
    try {
      const res = reservations.find(r => r.id === resId);
      await reservationApi.updateStatus(resId, 'CONFIRMED');
      if (res?.table_id) {
        await tableApi.updateStatus(res.table_id, 'RESERVED');
      }
      showNotification('✅ Table Booking Confirmed! Table reserved.');
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to confirm reservation');
    }
  };

  const handleDeclineReservation = async (resId) => {
    const res = reservations.find(r => r.id === resId);
    const hasOrder = Boolean(res?.order_id && Number(res?.order_total) > 0);
    const msg = hasOrder
      ? `Cancel this table booking?\n\n⚠️ NOTE: This reservation has an attached food pre-order of ₹${Number(res.order_total).toFixed(0)}. The kitchen order and receipt will also be CANCELLED automatically.`
      : 'Are you sure you want to cancel / decline this table booking?';

    if (!confirm(msg)) return;
    try {
      await reservationApi.updateStatus(resId, 'CANCELLED');
      showNotification('❌ Table Booking & Associated Food Order Cancelled. Table Released.');
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to decline reservation');
    }
  };

  const handleConfirmOrderAndTable = async (res) => {
    try {
      await reservationApi.updateStatus(res.id, 'CONFIRMED');
      showNotification('✅ ORDER & TABLE CONFIRMED! Kitchen ticket prepared.');
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to confirm order and table');
    }
  };

  const handleDeclineOrderAndTable = async (res) => {
    const msg = `Decline both this food order (₹${Number(res?.order_total || 0).toFixed(0)}) and table reservation?\n\nThe kitchen ticket will be voided and table released.`;
    if (!confirm(msg)) return;
    try {
      await reservationApi.updateStatus(res.id, 'CANCELLED');
      showNotification('❌ ORDER & TABLE DECLINED.');
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to decline order and table');
    }
  };

  // =========================================================================
  // 2. STAGE 2: SEAT CUSTOMER & START COOKING
  // =========================================================================
  const handleSeatCustomer = async (res) => {
    try {
      await reservationApi.updateStatus(res.id, 'SEATED');
      if (res.table_id) {
        await tableApi.updateStatus(res.table_id, 'OCCUPIED');
      }
      if (res.order_id && res.order_total > 0) {
        await orderApi.updateStatus(res.order_id, 'PREPARING');
      }
      showNotification(`🎉 Customer seated at Table ${res.table_number || 'T-01'}! Marked OCCUPIED.`);
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to seat customer');
    }
  };

  // =========================================================================
  // 3. STAGE 3: FOOD PREPARATION & SERVING LIFECYCLE
  // =========================================================================
  const handleConfirmOrder = async (orderId) => {
    try {
      await orderApi.updateStatus(orderId, 'CONFIRMED');
      showNotification('✅ Food Order Accepted! Kitchen ticket generated.');
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to confirm order');
    }
  };

  const handleDeclineOrder = async (orderId) => {
    if (!confirm('Decline this food order?')) return;
    try {
      await orderApi.updateStatus(orderId, 'CANCELLED');
      showNotification('❌ Food Order Declined.');
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to decline order');
    }
  };

  const handleUpdateFoodStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      const label = newStatus === 'PREPARING' ? '🔥 COOKING' : newStatus === 'SERVED' ? '🍽️ DINED IN (SERVED)' : newStatus;
      showNotification(`🍳 Food status updated to: ${label}`);
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to update food status');
    }
  };

  // =========================================================================
  // 4. STAGE 4: BILLING & PAYMENT SETTLEMENT
  // =========================================================================
  const handleMarkPaymentReceived = async (orderId, resId, tableId) => {
    try {
      if (orderId) {
        await orderApi.updateStatus(orderId, 'SERVED');
      }
      if (resId) {
        await reservationApi.updateStatus(resId, 'COMPLETED');
      }
      if (tableId) {
        await tableApi.updateStatus(tableId, 'CLEANING');
      }
      showNotification('💰 Payment Marked as RECEIVED! Table switched to 🟠 CLEANING.');
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to record payment');
    }
  };

  // =========================================================================
  // 5. STAGE 5: TABLE TURNOVER & CLEANING COMPLETION
  // =========================================================================
  const handleUpdateTableStatus = async (tableId, newStatus) => {
    try {
      await tableApi.updateStatus(tableId, newStatus);
      showNotification(`🪑 Table status updated to: ${newStatus}`);
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to update table status');
    }
  };

  const handleFinishCleaning = async (tableId, tableNumber) => {
    try {
      await tableApi.updateStatus(tableId, 'AVAILABLE');
      showNotification(`🧹 Cleaning complete! Table ${tableNumber} is now 🟢 AVAILABLE for next party.`);
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to mark table available');
    }
  };

  // =========================================================================
  // 6. LIVE WAITLIST WORKFLOW (When Tables Are Full)
  // =========================================================================
  const handleNotifyWaitlistGuest = async (waitId, guestName) => {
    try {
      await waitlistApi.updateStatus(waitId, 'NOTIFIED');
      showNotification(`🔔 Table Ready Alert sent to ${guestName}! Customer notified to come to host desk.`);
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to send alert');
    }
  };

  const handleSeatWaitlistGuest = async (waitId, guestName, tableId) => {
    try {
      await waitlistApi.updateStatus(waitId, 'SEATED');
      if (tableId) {
        await tableApi.updateStatus(tableId, 'OCCUPIED');
      }
      showNotification(`🎉 Seated waitlist guest ${guestName}! Marked table OCCUPIED.`);
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to seat waitlist guest');
    }
  };

  const handleCancelWaitlistGuest = async (waitId) => {
    if (!confirm('Remove this party from the live waitlist?')) return;
    try {
      await waitlistApi.updateStatus(waitId, 'CANCELLED');
      showNotification('Removed party from waitlist.');
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to cancel waitlist party');
    }
  };

  // =========================================================================
  // 7. DINE-IN CODE VERIFICATION
  // =========================================================================
  const handleVerifyDineInCode = async (e) => {
    if (e) e.preventDefault();
    setVerifyError('');
    setVerifySuccess('');
    
    if (!verifyCode.trim()) {
      setVerifyError('Please enter a Dine-In Code or Reservation ID.');
      return;
    }

    const cleanInput = verifyCode.trim().toUpperCase().replace('DIN-', '');
    const matched = reservations.find(r => 
      r.id.toUpperCase().includes(cleanInput) || 
      (r.table_number && r.table_number.toUpperCase() === cleanInput)
    );

    if (!matched) {
      setVerifyError(`No active reservation found matching "${verifyCode}".`);
      return;
    }

    try {
      await reservationApi.updateStatus(matched.id, 'SEATED');
      if (matched.table_id) {
        await tableApi.updateStatus(matched.table_id, 'OCCUPIED');
      }
      if (matched.order_id && matched.order_total > 0) {
        await orderApi.updateStatus(matched.order_id, 'PREPARING');
      }

      setVerifySuccess(`Verified Code DIN-${matched.id.slice(0, 6).toUpperCase()}! Customer seated at Table ${matched.table_number || 'T-01'}.`);
      setVerifyCode('');
      await fetchDashboardData();
    } catch (err) {
      setVerifyError(err.message || 'Verification failed');
    }
  };

  // =========================================================================
  // 8. MENU MANAGEMENT ACTIONS
  // =========================================================================
  const handleOpenAddDishModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemDesc('');
    setItemPrice('');
    setItemPrepTime('15');
    setItemCatId(menuData.categories[0]?.id || '');
    setItemIsVeg(true);
    setItemImageUrl('');
    setItemSpice('MILD');
    setIsMenuModalOpen(true);
  };

  const handleOpenEditDishModal = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description || '');
    setItemPrice(item.price.toString());
    setItemPrepTime(item.prep_time_minutes?.toString() || '15');
    setItemCatId(item.category_id || (menuData.categories[0]?.id || ''));
    setItemIsVeg(item.is_vegetarian === 1 || item.is_vegetarian === true);
    setItemImageUrl(item.image_url || '');
    setItemSpice(item.spiciness_level || 'MILD');
    setIsMenuModalOpen(true);
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !itemPrice) {
      alert('Please provide dish name and price.');
      return;
    }

    try {
      if (editingItem) {
        await menuApi.updateItem(editingItem.id, {
          name: itemName.trim(),
          description: itemDesc.trim(),
          price: parseFloat(itemPrice),
          prep_time_minutes: parseInt(itemPrepTime, 10) || 15,
          category_id: itemCatId || (menuData.categories[0]?.id || null),
          is_vegetarian: itemIsVeg ? 1 : 0,
          image_url: itemImageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
          spiciness_level: itemSpice
        });
        showNotification(`✅ Updated "${itemName}" (Price: ₹${itemPrice})`);
      } else {
        await menuApi.createItem({
          restaurant_id: activeRestaurantId,
          name: itemName.trim(),
          description: itemDesc.trim(),
          price: parseFloat(itemPrice),
          prep_time_minutes: parseInt(itemPrepTime, 10) || 15,
          category_id: itemCatId || (menuData.categories[0]?.id || null),
          is_vegetarian: itemIsVeg ? 1 : 0,
          image_url: itemImageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
          spiciness_level: itemSpice
        });
        showNotification(`🎉 Added new dish "${itemName}" at ₹${itemPrice} to menu!`);
      }

      setIsMenuModalOpen(false);
      const mRes = await menuApi.getByRestaurant(activeRestaurantId);
      setMenuData(mRes.data || { categories: [], items: [] });
    } catch (err) {
      alert(err.message || 'Failed to save menu item');
    }
  };

  const handleDeleteMenuItem = async (id, name) => {
    if (!confirm(`Delete "${name}" from menu?`)) return;
    try {
      await menuApi.deleteItem(id);
      showNotification(`🗑️ Deleted "${name}" from menu.`);
      const mRes = await menuApi.getByRestaurant(activeRestaurantId);
      setMenuData(mRes.data || { categories: [], items: [] });
    } catch (err) {
      alert(err.message || 'Failed to delete menu item');
    }
  };

  const handleToggleItemAvailability = async (item) => {
    try {
      await menuApi.updateItem(item.id, {
        is_available: item.is_available ? 0 : 1
      });
      const mRes = await menuApi.getByRestaurant(activeRestaurantId);
      setMenuData(mRes.data || { categories: [], items: [] });
      showNotification(`Dish availability toggled: ${item.name}`);
    } catch (err) {
      alert(err.message || 'Failed to toggle availability');
    }
  };

  // Filtered Lists
  const filteredReservations = reservations.filter(r => {
    if (reservationFilter === 'ALL') return true;
    return r.status === reservationFilter;
  });

  // Only display genuine customer food orders that have actual ordered dishes
  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'ALL') return true;
    return o.status === orderFilter;
  });

  const activeWaitlist = waitlist.filter(w => w.status === 'WAITING' || w.status === 'NOTIFIED');

  const filteredMenuItems = (menuData.items || []).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(menuSearchQuery.toLowerCase()));
    const matchesCategory = selectedMenuCategory === 'ALL' || item.category_id === selectedMenuCategory;
    return matchesSearch && matchesCategory;
  });

  // Summary Metrics
  const pendingReservationsCount = reservations.filter(r => r.status === 'PENDING').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PREPARING').length;
  const availableTablesCount = tables.filter(t => t.status === 'AVAILABLE').length;
  const occupiedTablesCount = tables.filter(t => t.status === 'OCCUPIED').length;
  const cleaningTablesCount = tables.filter(t => t.status === 'CLEANING').length;
  const waitlistQueueCount = activeWaitlist.length;

  const firstAvailableTable = tables.find(t => t.status === 'AVAILABLE');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 bg-[#0B0F19]">
        <div className="bg-[#161F30] rounded-3xl h-96 animate-pulse border border-gray-800" />
      </div>
    );
  }

  const ALL_RESTAURANTS = [
    { id: 'rest-001', name: 'Sangeetha Veg Gourmet', icon: '🥬' },
    { id: 'rest-002', name: 'Barbeque Nation Grill', icon: '🥩' },
    { id: 'rest-003', name: 'Toscano Italian Trattoria', icon: '🍕' },
    { id: 'rest-004', name: 'Mainland China Imperial House', icon: '🥢' },
    { id: 'rest-005', name: 'The Coastal Catch Seafood Bistro', icon: '🦐' },
    { id: 'rest-006', name: 'Paradise Biryani & Kebab Hub', icon: '🍗' }
  ];

  const handleClearOperationalData = async () => {
    if (!confirm('Are you sure you want to clear all active queues, reservations, and orders for this branch? This will reset all tables to AVAILABLE.')) return;
    try {
      await restaurantApi.clearData(activeRestaurantId);
      showNotification('🧹 All active queues, orders, and reservations cleared successfully! Tables reset to AVAILABLE.');
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to clear operational data');
    }
  };

  const isUnderVerification = restaurantDetails?.verification_status === 'UNDER_VERIFICATION';
  const isRejected = restaurantDetails?.verification_status === 'REJECTED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 bg-[#0B0F19]">
      
      {/* Verification Status Warning Banner */}
      {isUnderVerification && (
        <div className="p-5 rounded-3xl bg-amber-950/60 border-2 border-amber-500/60 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 text-lg font-bold">
              ⏳
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-amber-300">Restaurant Under Admin Verification</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400 border border-amber-500/30 uppercase">
                  Pending Approval
                </span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Your restaurant registration is currently undergoing verification by Smart Table Platform Admin. Online customer reservations & bookings will be automatically enabled once approved. You can set up and refine your menu in the meantime.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 bg-[#0F172A] px-3 py-2 rounded-2xl border border-amber-500/30">
            <span className="text-[10px] font-bold text-amber-400">FSSAI: {restaurantDetails?.fssai_license || 'FSSAI-220011993344'}</span>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-5 rounded-3xl bg-rose-950/60 border-2 border-rose-500/60 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 text-lg font-bold">
              ❌
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-rose-300">Application Requires Revision</h3>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                Admin Note: "{restaurantDetails?.admin_notes || 'Please update valid FSSAI documents or complete menu items.'}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header & Live Operational Metrics */}
      <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isUnderVerification ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isUnderVerification ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isUnderVerification ? 'Restaurant Under Verification • Preview Console' : 'Live Restaurant Manager Console'}
              </span>

              {/* Branch Switcher Pill */}
              <div className="flex items-center gap-1.5 bg-[#0F172A] px-2.5 py-1 rounded-xl border border-gray-700">
                <Store className="w-3.5 h-3.5 text-[#C81E1E]" />
                <span className="text-[10px] text-gray-400 font-bold">Branch:</span>
                <select
                  value={activeRestaurantId}
                  onChange={(e) => {
                    const selected = ALL_RESTAURANTS.find(r => r.id === e.target.value);
                    if (selected) {
                      setActiveRestaurantId(selected.id);
                      setRestaurantName(selected.name);
                    }
                  }}
                  className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer"
                >
                  {ALL_RESTAURANTS.map(r => (
                    <option key={r.id} value={r.id} className="bg-[#0F172A] text-white">
                      {r.icon} {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>


            <h1 className="text-2xl sm:text-3xl font-black text-white">{restaurantName}</h1>
            <p className="text-xs text-gray-400">
              Real-Time Customer Dining & Kitchen Operations (Only Real Manual Customer Orders)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleOpenAddDishModal}
              className="py-2.5 px-4 rounded-xl bg-[#C81E1E] hover:bg-[#A11414] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Dish to Menu</span>
            </button>

            <button
              onClick={handleClearOperationalData}
              className="py-2.5 px-3.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-500/40 transition-colors flex items-center gap-1.5"
              title="Clear all active queues, orders, and bookings"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear / Reset Queue & Orders</span>
            </button>

            <button
              onClick={fetchDashboardData}
              className="py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-gray-800 text-gray-200 text-xs font-bold border border-gray-700 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#C81E1E]" />
              <span>Refresh Live Data</span>
            </button>
          </div>
        </div>



        {/* 6 Summary Stat Pills with Interactive Workflow Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800 space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Pending Bookings</span>
            <span className="text-2xl font-black text-white">{pendingReservationsCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800 space-y-1">
            <span className="text-[10px] font-bold text-[#C81E1E] uppercase tracking-wider block">Active Food Orders</span>
            <span className="text-2xl font-black text-white">{pendingOrdersCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800 space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Available Tables</span>
            <span className="text-2xl font-black text-white">{availableTablesCount} / {tables.length}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800 space-y-1">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Occupied Tables</span>
            <span className="text-2xl font-black text-white">{occupiedTablesCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800 space-y-1">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">Cleaning Tables</span>
            <span className="text-2xl font-black text-white">{cleaningTablesCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Live Queue Waitlist</span>
            <span className="text-2xl font-black text-purple-400">{waitlistQueueCount} in Line</span>
          </div>
        </div>

        {/* Global Toast / Action Notice */}
        {actionNotice && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* 2. Section: Live Waitlist Queue Manager (When Tables are Full) */}
      <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[#C81E1E]" />
                <span>Live Waitlist & Waiting Queue Manager</span>
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Active when floor tables are full. Notify waiting customers when tables become clean or seat directly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-xs font-bold text-purple-300">
              {activeWaitlist.length} Waiting Parties in Line
            </span>
          </div>
        </div>

        {activeWaitlist.length === 0 ? (
          <div className="text-center py-6 bg-[#0F172A] rounded-2xl border border-gray-800 text-xs text-gray-400 space-y-1">
            <Users className="w-6 h-6 text-gray-500 mx-auto" />
            <p>No parties currently waiting in line. (Queue will auto-fill when all floor tables are occupied).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeWaitlist.map((w, idx) => {
              const isNotified = w.status === 'NOTIFIED';

              return (
                <div
                  key={w.id}
                  className={`p-4 rounded-2xl border space-y-3.5 flex flex-col justify-between transition-all ${
                    isNotified
                      ? 'bg-amber-950/40 border-amber-500/40 ring-1 ring-amber-500/40'
                      : 'bg-[#0F172A] border-gray-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#C81E1E] text-white font-bold text-xs flex items-center justify-center">
                          #{w.queue_position || idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-white">{w.customer_name}</h4>
                          <span className="text-[10px] text-gray-400 font-mono">Token: QUE-{w.id.slice(0, 5).toUpperCase()}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isNotified 
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                          : 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                      }`}>
                        {isNotified ? '🔔 TABLE ALERTED' : '⏳ WAITING'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-300 pt-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {w.party_size} Guests
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Phone className="w-3.5 h-3.5 text-[#C81E1E]" />
                        {w.customer_phone || '+91 98765 43210'}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Alert Table Ready or Seat at First Open Table */}
                  <div className="space-y-2 pt-2 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleNotifyWaitlistGuest(w.id, w.customer_name)}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all ${
                          isNotified
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-[#161F30] hover:bg-gray-800 text-amber-300 border border-amber-500/40'
                        }`}
                        title="Send SMS / App notification that table is ready"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>{isNotified ? 'Re-Alert Guest' : 'Notify Table Ready'}</span>
                      </button>

                      <button
                        onClick={() => handleCancelWaitlistGuest(w.id)}
                        className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-500/40 text-xs font-bold"
                        title="Remove from queue"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {firstAvailableTable && (
                      <button
                        onClick={() => handleSeatWaitlistGuest(w.id, w.customer_name, firstAvailableTable.id)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Seat at Open Table {firstAvailableTable.table_number}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Section: Dine-In Code Verification Card (Host Arrival Desk) */}
      <div className="bg-[#161F30] rounded-3xl p-6 border border-gray-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#C81E1E]" />
            <h2 className="text-base sm:text-lg font-bold text-white">Dine-In Code Verification & Arrival Seating</h2>
          </div>
          <span className="text-xs text-gray-400">Step 2: Verify guest pass, seat at table and trigger kitchen ticket</span>
        </div>

        <form onSubmit={handleVerifyDineInCode} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="Enter Dine-In Pass Code (e.g. DIN-4ACA9A79) or Table # (T-01)..."
              className="w-full bg-[#0F172A] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C81E1E]"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#C81E1E] hover:bg-[#A11414] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 shrink-0 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verify & Seat Customer</span>
          </button>
        </form>

        {verifySuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{verifySuccess}</span>
          </div>
        )}

        {verifyError && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{verifyError}</span>
          </div>
        )}
      </div>

      {/* 4. Section: Table Reservations (Step 1 Workflow: Confirm Order & Table / Decline) */}
      <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#C81E1E]" />
              <span>Step 1: Table Reservations (Confirm Order & Table / Decline)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Confirm or decline incoming bookings.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['ALL', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setReservationFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  reservationFilter === st
                    ? 'bg-[#C81E1E] text-white shadow-xs'
                    : 'bg-[#0F172A] text-gray-300 hover:bg-gray-800 border border-gray-700'
                }`}
              >
                {st === 'ALL' ? `All (${reservations.length})` : st}
              </button>
            ))}
          </div>
        </div>

        {filteredReservations.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No reservations matching filter ({reservationFilter}).</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReservations.map((res) => {
              const isPending = res.status === 'PENDING';
              const isConfirmed = res.status === 'CONFIRMED';
              const isSeated = res.status === 'SEATED';
              const isCancelled = res.status === 'CANCELLED';
              const isCompleted = res.status === 'COMPLETED';
              const hasOrder = Boolean(res.order_id && Number(res.order_total) > 0);

              return (
                <div
                  key={res.id}
                  className="p-5 rounded-2xl bg-[#0F172A] border border-gray-800 space-y-4 hover:border-gray-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-black text-white">{res.user_name || 'Guest Diner'}</span>
                        <p className="text-[11px] text-gray-400 font-mono">ID: DIN-{res.id.slice(0, 6).toUpperCase()}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isPending ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30' :
                        isConfirmed ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
                        isSeated ? 'bg-blue-950/60 text-blue-400 border border-blue-500/30' :
                        isCompleted ? 'bg-purple-950/60 text-purple-400 border border-purple-500/30' :
                        'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      }`}>
                        {res.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 pt-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-[#C81E1E]" />
                        {res.reservation_date} at {res.reservation_time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {res.guest_count} Guests
                      </span>
                      <span>•</span>
                      <span className="font-bold text-amber-400">
                        Table: {res.table_number || 'T-01'}
                      </span>
                    </div>

                    {res.special_requests && (
                      <p className="text-[11px] text-gray-400 bg-[#161F30] p-2 rounded-lg border border-gray-800 italic">
                        "{res.special_requests}"
                      </p>
                    )}

                    {hasOrder ? (
                      <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-bold">
                        <span>🍽️ Customer Pre-Order Attached</span>
                        <span>₹{Number(res.order_total).toFixed(0)}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-400 bg-[#161F30] px-3 py-1.5 rounded-xl border border-gray-800">
                        <span>🪑 Table-Only Booking (No food pre-ordered)</span>
                      </div>
                    )}
                  </div>

                  {/* Complete End-to-End Workflow Buttons */}
                  <div className="space-y-2 pt-3 border-t border-gray-800">
                    
                    {/* If PENDING: Show Confirm & Decline buttons */}
                    {isPending && (
                      <div className="flex items-center gap-2">
                        {hasOrder ? (
                          <button
                            onClick={() => handleConfirmOrderAndTable(res)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                            title="Confirm both food order and table booking"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Confirm Order & Table</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConfirmReservation(res.id)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                            title="Confirm table reservation"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Confirm Table</span>
                          </button>
                        )}

                        <button
                          onClick={() => hasOrder ? handleDeclineOrderAndTable(res) : handleDeclineReservation(res.id)}
                          className="py-2.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                          title="Decline booking"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}

                    {/* If CONFIRMED: Ready to Seat Diner */}
                    {isConfirmed && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-emerald-400 font-bold px-1">
                          <span>✅ Confirmed & Table Reserved</span>
                          <button
                            onClick={() => handleDeclineReservation(res.id)}
                            className="text-[10px] text-rose-400 hover:underline"
                          >
                            Decline / Cancel
                          </button>
                        </div>
                        <button
                          onClick={() => handleSeatCustomer(res)}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#C81E1E] hover:bg-[#A11414] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                        >
                          <Users className="w-4 h-4" />
                          <span>Guest Arrived → Seat Customer (Table {res.table_number || 'T-01'})</span>
                        </button>
                      </div>
                    )}

                    {/* If SEATED: Diner is at the table eating */}
                    {isSeated && (
                      <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs">
                        <span className="text-blue-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Diner Seated at Table {res.table_number || 'T-01'}</span>
                        </span>
                        <span className="text-[10px] text-gray-400">See Billing Below</span>
                      </div>
                    )}

                    {/* If COMPLETED */}
                    {isCompleted && (
                      <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-center text-xs font-bold text-purple-300 flex items-center justify-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Dining Completed & Closed</span>
                      </div>
                    )}

                    {/* If CANCELLED */}
                    {isCancelled && (
                      <div className="flex items-center justify-between text-xs text-rose-400">
                        <span>❌ Booking Cancelled</span>
                        <button
                          onClick={() => handleConfirmReservation(res.id)}
                          className="text-[11px] text-emerald-400 hover:underline font-bold"
                        >
                          Re-Confirm
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Section: Food Orders & Items Display (Step 3 Workflow: Cooking Lifecycle) */}
      <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-[#C81E1E]" />
              <span>Step 3: Kitchen Queue (Actual Food Orders Placed by Diners)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Only authentic food orders placed by customers appear here. Advance status: Ordered → Cooking → Dined In
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'SERVED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setOrderFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  orderFilter === st
                    ? 'bg-[#C81E1E] text-white shadow-xs'
                    : 'bg-[#0F172A] text-gray-300 hover:bg-gray-800 border border-gray-700'
                }`}
              >
                {st === 'ALL' ? `All (${filteredOrders.length})` : st}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 bg-[#0F172A] rounded-2xl border border-gray-800 text-xs text-gray-400 space-y-1">
            <Utensils className="w-6 h-6 text-gray-500 mx-auto" />
            <p>No food orders matching filter ({orderFilter}).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOrders.map((ord) => {
              const isPending = ord.status === 'PENDING';
              const isConfirmed = ord.status === 'CONFIRMED';
              const isCooking = ord.status === 'PREPARING';
              const isServed = ord.status === 'SERVED';
              const isCancelled = ord.status === 'CANCELLED';

              return (
                <div
                  key={ord.id}
                  className={`p-5 rounded-2xl border space-y-4 transition-all flex flex-col justify-between ${
                    isCancelled
                      ? 'bg-[#0F172A]/70 border-rose-500/30 opacity-80'
                      : 'bg-[#0F172A] border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                      <div>
                        <span className="text-sm font-black text-white">Order #{ord.id.slice(0, 8).toUpperCase()}</span>
                        <p className="text-[11px] text-gray-400">
                          Table: <strong className="text-white">{ord.table_number || 'T-01'}</strong> • Guest: {ord.user_name || 'Diner'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isPending ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30' :
                        isCooking ? 'bg-orange-950/60 text-orange-400 border border-orange-500/30 animate-pulse' :
                        isServed ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
                        isConfirmed ? 'bg-blue-950/60 text-blue-400 border border-blue-500/30' :
                        'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                      }`}>
                        {isCooking ? '🔥 COOKING' : isServed ? '🍽️ DINED IN / SERVED' : isPending ? '⏳ ORDERED' : isCancelled ? '❌ CANCELLED' : ord.status}
                      </span>
                    </div>

                    {/* Display Actual Dishes Ordered */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Dishes Ordered by Diner:
                      </span>
                      <div className="space-y-1.5 bg-[#161F30] p-3 rounded-xl border border-gray-800">
                        {ord.items && ord.items.length > 0 ? (
                          ord.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-gray-200 py-1 border-b border-gray-800 last:border-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${isCancelled ? 'text-gray-500' : 'text-[#C81E1E]'}`}>{it.quantity}x</span>
                                <span className={`font-semibold ${isCancelled ? 'text-gray-400 line-through' : 'text-white'}`}>{it.name || it.item_name}</span>
                                {it.customization && (
                                  <span className="text-[10px] text-gray-400 italic">({it.customization})</span>
                                )}
                              </div>
                                <span className="font-bold text-gray-200 font-mono">₹{Number(it.total_price || (it.unit_price || it.price || 0) * (it.quantity || 1)).toFixed(0)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-400 py-1 italic">
                            Dine-In Order (No specific items recorded yet)
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-gray-400">Total Order Amount:</span>
                        <span className={`text-sm font-black ${isCancelled ? 'text-gray-400 line-through' : 'text-[#C81E1E]'}`}>
                          ₹{Number(ord.total_amount || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accept / Decline & Food Status Progression Buttons */}
                  <div className="space-y-2 pt-3 border-t border-gray-800">
                    {isCancelled ? (
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <X className="w-4 h-4" />
                        <span>Food Order Cancelled (Kitchen Ticket Voided)</span>
                      </div>
                    ) : (
                      <>
                        {/* If Pending: Confirm or Decline */}
                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleConfirmOrder(ord.id)}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                              title="Confirm and accept this food order"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Confirm Order</span>
                            </button>

                            <button
                              onClick={() => handleDeclineOrder(ord.id)}
                              className="py-2 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                              title="Decline this food order"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline Order</span>
                            </button>
                          </div>
                        )}

                        {/* Progression Actions: Start Cooking → Mark Served */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleUpdateFoodStatus(ord.id, 'PREPARING')}
                            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                              isCooking 
                                ? 'bg-orange-600 text-white border-orange-500 shadow-md ring-2 ring-orange-500/40' 
                                : 'bg-[#161F30] text-gray-300 border-gray-700 hover:bg-gray-800'
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            <span>{isCooking ? 'Now Cooking 🔥' : 'Start Cooking'}</span>
                          </button>

                          <button
                            onClick={() => handleUpdateFoodStatus(ord.id, 'SERVED')}
                            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                              isServed 
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/40' 
                                : 'bg-[#161F30] text-gray-300 border-gray-700 hover:bg-gray-800'
                            }`}
                          >
                            <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isServed ? 'Served / Dined In 🍽️' : 'Mark Dined In (Served)'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Section: Food Menu & Price Manager (Add Dish, Set Price, Edit & Delete) */}
      <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-[#C81E1E]" />
              <span>Food Menu & Pricing Manager</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Add new dishes, set prices in ₹, manage categories, prep times, and toggle availability
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddDishModal}
              className="py-2.5 px-4 rounded-xl bg-[#C81E1E] hover:bg-[#A11414] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Food Dish</span>
            </button>
          </div>
        </div>

        {/* Category Pills & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedMenuCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedMenuCategory === 'ALL'
                  ? 'bg-[#C81E1E] text-white shadow-xs'
                  : 'bg-[#0F172A] text-gray-300 hover:bg-gray-800 border border-gray-700'
              }`}
            >
              All Items ({(menuData.items || []).length})
            </button>
            {(menuData.categories || []).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedMenuCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedMenuCategory === cat.id
                    ? 'bg-[#C81E1E] text-white shadow-xs'
                    : 'bg-[#0F172A] text-gray-300 hover:bg-gray-800 border border-gray-700'
                }`}
              >
                {cat.name} ({cat.items?.length || 0})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              placeholder="Search dish by name..."
              className="w-full bg-[#0F172A] border border-gray-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C81E1E]"
            />
          </div>
        </div>

        {/* Menu Dishes Grid */}
        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-8 bg-[#0F172A] rounded-2xl border border-gray-800 space-y-2">
            <Utensils className="w-8 h-8 text-gray-500 mx-auto" />
            <p className="text-xs text-gray-400">No menu items found. Tap "+ Add Food Dish" to create your first item.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenuItems.map((item) => {
              const catName = menuData.categories.find(c => c.id === item.category_id)?.name || 'General';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#0F172A] border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 border flex items-center justify-center rounded p-0.5 shrink-0 ${
                          item.is_vegetarian ? 'border-emerald-500' : 'border-rose-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.is_vegetarian ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-white leading-tight">{item.name}</h4>
                          <span className="text-[10px] text-gray-400">{catName}</span>
                        </div>
                      </div>

                      {/* Price in ₹ */}
                      <span className="text-base font-black text-[#C81E1E] shrink-0">
                        ₹{Number(item.price).toFixed(0)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {item.description || 'Delicious freshly prepared culinary dish.'}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        ~{item.prep_time_minutes || 15}m
                      </span>
                      {item.spiciness_level && item.spiciness_level !== 'NONE' && (
                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-amber-500" />
                          {item.spiciness_level}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2.5 border-t border-gray-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleItemAvailability(item)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                        item.is_available
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Sold Out (86)'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditDishModal(item)}
                        className="p-1.5 rounded-lg bg-[#161F30] hover:bg-gray-800 text-gray-300 border border-gray-700 flex items-center gap-1 text-xs font-semibold"
                        title="Edit Price & Details"
                      >
                        <Edit2 className="w-3 h-3 text-[#C81E1E]" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteMenuItem(item.id, item.name)}
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-500/40"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Section: Table Lifecycle & Turnover (Step 5 Workflow: Cleaning → Available) */}
      <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#C81E1E]" />
              <span>Step 5: Table Status Lifecycle & Turnover Manager</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              🟢 Table Available → 🔴 Table Occupied → 🟠 Cleaning Table → 🟢 Available
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#0F172A] border border-gray-700 text-xs font-bold text-gray-300">
            {tables.length} Floor Tables
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((tbl) => {
            const isAvail = tbl.status === 'AVAILABLE';
            const isOccupied = tbl.status === 'OCCUPIED';
            const isCleaning = tbl.status === 'CLEANING';
            const isReserved = tbl.status === 'RESERVED';

            return (
              <div
                key={tbl.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isAvail ? 'bg-emerald-950/40 border-emerald-500/40' :
                  isOccupied ? 'bg-rose-950/40 border-rose-500/40' :
                  isCleaning ? 'bg-orange-950/40 border-orange-500/40 ring-1 ring-orange-500/50' :
                  isReserved ? 'bg-amber-950/40 border-amber-500/40' :
                  'bg-[#0F172A] border-gray-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-white">{tbl.table_number}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isAvail ? 'bg-emerald-400 animate-pulse' :
                      isOccupied ? 'bg-rose-400' :
                      isCleaning ? 'bg-orange-400 animate-bounce' :
                      'bg-amber-400'
                    }`} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{tbl.capacity} Seats • {tbl.section || 'Main Dining'}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-800/80">
                  {isCleaning ? (
                    <button
                      onClick={() => handleFinishCleaning(tbl.id, tbl.table_number)}
                      className="w-full py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 transition-all"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Done Cleaning → Available</span>
                    </button>
                  ) : (
                    <select
                      value={tbl.status}
                      onChange={(e) => handleUpdateTableStatus(tbl.id, e.target.value)}
                      className="w-full bg-[#0F172A] border border-gray-700 rounded-lg p-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#C81E1E]"
                    >
                      <option value="AVAILABLE" className="bg-[#0F172A] text-emerald-400">🟢 Table Available</option>
                      <option value="OCCUPIED" className="bg-[#0F172A] text-rose-400">🔴 Table Occupied</option>
                      <option value="CLEANING" className="bg-[#0F172A] text-orange-400">🟠 Cleaning Table</option>
                      <option value="RESERVED" className="bg-[#0F172A] text-amber-400">🟡 Table Reserved</option>
                      <option value="BLOCKED" className="bg-[#0F172A] text-gray-400">⚪ Table Blocked</option>
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. Section: Billing & Payment Received (Step 4 Workflow: Pay → Clean Table) */}
      <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#C81E1E]" />
              <span>Step 4: Dine-In Billing & Payment Received</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Collect payments for food orders or settle table bookings.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservations.filter(r => r.status === 'SEATED' || r.status === 'CONFIRMED' || r.status === 'COMPLETED' || r.status === 'CANCELLED').map((res) => {
            const billAmount = Number(res.order_total || 0);
            const isCompleted = res.status === 'COMPLETED';
            const isCancelled = res.status === 'CANCELLED';
            const isRefundPending = res.payment_status === 'REFUND_PENDING';

            return (
              <div
                key={res.id}
                className={`p-5 rounded-2xl border space-y-4 transition-all flex flex-col justify-between ${
                  isCancelled 
                    ? 'bg-[#0F172A]/70 border-rose-500/30 opacity-80' 
                    : 'bg-[#0F172A] border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Table: {res.table_number || 'T-01'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isCancelled
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                        : isCompleted 
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' 
                        : billAmount > 0 
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-950/60 text-blue-400 border border-blue-500/30'
                    }`}>
                      {isCancelled 
                        ? (isRefundPending ? 'CANCELLED (REFUND PENDING)' : 'CANCELLED')
                        : isCompleted 
                        ? 'PAID / SETTLED' 
                        : billAmount > 0 
                        ? 'UNPAID BILL' 
                        : 'TABLE ONLY (DINE-IN)'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 font-medium">Guest: {res.user_name || 'Diner'}</p>
                  
                  {billAmount > 0 ? (
                    <div className="p-3 rounded-xl bg-[#161F30] border border-gray-800 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-400">
                        <span>Pre-Ordered Dishes Subtotal</span>
                        <span className={isCancelled ? 'text-gray-400 line-through' : 'text-white'}>₹{billAmount.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>GST (5%)</span>
                        <span className={isCancelled ? 'text-gray-400 line-through' : 'text-white'}>₹{(billAmount * 0.05).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-white pt-1 border-t border-gray-800">
                        <span>Grand Total</span>
                        <span className={isCancelled ? 'text-gray-400 line-through' : 'text-[#C81E1E] font-black'}>₹{(billAmount * 1.05).toFixed(0)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#161F30] border border-gray-800 text-xs text-gray-400 text-center">
                      <span>No pre-ordered food. Diner orders directly at table.</span>
                    </div>
                  )}
                </div>

                {isCancelled ? (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-center text-xs font-bold text-rose-400 flex items-center justify-center gap-1">
                    <X className="w-4 h-4" />
                    <span>{isRefundPending ? 'Refund Marked for Processing' : 'Bill Voided / Cancelled'}</span>
                  </div>
                ) : !isCompleted ? (
                  <button
                    onClick={() => handleMarkPaymentReceived(res.order_id, res.id, res.table_id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#C81E1E] hover:bg-[#A11414] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {billAmount > 0 
                        ? `Mark Payment Received (₹${(billAmount * 1.05).toFixed(0)})` 
                        : 'Close Table & Start Cleaning'}
                    </span>
                  </button>
                ) : (
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCheck className="w-4 h-4" />
                    <span>Payment Settled & Table Turned to Cleaning</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 9. Food Menu Item Create / Edit Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#161F30] rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-700 space-y-4">
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#C81E1E] uppercase tracking-wider">
                  Menu & Pricing Catalog
                </span>
                <h3 className="text-lg font-bold text-white">
                  {editingItem ? 'Edit Food Dish & Price' : 'Add New Food Menu Item'}
                </h3>
              </div>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-3.5 text-xs">
              
              {/* Dish Name */}
              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Paneer Butter Masala, Ghee Roast Dosa"
                  className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C81E1E]"
                />
              </div>

              {/* Price & Prep Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold flex items-center gap-1">
                    <span>Price in (₹) *</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="220"
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white font-bold text-sm focus:outline-none focus:border-[#C81E1E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Cooking Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itemPrepTime}
                    onChange={(e) => setItemPrepTime(e.target.value)}
                    placeholder="15"
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#C81E1E]"
                  />
                </div>
              </div>

              {/* Category & Spiciness Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Category</label>
                  <select
                    value={itemCatId}
                    onChange={(e) => setItemCatId(e.target.value)}
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#C81E1E]"
                  >
                    {menuData.categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#0F172A] text-white">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Spice Level</label>
                  <select
                    value={itemSpice}
                    onChange={(e) => setItemSpice(e.target.value)}
                    className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#C81E1E]"
                  >
                    <option value="NONE" className="bg-[#0F172A] text-white">Mild / Non-Spicy</option>
                    <option value="MILD" className="bg-[#0F172A] text-white">Medium Spice</option>
                    <option value="HOT" className="bg-[#0F172A] text-white">Hot & Spicy</option>
                    <option value="EXTRA_HOT" className="bg-[#0F172A] text-white">Very Spicy 🔥</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Description / Ingredients</label>
                <textarea
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Rich tomato cashew gravy with fresh cottage cheese cubes..."
                  className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#C81E1E] resize-none h-16"
                />
              </div>

              {/* Veg / Non-Veg Checkbox */}
              <div className="flex items-center gap-3 py-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-300">
                  <input
                    type="checkbox"
                    checked={itemIsVeg}
                    onChange={(e) => setItemIsVeg(e.target.checked)}
                    className="w-4 h-4 accent-[#C81E1E] rounded"
                  />
                  <span>Pure Vegetarian Dish (Leaf Tag)</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C81E1E] hover:bg-[#A11414] text-white font-bold shadow-sm transition-all flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Update Dish & Price' : 'Save Dish to Menu'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
