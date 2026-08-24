import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../api';
import { Package, AlertTriangle, Plus, PlusCircle, MinusCircle, Trash2, CheckCircle2 } from 'lucide-react';

export default function InventoryManager({ restaurantId, onStockUpdated }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Kitchen');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [minThreshold, setMinThreshold] = useState('5');
  const [costPerUnit, setCostPerUnit] = useState('0');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      const res = await inventoryApi.getByRestaurant(restaurantId);
      setInventory(res.data || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [restaurantId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryApi.create(restaurantId, {
        item_name: name,
        category,
        quantity: parseFloat(quantity || 0),
        unit,
        min_threshold: parseFloat(minThreshold || 5),
        cost_per_unit: parseFloat(costPerUnit || 0),
        supplier_name: supplierName,
        supplier_phone: supplierPhone
      });
      setIsModalOpen(false);
      setName('');
      setQuantity('');
      fetchInventory();
      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      alert(err.message || 'Failed to create inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async (item, delta) => {
    try {
      const action = delta > 0 ? 'ADD' : 'DEDUCT';
      await inventoryApi.updateStock(item.id, Math.abs(delta), action);
      fetchInventory();
      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      alert('Failed to update stock');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this ingredient from inventory?')) {
      await inventoryApi.delete(id);
      fetchInventory();
      if (onStockUpdated) onStockUpdated();
    }
  };

  if (loading) {
    return <div className="glass-card rounded-3xl h-72 animate-pulse bg-gray-800/40" />;
  }

  const lowStockCount = inventory.filter(i => Number(i.quantity) <= Number(i.min_threshold)).length;

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-400" />
            <span>Kitchen Inventory & Raw Stock Management</span>
          </h2>
          <p className="text-xs text-gray-400">Track kitchen ingredient levels, restock supplies, and monitor low-stock thresholds</p>
        </div>

        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lowStockCount} Low Stock</span>
            </span>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 border border-gray-800 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-400 uppercase text-[11px] border-b border-gray-800 pb-3">
              <th className="pb-3 font-bold">Ingredient / Supply</th>
              <th className="pb-3 font-bold">Category</th>
              <th className="pb-3 font-bold text-center">Current Stock</th>
              <th className="pb-3 font-bold text-center">Min. Threshold</th>
              <th className="pb-3 font-bold">Supplier Contact</th>
              <th className="pb-3 font-bold text-right">Adjust Stock</th>
              <th className="pb-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {inventory.map((it) => {
              const isLow = Number(it.quantity) <= Number(it.min_threshold);
              return (
                <tr key={it.id} className="hover:bg-gray-900/40 transition-all">
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-2">
                      {isLow && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                      <div>
                        <span className="font-bold text-white block">{it.item_name}</span>
                        {isLow && <span className="text-[10px] text-amber-400 font-medium">Restock Recommended</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-gray-300">{it.category}</td>
                  <td className="py-3.5 text-center">
                    <span className={`font-black text-sm ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {Number(it.quantity).toFixed(1)} {it.unit}
                    </span>
                  </td>
                  <td className="py-3.5 text-center text-gray-400">
                    {Number(it.min_threshold).toFixed(1)} {it.unit}
                  </td>
                  <td className="py-3.5 text-gray-400">
                    <div>{it.supplier_name || 'Direct Procurement'}</div>
                    {it.supplier_phone && <div className="text-[11px] text-gray-500">{it.supplier_phone}</div>}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAdjustStock(it, -1)}
                        className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
                        title="Deduct 1 unit"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAdjustStock(it, 5)}
                        className="p-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold text-[11px] px-2"
                        title="Restock +5 units"
                      >
                        +5 {it.unit}
                      </button>
                      <button
                        onClick={() => handleAdjustStock(it, 1)}
                        className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
                        title="Add 1 unit"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(it.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-800 text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleCreate} className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-gray-700 space-y-4">
            <h3 className="text-base font-bold text-white">Add Inventory Item</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Ingredient / Item Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Basmati Rice Extra Long"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Initial Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="25.0"
                  className="w-full glass-input rounded-xl p-3 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 bg-gray-900 text-xs font-bold"
                >
                  <option value="kg">kg (Kilograms)</option>
                  <option value="ltr">ltr (Liters)</option>
                  <option value="units">units (Count)</option>
                  <option value="packs">packs (Packets)</option>
                  <option value="boxes">boxes (Cartons)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Low Stock Alert Level</label>
                <input
                  type="number"
                  step="0.1"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(e.target.value)}
                  placeholder="5.0"
                  className="w-full glass-input rounded-xl p-3 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Dairy, Pulses..."
                  className="w-full glass-input rounded-xl p-3 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Supplier Name & Contact</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Nilgiri Dairy (+91 98402 34567)"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
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
                {submitting ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
