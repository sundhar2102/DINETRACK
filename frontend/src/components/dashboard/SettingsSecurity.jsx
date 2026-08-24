import React, { useState, useEffect } from 'react';
import { settingsApi } from '../../api';
import { Settings, Shield, Wifi, Percent, Clock, FileText, CheckCircle2, Save } from 'lucide-react';

export default function SettingsSecurity({ restaurantId }) {
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [autoAccept, setAutoAccept] = useState(true);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);
  const [gracePeriod, setGracePeriod] = useState(15);
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [taxPct, setTaxPct] = useState(5.0);
  const [serviceChargePct, setServiceChargePct] = useState(0.0);
  const [allowPreorders, setAllowPreorders] = useState(true);
  const [cancellationPolicy, setCancellationPolicy] = useState('');

  useEffect(() => {
    const fetchSettingsAndLogs = async () => {
      try {
        const [sRes, lRes] = await Promise.all([
          settingsApi.get(restaurantId),
          settingsApi.getLogs(restaurantId)
        ]);
        const s = sRes.data;
        setSettings(s);
        setLogs(lRes.data || []);
        setAutoAccept(!!s.auto_accept_reservations);
        setMaxAdvanceDays(s.max_advance_days || 30);
        setGracePeriod(s.walkin_grace_period_mins || 15);
        setWifiSsid(s.wifi_ssid || '');
        setWifiPassword(s.wifi_password || '');
        setTaxPct(s.tax_percentage || 5.0);
        setServiceChargePct(s.service_charge_percentage || 0.0);
        setAllowPreorders(!!s.allow_preorders);
        setCancellationPolicy(s.cancellation_policy || '');
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettingsAndLogs();
  }, [restaurantId]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update(restaurantId, {
        auto_accept_reservations: autoAccept,
        max_advance_days: parseInt(maxAdvanceDays, 10),
        walkin_grace_period_mins: parseInt(gracePeriod, 10),
        wifi_ssid: wifiSsid,
        wifi_password: wifiPassword,
        tax_percentage: parseFloat(taxPct),
        service_charge_percentage: parseFloat(serviceChargePct),
        allow_preorders: allowPreorders,
        cancellation_policy: cancellationPolicy
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      const lRes = await settingsApi.getLogs(restaurantId);
      setLogs(lRes.data || []);
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
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
            <Settings className="w-5 h-5 text-orange-400" />
            <span>Restaurant Operational Rules & Security Settings</span>
          </h2>
          <p className="text-xs text-gray-400">Configure reservation booking rules, tax rates, customer WiFi credentials, and audit logs</p>
        </div>

        {savedSuccess && (
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Form */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Reservation & Booking Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Max Booking Advance (Days)</label>
                <input
                  type="number"
                  value={maxAdvanceDays}
                  onChange={(e) => setMaxAdvanceDays(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Walk-in Hold Grace Period (Mins)</label>
                <input
                  type="number"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoAccept"
                  checked={autoAccept}
                  onChange={(e) => setAutoAccept(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded"
                />
                <label htmlFor="autoAccept" className="text-xs font-bold text-gray-300">
                  Instant Auto-Accept Online Bookings
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowPreorders"
                  checked={allowPreorders}
                  onChange={(e) => setAllowPreorders(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded"
                />
                <label htmlFor="allowPreorders" className="text-xs font-bold text-gray-300">
                  Allow Food Pre-Orders on Checkout
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-400" />
              <span>Tax & Service Charge Settings</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">GST / Sales Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Service Charge (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={serviceChargePct}
                  onChange={(e) => setServiceChargePct(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span>Guest WiFi Details (Displayed on Digital Menu)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">WiFi Network Name (SSID)</label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">WiFi Password</label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-4 border-t border-gray-800">
            <label className="text-xs font-semibold text-gray-300">Cancellation & Refund Policy</label>
            <textarea
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
              className="w-full glass-input rounded-xl p-3 text-xs resize-none h-16"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>

        {/* Security & Audit Trail */}
        <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
            <Shield className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold text-sm text-white">Security & Audit Logs</h3>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No recent audit logs.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px] font-mono">{log.action}</span>
                    <span className="text-[10px] text-gray-500">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
