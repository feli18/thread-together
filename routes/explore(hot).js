// routes/explore.js

import express from 'express';
import Post from '../models/Post.js';
import Tag  from '../models/Tag.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const agg = await Post.aggregate([
      { $unwind: '$tags' },
      { $group:   { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: '$_id', count: 1, _id: 0 } },

      // 下面这一段替代原来的简单 lookup，做 case-insensitive match
      { $lookup: {
          from: 'tags',
          let: { tagName: '$_id' },
          pipeline: [
            { $project: { name: 1, type: 1 } },
            { $match: {
                $expr: {
                  $eq: [
                    { $toLower: '$name' },
                    { $toLower: '$$tagName' }
                  ]
                }
            }}
          ],
          as: 'info'
      }},
      { $unwind: '$info' },

      // 然后你就可以继续把 info.type 拿出来分桶
    ]);

    const buckets = { style: [], material: [], technique: [] };
    agg.forEach(({ _id: name, count, info }) => {
      const cat = info.type.toLowerCase(); // 'style'、'material'、'technique'
      if (buckets[cat]) buckets[cat].push({ name, count });
    });
    for (const cat of ['style','material','technique']) {
      buckets[cat] = buckets[cat]
        .sort((a,b) => b.count - a.count)
        .slice(0,5);
    }

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('author','username avatar')
      .lean();

    const hotTags = await Post.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: "$_id", count: 1, _id: 0 } }
    ]);

    const styleTags = [], materialTags = [], techniqueTags = [];

    res.render('explore.ejs', {
      posts,
      hotTags,
      styleTags:     buckets.style,
      materialTags:  buckets.material,
      techniqueTags: buckets.technique
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

export default router;
