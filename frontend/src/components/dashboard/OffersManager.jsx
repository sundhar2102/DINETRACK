import React, { useState, useEffect } from 'react';
import { offersApi } from '../../api';
import { Tag, Plus, Trash2, Power, Percent, DollarSign, Calendar, CheckCircle2 } from 'lucide-react';

export default function OffersManager({ restaurantId }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('PERCENT');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOffers = async () => {
    try {
      const res = await offersApi.getByRestaurant(restaurantId);
      setOffers(res.data || []);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [restaurantId]);

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await offersApi.create(restaurantId, {
        code,
        description,
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_order_amount: parseFloat(minOrder || 0),
        max_discount: maxDiscount ? parseFloat(maxDiscount) : null
      });
      setIsModalOpen(false);
      setCode('');
      setDescription('');
      setDiscountValue('');
      fetchOffers();
    } catch (err) {
      alert(err.message || 'Failed to create promo code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await offersApi.toggle(id);
      fetchOffers();
    } catch (err) {
      alert('Failed to toggle offer status');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this promo code?')) {
      await offersApi.delete(id);
      fetchOffers();
    }
  };

  if (loading) {
    return <div className="glass-card rounded-3xl h-72 animate-pulse bg-gray-800/40" />;
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange-400" />
            <span>Offers, Coupons & Dynamic Discounts</span>
          </h2>
          <p className="text-xs text-gray-400">Create promotional discount codes for pre-orders, happy hours, and dining discounts</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Code</span>
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center text-gray-400 border border-gray-800 space-y-3">
          <Tag className="w-12 h-12 mx-auto text-gray-600" />
          <h3 className="text-base font-bold text-white">No active promo codes</h3>
          <p className="text-xs text-gray-500">Create special discount codes to drive pre-orders and early dining slots.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((off) => (
            <div
              key={off.id}
              className="glass-card rounded-2xl p-5 border border-gray-800 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/30">
                    {off.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    off.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {off.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="text-lg font-black text-white">
                  {off.discount_type === 'PERCENT' ? `${off.discount_value}% OFF` : `$${Number(off.discount_value).toFixed(2)} OFF`}
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">{off.description || 'Special promo offer'}</p>

                <div className="text-[11px] text-gray-500 space-y-0.5 pt-1">
                  <div>Min. Order: ${Number(off.min_order_amount || 0).toFixed(2)}</div>
                  {off.max_discount && <div>Max Cap: ${Number(off.max_discount).toFixed(2)}</div>}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <button
                  onClick={() => handleToggle(off.id)}
                  className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{off.is_active ? 'Disable' : 'Enable'}</span>
                </button>

                <button
                  onClick={() => handleDelete(off.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreateOffer} className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-gray-700 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Discount Code</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Promo Code (e.g. FEAST20)</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PROMO20"
                className="w-full glass-input rounded-xl p-3 text-xs font-mono font-bold tracking-wider uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="20% off for dinner bookings"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 bg-gray-900 text-xs font-bold"
                >
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FLAT">Flat Amount ($)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Discount Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="20"
                  className="w-full glass-input rounded-xl p-3 text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Min. Order ($)</label>
                <input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="0"
                  className="w-full glass-input rounded-xl p-3 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Max Cap ($ optional)</label>
                <input
                  type="number"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder="25"
                  className="w-full glass-input rounded-xl p-3 text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-glow"
              >
                {submitting ? 'Creating...' : 'Create Promo'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
