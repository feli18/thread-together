import mongoose from 'mongoose';


const tagActionLogSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  postId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: false },

  tag:          { type: String, required: true },
  action:       { type: String, enum: ['suggest', 'accept', 'edit', 'remove', 'add'], required: true },

 
  timeMs:       { type: Number, required: false, default: null },

  category:     { type: String, enum: ['Style', 'Material', 'Technique', 'Other'], required: false, default: 'Other' },

  suggestedCount: { type: Number, required: false, default: null },

  sessionId:    { type: String, required: false },

  expGroup:     { type: String, enum: ['A', 'B'], required: false },

  createdAt:    { type: Date, default: Date.now }
});

const TagActionLog = mongoose.model('TagActionLog', tagActionLogSchema);
export default TagActionLog;


