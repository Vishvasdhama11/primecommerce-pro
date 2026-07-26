import express from 'express';
import cors from 'cors';
import path from 'path';
import { authMiddleware } from './src/server/auth';
import authRoutes from './src/server/routes/authRoutes';
import productRoutes from './src/server/routes/productRoutes';
import userRoutes from './src/server/routes/userRoutes';
import orderRoutes from './src/server/routes/orderRoutes';
import adminRoutes from './src/server/routes/adminRoutes';
import razorpayRoutes from './src/server/routes/razorpayRoutes';

const app = express();
const PORT = 3000;

// Security & Parsing Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom Auth Middleware
app.use(authMiddleware);

// API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api/user', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/razorpay', razorpayRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Vite Dev Server Integration
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production build
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 NexusStore Full-Stack Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
