import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import TaskLog from '../models/TaskLog.js';

const router = express.Router();

// Create a new experiment task (when user starts an upload)
router.post('/task/start', async (req, res) => {
  try {
    const { mode, imageId, k } = req.body;
    
    // Validate inputs
    if (!['editable', 'locked', 'off'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }
    
    if (!imageId) {
      return res.status(400).json({ error: 'imageId required' });
    }

    const taskId = uuidv4();
    
    const taskLog = new TaskLog({
      taskId,
      userId: req.session?.userId || null,
      sessionId: req.sessionID,
      mode,
      model: 'clip', // Currently fixed to CLIP
      k: k || 5, // Default to 5 suggestions
      imageId,
      startedAt: new Date(),
      suggested: [], // Will be populated when AI runs
      final: [],
      isWarmup: req.body.isWarmup || false,
      participantSequence: req.body.participantSequence || null,
      latinSquareGroup: req.body.latinSquareGroup || null,
      userAgent: req.get('User-Agent')
    });

    await taskLog.save();
    
    res.json({
      success: true,
      taskId,
      message: 'Experiment task started'
    });
    
  } catch (error) {
    console.error('Error starting experiment task:', error);
    res.status(500).json({ error: 'Failed to start task' });
  }
});

// Update task with AI suggestions
router.post('/task/:taskId/suggestions', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { suggested, aiCallSuccess } = req.body;
    
    const taskLog = await TaskLog.findOne({ taskId });
    if (!taskLog) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Validate suggestions format
    const validSuggestions = suggested.map((s, index) => ({
      tag: s.tag || s,
      category: s.category || 'Other',
      rank: s.rank || index + 1,
      score: s.score || 0.5
    }));
    
    taskLog.suggested = validSuggestions;
    taskLog.aiCallSuccess = aiCallSuccess !== false;
    
    await taskLog.save();
    
    res.json({
      success: true,
      message: 'Suggestions recorded'
    });
    
  } catch (error) {
    console.error('Error recording suggestions:', error);
    res.status(500).json({ error: 'Failed to record suggestions' });
  }
});

// Complete a task (when user submits)
router.post('/task/:taskId/complete', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { final, imageUploadSuccess } = req.body;
    
    const taskLog = await TaskLog.findOne({ taskId });
    if (!taskLog) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Parse final tags (remove # and clean)
    const finalTags = Array.isArray(final) ? final : 
      (final || '').split(/\s*#+/).map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    
    taskLog.final = finalTags;
    taskLog.submittedAt = new Date();
    taskLog.imageUploadSuccess = imageUploadSuccess !== false;
    
    await taskLog.save();
    
    res.json({
      success: true,
      taskId,
      completionTime: taskLog.completionTimeSeconds,
      message: 'Task completed successfully'
    });
    
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Get task details
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskLog = await TaskLog.findOne({ taskId }).populate('userId', 'username');
    
    if (!taskLog) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({
      success: true,
      task: {
        ...taskLog.toObject(),
        completionTimeSeconds: taskLog.completionTimeSeconds,
        isCompleted: taskLog.isCompleted,
        acceptanceRate: taskLog.getAcceptanceRate(),
        categoryCoverage: taskLog.getCategoryCoverage()
      }
    });
    
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Get all tasks for a user/session (for analysis)
router.get('/tasks', async (req, res) => {
  try {
    const { userId, sessionId, mode, imageId, limit = 50 } = req.query;
    
    const filter = {};
    if (userId) filter.userId = userId;
    if (sessionId) filter.sessionId = sessionId;
    if (mode) filter.mode = mode;
    if (imageId) filter.imageId = imageId;
    
    const tasks = await TaskLog.find(filter)
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const tasksWithMetrics = tasks.map(task => ({
      ...task.toObject(),
      completionTimeSeconds: task.completionTimeSeconds,
      isCompleted: task.isCompleted,
      acceptanceRate: task.getAcceptanceRate(),
      categoryCoverage: task.getCategoryCoverage()
    }));
    
    res.json({
      success: true,
      tasks: tasksWithMetrics,
      count: tasksWithMetrics.length
    });
    
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

export default router;
