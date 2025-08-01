import mongoose from 'mongoose';
const tagViewSchema = new mongoose.Schema({
  tag:      { type: String, required: true },
  viewedAt: { type: Date,   default: Date.now },
  post:     { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }  // 可选
});
export default mongoose.model('TagView', tagViewSchema);