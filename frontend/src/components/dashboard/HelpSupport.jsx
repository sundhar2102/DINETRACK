import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Phone, BookOpen, Send, CheckCircle2 } from 'lucide-react';
import { supportApi } from '../../api';

export default function HelpSupport({ restaurantId }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('TABLES');
  const [priority, setPriority] = useState('MEDIUM');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const faqs = [
    {
      q: 'How does the automated wait-time estimation engine compute queue delays?',
      a: 'The SmartTable AI wait engine continuously monitors occupied tables with their respective elapsed dining durations, calculates party-size fit against available capacities, and factors in real-time walk-in queues and incoming reservations.'
    },
    {
      q: 'How are kitchen preparation orders synchronized with customer travel ETA?',
      a: 'When diners pre-order food, our Prep Timing service tracks their travel ETA and delays kitchen firing tickets so that dishes are ready exactly within 2-3 minutes of the customer arrival.'
    },
    {
      q: 'Can multiple staff members access the dashboard simultaneously?',
      a: 'Yes! Kitchen staff can stay on the Kitchen Display System (KDS) screen while host desk receptionists manage the Floor Plan and Walk-in Queue on separate tablets.'
    }
  ];

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supportApi.createTicket(restaurantId, {
        subject,
        category,
        priority,
        message
      });
      setSubmittedSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmittedSuccess(false), 4000);
    } catch (err) {
      alert(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-orange-400" />
          <span>Help Center, FAQs & 24/7 Priority Support</span>
        </h2>
        <p className="text-xs text-gray-400">Knowledgebase guides, operational troubleshooting, and direct support ticket submission</p>
      </div>

      {submittedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Support ticket submitted! A platform engineer will review your inquiry shortly.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Knowledge Base & FAQs */}
        <div className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-400" />
            <span>Frequently Asked Operational Questions</span>
          </h3>

          <div className="space-y-3">
            {faqs.map((f, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-1.5">
                <h4 className="font-bold text-xs text-white">{f.q}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-orange-400" />
              <span className="text-gray-300">24/7 Restaurant Partner Hotline:</span>
            </div>
            <span className="font-bold text-white">+1 (800) 555-DINE-SYNC</span>
          </div>
        </div>

        {/* Ticket Submission Form */}
        <form onSubmit={handleSubmitTicket} className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Open Technical Support Ticket</span>
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. POS printer receipt sync query"
              className="w-full glass-input rounded-xl p-3 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full glass-input rounded-xl p-3 bg-gray-900 text-xs font-bold"
              >
                <option value="TABLES">Floor Plan & Tables</option>
                <option value="KITCHEN">Kitchen KDS Orders</option>
                <option value="BILLING">Billing & Payments</option>
                <option value="HARDWARE">Hardware / Printers</option>
                <option value="ACCOUNT">Account & Settings</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Urgency</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full glass-input rounded-xl p-3 bg-gray-900 text-xs font-bold"
              >
                <option value="LOW">Low (General Inquiry)</option>
                <option value="MEDIUM">Medium (Normal)</option>
                <option value="HIGH">High (Impacts Service)</option>
                <option value="URGENT">Urgent (Shift Outage)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Description of Issue</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide detailed description of what happened..."
              className="w-full glass-input rounded-xl p-3 text-xs resize-none h-24"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Support Request'}</span>
          </button>
        </form>

      </div>

    </div>
  );
}
