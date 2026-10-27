const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

// Import route modules
const authRoutes = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incident.routes');
const complaintRoutes = require('./routes/complaint.routes');
const adminRoutes = require('./routes/admin.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or during development
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// HTTP logging in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded static evidence images
const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// Rate limit general API endpoints
app.use('/api', apiLimiter);

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    project: 'CivicProof API',
    scope: 'Mumbai Municipal Grievance & Evidence Tracking',
    timestamp: new Date().toISOString()
  });
});

// Root welcome & disclaimer
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'CivicProof - Verified Municipal Issue Resolution',
    status: 'online',
    docs: '/api/health',
    notice: 'CivicProof is an independent civic evidence tool and is not an official BMC system.'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
