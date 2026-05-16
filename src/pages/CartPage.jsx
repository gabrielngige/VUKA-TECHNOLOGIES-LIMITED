import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore, useAuthStore } from '../store/index.js';
import CheckoutModal from '../components/checkout/CheckoutModal.jsx';
import { calculateOrderSummary } from '../utils/helpers.js';

export default function CartPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { items, updateQty, removeItem, clearCart, mode } = useCartStore();
  const [showCheckout, setShowCheckout] = useState(false);

  const summary = calculateOrderSummary(items);

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
        <p className="text-xl font-semibold text-gray-900">Please log in to checkout</p>
        <Link to="/login" className="btn-primary inline-flex mt-6">
          Go to Login
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
        <p className="text-xl font-semibold text-gray-400">Your cart is empty</p>
        <Link to="/" className="btn-primary inline-flex mt-6">
          Browse Products
        </Link>
      </div>
    );
  }

  const handleOrderCreated = (order) => {
    toast.success('Order placed successfully! Redirecting...');
    setTimeout(() => {
      navigate('/orders', { state: { orderId: order.id } });
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-vuka-green mb-6 transition-colors">
        <ArrowLeft size={16} /> Continue Shopping
      </Link>

      <h1 className="font-display text-2xl font-semibold text-vuka-green mb-6">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-pale rounded-xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={item.name} /> : item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{item.weight} · <span className={mode === 'wholesale' ? 'badge-wholesale' : 'badge-retail'}>{mode}</span></p>
                <p className="text-sm font-semibold text-vuka-green mt-1">KES {item.price.toLocaleString()} each</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-medium transition-colors">−</button>
                <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded-lg bg-amber flex items-center justify-center text-sm font-medium text-white hover:bg-amber-dark transition-colors">+</button>
              </div>
              <p className="font-semibold text-gray-900 w-24 text-right">KES {(item.price * item.qty).toLocaleString()}</p>
              <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary + Payment */}
        <div className="space-y-4">
          {/* Order summary */}
          <div className="card p-5 space-y-4">
            <p className="font-semibold text-gray-900">Order Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span>KES {summary.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 py-2 border-t border-gray-50">
                <span>Shipping</span>
                <span className="text-vuka-green font-medium">Free</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t border-gray-100 pt-2">
                <span>Total</span>
                <span className="text-vuka-green">KES {summary.total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setShowCheckout(true)}
              className="btn-primary w-full text-center"
            >
              Proceed to Checkout
            </button>
          </div>

          {/* Checkout Modal */}
          <CheckoutModal
            isOpen={showCheckout}
            onClose={() => setShowCheckout(false)}
            onOrderCreated={handleOrderCreated}
          />
        </div>
      </div>
    </div>
  );
}

