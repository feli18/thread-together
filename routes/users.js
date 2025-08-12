import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { isLoggedIn } from '../middleware/middleware.js';
import upload from '../middleware/multer.js'; 
import { followUser, unfollowUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', isLoggedIn, async (req, res, next) => {
  try {
    console.log('Profile route start');
    console.log('  - User ID:', req.session.userId);
    
    const userId = req.session.userId;

    const user = await User.findById(userId)
      .populate('followers')
      .populate('following');
    
    console.log('  - User query result:', !!user);
    console.log('  - Username:', user?.username);

    const [userPosts, likedPosts, collectedPosts] = await Promise.all([
      Post.find({ author: userId }).sort({ createdAt: -1 }),
      Post.find({ likedBy: userId }).sort({ createdAt: -1 }),
      Post.find({ bookmarkedBy: userId }).sort({ createdAt: -1 }),
    ]);
    
    console.log('  - Posts number:', userPosts.length);
    console.log('  - prepare to render profile page');
    
    res.render('profile.ejs', { user, userPosts, likedPosts, collectedPosts });
    
    console.log('  - Profile page rendered');
  } catch (err) {
    console.error('❌ Profile route error:', err);
    next(err);
  }
});

async function handleProfileUpdate(req, res, next) {
  try {
    const { username, bio, website } = req.body;
    const user = await User.findById(req.session.userId);

    user.username = username;
    user.bio = bio;
    user.website = website;

    if (req.file) {
      if (req.file.filename) {
        user.avatar = '/uploads/' + req.file.filename;
      } else {
        // Vercel：URL
      }
    }

    await user.save();
    req.flash('success', 'Profile updated successfully!');
    return res.redirect('/profile');
  } catch (err) {
    return next(err);
  }
}

router.post('/profile/edit', isLoggedIn, upload.single('avatar'), handleProfileUpdate);
router.post('/profile',      isLoggedIn, upload.single('avatar'), handleProfileUpdate);

router.get('/profile/edit', isLoggedIn, async (req, res) => {
  const user = await User.findById(req.session.userId); 
  res.render('users/edit', { user });
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const profileUser = await User.findById(req.params.id).lean();
    if (!profileUser) return res.status(404).send('User not found');

    const userPosts = await Post.find({ author: profileUser._id })
      .sort({ createdAt: -1 })
      .lean();

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
