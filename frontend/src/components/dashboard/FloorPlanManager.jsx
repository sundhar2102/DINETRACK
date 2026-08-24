import React, { useState } from 'react';
import { Plus, Users, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import TableGrid from '../restaurant/TableGrid';
import { tableApi } from '../../api';

export default function FloorPlanManager({ tables = [], restaurantId, onTableUpdated }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [section, setSection] = useState('Main Dining');
  const [submitting, setSubmitting] = useState(false);

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      await tableApi.updateStatus(tableId, newStatus);
      if (onTableUpdated) onTableUpdated();
    } catch (e) {
      alert('Failed to update table status: ' + e.message);
    }
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!tableNumber || !capacity) return;
    setSubmitting(true);
    try {
      await tableApi.create(restaurantId, {
        table_number: tableNumber,
        capacity: parseInt(capacity, 10),
        section
      });
      setIsAddModalOpen(false);
      setTableNumber('');
      if (onTableUpdated) onTableUpdated();
    } catch (err) {
      alert(err.message || 'Failed to add table');
    } finally {
      setSubmitting(false);
    }
  };

  const availableCount = tables.filter(t => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length;
  const reservedCount = tables.filter(t => t.status === 'RESERVED').length;
  const cleaningCount = tables.filter(t => t.status === 'CLEANING').length;

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-400" />
            Live Floor Plan & Table Management
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Click any table to update its live status in real-time across customer apps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-2 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Table</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
          <p className="text-[10px] uppercase font-bold text-gray-400">Available</p>
          <p className="text-lg font-black mt-0.5">{availableCount} Tables</p>
        </div>
        <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-400">
          <p className="text-[10px] uppercase font-bold text-gray-400">Occupied</p>
          <p className="text-lg font-black mt-0.5">{occupiedCount} Tables</p>
        </div>
        <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-400">
          <p className="text-[10px] uppercase font-bold text-gray-400">Reserved</p>
          <p className="text-lg font-black mt-0.5">{reservedCount} Tables</p>
        </div>
        <div className="p-3 rounded-2xl bg-orange-950/40 border border-orange-500/30 text-orange-400">
          <p className="text-[10px] uppercase font-bold text-gray-400">Needs Cleaning</p>
          <p className="text-lg font-black mt-0.5">{cleaningCount} Tables</p>
        </div>
      </div>

      {/* Interactive Floor Plan Grid */}
      <div className="glass-card rounded-3xl p-6 border border-gray-800">
        <TableGrid
          tables={tables}
          isOwnerView={true}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreateTable} className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-gray-700 space-y-4">
            <h3 className="text-base font-bold text-white">Add New Table to Floor Plan</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Table Identifier / Number</label>
              <input
                type="text"
                required
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. T-11, Booth 4, Rooftop 2"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Seating Capacity</label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs bg-gray-900"
                >
                  <option value="2">2 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="6">6 Guests</option>
                  <option value="8">8 Guests</option>
                  <option value="12">12 Guests</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Dining Section</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="Main Dining, Patio, VIP"
                  className="w-full glass-input rounded-xl p-3 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-glow"
              >
                {submitting ? 'Creating...' : 'Create Table'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
