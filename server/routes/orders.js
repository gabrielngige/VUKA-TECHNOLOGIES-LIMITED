import express from 'express';
import { db }  from '../db/database.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ── Helpers ────────────────────────────────────────────────────

const withItems = (row) => {
  if (!row) return null;
  const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(row.id);
  return {
    id:            row.id,
    orderNumber:   row.orderNumber,
    userId:        row.userId,
    userEmail:     row.userEmail,
    userName:      row.userName,
    items,
    mode:          row.mode,
    customerInfo: {
      phoneNumber:      row.phoneNumber,
      deliveryLocation: row.deliveryLocation,
      deliveryCoords:   row.deliveryLat ? { lat: row.deliveryLat, lng: row.deliveryLng } : null,
      notes:            row.notes,
    },
    subtotal:      row.subtotal,
    shippingFee:   row.shippingFee,
    tax:           row.tax,
    total:         row.total,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    orderStatus:   row.orderStatus,
    transactionId: row.transactionId,
    deliveryLocation: row.deliveryLocation,
    deliveryCoords:   row.deliveryLat ? { lat: row.deliveryLat, lng: row.deliveryLng } : null,
    notes:         row.notes,
    createdAt:     row.createdAt,
    updatedAt:     row.updatedAt,
  };
};

// ── POST /api/orders ───────────────────────────────────────────
router.post('/', verifyToken, (req, res) => {
  const { items, mode, customerInfo, paymentMethod } = req.body;

  if (!items?.length)
    return res.status(400).json({ message: 'Cart is empty' });
  if (!customerInfo?.phoneNumber || !customerInfo?.deliveryLocation)
    return res.status(400).json({ message: 'Customer info incomplete' });

  const subtotal    = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const shippingFee = 200;
  const tax         = Math.round(subtotal * 0.16);
  const total       = subtotal + shippingFee + tax;
  const id          = Date.now().toString();
  const orderNumber = `ORD-${id.slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  const now         = new Date().toISOString();

  const createOrder = db.transaction(() => {
    db.prepare(`
      INSERT INTO orders
        (id, orderNumber, userId, userEmail, userName, mode,
         subtotal, shippingFee, tax, total, paymentMethod,
         paymentStatus, orderStatus, phoneNumber, deliveryLocation,
         deliveryLat, deliveryLng, notes, createdAt, updatedAt)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending','pending',?,?,?,?,?,?,?)
    `).run(
      id, orderNumber, req.user.id, req.user.email, req.user.name ?? null, mode,
      subtotal, shippingFee, tax, total, paymentMethod,
      customerInfo.phoneNumber, customerInfo.deliveryLocation,
      customerInfo.deliveryCoords?.lat ?? null,
      customerInfo.deliveryCoords?.lng ?? null,
      customerInfo.notes ?? '', now, now
    );

    const insItem = db.prepare(`
      INSERT INTO order_items (orderId, productId, productName, quantity, unitPrice, totalPrice, category, mode)
      VALUES (?,?,?,?,?,?,?,?)
    `);
    for (const item of items) {
      insItem.run(id, item.productId ?? null, item.productName, item.quantity, item.unitPrice, item.totalPrice, item.category ?? null, item.mode ?? mode);
    }
  });

  createOrder();

  const order = withItems(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
  res.status(201).json({ message: 'Order created successfully', order });
});

// ── GET /api/orders/user/:userId (must be before /:id) ────────
router.get('/user/:userId', verifyToken, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC').all(req.params.userId);
  res.json({ orders: rows.map(withItems), total: rows.length });
});

// ── GET /api/orders ────────────────────────────────────────────
router.get('/', verifyToken, (req, res) => {
  const rows = req.user.role === 'admin'
    ? db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all()
    : db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC').all(req.user.id);

  res.json({ orders: rows.map(withItems), total: rows.length });
});

// ── GET /api/orders/:id ────────────────────────────────────────
router.get('/:id', verifyToken, (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Order not found' });
  if (req.user.role !== 'admin' && String(row.userId) !== String(req.user.id))
    return res.status(403).json({ message: 'Unauthorized' });

  res.json({ order: withItems(row) });
});

// ── PATCH /api/orders/:id ──────────────────────────────────────
router.patch('/:id', verifyToken, requireAdmin, (req, res) => {
  const row = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Order not found' });

  const { orderStatus, paymentStatus, transactionId } = req.body;
  const sets = [];
  const vals = [];

  if (orderStatus)   { sets.push('orderStatus = ?');   vals.push(orderStatus); }
  if (paymentStatus) { sets.push('paymentStatus = ?'); vals.push(paymentStatus); }
  if (transactionId) { sets.push('transactionId = ?'); vals.push(transactionId); }
  sets.push('updatedAt = ?'); vals.push(new Date().toISOString());
  vals.push(req.params.id);

  db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ message: 'Order updated', order: withItems(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)) });
});

// ── DELETE /api/orders/:id ─────────────────────────────────────
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
  const row = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Order not found' });
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ message: 'Order deleted' });
});

export default router;
