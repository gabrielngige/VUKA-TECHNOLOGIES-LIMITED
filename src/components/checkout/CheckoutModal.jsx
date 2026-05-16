import { useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore, useCartStore } from '../../store/index.js';
import { ordersAPI } from '../../utils/api.js';
import { formatCartForOrder, calculateOrderSummary, isValidPhoneNumber, formatPhoneForMpesa } from '../../utils/helpers.js';
import CustomerPinMap from '../delivery/CustomerPinMap.jsx';
import MpesaPayment from '../payment/MpesaPayment.jsx';

export default function CheckoutModal({ isOpen, onClose, onOrderCreated }) {
  const user = useAuthStore((s) => s.user);
  const { items, mode, clearCart } = useCartStore();

  const [step,    setStep]    = useState('form');   // 'form' | 'payment'
  const [created, setCreated] = useState(null);     // the order returned by POST /api/orders
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const [formData, setFormData] = useState({
    phoneNumber:      '',
    deliveryLocation: '',   // text address from geocoder
    deliveryCoords:   null, // { lat, lng }
    notes:            '',
    paymentMethod:    'mpesa',
  });

  const summary = calculateOrderSummary(items);

  const validate = () => {
    const e = {};
    if (!formData.phoneNumber.trim())                  e.phoneNumber = 'Phone number required';
    else if (!isValidPhoneNumber(formData.phoneNumber)) e.phoneNumber = 'Enter a valid Kenyan phone number';

    if (!formData.deliveryCoords && !formData.deliveryLocation.trim())
      e.deliveryLocation = 'Pin your location on the map or type an address';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleLocationSelected = ({ lat, lng, address }) => {
    setFormData(p => ({ ...p, deliveryLocation: address, deliveryCoords: { lat, lng } }));
    if (errors.deliveryLocation) setErrors(p => ({ ...p, deliveryLocation: '' }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await ordersAPI.create({
        items: formatCartForOrder(items, mode),
        mode,
        customerInfo: {
          phoneNumber:      formatPhoneForMpesa(formData.phoneNumber),
          deliveryLocation: formData.deliveryLocation,
          deliveryCoords:   formData.deliveryCoords,
          notes:            formData.notes,
        },
        paymentMethod: formData.paymentMethod,
      });

      if (formData.paymentMethod === 'mpesa') {
        setCreated(data.order);
        setStep('payment');
      } else {
        // Cash / bank — order is confirmed immediately
        toast.success('Order placed successfully!');
        clearCart();
        onOrderCreated?.(data.order);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async ({ checkoutId, transactionId }) => {
    try {
      await ordersAPI.updateOrder(created.id, {
        paymentStatus: 'completed',
        transactionId: transactionId || checkoutId || null,
      });
    } catch (_) {}
    clearCart();
    onOrderCreated?.(created);
    onClose();
  };

  const handleClose = () => {
    setStep('form');
    setCreated(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10">
          <div>
            <h2 className="font-display text-xl font-semibold text-gray-900">
              {step === 'form' ? 'Checkout' : 'Complete Payment'}
            </h2>
            {step === 'payment' && created && (
              <p className="text-xs text-gray-400 mt-0.5">Order #{created.orderNumber} created — pay to confirm</p>
            )}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* ── STEP 1: Delivery & payment method ── */}
        {step === 'form' && (
          <form onSubmit={handlePlaceOrder} className="p-6 space-y-6">

            {/* Order Summary */}
            <div className="bg-vuka-green-pale p-4 rounded-lg space-y-3">
              <p className="font-semibold text-gray-900">Order Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span>
                  <span className="font-medium">KES {summary.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-vuka-green">Free</span>
                </div>
                <div className="flex justify-between border-t border-vuka-green/20 pt-2 font-semibold text-base">
                  <span>Total</span>
                  <span className="text-vuka-green">KES {summary.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel" name="phoneNumber"
                value={formData.phoneNumber} onChange={handleChange}
                placeholder="0712345678"
                className={`w-full px-4 py-2 rounded-lg border ${errors.phoneNumber ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-vuka-green/20`}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.phoneNumber}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Format: 0712345678 or +254712345678</p>
            </div>

            {/* Delivery Location — Map Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Location *</label>
              <CustomerPinMap onLocationSelected={handleLocationSelected} />
              {/* Fallback text if no pin placed */}
              {!formData.deliveryCoords && (
                <input
                  type="text" name="deliveryLocation"
                  value={formData.deliveryLocation} onChange={handleChange}
                  placeholder="Or type your address manually"
                  className={`w-full mt-2 px-4 py-2 rounded-lg border ${errors.deliveryLocation ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-vuka-green/20 text-sm`}
                />
              )}
              {errors.deliveryLocation && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.deliveryLocation}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions (Optional)</label>
              <textarea
                name="notes" value={formData.notes} onChange={handleChange}
                placeholder="e.g. Ring bell 3 times, leave at gate…" rows={2}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-vuka-green/20"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <p className="font-semibold text-gray-900">Payment Method</p>
              {[
                { value: 'mpesa', label: 'M-Pesa',           description: 'Pay via STK push — prompted on your phone' },
                { value: 'bank',  label: 'Bank Transfer',     description: 'Direct bank deposit (details sent by email)' },
                { value: 'cash',  label: 'Cash on Delivery',  description: 'Pay when order arrives' },
              ].map((m) => (
                <label key={m.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio" name="paymentMethod" value={m.value}
                    checked={formData.paymentMethod === m.value} onChange={handleChange}
                    className="mt-1 accent-vuka-green"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{m.label}</p>
                    <p className="text-sm text-gray-500">{m.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Customer info */}
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
              Order for <strong>{user?.name}</strong> ({user?.email})
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={handleClose} disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg bg-vuka-green text-white font-semibold hover:bg-vuka-green-dark disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Processing…' : 'Place Order'}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: M-Pesa payment ── */}
        {step === 'payment' && created && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              <CheckCircle size={16} className="flex-shrink-0" />
              Order #{created.orderNumber} created — complete payment below.
            </div>
            <MpesaPayment
              amount={summary.total}
              orderId={created.orderNumber}
              defaultPhone={formData.phoneNumber}
              onSuccess={handlePaymentSuccess}
            />
            <button
              onClick={handleClose}
              className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
            >
              Cancel (order will remain unpaid)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
