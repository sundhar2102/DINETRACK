import React, { useState } from 'react';
import { Megaphone, Send, Bell, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export default function MarketingHub({ restaurantId }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('ALL_CUSTOMERS');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  const [campaigns, setCampaigns] = useState([
    {
      id: 'camp-1',
      title: 'Weekend Ghee Roast Special Feast 🥞',
      audience: 'ALL_CUSTOMERS',
      message: 'Pre-order our signature Ghee Podi Roast this Saturday & Sunday and get a free Filter Coffee!',
      sent_at: 'Yesterday, 6:00 PM',
      reach: '342 Diners'
    },
    {
      id: 'camp-2',
      title: 'VIP Exclusive: Chef Table Tasting Night',
      audience: 'VIP_DINERS',
      message: 'Exclusive invitation for our VIP diners: Join Executive Chef Suresh for an intimate 7-course tasting.',
      sent_at: '3 days ago',
      reach: '48 VIPs'
    }
  ]);

  const handleBroadcast = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setCampaigns([
        {
          id: `camp-${Date.now()}`,
          title,
          audience,
          message,
          sent_at: 'Just now',
          reach: audience === 'ALL_CUSTOMERS' ? '342 Diners' : '48 VIPs'
        },
        ...campaigns
      ]);
      setTitle('');
      setMessage('');
      setSending(false);
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-orange-400" />
          <span>Marketing Campaigns & Diner Broadcasts</span>
        </h2>
        <p className="text-xs text-gray-400">Broadcast promotional announcements, happy hour alerts, and notifications to past diners</p>
      </div>

      {sentSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Broadcast announcement sent successfully to customer apps!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Creator Form */}
        <form onSubmit={handleBroadcast} className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Create In-App Announcement</span>
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Campaign Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Festival Buffet Booking Open"
              className="w-full glass-input rounded-xl p-3 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Target Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full glass-input rounded-xl p-3 bg-gray-900 text-xs font-bold"
            >
              <option value="ALL_CUSTOMERS">All Registered Diners</option>
              <option value="VIP_DINERS">VIP Guests Only</option>
              <option value="PAST_VISITORS">Past 30-Day Diners</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Broadcast Message</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter special promotion or dining announcement..."
              className="w-full glass-input rounded-xl p-3 text-xs resize-none h-24"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Broadcasting...' : 'Broadcast to Diners'}</span>
          </button>
        </form>

        {/* Previous Campaigns */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-200">Recent Marketing Broadcasts</h3>

          <div className="space-y-3">
            {campaigns.map((camp) => (
              <div key={camp.id} className="glass-card rounded-2xl p-5 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{camp.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {camp.audience}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{camp.message}</p>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-800/80">
                  <span>Sent: {camp.sent_at}</span>
                  <span className="text-emerald-400 font-bold">Reach: {camp.reach}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
