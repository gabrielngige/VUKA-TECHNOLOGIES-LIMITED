import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import DeliveryMap from '../components/delivery/DeliveryMap.jsx';
import { useDeliveryStore, useAuthStore } from '../store/index.js';
import { ordersAPI } from '../utils/api.js';

// Maps server order → delivery store shape expected by DeliveryMap
const toDeliveryOrder = (o) => ({
  id:       o.orderNumber,
  customer: o.userName || o.userEmail,
  lat:      o.deliveryCoords?.lat  ?? null,
  lng:      o.deliveryCoords?.lng  ?? null,
  area:     o.deliveryLocation     || 'Unknown',
  items:    (o.items || []).map(i => `${i.productName} x${i.quantity}`).join(', '),
  amount:   o.total,
  status:   o.orderStatus === 'delivered' ? 'delivered'
          : o.orderStatus === 'shipped'   ? 'transit'
          : 'pending',
});

export default function DeliveryPage() {
  const { setOrders } = useDeliveryStore();
  const isAdmin = useAuthStore(s => s.isAdmin);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await ordersAPI.getAll();
        setOrders((data.orders || []).map(toDeliveryOrder));
      } catch {
        // Non-admin users see their own orders; any fetch failure is silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-vuka-green">
          Delivery <span className="text-amber">Tracker</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {isAdmin
            ? 'Live view of all customer deliveries — click a marker for order details'
            : 'Live delivery status — click a marker on the map to view order details'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-vuka-green" size={28} />
        </div>
      ) : (
        <DeliveryMap />
      )}
    </div>
  );
}
