import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  avatar: {type: String,default: '/images/propic.png'},
  bio: {type: String,default: ''},
  website: {type: String,default: ''},
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

});

const User = mongoose.model('User', userSchema);

export default User;
