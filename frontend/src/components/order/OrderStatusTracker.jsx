import React from 'react';
import { CheckCircle2, ChefHat, Utensils, Sparkles, Clock, AlertCircle } from 'lucide-react';

const STEPS = [
  { status: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle2, desc: 'Received by kitchen' },
  { status: 'PREPARING', label: 'Kitchen Cooking', icon: ChefHat, desc: 'Freshly prepared by chef' },
  { status: 'READY', label: 'Food Ready', icon: Sparkles, desc: 'Piping hot and plated' },
  { status: 'SERVED', label: 'Served & Enjoy', icon: Utensils, desc: 'Bon appetit!' }
];

export default function OrderStatusTracker({ currentStatus, orderId, restaurantName, tableNumber, estimatedPrepTime }) {
  const getStepIndex = (status) => {
    switch (status) {
      case 'CONFIRMED': return 0;
      case 'PREPARING': return 1;
      case 'READY': return 2;
      case 'SERVED': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-400 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="text-xs font-bold">Order Cancelled</h4>
          <p className="text-[11px] text-gray-300">This order or reservation was cancelled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Live State Tracker Bar */}
      <div className="relative flex items-center justify-between">
        
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2 z-0" />
        
        {/* Active Connecting Fill Line */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400 -translate-y-1/2 z-0 transition-all duration-700"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center group">
              <div 
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                  isDone 
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-md' 
                    : isCurrent
                    ? 'bg-orange-500 border-orange-400 text-white shadow-glow animate-pulse'
                    : 'bg-gray-900 border-gray-700 text-gray-500'
                }`}
              >
                <StepIcon className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold mt-2 text-center whitespace-nowrap ${
                isCurrent ? 'text-orange-400' : isDone ? 'text-emerald-400' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
              <span className="text-[9px] text-gray-400 hidden sm:block">
                {step.desc}
              </span>
            </div>
          );
        })}

      </div>

      {/* Summary Box */}
      <div className="p-4 rounded-2xl bg-gray-800/60 border border-gray-700/70 flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <p className="text-gray-400">Restaurant: <span className="text-white font-bold">{restaurantName}</span></p>
          {tableNumber && (
            <p className="text-gray-400">Assigned Table: <span className="text-orange-400 font-bold">{tableNumber}</span></p>
          )}
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
            <Clock className="w-3.5 h-3.5" />
            {currentStatus === 'PREPARING' ? 'Cooking in Progress' : currentStatus === 'READY' ? 'Ready for You' : currentStatus}
          </span>
        </div>
      </div>

    </div>
  );
}
