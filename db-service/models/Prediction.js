const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  prediction: {
    type: String,
    required: true,
    enum: ['Healthy', 'Diseased'],
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  anomaly_type: {
    type: String,
    required: true,
  },
  all_scores: {
    type: Map,
    of: Number,
    default: {},
  },
  processing_time_ms: {
    type: Number,
    default: 0,
  },
  image_meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  attention_map_available: {
    type: Boolean,
    default: false,
  },
  filename: {
    type: String,
    default: null,
  },
  user_agent: {
    type: String,
    default: null,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

predictionSchema.index({ created_at: -1 });
predictionSchema.index({ prediction: 1 });
predictionSchema.index({ anomaly_type: 1 });
predictionSchema.index({ user_id: 1 });

module.exports = mongoose.model('Prediction', predictionSchema);
