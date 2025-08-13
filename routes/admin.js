import express from 'express';
import TagActionLog from '../models/TagActionLog.js';
import Post from '../models/Post.js';

const router = express.Router();

// Simple logs table for debugging in browser
router.get('/logs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10) || 100, 500);
    const logs = await TagActionLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.render('admin/logs', { logs });
  } catch (err) {
    console.error('admin/logs error', err);
    res.status(500).send('Failed to load logs');
  }
});

// Basic metrics page
router.get('/metrics', async (req, res) => {
  try {
    const [counts, avgTimeAgg, meanTagsAgg] = await Promise.all([
      TagActionLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } }
      ]),
      TagActionLog.aggregate([
        { $match: { timeMs: { $ne: null } } },
        { $group: { _id: null, avgTimeMs: { $avg: '$timeMs' } } }
      ]),
      Post.aggregate([
        { $project: { tagCount: { $size: { $ifNull: ['$tags', []] } } } },
        { $group: { _id: null, meanTags: { $avg: '$tagCount' } } }
      ])
    ]);

    const map = Object.fromEntries(counts.map(c => [c._id, c.count]));
    const suggested = map['suggest'] || 0;
    const accepted  = map['accept']  || 0;
    const edited    = map['edit']    || 0;
    const removed   = map['remove']  || 0;

    const acceptanceRate = suggested ? accepted / suggested : 0;
    const editRate       = suggested ? edited   / suggested : 0;
    const removeRate     = suggested ? removed  / suggested : 0;
    const avgTimeMs      = (avgTimeAgg[0]?.avgTimeMs) || 0;
    const meanTags       = (meanTagsAgg[0]?.meanTags) || 0;

    res.render('admin/metrics', {
      suggested,
      accepted,
      edited,
      removed,
      acceptanceRate,
      editRate,
      removeRate,
      avgTimeMs: Math.round(avgTimeMs),
      meanTags:  Number(meanTags.toFixed(2))
    });
  } catch (err) {
    console.error('admin/metrics error', err);
    res.status(500).send('Failed to load metrics');
  }
});

export default router;


