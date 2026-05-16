import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore, useProductStore } from '../../store/index.js';

const FALLBACK = [
  { id: 'f1', emoji: '🌽', name: 'Maize Meal — 2kg', retailPrice: 180, category: 'Retail' },
  { id: 'f2', emoji: '🌾', name: 'Brown Rice — 25kg', retailPrice: 3200, category: 'Wholesale' },
  { id: 'f3', emoji: '🫘', name: 'Mixed Beans — 10kg', retailPrice: 1450, category: 'Wholesale' },
];

function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

export default function Hero() {
  const setMode = useCartStore((s) => s.setMode);
  const mode = useCartStore((s) => s.mode);
  const { products, fetchProducts } = useProductStore();
  const [featured, setFeatured] = useState([]);

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    if (products.length > 0) setFeatured(pickRandom(products, 3));
  }, [products]);

  return (
    <div className="bg-gradient-to-br from-vuka-green to-[#1A4A22] px-6 py-12">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10">
        {/* Text */}
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-amber/20 border border-amber/40 rounded-full px-4 py-1.5 text-amber-light text-xs font-medium mb-5">
            🌾 Kenya's Cereal Specialists
          </div>
          <h1 className="font-display text-4xl lg:text-5xl text-white font-semibold leading-tight mb-4">
            Quality Cereals,<br />
            <span className="text-amber">Wholesale & Retail</span>
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-md">
            From rice to specialty grains — order in bulk or retail quantities.
            Fast delivery across Nairobi and beyond, tracked live on map.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/" onClick={() => setMode('retail')} className="bg-amber text-white font-medium px-6 py-3 rounded-lg hover:bg-amber-dark transition-colors">
              Shop Retail
            </Link>
            <Link to="/" onClick={() => setMode('wholesale')} className="bg-white/10 border border-white/30 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/20 transition-colors">
              Wholesale Account
            </Link>
          </div>
          {/* Stats */}
          <div className="flex gap-8 mt-10">
            {[['80+', 'Products'], ['500+', 'Customers'], ['24hr', 'Delivery']].map(([num, label]) => (
              <div key={label}>
                <p className="font-display text-2xl text-amber font-semibold">{num}</p>
                <p className="text-white/50 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured card */}
        <div className="w-full lg:w-72 bg-white/8 border border-white/15 rounded-2xl p-5 space-y-3 backdrop-blur-sm">
          <p className="text-white/50 text-[11px] font-medium uppercase tracking-wider">Featured Products</p>
          {(featured.length > 0 ? featured : FALLBACK).map((p) => {
            const price = mode === 'wholesale' && p.wholesalePrice ? p.wholesalePrice : p.retailPrice;
            return (
              <div key={p.id} className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber/20 flex items-center justify-center text-2xl overflow-hidden">
                  {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : (p.emoji || '📦')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{p.name}</p>
                  <p className="text-amber text-xs">KES {price?.toLocaleString()}</p>
                </div>
                <span className="text-[10px] bg-vuka-green/60 text-green-200 px-2 py-0.5 rounded-full flex-shrink-0">{p.category}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
