import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video'], required: true },
  image: String,
  video: String,
  text: String
}, { _id: false });

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  tags: [{ type: String }], 
  steps: [stepSchema],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now }
});

comments: [
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: String,
    date: { type: Date, default: Date.now },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }//reply comment
  }
]


const Post = mongoose.model('Post', postSchema);
export default Post;
