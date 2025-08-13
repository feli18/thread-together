import express from 'express';
import TagActionLog from '../models/TagActionLog.js';

const router = express.Router();

// Minimal endpoint to ingest logging events from frontend
// Accepts either single object or array of objects
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const events = Array.isArray(body) ? body : [body];

    // Attach user/session context if present
    const userId = req.session?.userId || null;
    const sessionId = req.sessionID;

    const docs = events
      .filter(e => e && e.tag && e.action)
      .map(e => ({
        userId: userId || e.userId || null,
        postId: e.postId || null,
        tag: (e.tag || '').toString(),
        action: e.action,
        timeMs: typeof e.timeMs === 'number' ? e.timeMs : null,
        category: e.category || 'Other',
        suggestedCount: typeof e.suggestedCount === 'number' ? e.suggestedCount : null,
        sessionId
      }));

    if (!docs.length) return res.status(400).json({ error: 'Invalid payload' });

    await TagActionLog.insertMany(docs);
    return res.json({ ok: true, saved: docs.length });
  } catch (err) {
    console.error('Log ingest error:', err);
    return res.status(500).json({ error: 'Log ingest failed' });
  }
});

export default router;


