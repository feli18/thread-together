import mongoose from 'mongoose';

const suggestedTagSchema = new mongoose.Schema({
  tag: { type: String, required: true },
  category: { type: String, enum: ['Style', 'Material', 'Technique', 'Garment', 'Other'], default: 'Other' },
  rank: { type: Number, required: true }, 
  score: { type: Number, required: true } 
}, { _id: false });

const taskLogSchema = new mongoose.Schema({
  // Core identification
  taskId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, 
  sessionId: { type: String, required: true }, 
  
  // Experiment configuration
  mode: { type: String, enum: ['editable', 'locked', 'off'], required: true }, 
  model: { type: String, default: 'clip' }, 
  k: { type: Number, required: true }, 
  imageId: { type: String, required: true }, 
  
  // Timing data
  startedAt: { type: Date, required: true }, 
  submittedAt: { type: Date, required: false }, 

  // AI suggestions (empty array for mode='off')
  suggested: [suggestedTagSchema],
  
  // Final user output
  final: [{ type: String }], 

  // Task metadata
  isWarmup: { type: Boolean, default: false }, 
  participantSequence: { type: Number, required: false },
  latinSquareGroup: { type: Number, required: false }, 
  
  // Quality indicators
  aiCallSuccess: { type: Boolean, default: true }, 
  imageUploadSuccess: { type: Boolean, default: true }, 
  
  // Additional context
  userAgent: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for efficient querying
taskLogSchema.index({ userId: 1, createdAt: -1 });
taskLogSchema.index({ mode: 1, createdAt: -1 });
taskLogSchema.index({ sessionId: 1, createdAt: -1 });
taskLogSchema.index({ taskId: 1 });
taskLogSchema.index({ imageId: 1 });

// Virtual for completion time in seconds
taskLogSchema.virtual('completionTimeSeconds').get(function() {
  if (!this.submittedAt || !this.startedAt) return null;
  return Math.round((this.submittedAt - this.startedAt) / 1000);
});

// Virtual for task completion status
taskLogSchema.virtual('isCompleted').get(function() {
  return !!this.submittedAt;
});

// Method to calculate acceptance rate for this task
taskLogSchema.methods.getAcceptanceRate = function() {
  if (this.suggested.length === 0) return null;
  const acceptedCount = this.suggested.filter(s => 
    this.final.some(f => f.toLowerCase() === s.tag.toLowerCase())
  ).length;
  return acceptedCount / this.suggested.length;
};

// Method to get category coverage
taskLogSchema.methods.getCategoryCoverage = function() {
  const categories = new Set();
  this.final.forEach(tag => {
    const suggested = this.suggested.find(s => s.tag.toLowerCase() === tag.toLowerCase());
    if (suggested) {
      categories.add(suggested.category);
    } else {
      categories.add(this.inferCategory(tag));
    }
  });
  return ['Style', 'Material', 'Technique'].filter(cat => categories.has(cat)).length;
};

// Helper method to infer category (same logic as frontend)
taskLogSchema.methods.inferCategory = function(tag) {
  const styles = ['vintage', 'modern', 'minimalist', 'cottagecore', 'street', 'classic', 'bohemian', 'elegant'];
  const materials = ['cotton', 'linen', 'silk', 'wool', 'denim', 'leather', 'polyester', 'rayon'];
  const techniques = ['patchwork', 'applique', 'embroidery', 'handsewn', 'quilting', 'knitting', 'crochet'];
  
  const lowerTag = tag.toLowerCase();
  if (styles.some(s => lowerTag.includes(s))) return 'Style';
  if (materials.some(m => lowerTag.includes(m))) return 'Material';
  if (techniques.some(t => lowerTag.includes(t))) return 'Technique';
  return 'Other';
};

const TaskLog = mongoose.model('TaskLog', taskLogSchema);
export default TaskLog;
