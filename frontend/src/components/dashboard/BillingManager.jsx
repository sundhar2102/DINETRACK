import React, { useState } from 'react';
import { Receipt, DollarSign, Printer, Split, CreditCard, Search, CheckCircle2 } from 'lucide-react';

export default function BillingManager({ restaurantId, orders = [] }) {
  const [selectedOrder, setSelectedOrder] = useState(orders[0] || null);
  const [splitCount, setSplitCount] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.table_number && o.table_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const subtotal = selectedOrder ? Number(selectedOrder.subtotal || selectedOrder.total_amount * 0.95) : 0;
  const tax = selectedOrder ? Number(selectedOrder.tax || subtotal * 0.05) : 0;
  const total = selectedOrder ? Number(selectedOrder.total_amount) : 0;
  const splitPerPerson = splitCount > 0 ? (total / splitCount).toFixed(2) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-orange-400" />
          <span>Payments, POS Billing & Invoice Receipts</span>
        </h2>
        <p className="text-xs text-gray-400">Generate itemized dining receipts, tax invoices, and split bills</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Orders Column */}
        <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table or order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No orders found.</p>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-orange-500/20 border-orange-500/50 shadow-sm'
                        : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Table: {ord.table_number || 'Pre-Order'}</span>
                      <span className="font-black text-orange-400">${Number(ord.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                      <span>Order #{ord.id.slice(0, 8)}</span>
                      <span className="capitalize text-emerald-400">{ord.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Itemized POS Receipt Preview */}
        <div className="lg:col-span-2 space-y-4">
          {selectedOrder ? (
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6 relative overflow-hidden">
              
              {selectedOrder.status === 'CANCELLED' && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-2xl flex items-center justify-between text-rose-300 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">❌</span>
                    <span>RECEIPT VOIDED / RESERVATION CANCELLED</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-900/60 text-[10px] text-rose-200 uppercase">
                    Non-Billable
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div>
                  <h3 className="font-black text-lg text-white">Sangeetha Veg Gourmet</h3>
                  <p className="text-xs text-gray-400">12 Nungambakkam High Road, Chennai</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">GSTIN: 33AAAAA0000A1Z5 • FSSAI: 12418008000123</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-300 block">Bill #{selectedOrder.id.slice(0, 8)}</span>
                  <span className="text-[11px] text-gray-500">{new Date(selectedOrder.created_at || Date.now()).toLocaleString()}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 text-[11px] font-bold text-gray-400 uppercase pb-2 border-b border-gray-800">
                  <span className="col-span-6">Item Description</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Amount</span>
                </div>

                <div className="space-y-2 text-xs">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-gray-200">
                      <span className={`col-span-6 font-medium ${selectedOrder.status === 'CANCELLED' ? 'line-through text-gray-400' : ''}`}>{it.item_name}</span>
                      <span className="col-span-2 text-center text-gray-400">{it.quantity}</span>
                      <span className="col-span-2 text-right text-gray-400">₹{Number(it.unit_price || it.total_price / it.quantity).toFixed(0)}</span>
                      <span className="col-span-2 text-right font-bold text-white">₹{Number(it.total_price).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Totals */}
              <div className="space-y-1.5 pt-4 border-t border-gray-800 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className={selectedOrder.status === 'CANCELLED' ? 'line-through' : ''}>₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>CGST (2.5%) + SGST (2.5%)</span>
                  <span className={selectedOrder.status === 'CANCELLED' ? 'line-through' : ''}>₹{tax.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-gray-800">
                  <span>Total Payable</span>
                  <span className={selectedOrder.status === 'CANCELLED' ? 'text-gray-400 line-through' : 'text-orange-400'}>
                    ₹{total.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Split Bill Calculator */}
              <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Split className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-gray-200">Split Bill Among Diners:</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                      className="w-6 h-6 rounded-lg bg-gray-800 text-white font-bold"
                    >-</button>
                    <span className="font-bold text-white px-2">{splitCount} Guests</span>
                    <button 
                      onClick={() => setSplitCount(splitCount + 1)}
                      className="w-6 h-6 rounded-lg bg-gray-800 text-white font-bold"
                    >+</button>
                  </div>
                  <span className="text-emerald-400 font-bold">= ${splitPerPerson} / person</span>
                </div>
              </div>

              {/* Print Action */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handlePrint}
                  className="py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow flex items-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="glass-card rounded-3xl p-12 text-center text-gray-500 border border-gray-800">
              Select an order to view invoice receipt.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
