import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X, Trash2, Clock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const { 
    isDrawerOpen, 
    setIsDrawerOpen, 
    cartItems, 
    restaurant, 
    updateQuantity, 
    removeItem, 
    clearCart,
    subtotal, 
    tax, 
    total, 
    maxPrepTime 
  } = useCart();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const handleCheckout = () => {
    setIsDrawerOpen(false);
    if (restaurant) {
      navigate(`/restaurant/${restaurant.id}/reserve`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-0" onClick={() => setIsDrawerOpen(false)} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel bg-gray-900/95 border-l border-gray-800 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Pre-Order Basket</h3>
                <p className="text-xs text-gray-400 truncate max-w-[220px]">
                  {restaurant ? restaurant.name : 'No restaurant selected'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-sm font-bold text-gray-300">Your basket is empty</p>
                <p className="text-xs text-gray-500 mt-1">Add signature dishes to pre-order before arriving.</p>
              </div>
            ) : (
              <>
                {/* Intelligent Timing Info Box */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-950/40 to-amber-950/40 border border-orange-500/30 text-xs text-orange-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">Smart Cooking Synchronization</span>
                    <span className="text-[11px] text-gray-300">
                      Kitchen starts cooking ~{maxPrepTime} mins before your arrival so your meal is served fresh right when seated.
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3 pt-2">
                  {cartItems.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="glass-card rounded-2xl p-3.5 flex items-start justify-between gap-3 border border-gray-800"
                    >
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-white leading-tight">{item.name}</h4>
                        <p className="text-xs font-bold text-orange-400 mt-0.5">
                          ${(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                        {item.customization && (
                          <p className="text-[10px] text-gray-400 italic mt-1 bg-black/40 px-2 py-0.5 rounded inline-block">
                            Note: {item.customization}
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-gray-900 px-2 py-1 rounded-xl border border-gray-700 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, item.customization, item.quantity - 1)}
                          className="text-gray-400 hover:text-white font-bold text-xs px-1"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-white w-3 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.customization, item.quantity + 1)}
                          className="text-orange-400 hover:text-orange-300 font-bold text-xs px-1"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id, item.customization)}
                        className="text-gray-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-gray-500 hover:text-rose-400 transition-colors"
                  >
                    Clear All Items
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-gray-800 space-y-3 bg-gray-950/60">
              <div className="space-y-1.5 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-gray-200 font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & GST (5%)</span>
                  <span className="text-gray-200 font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-gray-800">
                  <span>Total Amount</span>
                  <span className="text-orange-400 font-black">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow transition-all"
              >
                <span>Confirm Reservation & Pre-Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Guaranteed Fresh On-Arrival Preparation</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
