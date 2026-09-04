/**
 * Leaf Anomaly Detection — Node.js + Mongoose Database Service
 * =============================================================
 * Express API for MongoDB operations with auto-reconnection.
 * Run: node server.js
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const historyRoutes = require('./routes/history');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'leaf_anomaly_detection';

// Reconnection settings
const RECONNECT_INTERVAL_MS = 10000;
let reconnectAttempts = 0;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/history', historyRoutes);
app.use('/api/auth', authRoutes);

// Stats shortcut (no /api/history prefix)
app.get('/api/stats', async (req, res) => {
  // Redirect to the aggregate route inside history router
  req.url = '/stats/aggregate';
  historyRoutes(req, res, () => {});
});

// Health check
app.get('/api/health', async (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'healthy',
    db_connected: dbConnected,
    service: 'leaf-anomaly-db-service',
    version: '1.0.0',
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'Leaf Anomaly Detection — DB Service',
    version: '1.0.0',
    db_connected: mongoose.connection.readyState === 1,
    endpoints: {
      health: 'GET  /api/health',
      history: 'GET  /api/history',
      stats: 'GET  /api/stats',
      save: 'POST /api/history',
      delete: 'DELETE /api/history/:id',
    },
  });
});

// ---------------------------------------------------------------------------
// MongoDB Connection + Server Start
// ---------------------------------------------------------------------------
mongoose.set('strictQuery', false);

// Mongoose connection options for resilience
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  autoIndex: true,
};

async function connectToMongo() {
  try {
    await mongoose.connect(`${MONGODB_URL}/${MONGODB_DB_NAME}`, mongooseOptions);
    reconnectAttempts = 0;
    console.log('='.repeat(60));
    console.log('  Leaf Anomaly DB Service — Mongoose Connected');
    console.log('='.repeat(60));
    console.log(`  MongoDB:  ${MONGODB_URL}/${MONGODB_DB_NAME}`);
    console.log(`  Port:     ${PORT}`);
    console.log('='.repeat(60));
  } catch (err) {
    console.warn('MongoDB not available:', err.message);
    console.warn('Running without database — history features disabled');
    console.warn(`Will retry every ${RECONNECT_INTERVAL_MS / 1000}s...`);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  setTimeout(async () => {
    if (mongoose.connection.readyState === 1) {
      return; // Already connected
    }
    reconnectAttempts++;
    console.log(`Attempting to reconnect to MongoDB (attempt ${reconnectAttempts})...`);
    try {
      await mongoose.connect(`${MONGODB_URL}/${MONGODB_DB_NAME}`, mongooseOptions);
      reconnectAttempts = 0;
      console.log('Successfully reconnected to MongoDB!');
    } catch (err) {
      console.warn(`Reconnection failed: ${err.message}`);
      scheduleReconnect();
    }
  }, RECONNECT_INTERVAL_MS);
}

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
  scheduleReconnect();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected.');
});

connectToMongo();

app.listen(PORT, () => {
  console.log(`DB Service running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
