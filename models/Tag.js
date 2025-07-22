import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Style', 'Material', 'Technique'], required: true }
});

const Tag = mongoose.model('Tag', tagSchema);
export default Tag;
