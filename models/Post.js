import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video'], required: true },
  image: String,
  video: String,
  text: String
}, { _id: false });

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  tags: [{ type: String }],
  steps: [stepSchema],

  
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);
export default Post;
