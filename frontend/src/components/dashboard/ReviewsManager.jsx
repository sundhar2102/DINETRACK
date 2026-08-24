import React, { useState, useEffect } from 'react';
import { reviewApi } from '../../api';
import { Star, MessageSquare, CornerDownRight, Send, CheckCircle2 } from 'lucide-react';

export default function ReviewsManager({ restaurantId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await reviewApi.getByRestaurant(restaurantId);
      setReviews(res.data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [restaurantId]);

  const handleSendReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await reviewApi.reply(reviewId, replyText);
      setReplyText('');
      setReplyingReviewId(null);
      fetchReviews();
    } catch (err) {
      alert(err.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="glass-card rounded-3xl h-72 animate-pulse bg-gray-800/40" />;
  }

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 4.8;

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>Customer Reviews, Ratings & Replies</span>
          </h2>
          <p className="text-xs text-gray-400">Respond directly to customer feedback and track diner satisfaction</p>
        </div>

        <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-2xl self-start sm:self-auto">
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-4 h-4 fill-amber-400" />
            <span className="text-base font-black text-white">{avgRating}</span>
          </div>
          <span className="text-xs text-gray-400">({reviews.length} Verified Reviews)</span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="glass-card rounded-3xl p-6 border border-gray-800 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">{rev.user_name}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] text-gray-500 ml-2">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {!rev.reply_text && replyingReviewId !== rev.id && (
                <button
                  onClick={() => {
                    setReplyingReviewId(rev.id);
                    setReplyText('');
                  }}
                  className="py-1.5 px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold text-xs border border-orange-500/30 flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              )}
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">{rev.comment}</p>

            {/* Existing Owner Reply */}
            {rev.reply_text && (
              <div className="p-3.5 rounded-2xl bg-orange-950/20 border border-orange-500/20 flex items-start gap-2.5 text-xs text-gray-300 ml-4">
                <CornerDownRight className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-orange-400 block text-[11px]">Restaurant Response</span>
                  <p className="text-gray-300 text-xs">{rev.reply_text}</p>
                </div>
              </div>
            )}

            {/* Reply Input Form */}
            {replyingReviewId === rev.id && (
              <div className="pt-2 ml-4 space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official response to customer..."
                  className="w-full glass-input rounded-xl p-3 text-xs resize-none h-16"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setReplyingReviewId(null)}
                    className="py-1.5 px-3 rounded-xl bg-gray-800 text-gray-400 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSendReply(rev.id)}
                    disabled={submitting || !replyText.trim()}
                    className="py-1.5 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 shadow-glow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Posting...' : 'Post Reply'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
}
