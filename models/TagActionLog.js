import mongoose from 'mongoose';

// Minimal logging model for tag interactions and measurements
// Captures: user, optional post, tag text, action type, time used, category, etc.
// Action types include: 'suggest', 'accept', 'edit', 'remove', 'add'

const tagActionLogSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  postId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: false },

  tag:          { type: String, required: true },
  action:       { type: String, enum: ['suggest', 'accept', 'edit', 'remove', 'add'], required: true },

  // milliseconds spent for this action (e.g., since suggestions surfaced)
  timeMs:       { type: Number, required: false, default: null },

  // Optional high-level category for the tag
  category:     { type: String, enum: ['Style', 'Material', 'Technique', 'Other'], required: false, default: 'Other' },

  // Optional counters to help compute accepted/suggested without cross-joining
  suggestedCount: { type: Number, required: false, default: null },

  // Helpful to correlate anonymous sessions before login
  sessionId:    { type: String, required: false },

  createdAt:    { type: Date, default: Date.now }
});

const TagActionLog = mongoose.model('TagActionLog', tagActionLogSchema);
export default TagActionLog;


