import React, { useState } from 'react';
import { Star, X, CheckCircle2, MessageSquare } from 'lucide-react';
import { reviewApi } from '../../api';

export default function ReviewModal({ isOpen, onClose, restaurantId, restaurantName, onReviewSubmitted }) {
  const [overallRating, setOverallRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [ambienceRating, setAmbienceRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewApi.create({
        restaurantId,
        rating: overallRating,
        foodRating,
        serviceRating,
        ambienceRating,
        valueRating,
        comment
      });
      setSuccess(true);
      if (onReviewSubmitted) onReviewSubmitted();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarPicker = (val, setVal, label) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-300 font-semibold">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => setVal(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-4 h-4 ${
                star <= val ? 'fill-amber-400 text-amber-400' : 'text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-gray-700 shadow-2xl space-y-6 relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Thank You for Your Feedback!</h3>
            <p className="text-xs text-gray-400">Your review helps improve dining experiences across the community.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Customer Feedback</span>
              <h2 className="text-xl font-bold text-white mt-0.5">Rate Your Dining Experience</h2>
              <p className="text-xs text-gray-400">At {restaurantName}</p>
            </div>

            {/* Overall Rating Hero */}
            <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 text-center space-y-2">
              <span className="text-xs font-bold text-gray-300">Overall Rating</span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setOverallRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= overallRating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 4-Factor Ratings */}
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-1">
              {renderStarPicker(foodRating, setFoodRating, 'Food & Taste 🍲')}
              {renderStarPicker(serviceRating, setServiceRating, 'Staff & Service 👨‍🍳')}
              {renderStarPicker(ambienceRating, setAmbienceRating, 'Ambience & Music 🎶')}
              {renderStarPicker(valueRating, setValueRating, 'Value for Money 💰')}
            </div>

            {/* Comment Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                Your Review Comments
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details about the dishes you ordered, service speed, or atmosphere..."
                className="w-full glass-input rounded-xl p-3 text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow transition-all"
            >
              {submitting ? 'Submitting Review...' : 'Submit Review'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
