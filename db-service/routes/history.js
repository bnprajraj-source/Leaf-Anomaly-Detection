const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Prediction = require('../models/Prediction');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'leaf-anomaly-detection-secret-key-2024';

// Middleware: extract user from token (optional — doesn't block, just attaches)
const extractUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
    } catch {}
  }
  next();
};

// Middleware: check DB connection
const requireDb = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      detail: 'Mongoose is not connected to MongoDB. Start MongoDB to use history features.',
    });
  }
  next();
};

// GET /api/history — Paginated prediction history
router.get('/', requireDb, extractUser, async (req, res) => {
  try {
    const {
      page = 1,
      per_page = 20,
      prediction,
      anomaly_type,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.min(100, Math.max(1, parseInt(per_page)));
    const skip = (pageNum - 1) * limit;

    // Build filter
    const filter = {};
    if (req.userId) filter.user_id = new mongoose.Types.ObjectId(req.userId);
    if (prediction) filter.prediction = prediction;
    if (anomaly_type) filter.anomaly_type = anomaly_type;

    const [items, total] = await Promise.all([
      Prediction.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prediction.countDocuments(filter),
    ]);

    const total_pages = Math.ceil(total / limit) || 1;

    // Serialize _id to id
    const serialized = items.map((doc) => ({
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
    }));

    res.json({
      items: serialized,
      total,
      page: pageNum,
      per_page: limit,
      total_pages,
    });
  } catch (err) {
    console.error('GET /api/history error:', err);
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/history/:id — Get single record
router.get('/:id', requireDb, extractUser, async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.userId) filter.user_id = new mongoose.Types.ObjectId(req.userId);
    const doc = await Prediction.findOne(filter).lean();
    if (!doc) {
      return res.status(404).json({ detail: 'Record not found' });
    }
    res.json({
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ detail: 'Invalid record ID format' });
    }
    console.error('GET /api/history/:id error:', err);
    res.status(500).json({ detail: err.message });
  }
});

// POST /api/history — Save a new prediction record
router.post('/', requireDb, extractUser, async (req, res) => {
  try {
    const record = { ...req.body };
    if (req.userId) record.user_id = req.userId;
    const doc = await Prediction.create(record);
    res.status(201).json({
      id: doc._id.toString(),
      message: 'Record saved successfully',
    });
  } catch (err) {
    console.error('POST /api/history error:', err);
    res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/history/:id — Delete single record
router.delete('/:id', requireDb, extractUser, async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.userId) filter.user_id = new mongoose.Types.ObjectId(req.userId);
    const doc = await Prediction.findOneAndDelete(filter);
    if (!doc) {
      return res.status(404).json({ detail: 'Record not found' });
    }
    res.json({ message: 'Record deleted successfully', id: req.params.id });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ detail: 'Invalid record ID format' });
    }
    console.error('DELETE /api/history/:id error:', err);
    res.status(500).json({ detail: err.message });
  }
});

// DELETE /api/history — Clear all history
router.delete('/', requireDb, extractUser, async (req, res) => {
  try {
    const filter = {};
    if (req.userId) filter.user_id = new mongoose.Types.ObjectId(req.userId);
    const result = await Prediction.deleteMany(filter);
    res.json({
      message: 'All prediction history cleared',
      deleted_count: result.deletedCount,
    });
  } catch (err) {
    console.error('DELETE /api/history error:', err);
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/stats — Aggregated statistics
router.get('/stats/aggregate', requireDb, extractUser, async (req, res) => {
  try {
    const matchStage = {};
    if (req.userId) matchStage.user_id = new mongoose.Types.ObjectId(req.userId);

    const total = await Prediction.countDocuments(matchStage);

    if (total === 0) {
      return res.json({
        total_predictions: 0,
        healthy_count: 0,
        diseased_count: 0,
        disease_counts: {},
        avg_confidence: 0,
        avg_processing_time_ms: 0,
        recent_predictions: [],
        db_connected: true,
      });
    }

    // Aggregation
    const pipeline = Object.keys(matchStage).length > 0
      ? [{ $match: matchStage }, { $group: { _id: null, total: { $sum: 1 }, healthy_count: { $sum: { $cond: [{ $eq: ['$prediction', 'Healthy'] }, 1, 0] } }, diseased_count: { $sum: { $cond: [{ $eq: ['$prediction', 'Diseased'] }, 1, 0] } }, avg_confidence: { $avg: '$confidence' }, avg_processing_time: { $avg: '$processing_time_ms' } } }]
      : [{ $group: { _id: null, total: { $sum: 1 }, healthy_count: { $sum: { $cond: [{ $eq: ['$prediction', 'Healthy'] }, 1, 0] } }, diseased_count: { $sum: { $cond: [{ $eq: ['$prediction', 'Diseased'] }, 1, 0] } }, avg_confidence: { $avg: '$confidence' }, avg_processing_time: { $avg: '$processing_time_ms' } } }];

    const [aggResult] = await Prediction.aggregate(pipeline);

    // Disease counts
    const diseasePipeline = Object.keys(matchStage).length > 0
      ? [{ $match: matchStage }, { $group: { _id: '$anomaly_type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]
      : [{ $group: { _id: '$anomaly_type', count: { $sum: 1 } } }, { $sort: { count: -1 } }];
    const diseaseAgg = await Prediction.aggregate(diseasePipeline);
    const disease_counts = {};
    diseaseAgg.forEach((d) => {
      disease_counts[d._id] = d.count;
    });

    // Recent predictions
    const recentQuery = Object.keys(matchStage).length > 0 ? matchStage : {};
    const recent = await Prediction.find(recentQuery)
      .sort({ created_at: -1 })
      .limit(5)
      .lean()
      .then((docs) =>
        docs.map((d) => ({
          ...d,
          id: d._id.toString(),
          _id: undefined,
          created_at: d.created_at?.toISOString(),
        }))
      );

    res.json({
      total_predictions: aggResult?.total || 0,
      healthy_count: aggResult?.healthy_count || 0,
      diseased_count: aggResult?.diseased_count || 0,
      disease_counts,
      avg_confidence: Math.round((aggResult?.avg_confidence || 0) * 100) / 100,
      avg_processing_time_ms:
        Math.round((aggResult?.avg_processing_time || 0) * 100) / 100,
      recent_predictions: recent,
      db_connected: true,
    });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    res.status(500).json({ detail: err.message });
  }
});

module.exports = router;
