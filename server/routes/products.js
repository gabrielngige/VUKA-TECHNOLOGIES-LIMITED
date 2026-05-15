import express from 'express';
import { db } from '../db/database.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/products — public
router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    const conditions = [];

    if (category && category !== 'All') { conditions.push('category = ?'); params.push(category); }
    if (search) { conditions.push('LOWER(name) LIKE ?'); params.push(`%${search.toLowerCase()}%`); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY id ASC';

    res.json({ products: db.prepare(query).all(...params) });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
});

// POST /api/products — admin only
router.post('/', verifyToken, requireAdmin, (req, res) => {
  try {
    const { name, category, weight, retailPrice, wholesalePrice, stock, emoji, badge, image } = req.body;
    if (!name || retailPrice == null || stock == null) {
      return res.status(400).json({ message: 'name, retailPrice and stock are required' });
    }
    const rp = Number(retailPrice);
    const wp = Number(wholesalePrice) || Math.round(rp * 0.75);
    const result = db.prepare(
      'INSERT INTO products (name, category, weight, retailPrice, wholesalePrice, stock, emoji, badge, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, category || 'Maize & Flour', weight || '', rp, wp, Number(stock), emoji || '📦', badge || null, image || null);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
});

// PATCH /api/products/:id — admin only
router.patch('/:id', verifyToken, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!db.prepare('SELECT id FROM products WHERE id = ?').get(id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { retailPrice, wholesalePrice, stock, id: _id, ...rest } = req.body;
    const fields = { ...rest };
    if (retailPrice != null) fields.retailPrice = Number(retailPrice);
    if (wholesalePrice != null) fields.wholesalePrice = Number(wholesalePrice);
    if (stock != null) fields.stock = Number(stock);

    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ message: 'Nothing to update' });

    db.prepare(`UPDATE products SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`)
      .run(...Object.values(fields), id);

    res.json({ product: db.prepare('SELECT * FROM products WHERE id = ?').get(id) });
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

// DELETE /api/products/:id — admin only
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!db.prepare('SELECT id FROM products WHERE id = ?').get(id)) {
      return res.status(404).json({ message: 'Product not found' });
    }
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

export default router;
