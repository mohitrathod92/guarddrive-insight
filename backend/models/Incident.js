const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'session',
    required: true,
  },
  type: {
    type: String,
    enum: ['Blink', 'Drowsiness'],
    required: true,
  },
  ear: {
    type: Number,
    required: true,
  },
  frames: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('incident', IncidentSchema);
