import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const db = new Database(path.join(__dirname, 'vuka.db'));

// WAL mode gives safe concurrent reads alongside writes
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    password  TEXT,
    role      TEXT    NOT NULL DEFAULT 'customer',
    createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL,
    category       TEXT    NOT NULL DEFAULT 'Maize & Flour',
    weight         TEXT    DEFAULT '',
    retailPrice    REAL    NOT NULL,
    wholesalePrice REAL    NOT NULL,
    stock          INTEGER NOT NULL DEFAULT 0,
    emoji          TEXT    DEFAULT '📦',
    badge          TEXT,
    image          TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    orderNumber     TEXT NOT NULL,
    userId          INTEGER NOT NULL,
    userEmail       TEXT NOT NULL,
    userName        TEXT,
    mode            TEXT NOT NULL DEFAULT 'retail',
    subtotal        REAL NOT NULL,
    shippingFee     REAL NOT NULL DEFAULT 200,
    tax             REAL NOT NULL,
    total           REAL NOT NULL,
    paymentMethod   TEXT NOT NULL DEFAULT 'mpesa',
    paymentStatus   TEXT NOT NULL DEFAULT 'pending',
    orderStatus     TEXT NOT NULL DEFAULT 'pending',
    transactionId   TEXT,
    phoneNumber     TEXT,
    deliveryLocation TEXT,
    deliveryLat     REAL,
    deliveryLng     REAL,
    notes           TEXT DEFAULT '',
    createdAt       TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt       TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    productId   INTEGER,
    productName TEXT NOT NULL,
    quantity    INTEGER NOT NULL,
    unitPrice   REAL NOT NULL,
    totalPrice  REAL NOT NULL,
    category    TEXT,
    mode        TEXT
  );
`);

// ── One-time migration from JSON flat files ────────────────────
const migrate = db.transaction(() => {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount === 0) {
    const usersPath = path.join(__dirname, 'users.json');
    if (fs.existsSync(usersPath)) {
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const ins = db.prepare(
        'INSERT OR IGNORE INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const u of users) ins.run(u.id, u.name, u.email, u.password, u.role, u.createdAt);
      console.log(`📦 Migrated ${users.length} user(s) from users.json`);
    }
  }

  const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  if (productCount === 0) {
    const productsPath = path.join(__dirname, 'products.json');
    if (fs.existsSync(productsPath)) {
      const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      const ins = db.prepare(
        'INSERT OR IGNORE INTO products (name, category, weight, retailPrice, wholesalePrice, stock, emoji, badge, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      for (const p of products) ins.run(p.name, p.category, p.weight, p.retailPrice, p.wholesalePrice, p.stock, p.emoji, p.badge ?? null, p.image ?? null);
      console.log(`📦 Migrated ${products.length} product(s) from products.json`);
    }
  }

  const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  if (orderCount === 0) {
    const ordersPath = path.join(__dirname, 'orders.json');
    if (fs.existsSync(ordersPath)) {
      const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
      const insOrder = db.prepare(`
        INSERT OR IGNORE INTO orders
          (id, orderNumber, userId, userEmail, userName, mode, subtotal, shippingFee, tax, total,
           paymentMethod, paymentStatus, orderStatus, transactionId, phoneNumber,
           deliveryLocation, deliveryLat, deliveryLng, notes, createdAt, updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `);
      const insItem = db.prepare(`
        INSERT INTO order_items (orderId, productId, productName, quantity, unitPrice, totalPrice, category, mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const o of orders) {
        insOrder.run(
          o.id, o.orderNumber, o.userId, o.userEmail, o.userName ?? null, o.mode,
          o.subtotal, o.shippingFee, o.tax, o.total,
          o.paymentMethod, o.paymentStatus, o.orderStatus, o.transactionId ?? null,
          o.customerInfo?.phoneNumber ?? null, o.deliveryLocation ?? null,
          o.customerInfo?.deliveryCoords?.lat ?? null,
          o.customerInfo?.deliveryCoords?.lng ?? null,
          o.notes ?? '', o.createdAt, o.updatedAt
        );
        for (const item of (o.items ?? [])) {
          insItem.run(o.id, item.productId ?? null, item.productName, item.quantity, item.unitPrice, item.totalPrice, item.category ?? null, item.mode ?? null);
        }
      }
      console.log(`📦 Migrated ${orders.length} order(s) from orders.json`);
    }
  }
});

migrate();

// Add google_id column if it doesn't exist yet (idempotent)
try {
  db.exec(`ALTER TABLE users ADD COLUMN google_id TEXT`);
} catch {
  // Column already exists — safe to ignore
}
