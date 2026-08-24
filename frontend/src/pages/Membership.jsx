import React, { useState } from 'react';
import { Crown, Sparkles, Check, ArrowRight, ShieldCheck, Zap, Heart } from 'lucide-react';

const TIERS = [
  {
    id: 'silver',
    name: 'Silver Gourmet',
    price: '₹999',
    period: '/ 6 Months',
    badge: 'Starter Pass',
    border: 'border-gray-800',
    benefits: [
      'Flat 15% OFF at 100+ partner restaurants',
      'Instant table booking priority',
      'Free welcome drink on arrival',
      'Exclusive weekend dessert vouchers'
    ]
  },
  {
    id: 'gold',
    name: 'Gold Privilege',
    price: '₹1,799',
    period: '/ 1 Year',
    badge: 'Most Popular ⭐',
    border: 'border-orange-500/60 shadow-lg',
    featured: true,
    benefits: [
      'Flat 25% OFF total dining bill',
      'Zero-wait guaranteed table seating',
      'Complimentary chef special appetizer per visit',
      'Free valet parking at fine-dining outlets',
      'Exclusive invites to wine & gourmet tasting nights'
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum Black VIP',
    price: '₹3,499',
    period: '/ 1 Year',
    badge: 'Ultimate Luxury',
    border: 'border-gray-700',
    benefits: [
      'Flat 30% OFF food & beverages across all partner venues',
      'Dedicated personal VIP concierge for private dining',
      'Complimentary birthday & anniversary champagne bottle',
      'Unlimited 1+1 buffet passes on selected dates',
      'Access to exclusive private chef banquet rooms'
    ]
  }
];

export default function Membership() {
  const [selectedTier, setSelectedTier] = useState('gold');

  const handleJoin = (tier) => {
    alert(`Thank you for choosing ${tier.name}! Proceeding to secure membership checkout.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-20 bg-[#0B0F19]">
      
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-[#FF6A00] text-xs font-bold shadow-xs">
          <Crown className="w-4 h-4 text-[#FF6A00]" />
          <span>Smart Table Dining Privilege Club</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Unlock Unlimited Dining Savings & VIP Privileges
        </h1>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
          Join thousands of food lovers saving up to 30% on every dine-in meal, enjoying guaranteed zero-wait table reservations, and complimentary gourmet perks.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`bg-[#161F30] rounded-3xl p-8 border ${tier.border} flex flex-col justify-between space-y-6 relative transition-all ${
              tier.featured ? 'shadow-2xl border-2 border-[#FF6A00] md:-translate-y-2' : 'shadow-sm'
            }`}
          >
            {tier.badge && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#FF6A00] text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                {tier.badge}
              </span>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-white">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">{tier.price}</span>
                  <span className="text-xs text-gray-400 font-medium">{tier.period}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-800">
                {tier.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300 font-medium">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleJoin(tier)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                tier.featured 
                  ? 'bg-[#FF6A00] hover:bg-[#E55F00] text-white' 
                  : 'bg-[#1E293B] hover:bg-[#334155] text-gray-200'
              }`}
            >
              <span>Join {tier.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
