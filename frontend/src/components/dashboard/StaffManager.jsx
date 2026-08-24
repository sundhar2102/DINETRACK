import React, { useState, useEffect } from 'react';
import { staffApi } from '../../api';
import { Shield, UserPlus, Trash2, Mail, Phone, CheckCircle2 } from 'lucide-react';

export default function StaffManager({ restaurantId }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('WAITER');
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await staffApi.getByRestaurant(restaurantId);
      setStaff(res.data || []);
    } catch (err) {
      console.error('Failed to load staff roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [restaurantId]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await staffApi.add(restaurantId, {
        name,
        email,
        phone,
        staffRole: role,
        password: 'Password123!'
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to add staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    if (confirm('Remove this staff member from restaurant roster?')) {
      await staffApi.remove(id);
      fetchStaff();
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
            <Shield className="w-5 h-5 text-orange-400" />
            <span>Staff Roster, Shifts & Role Permissions</span>
          </h2>
          <p className="text-xs text-gray-400">Assign staff roles (Manager, Kitchen Chef, Floor Waiter, Host Desk Reception)</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow flex items-center gap-1.5 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((st) => (
          <div
            key={st.id}
            className="glass-card rounded-2xl p-5 border border-gray-800 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={st.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={st.name}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-700"
                />
                <div>
                  <h4 className="font-bold text-sm text-white">{st.name}</h4>
                  <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                    st.staff_role === 'KITCHEN' 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : st.staff_role === 'MANAGER'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {st.staff_role}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span>{st.email}</span>
                </div>
                {st.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-500" />
                    <span>{st.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Active Shift
              </span>

              <button
                onClick={() => handleRemove(st.id)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleAddStaff} className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-gray-700 space-y-4">
            <h3 className="text-base font-bold text-white">Add Restaurant Staff Member</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Staff Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Krishnan"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@sangeetha.com"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full glass-input rounded-xl p-3 bg-gray-900 text-xs font-bold"
              >
                <option value="WAITER">Floor Waiter (Table Seating & Status)</option>
                <option value="KITCHEN">Kitchen Chef (KDS Prep Orders)</option>
                <option value="MANAGER">Restaurant Manager (Full Operations)</option>
                <option value="RECEPTION">Host Desk Reception (Check-in & Waitlist)</option>
              </select>
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
                {submitting ? 'Adding...' : 'Add to Staff'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
