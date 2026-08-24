import React from 'react';
import { Users, CheckCircle2, AlertCircle, Ban, Sparkles } from 'lucide-react';

export default function TableGrid({ tables = [], selectedTableId, onSelectTable, isOwnerView = false, onStatusChange }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
          indicator: 'bg-emerald-400',
          label: 'Available',
          badge: 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
        };
      case 'RESERVED':
        return {
          bg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
          indicator: 'bg-amber-400',
          label: 'Reserved',
          badge: 'bg-amber-900/60 text-amber-300 border border-amber-500/30'
        };
      case 'OCCUPIED':
        return {
          bg: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
          indicator: 'bg-rose-400',
          label: 'Occupied',
          badge: 'bg-rose-900/60 text-rose-300 border border-rose-500/30'
        };
      case 'CLEANING':
        return {
          bg: 'bg-orange-950/70 border-orange-500/40 text-orange-300',
          indicator: 'bg-orange-400',
          label: 'Cleaning',
          badge: 'bg-orange-900/60 text-orange-300 border border-orange-500/30'
        };
      case 'BLOCKED':
        return {
          bg: 'bg-purple-950/70 border-purple-500/40 text-purple-300',
          indicator: 'bg-purple-400',
          label: 'Blocked',
          badge: 'bg-purple-900/60 text-purple-300 border border-purple-500/30'
        };
      case 'MAINTENANCE':
        return {
          bg: 'bg-zinc-950/80 border-zinc-600/40 text-zinc-300',
          indicator: 'bg-zinc-400',
          label: 'Maintenance',
          badge: 'bg-zinc-900/60 text-zinc-300 border border-zinc-500/30'
        };
      default:
        return {
          bg: 'bg-[#0F172A] border-gray-700 text-gray-400',
          indicator: 'bg-gray-400',
          label: status,
          badge: 'bg-gray-800 text-gray-400'
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pb-2 border-b border-gray-800">
        <span className="font-semibold text-gray-300">Live Status:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
          <span>Cleaning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
          <span>Maintenance</span>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {tables.map((tbl) => {
          const statusInfo = getStatusBadge(tbl.status);
          const isSelected = selectedTableId === tbl.id;
          const isClickable = isOwnerView || tbl.status === 'AVAILABLE';

          return (
            <div
              key={tbl.id}
              onClick={() => {
                if (isClickable && onSelectTable) {
                  onSelectTable(tbl);
                }
              }}
              className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                statusInfo.bg
              } ${
                isSelected ? 'ring-2 ring-[#FF6A00] scale-105 shadow-glow' : 'shadow-xs'
              } ${
                isClickable ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Header: Table Number & Status Dot */}
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-white tracking-wide">{tbl.table_number}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.indicator} animate-pulse`}></span>
              </div>

              {/* Center: Capacity */}
              <div className="my-3 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-black/40 border border-white/5 shadow-xs">
                <Users className="w-4 h-4 text-gray-300" />
                <span className="text-xs font-bold text-gray-100">{tbl.capacity} Seats</span>
              </div>

              {/* Footer: Section & Status Label */}
              <div className="flex items-center justify-between text-[10px] font-semibold">
                <span className="text-gray-400 truncate max-w-[70px]">{tbl.section}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusInfo.badge}`}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Owner Quick Status Change Select */}
              {isOwnerView && onStatusChange && (
                <div className="mt-3 pt-2 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={tbl.status}
                    onChange={(e) => onStatusChange(tbl.id, e.target.value)}
                    className="w-full bg-[#0F172A] text-[10px] font-bold text-white rounded-lg p-1 border border-gray-700 focus:outline-none focus:border-[#FF6A00]"
                  >
                    <option value="AVAILABLE" className="bg-[#0F172A] text-white">AVAILABLE</option>
                    <option value="RESERVED" className="bg-[#0F172A] text-white">RESERVED</option>
                    <option value="OCCUPIED" className="bg-[#0F172A] text-white">OCCUPIED</option>
                    <option value="CLEANING" className="bg-[#0F172A] text-white">CLEANING</option>
                    <option value="BLOCKED" className="bg-[#0F172A] text-white">BLOCKED</option>
                    <option value="MAINTENANCE" className="bg-[#0F172A] text-white">MAINTENANCE</option>
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
