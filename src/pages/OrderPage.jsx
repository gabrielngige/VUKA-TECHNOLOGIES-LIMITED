import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, Clock, CheckCircle, Truck, ArrowLeft, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/index.js';
import { ordersAPI } from '../utils/api.js';
import { formatDate, getOrderStatusColor, formatCurrency } from '../utils/helpers.js';

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const statusConfig = {
  pending:   { icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50',            label: 'Pending' },
  confirmed: { icon: CheckCircle,  color: 'text-blue-600',   bg: 'bg-blue-50',              label: 'Confirmed' },
  shipped:   { icon: Truck,        color: 'text-purple-600', bg: 'bg-purple-50',            label: 'Shipped' },
  delivered: { icon: CheckCircle,  color: 'text-vuka-green', bg: 'bg-vuka-green-pale',      label: 'Delivered' },
  cancelled: { icon: Package,      color: 'text-red-600',    bg: 'bg-red-50',               label: 'Cancelled' },
};

export default function OrderPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updating,     setUpdating]     = useState(null); // orderId being updated

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await ordersAPI.getAll();
        setOrders(data.orders || []);
      } catch {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleStatusChange = async (orderId, orderStatus) => {
    setUpdating(orderId);
    try {
      const { data } = await ordersAPI.updateOrder(orderId, { orderStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
      toast.success(`Status updated to ${orderStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Package size={48} className="text-gray-200 mx-auto mb-4" />
      <p className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your orders</p>
      <Link to="/login" className="btn-primary inline-flex mt-4">Sign In</Link>
    </div>
  );

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <Loader2 className="animate-spin text-vuka-green mx-auto mb-4" size={32} />
      <p className="text-gray-600">Loading your orders…</p>
    </div>
  );

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.orderStatus === filterStatus);

  if (orders.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-vuka-green hover:underline font-medium mb-6">
        <ArrowLeft size={16} /> Back to catalog
      </Link>
      <Package size={48} className="text-gray-200 mx-auto mb-4" />
      <p className="text-lg font-semibold text-gray-900 mb-2">No orders yet</p>
      <p className="text-sm text-gray-500 mb-6">Start shopping to create your first order.</p>
      <Link to="/" className="btn-primary inline-flex">Browse Products</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-vuka-green mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to catalog
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-vuka-green mb-1">
          {isAdmin ? 'All Orders' : 'Your Orders'}
        </h1>
        <p className="text-gray-600 flex items-center gap-1.5">
          {isAdmin && <><Shield size={14} className="text-amber" /><span>Admin view — showing all customer orders</span></>}
          {!isAdmin && `Order history for ${user.name || user.email}`}
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: 'all',       label: 'All Orders' },
          { value: 'pending',   label: 'Pending' },
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'shipped',   label: 'Shipped' },
          { value: 'delivered', label: 'Delivered' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition-colors ${
              filterStatus === f.value ? 'bg-vuka-green text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="card p-8 text-center">
            <Package size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900">No {filterStatus !== 'all' ? filterStatus : ''} orders</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const cfg = statusConfig[order.orderStatus] || statusConfig.pending;
            const Icon = cfg.icon;

            return (
              <div key={order.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <p className="font-display text-lg font-semibold text-gray-900">{order.orderNumber}</p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon size={14} />{cfg.label}
                      </span>
                      {order.paymentStatus === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <CheckCircle size={12} /> Paid
                        </span>
                      )}
                      {order.paymentStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                          <Clock size={12} /> Awaiting payment
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><Clock size={13} />{formatDate(order.createdAt)}</span>
                      {isAdmin && order.userName && <span className="text-gray-700 font-medium">{order.userName}</span>}
                      {isAdmin && <span className="text-gray-400">{order.userEmail}</span>}
                    </div>
                    {order.deliveryLocation && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                        <MapPin size={13} className="text-amber flex-shrink-0" />
                        <span className="truncate">{order.deliveryLocation}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="font-display text-2xl font-bold text-vuka-green">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-500 mt-1">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} · {order.mode}</p>
                  </div>
                </div>

                {/* Admin status control */}
                {isAdmin && (
                  <div className="border-t border-gray-100 pt-3 flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Update Status:</span>
                    <select
                      value={order.orderStatus}
                      disabled={updating === order.id}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-vuka-green"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    {updating === order.id && <Loader2 size={14} className="animate-spin text-vuka-green" />}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {orders.length > 0 && (
        <div className="mt-8 text-center">
          <Link to="/" className="text-vuka-green hover:underline font-medium text-sm">← Continue shopping</Link>
        </div>
      )}
    </div>
  );
}
