import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../../store/index.js';

export default function ProductCard({ product, mode }) {
  const { items, addItem, updateQty, removeItem } = useCartStore();
  const cartItem = items.find((i) => i.id === product.id);
  const price = mode === 'wholesale' ? product.wholesalePrice : product.retailPrice;

  return (
    <div className="card overflow-hidden hover:border-amber hover:shadow-md transition-all duration-200 group">
      {/* Image / Emoji area */}
      <div className="h-36 bg-amber-pale flex items-center justify-center text-5xl relative">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span>{product.emoji || '📦'}</span>
        )}
        {product.badge && (
          <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            product.badge === 'New' ? 'bg-amber text-white' : 'bg-vuka-green text-white'
          }`}>
            {product.badge}
          </span>
        )}
        {product.stock <= 10 && (
          <span className="absolute top-2 right-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
            Low stock
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{product.weight} · {product.category}</p>

        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-base font-semibold text-vuka-green">
              KES {price.toLocaleString()}
            </p>
            {mode === 'wholesale' && (
              <p className="text-[10px] text-gray-400 line-through">KES {product.retailPrice.toLocaleString()}</p>
            )}
          </div>

          {/* Cart controls */}
          {cartItem ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateQty(product.id, cartItem.qty - 1)}
                className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Minus size={12} />
              </button>
              <span className="text-sm font-medium w-6 text-center">{cartItem.qty}</span>
              <button
                onClick={() => addItem(product)}
                className="w-7 h-7 rounded-md bg-amber flex items-center justify-center hover:bg-amber-dark transition-colors"
              >
                <Plus size={12} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(product)}
              className="w-8 h-8 bg-amber rounded-lg flex items-center justify-center hover:bg-amber-dark transition-colors group-hover:scale-105"
            >
              <Plus size={16} className="text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
