import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { isLoggedIn } from '../middleware/middleware.js';
import upload from '../middleware/multer.js'; 
import { followUser, unfollowUser } from '../controllers/userController.js';

// 注意：.js 不能省略！

const router = express.Router();


// POST 保存修改
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

// GET 用户edit主页
router.get('/profile/edit', isLoggedIn, async (req, res) => {
  const user = await User.findById(req.session.userId); 
  res.render('users/edit', { user });
});

// router.get('/users', async (req, res) => {
//   const query = req.query.q || '';
//   const users = await User.find({
//     username: { $regex: query, $options: 'i' } // 模糊匹配，忽略大小写
//   });
//   res.render('users/directory', { users, query });
// });

//check other profile
router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  const userPosts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
  res.render('users/publicProfile', { user, userPosts });
});

// 公开主页视图（不需登录）
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const userPosts = await Post.find({ author: user._id }).sort({ createdAt: -1 });

    res.render('../views/users/publicProfile.ejs', {
      users,
      userPosts,
      currentUser: req.session.userId,
      query: '', 
      users: []   
    });
  } catch (err) {
    console.error("Error loading public profile:", err);
    res.status(500).send("Server error");
  }
});
// follow someone
router.post('/users/:id/follow', isLoggedIn, followUser);

// unfollow
router.post('/users/:id/unfollow', isLoggedIn, unfollowUser);


export default router;
