import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../../api';
import { Store, MapPin, Clock, Phone, Mail, Image, Save, CheckCircle2 } from 'lucide-react';

export default function RestaurantProfileManager({ restaurantId, onUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [priceRange, setPriceRange] = useState('$$');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('23:00');
  const [avgDiningMins, setAvgDiningMins] = useState(45);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await restaurantApi.getById(restaurantId);
        const r = res.data;
        setProfile(r);
        setName(r.name || '');
        setDescription(r.description || '');
        setCuisine(r.cuisine || '');
        setPriceRange(r.price_range || '$$');
        setPhone(r.phone || '');
        setEmail(r.email || '');
        setImageUrl(r.image_url || '');
        setCoverImageUrl(r.cover_image_url || '');
        setOpeningTime(r.opening_time || '09:00');
        setClosingTime(r.closing_time || '23:00');
        setAvgDiningMins(r.avg_dining_duration_mins || 45);
        setIsOpen(!!r.is_open);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [restaurantId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await restaurantApi.update(restaurantId, {
        name,
        description,
        cuisine,
        price_range: priceRange,
        phone,
        email,
        image_url: imageUrl,
        cover_image_url: coverImageUrl,
        opening_time: openingTime,
        closing_time: closingTime,
        avg_dining_duration_mins: parseInt(avgDiningMins, 10),
        is_open: isOpen ? 1 : 0
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="glass-card rounded-3xl h-96 animate-pulse bg-gray-800/40" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-400" />
            <span>Restaurant Profile & Brand Settings</span>
          </h2>
          <p className="text-xs text-gray-400">Configure branding, operating hours, dining durations, and contact details</p>
        </div>

        {savedSuccess && (
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            <span>Changes Saved!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-800 space-y-6">
        
        {/* Cover & Brand Images */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Image className="w-4 h-4 text-orange-400" />
            Branding Imagery
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Thumbnail Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
              {imageUrl && (
                <img src={imageUrl} alt="Thumbnail preview" className="w-full h-28 object-cover rounded-xl mt-2 border border-gray-700" />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Cover Banner Image URL</label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
              {coverImageUrl && (
                <img src={coverImageUrl} alt="Banner preview" className="w-full h-28 object-cover rounded-xl mt-2 border border-gray-700" />
              )}
            </div>
          </div>
        </div>

        {/* General Info */}
        <div className="space-y-4 pt-4 border-t border-gray-800">
          <h3 className="text-sm font-bold text-gray-200">General Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Restaurant Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Cuisines / Specialties</label>
              <input
                type="text"
                required
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Description / Bio</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input rounded-xl p-3 text-xs resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Price Tier</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full glass-input rounded-xl p-3 bg-gray-900 text-xs"
              >
                <option value="$">$ (Budget-Friendly)</option>
                <option value="$$">$$ (Moderate / Casual)</option>
                <option value="$$$">$$$ (Fine Dining)</option>
                <option value="$$$$">$$$$ (Luxury Gourmet)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours & Dining Buffers */}
        <div className="space-y-4 pt-4 border-t border-gray-800">
          <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            Operating Schedule & Wait Engine Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Opening Time</label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Closing Time</label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Avg Dining Duration (mins)</label>
              <input
                type="number"
                value={avgDiningMins}
                onChange={(e) => setAvgDiningMins(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isOpen"
              checked={isOpen}
              onChange={(e) => setIsOpen(e.target.checked)}
              className="w-4 h-4 accent-orange-500 rounded"
            />
            <label htmlFor="isOpen" className="text-xs font-bold text-white">
              Accepting Live Bookings & Walk-ins (Open for Business)
            </label>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-glow flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
