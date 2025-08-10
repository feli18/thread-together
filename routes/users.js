import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { isLoggedIn } from '../middleware/middleware.js';
import upload from '../middleware/multer.js'; 
import { followUser, unfollowUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/profile/edit', isLoggedIn, upload.single('avatar'), async (req, res) => {
  const { username, bio, website } = req.body;
  const user = await User.findById(req.session.userId);

  user.username = username;
  user.bio = bio;
  user.website = website;

  if (req.file) {
    user.avatar = '/uploads/' + req.file.filename;
  }

  await user.save();
  req.flash('success', 'Profile updated successfully!');
  res.redirect('/profile');
});

router.get('/profile/edit', isLoggedIn, async (req, res) => {
  const user = await User.findById(req.session.userId); 
  res.render('users/edit', { user });
});

router.get('/users/:id', async (req, res, next) => {
  try {
    // 被访问的用户
    const profileUser = await User.findById(req.params.id).lean();
    if (!profileUser) return res.status(404).send('User not found');

    
    const userPosts = await Post.find({ author: profileUser._id })
      .sort({ createdAt: -1 })
      .lean();

    const currentUser = req.session.userId
      ? await User.findById(req.session.userId).lean()
      : null;

    res.render('users/publicProfile', {
      user: profileUser,   
      userPosts,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/users/:id/follow', isLoggedIn, followUser);

router.post('/users/:id/unfollow', isLoggedIn, unfollowUser);


export default router;
