import React, { useState, useEffect } from 'react';
import { Plus, Clock, Flame, Leaf, Check, ShoppingBag, Info, RefreshCw } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { menuApi } from '../../api';

export default function MenuSection({ menu = [], categories = [], items = [], restaurantId, restaurant }) {
  const { addItem, cartItems } = useCart();
  const [liveMenuData, setLiveMenuData] = useState({ categories: [], items: [] });
  const [loading, setLoading] = useState(false);

  // Normalise input
  const rawCategories = Array.isArray(categories) && categories.length > 0 
    ? categories 
    : (Array.isArray(menu) ? menu : (menu?.categories || []));

  const rawItems = Array.isArray(items) && items.length > 0
    ? items
    : (Array.isArray(menu?.items) ? menu.items : (Array.isArray(rawCategories) ? rawCategories.flatMap(c => c.items || (c.price ? [c] : [])) : []));

  useEffect(() => {
    const targetRestId = restaurantId || restaurant?.id;
    if (targetRestId) {
      setLoading(true);
      menuApi.getByRestaurant(targetRestId)
        .then(res => {
          if (res.data) {
            setLiveMenuData(res.data);
          }
        })
        .catch(err => console.error('Failed to load menu items:', err))
        .finally(() => setLoading(false));
    }
  }, [restaurantId, restaurant?.id]);

  // Combine live data with passed props
  const allCategories = liveMenuData.categories?.length > 0 
    ? liveMenuData.categories 
    : (rawCategories.length > 0 ? rawCategories : []);

  const allItems = liveMenuData.items?.length > 0
    ? liveMenuData.items
    : (rawItems.length > 0 ? rawItems : allCategories.flatMap(c => c.items || []));

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDiet, setSelectedDiet] = useState('ALL'); // 'ALL', 'VEG', 'NON_VEG'
  const [customizingItem, setCustomizingItem] = useState(null);
  const [customNote, setCustomNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  const displayedItems = (selectedCategory === 'ALL' 
    ? allItems 
    : (allCategories.find(c => (c.id === selectedCategory || c.name === selectedCategory))?.items || allItems.filter(i => i.category_id === selectedCategory))
  ).filter(item => {
    if (selectedDiet === 'VEG') return item.is_vegetarian === 1 || item.is_vegetarian === true;
    if (selectedDiet === 'NON_VEG') return item.is_vegetarian === 0 || item.is_vegetarian === false;
    return true;
  });

  const handleOpenModal = (item) => {
    setCustomizingItem(item);
    setCustomNote('');
    setQuantity(1);
  };

  const handleConfirmAdd = () => {
    if (customizingItem) {
      addItem(customizingItem, restaurant || { id: restaurantId || restaurant?.id, name: restaurant?.name || 'Restaurant' }, quantity, customNote);
      setCustomizingItem(null);
    }
  };


  return (
    <div className="space-y-6">
      
      {/* Category Pills & Dietary Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-[#FF6A00] text-white shadow-xs'
                : 'bg-[#0F172A] text-gray-300 hover:bg-gray-800'
            }`}
          >
            All Items ({allItems.length})
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat.id || cat.name}
              onClick={() => setSelectedCategory(cat.id || cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === (cat.id || cat.name)
                  ? 'bg-[#FF6A00] text-white shadow-xs'
                  : 'bg-[#0F172A] text-gray-300 hover:bg-gray-800'
              }`}
            >
              {cat.name} ({cat.items?.length || 0})
            </button>
          ))}
        </div>

        {/* Dietary Filters */}
        <div className="flex items-center bg-[#0F172A] rounded-xl p-1 border border-gray-800 self-start md:self-auto shrink-0">
          <button
            onClick={() => setSelectedDiet('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              selectedDiet === 'ALL' ? 'bg-[#1E293B] text-white shadow-xs' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedDiet('VEG')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
              selectedDiet === 'VEG' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Leaf className="w-3 h-3" />
            Veg
          </button>
          <button
            onClick={() => setSelectedDiet('NON_VEG')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              selectedDiet === 'NON_VEG' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Non-Veg
          </button>
        </div>
      </div>

      {/* Menu Item Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedItems.map((item) => {
          const inCartCount = cartItems
            .filter(i => i.id === item.id)
            .reduce((sum, i) => sum + i.quantity, 0);

          return (
            <div
              key={item.id}
              className="bg-[#161F30] rounded-2xl p-4 flex gap-4 items-center justify-between border border-gray-800 hover:border-orange-500/40 shadow-xs hover:shadow-lg transition-all"
            >
              {/* Item Info */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  {/* Veg / Non-Veg Indicator Icon */}
                  <span className={`w-4 h-4 border flex items-center justify-center rounded p-0.5 ${
                    item.is_vegetarian ? 'border-emerald-500' : 'border-rose-500'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${item.is_vegetarian ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  </span>

                  <h4 className="font-bold text-sm text-white leading-tight">{item.name}</h4>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="font-black text-[#FF6A00] text-sm">
                    ₹{Number(item.price).toFixed(0)}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    ~{item.prep_time_minutes || 15}m prep
                  </span>
                  {item.spiciness_level && item.spiciness_level !== 'NONE' && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                      <Flame className="w-3 h-3 text-amber-500" />
                      {item.spiciness_level}
                    </span>
                  )}
                </div>
              </div>

              {/* Image & Add Button */}
              <div className="relative shrink-0 flex flex-col items-center">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-24 h-24 rounded-xl object-cover border border-gray-700"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-[#0F172A] flex items-center justify-center text-gray-500 border border-gray-800">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}

                <button
                  onClick={() => handleOpenModal(item)}
                  className={`mt-2 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs ${
                    inCartCount > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#FF6A00] hover:bg-[#E55F00] text-white'
                  }`}
                >
                  {inCartCount > 0 ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>{inCartCount} Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Add Item</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pre-Order Item Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#161F30] rounded-3xl p-6 shadow-2xl border border-gray-700 space-y-4">
            
            {customizingItem.image_url && (
              <img
                src={customizingItem.image_url}
                alt={customizingItem.name}
                className="w-full h-44 object-cover rounded-2xl border border-gray-700"
              />
            )}

            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">{customizingItem.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{customizingItem.description}</p>
              </div>
              <span className="text-base font-black text-[#FF6A00]">
                ₹{Number(customizingItem.price).toFixed(0)}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between py-3 border-y border-gray-800">
              <span className="text-xs font-bold text-gray-300">Quantity</span>
              <div className="flex items-center gap-3 bg-[#0F172A] px-3 py-1 rounded-xl border border-gray-700">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-gray-400 hover:text-white font-bold text-base px-1"
                >
                  -
                </button>
                <span className="text-sm font-bold text-white w-4 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-[#FF6A00] hover:text-[#E55F00] font-bold text-base px-1"
                >
                  +
                </button>
              </div>
            </div>

            {/* Special Chef Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#FF6A00]" />
                Special Preparation Requests (Optional)
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Less spicy, dressing on the side, extra crispy..."
                className="w-full bg-[#0F172A] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6A00] resize-none h-20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCustomizingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdd}
                className="flex-1 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#E55F00] text-white text-xs font-bold shadow-xs transition-all"
              >
                Add (₹{(Number(customizingItem.price) * quantity).toFixed(0)})
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
