import React, { useState } from 'react';
import { BookOpen, Clock, User, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const BLOG_POSTS = [
  {
    id: 'post-1',
    title: 'Top 10 Authentic South Indian Fine Dining Spots in Chennai You Must Try',
    category: 'Restaurant Guides',
    excerpt: 'From crispy ghee roast dosas to traditional filter coffee ceremonies, explore the finest vegetarian gourmets across Nungambakkam and Mylapore.',
    author: 'Ananya Ramesh',
    date: '20 August 2026',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800'
  },
  {
    id: 'post-2',
    title: 'How AI-Predicted Wait Times Are Changing Weekend Dining Experiences',
    category: 'Dining Tech',
    excerpt: 'No more standing in long restaurant queues. Discover how real-time seat tracking and intelligent pre-ordering get food on your table the moment you sit.',
    author: 'Karthik Subramanian',
    date: '18 August 2026',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800'
  },
  {
    id: 'post-3',
    title: 'The Ultimate Italian Wood-Fired Pizza & Pasta Trail in the City',
    category: 'Food Trails',
    excerpt: 'A curated journey through artisanal sourdough crusts, imported burrata, and hand-rolled gnocchi at the top authentic trattorias.',
    author: 'Chef Marco Rossi',
    date: '15 August 2026',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800'
  }
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'Restaurant Guides', 'Dining Tech', 'Food Trails'];

  const filtered = selectedCategory === 'ALL' 
    ? BLOG_POSTS 
    : BLOG_POSTS.filter(p => p.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20 bg-[#0B0F19]">
      
      {/* Header Banner */}
      <div className="bg-[#161F30] rounded-3xl p-8 sm:p-12 border border-gray-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-[#FF6A00] text-xs font-bold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>The Smart Table Food Journal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          Stories, Guides & Gourmet Dining Chronicles
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
          Discover handpicked dining recommendations, chef interviews, restaurant reviews, and the latest food culture trends.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#FF6A00] text-white shadow-xs'
                : 'bg-[#161F30] border border-gray-800 text-gray-300 hover:bg-gray-800'
            }`}
          >
            {cat === 'ALL' ? 'All Articles' : cat}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filtered.map((post) => (
          <article
            key={post.id}
            className="bg-[#161F30] rounded-3xl overflow-hidden border border-gray-800 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all flex flex-col group"
          >
            <div className="relative h-52 w-full overflow-hidden bg-gray-900">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-white/10">
                {post.category}
              </span>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#FF6A00] transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {post.readTime}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

    </div>
  );
}
