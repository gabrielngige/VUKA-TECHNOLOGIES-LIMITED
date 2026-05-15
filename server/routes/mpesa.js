import express from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/auth.js';

const router = express.Router();

// ─── Daraja Config ─────────────────────────────────────────────
const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,          // Your Lipa Na Mpesa Online shortcode
  MPESA_PASSKEY,            // From Daraja dashboard
  MPESA_CALLBACK_URL,       // Publicly accessible URL e.g. https://yourdomain.com/api/mpesa/callback
  MPESA_ENV = 'sandbox',    // 'sandbox' | 'production'
} = process.env;

const BASE_URL = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// In-memory payment store (use Redis or DB in production)
const payments = {};

// ─── Helper: Get OAuth Token ────────────────────────────────────
async function getAccessToken() {
  const creds = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const res = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${creds}` },
  });
  return res.data.access_token;
}

// ─── Helper: Generate Password ─────────────────────────────────
function generatePassword() {
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const raw = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
  return { password: Buffer.from(raw).toString('base64'), timestamp };
}

// ─── STK Push ─────────────────────────────────────────────────
// POST /api/mpesa/stk-push
router.post('/stk-push', asyncHandler(async (req, res) => {
  const { phone, amount, orderId } = req.body;

  if (!phone || !amount || !orderId) {
    return res.status(400).json({ message: 'phone, amount, and orderId are required' });
  }

  const token = await getAccessToken();
  const { password, timestamp } = generatePassword();

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: phone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: orderId,
    TransactionDesc: `Vuka Cereals Order ${orderId}`,
  };

  const { data } = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Track payment
  if (data.CheckoutRequestID) {
    payments[data.CheckoutRequestID] = { orderId, paid: false, amount };
  }

  res.json(data);
}));

// ─── STK Status Query ──────────────────────────────────────────
// GET /api/mpesa/status/:checkoutId
router.get('/status/:checkoutId', asyncHandler(async (req, res) => {
  const { checkoutId } = req.params;

  // Check in-memory store first
  const payment = payments[checkoutId];
  if (payment?.paid) return res.json({ paid: true, ...payment });

  const token = await getAccessToken();
  const { password, timestamp } = generatePassword();

  const { data } = await axios.post(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutId,
  }, { headers: { Authorization: `Bearer ${token}` } });

  const paid = data.ResultCode === '0';
  if (paid && payments[checkoutId]) payments[checkoutId].paid = true;

  res.json({ paid, resultCode: data.ResultCode, resultDesc: data.ResultDesc });
}));

// ─── Daraja Callback (webhook Safaricom calls after STK) ───────
// POST /api/mpesa/callback
router.post('/callback', (req, res) => {
  const body = req.body?.Body?.stkCallback;

  if (!body) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  const { CheckoutRequestID, ResultCode, CallbackMetadata } = body;

  if (ResultCode === 0 && payments[CheckoutRequestID]) {
    const meta = CallbackMetadata?.Item || [];
    const get = (name) => meta.find((i) => i.Name === name)?.Value;
    payments[CheckoutRequestID].paid = true;
    payments[CheckoutRequestID].mpesaReceiptNumber = get('MpesaReceiptNumber');
    payments[CheckoutRequestID].transactionDate = get('TransactionDate');
    console.log(`✅ Payment confirmed: ${CheckoutRequestID}`, payments[CheckoutRequestID]);
  }

  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// ─── Paybill Confirmation (manual) ────────────────────────────
// POST /api/mpesa/paybill-confirm
router.post('/paybill-confirm', (req, res) => {
  const { orderId, phone, amount } = req.body;
  // In production: verify against your paybill transaction records
  console.log(`Paybill payment claimed for order ${orderId}: KES ${amount} from ${phone}`);
  res.json({ confirmed: true, orderId });
});

export default router;
