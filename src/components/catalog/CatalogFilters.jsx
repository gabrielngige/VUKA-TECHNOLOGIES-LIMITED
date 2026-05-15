import { Search } from 'lucide-react';
import { useProductStore, useCartStore } from '../../store/index.js';

export default function CatalogFilters() {
  const { search, setSearch, categories, activeCategory, setCategory } = useProductStore();
  const { mode, setMode } = useCartStore();

  return (
    <div className="space-y-4">
      {/* Mode toggle + search row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Mode toggle */}
        <div className="flex border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex-shrink-0">
          {['retail', 'wholesale'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 text-sm font-medium capitalize transition-colors ${
                mode === m ? 'bg-vuka-green text-white' : 'text-gray-500 hover:text-vuka-green'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cereals, grains, flour..."
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
              activeCategory === cat
                ? 'bg-amber-pale border-amber text-vuka-green'
                : 'bg-white border-gray-200 text-gray-500 hover:border-amber hover:text-vuka-green'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
