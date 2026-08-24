import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Sparkles, Clock, ArrowRight, Percent, Check, Gift, Store, Copy } from 'lucide-react';
import { offersApi } from '../api';

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await offersApi.getAll();
        setOffers(res.data || []);
      } catch (err) {
        console.error('Failed to load offers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 bg-[#0B0F19]">
      
      {/* Header Banner */}
      <div className="bg-[#161F30] rounded-3xl p-8 sm:p-12 border border-gray-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-[#FF6A00] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Exclusive Dining Discounts</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          Restaurant Offers & Dining Coupons
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
          Save up to 50% on your restaurant bill. Reserve your table and apply verified coupon codes during booking for instant savings.
        </p>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-[#161F30] rounded-3xl h-64 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-[#161F30] rounded-3xl p-12 text-center text-gray-400 border border-gray-800">
          <Tag className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <h3 className="text-base font-bold text-white">No active promotions available right now</h3>
          <p className="text-xs text-gray-400 mt-1">Check back soon for new dining discounts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div 
              key={offer.id}
              className="bg-[#161F30] rounded-3xl p-6 border border-gray-800 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              {/* Discount Ribbon */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl font-black text-[#FF6A00] flex items-center gap-1">
                    {offer.discount_type === 'PERCENT' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                  </span>
                  <p className="text-xs text-gray-300 mt-1 font-medium line-clamp-1">
                    {offer.description || 'Valid on all table reservations and pre-orders'}
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-orange-950/60 text-[#FF6A00] border border-orange-500/30">
                  <Percent className="w-5 h-5" />
                </div>
              </div>

              {/* Restaurant Meta */}
              <div className="p-3 rounded-2xl bg-[#0F172A] border border-gray-800 space-y-1">
                <div className="flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                  <span className="text-xs font-bold text-white truncate">{offer.restaurant_name}</span>
                </div>
                <p className="text-[11px] text-gray-400 truncate pl-5">
                  {offer.restaurant_cuisine} • {offer.restaurant_address || 'Chennai'}
                </p>
              </div>

              {/* Terms & Code */}
              <div className="space-y-3 pt-3 border-t border-gray-800">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Min Bill: ₹{Number(offer.min_order_amount || 0).toFixed(0)}</span>
                  {offer.max_discount && <span>Max Cap: ₹{Number(offer.max_discount).toFixed(0)}</span>}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(offer.code)}
                    className="flex-1 py-2 px-3 rounded-xl bg-orange-950/40 border border-dashed border-[#FF6A00] text-[#FF6A00] font-mono text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-orange-900/50 transition-colors"
                  >
                    {copiedCode === offer.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{offer.code}</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/restaurant/${offer.restaurant_id}/reserve`}
                    className="py-2 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1 shrink-0"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
