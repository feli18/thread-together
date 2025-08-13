import express from 'express';
import TagActionLog from '../models/TagActionLog.js';
import Post from '../models/Post.js';
import TagView from '../models/TagView.js';

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
    const windowDays = Math.max(1, Math.min(parseInt(req.query.days || '7', 10) || 7, 30));
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const [counts, avgTimeAgg, meanTagsAgg, funnelAgg] = await Promise.all([
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
      ]),
      // Funnel: TagView -> viewPost -> interaction (like/bookmark)
      TagActionLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$action', c: { $sum: 1 } } }
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

    // H3: Top-5 Share and HHI for last N days using TagView
    const tvAgg = await TagView.aggregate([
      { $match: { viewedAt: { $gte: since } } },
      { $group: { _id: '$tag', c: { $sum: 1 } } },
      { $sort: { c: -1 } },
      { $group: { _id: null, items: { $push: '$$ROOT' }, total: { $sum: '$c' } } },
      { $project: {
        total: 1,
        top5: { $slice: ['$items', 5] },
        items: 1
      } },
      { $unwind: '$items' },
      { $project: {
        total: 1,
        top5: 1,
        p: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$items.c', '$total'] }, 0] },
        tag: '$items._id',
        c: '$items.c'
      } },
      { $group: { _id: null, total: { $first: '$total' }, top5Arr: { $first: '$top5' }, hhi: { $sum: { $multiply: ['$p', '$p'] } } } }
    ]);

    let top5Share = 0;
    let hhi = 0;
    if (tvAgg[0]) {
      const total = tvAgg[0].total || 0;
      const tsum = (tvAgg[0].top5Arr || []).reduce((s, x) => s + (x?.c || 0), 0);
      top5Share = total ? (tsum / total) : 0;
      hhi = tvAgg[0].hhi || 0;
    }

    // Funnel quick calc (counts only, unique users can be added later if needed)
    const funnelMap = Object.fromEntries((funnelAgg||[]).map(x => [x._id, x.c]));
    const tagViewsCnt = await TagView.countDocuments({ viewedAt: { $gte: since } });
    const postViewsCnt = funnelMap['viewPost'] || 0;
    const interactionsCnt = (funnelMap['like'] || 0) + (funnelMap['bookmark'] || 0);

    const ctrTagToPost = tagViewsCnt ? (postViewsCnt / tagViewsCnt) : 0;
    const convPostToInteract = postViewsCnt ? (interactionsCnt / postViewsCnt) : 0;

    res.render('admin/metrics', {
      suggested,
      accepted,
      edited,
      removed,
      acceptanceRate,
      editRate,
      removeRate,
      avgTimeMs: Math.round(avgTimeMs),
      meanTags:  Number(meanTags.toFixed(2)),
      top5Share,
      hhi,
      windowDays,
      ctrTagToPost,
      convPostToInteract
    });
  } catch (err) {
    console.error('admin/metrics error', err);
    res.status(500).send('Failed to load metrics');
  }
});

export default router;


