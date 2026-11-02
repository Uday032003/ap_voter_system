import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import geographyRoutes from './routes/geographyRoutes.js';
import constituencyRoutes from './routes/constituencyRoutes.js';
import voterRoutes from './routes/voterRoutes.js';
import accessRequestRoutes from './routes/accessRequestRoutes.js';
import leaderWorkspaceRoutes from './routes/leaderWorkspaceRoutes.js';
import importRoutes from './routes/importRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

const app = express();

// Allowed Origins for CORS (Vercel, Localhost, Custom Domain)
const allowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5000'
].filter(Boolean);

// Dynamic CORS configuration - safely mirrors caller origin for credentials
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow configured client URL, localhost, or any vercel.app deployment preview/production
    const isAllowed = 
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed || ENV.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Default permissive reflection so Vercel deployments are not blocked
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate Limiting for sensitive routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests from this IP. Please try again after 15 minutes.' }
});

// Root service endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Andhra Pradesh Voter Directory & Constituency Management System API',
    status: 'online',
    version: '2.0.0',
    mode: 'Neutral Electoral Roll & Record Management System',
    timestamp: new Date().toISOString(),
    health: '/api/health',
    endpoints: {
      health: '/api/health',
      voters: '/api/voters',
      constituencies: '/api/constituencies',
      auth: '/api/auth'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Andhra Pradesh Voter Directory & Constituency Management System',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    mode: ENV.IS_SUPABASE_CONFIGURED ? 'supabase_postgresql' : 'mock_datastore'
  });
});

// Mount Routes - Clean, Neutral Electoral System
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/geography', geographyRoutes);
app.use('/api/constituencies', constituencyRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/access-requests', accessRequestRoutes);
app.use('/api/leader', leaderWorkspaceRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/public', publicRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test' && !process.argv.some(arg => arg.includes('test'))) {
  const PORT = ENV.PORT || 5000;
  const HOST = '0.0.0.0';

  app.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(` Andhra Pradesh Voter Directory API running on port ${PORT}`);
    console.log(` Host: ${HOST} (Listening for Render / Cloud Containers)`);
    console.log(` Mode: Neutral Electoral Roll & Record Management System`);
    console.log(` Database: ${ENV.IS_SUPABASE_CONFIGURED ? 'Supabase PostgreSQL' : 'Mock Datastore'}`);
    console.log(` Health: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

export default app;
