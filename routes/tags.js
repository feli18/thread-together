// routes/tags.js

import express from 'express';
import Post    from '../models/Post.js';
const router = express.Router();

router.get('/:tagName', async (req, res) => {
  try {
    const { tagName } = req.params;
    // 构造一个不区分大小写的正则
    const regex = new RegExp(`^${tagName}$`, 'i');

    // 查询所有包含该 tag 的帖子
    const posts = await Post.find({ tags: regex })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .lean();

    // 取回 Referer，默认回 /explore
    const referer = req.get('Referer') || '/explore';

    return res.render('tagPage.ejs', {
      tagName,
      posts,
      referer,
      currentUser: req.session.userId
    });
  } catch (err) {
    console.error('Tags route error:', err);
    return res.status(500).send('Server error');
  }
});

export default router;
