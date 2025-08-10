import express from 'express';
import Post    from '../models/Post.js';
import TagView from '../models/TagView.js';
const router = express.Router();

router.get('/:tagName', async (req, res) => {
  try {
    const { tagName } = req.params;
    const regex = new RegExp(`^${tagName}$`, 'i');
    const tag = req.params.tagName;
    await TagView.create({ tag });

    const posts = await Post.find({ tags: regex })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .lean();

    const referer = req.get('Referer') || '/explore';

    return res.render('tagPage.ejs', {
      tagName,
      posts,
      referer
    });
  } catch (err) {
    console.error('Tags route error:', err);
    return res.status(500).send('Server error');
  }
});

export default router;
