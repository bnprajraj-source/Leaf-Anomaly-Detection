const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'leaf-anomaly-detection-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

// Check if MongoDB is connected
const isDbReady = () => mongoose.connection.readyState === 1;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ detail: 'Database not connected. Please start MongoDB on port 27017 and restart the DB service.' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ detail: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ detail: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ detail: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error('POST /api/auth/register error:', err);
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ detail: 'Database not connected. Please start MongoDB on port 27017 and restart the DB service.' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ detail: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/auth/me — get current user from token
router.get('/me', async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ detail: 'Database not connected.' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ detail: 'User not found.' });
    }

    res.json({ id: user._id, name: user.name, email: user.email, avatar: user.avatar });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Invalid or expired token.' });
    }
    console.error('GET /api/auth/me error:', err);
    res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
