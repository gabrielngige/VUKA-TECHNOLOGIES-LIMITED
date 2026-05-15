import { useState } from 'react';
import { Phone, Building2, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const PAYBILL_NUMBER = '400200'; // Replace with Vuka's actual paybill
const TILL_NUMBER = '123456';   // Replace with Vuka's till

export default function MpesaPayment({ amount, orderId, defaultPhone = '', onSuccess }) {
  const [method, setMethod] = useState('stk'); // 'stk' | 'paybill'
  const [phone, setPhone] = useState(defaultPhone);
  const [status, setStatus] = useState('idle'); // idle | loading | polling | success | error
  const [message, setMessage] = useState('');

  const formatPhone = (val) => {
    // Normalize to 254XXXXXXXXX
    let num = val.replace(/\D/g, '');
    if (num.startsWith('0')) num = '254' + num.slice(1);
    if (num.startsWith('+')) num = num.slice(1);
    return num;
  };

  const handleSTKPush = async () => {
    const formatted = formatPhone(phone);
    if (formatted.length !== 12) {
      setMessage('Enter a valid Kenyan phone number (e.g. 0712345678)');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setMessage('');

    try {
      const res = await axios.post('/api/mpesa/stk-push', {
        phone: formatted,
        amount: Math.ceil(amount),
        orderId,
      });

      if (res.data.ResponseCode === '0') {
        setStatus('polling');
        setMessage('Check your phone and enter your M-Pesa PIN to complete payment.');
        // Poll for completion
        pollStatus(res.data.CheckoutRequestID, orderId);
      } else {
        setStatus('error');
        setMessage(res.data.CustomerMessage || 'Failed to initiate payment.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Could not connect. Please try again.');
    }
  };

  const pollStatus = async (checkoutId, orderId) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await axios.get(`/api/mpesa/status/${checkoutId}`);
        if (res.data.paid) {
          clearInterval(interval);
          setStatus('success');
          setMessage('Payment confirmed! Your order is being processed.');
          onSuccess?.({ method: 'stk', checkoutId, transactionId: res.data.mpesaReceiptNumber || checkoutId, orderId });
        }
      } catch (_) {}

      if (attempts >= 12) { // 60 seconds timeout
        clearInterval(interval);
        if (status !== 'success') {
          setStatus('error');
          setMessage('Payment timed out. If you completed payment, contact us with order ' + orderId);
        }
      }
    }, 5000);
  };

  return (
    <div className="card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#00A859]/10 rounded-lg flex items-center justify-center">
          <span className="text-[#00A859] font-bold text-sm">M</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Pay with M-Pesa</p>
          <p className="text-xs text-gray-400">Secure mobile payment</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-400">Total</p>
          <p className="font-display text-xl font-semibold text-vuka-green">KES {amount.toLocaleString()}</p>
        </div>
      </div>

      {/* Method selector */}
      <div className="flex gap-2">
        {[
          { id: 'stk', icon: <Phone size={14} />, label: 'STK Push', sub: 'Get prompted on phone' },
          { id: 'paybill', icon: <Building2 size={14} />, label: 'Paybill', sub: 'Manual payment' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => { setMethod(m.id); setStatus('idle'); setMessage(''); }}
            className={`flex-1 border-2 rounded-xl p-3 text-left transition-all ${
              method === m.id
                ? 'border-vuka-green bg-vuka-green-pale'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`flex items-center gap-1.5 text-xs font-semibold mb-0.5 ${method === m.id ? 'text-vuka-green' : 'text-gray-700'}`}>
              {m.icon} {m.label}
            </div>
            <p className="text-[11px] text-gray-400">{m.sub}</p>
          </button>
        ))}
      </div>

      {/* STK Push flow */}
      {method === 'stk' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">M-Pesa Number</label>
            <div className="flex gap-2 mt-1">
              <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 border-r-0 rounded-r-none">🇰🇪 +254</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="712 345 678"
                className="input-field rounded-l-none flex-1"
                disabled={status === 'loading' || status === 'polling' || status === 'success'}
              />
            </div>
          </div>

          {status !== 'success' && (
            <button
              onClick={handleSTKPush}
              disabled={status === 'loading' || status === 'polling'}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {(status === 'loading' || status === 'polling') && <Loader2 size={16} className="animate-spin" />}
              {status === 'idle' && 'Send Payment Request'}
              {status === 'loading' && 'Sending...'}
              {status === 'polling' && 'Waiting for payment...'}
              {status === 'error' && 'Try Again'}
            </button>
          )}
        </div>
      )}

      {/* Paybill flow */}
      {method === 'paybill' && (
        <div className="bg-vuka-green-pale border border-vuka-green/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-vuka-green uppercase tracking-wide">Payment Instructions</p>
          {[
            ['Paybill Number', PAYBILL_NUMBER],
            ['Account Number', orderId || 'Your Order ID'],
            ['Amount', `KES ${amount.toLocaleString()}`],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-vuka-green/10 last:border-0">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-sm font-semibold text-vuka-green font-mono">{value}</span>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 pt-1">
            Go to <strong>M-Pesa → Lipa na M-Pesa → Pay Bill</strong> and enter the above details. Your order will be confirmed once payment is received.
          </p>
          <button
            onClick={() => { setStatus('success'); onSuccess?.({ method: 'paybill', orderId }); }}
            className="btn-primary w-full text-sm"
          >
            I've Completed Payment
          </button>
        </div>
      )}

      {/* Status messages */}
      {message && (
        <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
          status === 'success' ? 'bg-green-50 text-green-700' :
          status === 'error' ? 'bg-red-50 text-red-600' :
          'bg-amber-pale text-amber-dark'
        }`}>
          {status === 'success' && <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />}
          {status === 'error' && <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
          {status === 'polling' && <Loader2 size={16} className="flex-shrink-0 mt-0.5 animate-spin" />}
          <p>{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center py-2">
          <CheckCircle size={40} className="text-vuka-green mx-auto mb-2" />
          <p className="font-semibold text-vuka-green">Order #{orderId} Confirmed!</p>
          <p className="text-xs text-gray-400 mt-1">You'll receive an SMS confirmation shortly.</p>
        </div>
      )}
    </div>
  );
}
