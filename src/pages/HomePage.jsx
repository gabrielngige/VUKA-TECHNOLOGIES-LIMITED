import Hero from '../components/layout/Hero.jsx';
import CatalogFilters from '../components/catalog/CatalogFilters.jsx';
import ProductCard from '../components/catalog/ProductCard.jsx';
import { useProductStore, useCartStore } from '../store/index.js';

export default function HomePage() {
  const { products, search, activeCategory } = useProductStore();
  const mode = useCartStore((s) => s.mode);

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <Hero />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-vuka-green">
            Product <span className="text-amber">Catalog</span>
          </h2>
          <span className="text-sm text-gray-400">{filtered.length} products</span>
        </div>
        <CatalogFilters />
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🌾</p>
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} mode={mode} />)}
          </div>
        )}
      </div>
    </div>
  );
}

