// routes/search.js
import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';

const router = express.Router();

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.render('search.ejs', { users: [], posts: [], q });
  }

  // 1) 匹配用户
  const users = await User.find({
    username: { $regex: q, $options: 'i' }
  })
  .select('username avatar bio')
  .lean();

  // 2) 匹配帖子（标题模糊 or 精确标签）
  const posts = await Post.find({
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { tags: q.toLowerCase() }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(20)
  .lean();

  res.render('search.ejs', { users, posts, q });
});

export default router;
