import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB, disconnectDB, getDbMode } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import candidateRoutes from './routes/candidateRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import authRoutes from './routes/authRoutes.js';
import shortlistRoutes from './routes/shortlistRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import { getPricingConfig } from './controllers/billingController.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// 1. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS configuration (explicit trusted origins with credentials, never wildcard)
const allowedOrigins = [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
    return true;
  }
  try {
    const url = new URL(origin);
    if (url.hostname === 'hirevoxa.com' || url.hostname.endsWith('.hirevoxa.com')) return true;
    if (url.hostname === 'hirevoxa.vercel.app' || url.hostname.endsWith('.vercel.app')) return true;
  } catch {
    return false;
  }
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Hirevoxa-CSRF']
}));

// 3. Cookie parser for HttpOnly session cookies
app.use(cookieParser());

// 4. Rate Limiter (protection against abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', limiter);

// 5. Body parser with strict size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 6. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Hirevoxa API Service',
    version: '1.0.0',
    mode: getDbMode(),
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// 7. API Resource Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/shortlists', shortlistRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/billing', billingRoutes);
app.get('/api/pricing', getPricingConfig);

// 8. Static Frontend Serving (in production or when client/dist exists)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 9. Error & 404 Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Only listen if executed directly, not when imported in test suites
const isDirectRun = (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) || process.env.AUTO_START === 'true';
if (isDirectRun && process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[Hirevoxa API] Server running on http://localhost:${PORT}`);
        console.log(`[Hirevoxa API] Database Mode: ${getDbMode()}`);
      });
    })
    .catch((error) => {
      console.error(`[FATAL DATABASE CONFIGURATION ERROR] ${error.message}`);
      process.exitCode = 1;
    });
} else {
  connectDB().catch((error) => {
    console.error(`[DATABASE CONFIGURATION ERROR] ${error.message}`);
  });
}

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`[Hirevoxa API] Received ${signal}. Closing server and database connection cleanly...`);
  try {
    await disconnectDB();
  } catch (err) {
    console.error(`[Hirevoxa API] Error during disconnect: ${err.message}`);
  }
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[Hirevoxa API] Unhandled Rejection:', reason?.message || reason);
});

export default app;
