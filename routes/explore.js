// routes/explore.js
import express from 'express';
import Post from '../models/Post.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // 1) Featured Posts：最新 20 篇
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author', 'username avatar')
      .lean();

    // 2) Hot Tags：取出现次数最多的前 8 个
    const hotAgg = await Post.aggregate([
      { $unwind: '$tags' },
      { $group:   { _id: '$tags', count: { $sum: 1 } } },
      { $sort:    { count: -1 } },
      { $limit:   8 },
      { $project: { name: '$_id', _id: 0 } }
    ]);
    const hotTags = hotAgg.map(t => t.name);

    // 3) 三组手动固定标签
    const materialTags = ['Cotton', 'Silk', 'Denim', 'Linen', 'Leather'];
    const styleTags    = ['Vintage', 'Minimalist', 'Boho', 'Modern', 'Cottagecore'];
    const techniqueTags= ['Patchwork', 'Quilting', 'Embroidery', 'Handsewn', 'Appliqué'];

    res.render('explore.ejs', {
      posts,
      hotTags,
      materialTags,
      styleTags,
      techniqueTags
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

export default router;
