import express      from 'express';
import cors         from 'cors';
import dotenv       from 'dotenv';
import path         from 'path';
import { fileURLToPath } from 'url';
import authRoutes    from './routes/auth.js';
import productsRoutes from './routes/products.js';
import ordersRoutes  from './routes/orders.js';
import mpesaRoutes   from './routes/mpesa.js';
import uploadRoutes  from './routes/upload.js';
import { errorHandler } from './middleware/auth.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('❌  FATAL: JWT_SECRET environment variable is not set. Set it in .env before starting.');
  process.exit(1);
}

console.log('🌾 Vuka Cereals API Starting...');
console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`💰 M-Pesa Configured: ${process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_KEY !== 'your_consumer_key_here' ? '✓ Yes' : '⚠ No (sandbox placeholder)'}`);
console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
console.log('─────────────────────────────────────────────────');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',     authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders',   ordersRoutes);
app.use('/api/mpesa',    mpesaRoutes);
app.use('/api/upload',   uploadRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'Vuka Cereals API v2' }));

// Serve React build in production — must be after all API routes
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🌾 Vuka API → http://localhost:${PORT}`));
