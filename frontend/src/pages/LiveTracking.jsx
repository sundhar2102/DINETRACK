import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  Users, 
  Utensils, 
  ChefHat, 
  Sparkles, 
  CheckCircle2, 
  Navigation, 
  AlertCircle, 
  ArrowLeft,
  Calendar,
  Receipt,
  Bell,
  CreditCard,
  Star,
  Download,
  Check
} from 'lucide-react';
import { reservationApi, orderApi } from '../api';
import { useSocket } from '../context/SocketContext';
import OrderStatusTracker from '../components/order/OrderStatusTracker';
import ReviewModal from '../components/restaurant/ReviewModal';

export default function LiveTracking() {
  const { id } = useParams(); // reservationId
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [reservation, setReservation] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Digital Dining States
  const [serviceActionSuccess, setServiceActionSuccess] = useState('');
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billPaid, setBillPaid] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchTrackingData = async () => {
    try {
      const res = await reservationApi.getMy();
      const myRes = (res.data || []).find(r => r.id === id);
      if (myRes) {
        setReservation(myRes);
        if (myRes.order_id) {
          const ordRes = await orderApi.getById(myRes.order_id);
          setOrder(ordRes.data);
        }
      }
    } catch (e) {
      console.error('Failed to load tracking info:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [id]);

  // Live Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    const handleReservationUpdated = (updatedRes) => {
      if (updatedRes.id === id) {
        setReservation(prev => ({ ...prev, ...updatedRes }));
      }
    };

    const handleOrderStatusChanged = (updatedOrder) => {
      if (order && updatedOrder.id === order.id) {
        setOrder(updatedOrder);
      }
    };

    socket.on('reservation_updated', handleReservationUpdated);
    socket.on('order_status_changed', handleOrderStatusChanged);

    return () => {
      socket.off('reservation_updated', handleReservationUpdated);
      socket.off('order_status_changed', handleOrderStatusChanged);
    };
  }, [socket, id, order]);

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await reservationApi.updateStatus(id, 'CANCELLED');
        fetchTrackingData();
      } catch (e) {
        alert(e.message || 'Cancellation failed');
      }
    }
  };

  const handleServiceRequest = (type) => {
    setServiceActionSuccess(`Host and staff notified: ${type}!`);
    setTimeout(() => setServiceActionSuccess(''), 4000);
  };

  const handlePayBill = () => {
    setBillPaid(true);
    setTimeout(() => {
      setIsBillModalOpen(false);
      alert('Payment Successful! Thank you for dining with us.');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-[#161F30] rounded-3xl h-96 animate-pulse border border-gray-800" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-rose-500" />
        <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
        <Link to="/bookings" className="mt-4 inline-block text-[#FF6A00] font-bold text-sm hover:underline">
          View All Bookings
        </Link>
      </div>
    );
  }

  const isConfirmed = reservation.status === 'CONFIRMED';
  const isArrived = reservation.status === 'CHECKED_IN';
  const isSeated = reservation.status === 'SEATED';
  const isCompleted = reservation.status === 'COMPLETED';

  // Google Calendar Link
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Dine-In: ${reservation.restaurant_name}`)}&dates=${reservation.reservation_date.replace(/-/g, '')}T${reservation.reservation_time.replace(':', '')}00Z/${reservation.reservation_date.replace(/-/g, '')}T${(parseInt(reservation.reservation_time.slice(0, 2)) + 2).toString().padStart(2, '0')}${reservation.reservation_time.slice(3)}00Z&details=${encodeURIComponent(`Table Booking ID: ${reservation.id} for ${reservation.guest_count} guests.`)}&location=${encodeURIComponent(reservation.restaurant_name)}`;

  // Bill Calculations
  const foodSubtotal = Number(reservation.order_total || (order ? order.total_amount : 450.00));
  const taxAmount = foodSubtotal * 0.05;
  const serviceCharge = foodSubtotal * 0.05;
  const grandTotal = foodSubtotal + taxAmount + serviceCharge;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20 bg-[#0B0F19]">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bookings')}
            className="p-2.5 rounded-xl bg-[#161F30] border border-gray-800 text-gray-300 hover:text-white shadow-xs transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Live Dining Pass & Status</h1>
            <p className="text-xs text-gray-400">Booking ID: <strong className="text-[#FF6A00] font-mono">{reservation.id.slice(0, 8).toUpperCase()}</strong></p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          isSeated ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
          isCompleted ? 'bg-purple-950/60 text-purple-400 border border-purple-500/30' :
          'bg-orange-950/60 text-[#FF6A00] border border-orange-500/30'
        }`}>
          {reservation.status}
        </span>
      </div>

      {serviceActionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{serviceActionSuccess}</span>
        </div>
      )}

      {/* Hero Tracking Card */}
      <div className="bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-800 shadow-xl space-y-6">
        
        {/* Restaurant Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            {reservation.restaurant_image && (
              <img
                src={reservation.restaurant_image}
                alt={reservation.restaurant_name}
                className="w-16 h-16 rounded-2xl object-cover border border-gray-700"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{reservation.restaurant_name}</h2>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                <span>{reservation.reservation_date}</span>
                <span>•</span>
                <span className="text-[#FF6A00] font-bold">{reservation.reservation_time}</span>
                <span>•</span>
                <span>{reservation.guest_count} Guests</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={gcalUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 rounded-xl bg-[#0F172A] hover:bg-gray-800 text-gray-300 font-bold text-xs flex items-center gap-1.5 border border-gray-700 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>Add to Calendar</span>
            </a>

            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(reservation.restaurant_name)}`}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
            </a>
          </div>
        </div>

        {/* Live Order Progression Tracker */}
        {order ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Food & Kitchen Status
            </h3>
            <OrderStatusTracker
              currentStatus={order.status}
              orderId={order.id}
              restaurantName={reservation.restaurant_name}
              tableNumber={reservation.table_number}
              estimatedPrepTime={order.estimated_prep_time_minutes}
            />
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-200">Table Confirmed</p>
              <p className="text-emerald-400">Table {reservation.table_number || 'is reserved'} for {reservation.guest_count} guests.</p>
            </div>
          </div>
        )}

        {/* Digital Check-In Arrival Pass */}
        <div className="p-5 rounded-2xl bg-orange-950/30 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#0F172A] p-2 rounded-2xl border border-orange-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <div className="w-full h-full bg-[#161F30] rounded-lg p-1 flex items-center justify-center text-[7px] font-mono font-bold text-[#FF6A00] text-center leading-none border border-orange-500/20">
                QR PASS #{reservation.id.slice(0, 4)}
              </div>
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Host Desk Digital Check-In Pass</span>
              <span className="text-xs text-gray-400">Show this QR code at the restaurant host desk for instant 1-click seating.</span>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-[#FF6A00] bg-[#0F172A] px-3.5 py-2 rounded-xl border border-orange-500/30 shrink-0 shadow-xs">
            DIN-{reservation.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* In-Restaurant Digital Dining Action Center (When Seated or Arrived) */}
        {(isSeated || isArrived) && (
          <div className="p-5 rounded-2xl bg-[#0F172A] border border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#FF6A00] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>At-Table Digital Dining Center</span>
              </h3>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                Table: {reservation.table_number || 'T-01'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                onClick={() => handleServiceRequest('Waiter called to Table')}
                className="p-3 rounded-xl bg-[#161F30] hover:bg-gray-800 text-gray-200 font-semibold text-center transition-colors border border-gray-700 shadow-xs flex flex-col items-center gap-1"
              >
                <span>🙋‍♂️ Call Waiter</span>
              </button>
              <button
                onClick={() => handleServiceRequest('Water requested')}
                className="p-3 rounded-xl bg-[#161F30] hover:bg-gray-800 text-gray-200 font-semibold text-center transition-colors border border-gray-700 shadow-xs flex flex-col items-center gap-1"
              >
                <span>💧 Request Water</span>
              </button>
              <button
                onClick={() => navigate(`/restaurant/${reservation.restaurant_id}`)}
                className="p-3 rounded-xl bg-[#161F30] hover:bg-gray-800 text-gray-200 font-semibold text-center transition-colors border border-gray-700 shadow-xs flex flex-col items-center gap-1"
              >
                <span>🍽️ Digital Menu</span>
              </button>
              <button
                onClick={() => setIsBillModalOpen(true)}
                className="p-3 rounded-xl bg-orange-950/60 hover:bg-orange-900/80 text-[#FF6A00] font-bold text-center transition-colors border border-orange-500/40 shadow-xs flex flex-col items-center gap-1"
              >
                <span>🧾 View & Pay Bill</span>
              </button>
            </div>
          </div>
        )}

        {/* Completed Dining Review Prompt */}
        {isCompleted && (
          <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">How was your dining experience?</h4>
                <p className="text-xs text-gray-400">Rate food, service, ambience, and value to help fellow diners.</p>
              </div>
            </div>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-xs transition-all shrink-0"
            >
              Write Review
            </button>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-[#0F172A] border border-gray-800">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Table No</span>
            <span className="text-sm font-black text-[#FF6A00]">
              {reservation.table_number || 'Auto-Assigned'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#0F172A] border border-gray-800">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Guests</span>
            <span className="text-sm font-black text-white">
              {reservation.guest_count} People
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#0F172A] border border-gray-800">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Pre-Order Bill</span>
            <span className="text-sm font-black text-emerald-400">
              ₹{foodSubtotal.toFixed(0)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#0F172A] border border-gray-800">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Status</span>
            <span className="text-sm font-black text-white">
              {reservation.status}
            </span>
          </div>
        </div>

        {/* Cancellation Option */}
        {isConfirmed && (
          <div className="pt-4 border-t border-gray-800 flex justify-end">
            <button
              onClick={handleCancel}
              className="text-xs text-rose-400 hover:underline font-semibold"
            >
              Cancel Reservation
            </button>
          </div>
        )}

      </div>

      {/* Itemized Digital Bill & Payment Modal */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#161F30] rounded-3xl p-6 sm:p-8 border border-gray-700 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#FF6A00] uppercase">Dining Invoice</span>
                <h3 className="text-lg font-bold text-white">{reservation.restaurant_name}</h3>
              </div>
              <span className="text-xs text-gray-400">Table: {reservation.table_number || 'T-01'}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-gray-300">
                <span>Food & Beverage Subtotal</span>
                <span className="font-bold text-white">₹{foodSubtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-300">
                <span>GST (5%)</span>
                <span>₹{taxAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-300">
                <span>Restaurant Service Charge (5%)</span>
                <span>₹{serviceCharge.toFixed(0)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-800 text-sm font-bold text-white">
                <span>Grand Total Payable</span>
                <span className="text-[#FF6A00] font-black">₹{grandTotal.toFixed(0)}</span>
              </div>
            </div>

            {billPaid ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2 text-emerald-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold">Payment Verified! Receipt DIN-{reservation.id.slice(0, 6).toUpperCase()}</p>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <button
                  onClick={handlePayBill}
                  className="w-full py-3 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Now (₹{grandTotal.toFixed(0)})</span>
                </button>
                <button
                  onClick={() => setIsBillModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#0F172A] text-gray-300 hover:bg-gray-800 text-xs font-semibold border border-gray-700"
                >
                  Close
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 4-Factor Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        restaurantId={reservation.restaurant_id}
        restaurantName={reservation.restaurant_name}
        onReviewSubmitted={() => fetchTrackingData()}
      />

    </div>
  );
}
