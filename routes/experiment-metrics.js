import express from 'express';
import TaskLog from '../models/TaskLog.js';

const router = express.Router();

// Calculate all H1-H4 metrics for experiment analysis
router.get('/h1-h4-metrics', async (req, res) => {
  try {
    const { mode, days = 7, userId } = req.query;
    
    // Build filter
    const filter = { isCompleted: true }; // Only completed tasks
    if (mode) filter.mode = mode;
    if (userId) filter.userId = userId;
    
    // Time filter
    if (days) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      filter.createdAt = { $gte: since };
    }
    
    const tasks = await TaskLog.find(filter).populate('userId', 'username');
    
    if (tasks.length === 0) {
      return res.json({
        message: 'No completed tasks found for the specified criteria',
        metrics: null
      });
    }
    
    // Calculate H1-H4 metrics
    const metrics = calculateH1H4Metrics(tasks);
    
    res.json({
      success: true,
      taskCount: tasks.length,
      timeRange: `${days} days`,
      mode: mode || 'all',
      metrics
    });
    
  } catch (error) {
    console.error('Error calculating H1-H4 metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

// Calculate individual task metrics
router.get('/task/:taskId/metrics', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await TaskLog.findOne({ taskId });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const metrics = calculateTaskMetrics(task);
    
    res.json({
      success: true,
      taskId,
      metrics
    });
    
  } catch (error) {
    console.error('Error calculating task metrics:', error);
    res.status(500).json({ error: 'Failed to calculate task metrics' });
  }
});

// Helper function to calculate H1-H4 metrics
function calculateH1H4Metrics(tasks) {
  const modeGroups = {};
  
  // Group tasks by mode
  tasks.forEach(task => {
    if (!modeGroups[task.mode]) {
      modeGroups[task.mode] = [];
    }
    modeGroups[task.mode].push(task);
  });
  
  const results = {};
  
  // Calculate metrics for each mode
  Object.keys(modeGroups).forEach(mode => {
    const modeTasks = modeGroups[mode];
    results[mode] = calculateModeMetrics(modeTasks);
  });
  
  // Calculate A vs B comparisons (H1, H2, H3)
  if (modeGroups.editable && modeGroups.locked) {
    results['A_vs_B'] = calculateComparisonMetrics(
      modeGroups.editable, 
      modeGroups.locked, 
      'editable', 
      'locked'
    );
  }
  
  // Calculate A vs C comparisons (H4)
  if (modeGroups.editable && modeGroups.off) {
    results['A_vs_C'] = calculateComparisonMetrics(
      modeGroups.editable, 
      modeGroups.off, 
      'editable', 
      'off'
    );
  }
  
  return results;
}

// Calculate metrics for a specific mode
function calculateModeMetrics(tasks) {
  const metrics = {
    taskCount: tasks.length,
    acceptanceRate: 0,
    directAcceptanceRate: 0,
    editAcceptanceRate: 0,
    meanTagsPerPost: 0,
    categoryCoverage: 0,
    removalRate: 0,
    editRate: 0,
    disagreement: 0,
    avgCompletionTime: 0,
    categoryBreakdown: {}
  };
  
  let totalAcceptance = 0;
  let totalDirectAcceptance = 0;
  let totalEditAcceptance = 0;
  let totalTags = 0;
  let totalCoverage = 0;
  let totalRemoval = 0;
  let totalEdit = 0;
  let totalDisagreement = 0;
  let totalTime = 0;
  let validTimeCount = 0;
  
  tasks.forEach(task => {
    // Acceptance rate
    const acceptanceRate = task.getAcceptanceRate();
    if (acceptanceRate !== null) {
      totalAcceptance += acceptanceRate;
    }
    
    // Direct vs Edit acceptance (simplified logic)
    const finalTags = task.final || [];
    const suggestedTags = task.suggested.map(s => s.tag.toLowerCase());
    
    const directAccepted = finalTags.filter(tag => 
      suggestedTags.includes(tag.toLowerCase())
    ).length;
    
    totalDirectAcceptance += directAccepted;
    totalEditAcceptance += finalTags.length - directAccepted;
    
    // Tags per post
    totalTags += finalTags.length;
    
    // Category coverage
    const coverage = task.getCategoryCoverage();
    totalCoverage += coverage;
    
    // Removal rate (simplified)
    const removed = suggestedTags.length - finalTags.length;
    totalRemoval += Math.max(0, removed);
    
    // Edit rate (simplified)
    const edited = Math.max(0, finalTags.length - directAccepted);
    totalEdit += edited;
    
    // Disagreement (Jaccard distance)
    const intersection = finalTags.filter(tag => 
      suggestedTags.includes(tag.toLowerCase())
    ).length;
    const union = new Set([...finalTags, ...suggestedTags]).size;
    const jaccard = union > 0 ? intersection / union : 0;
    totalDisagreement += (1 - jaccard);
    
    // Completion time
    if (task.completionTimeSeconds) {
      totalTime += task.completionTimeSeconds;
      validTimeCount++;
    }
    
    // Category breakdown
    finalTags.forEach(tag => {
      const category = task.inferCategory ? task.inferCategory(tag) : 'Other';
      if (!metrics.categoryBreakdown[category]) {
        metrics.categoryBreakdown[category] = 0;
      }
      metrics.categoryBreakdown[category]++;
    });
  });
  
  // Calculate averages
  if (tasks.length > 0) {
    metrics.acceptanceRate = totalAcceptance / tasks.length;
    metrics.directAcceptanceRate = totalDirectAcceptance / tasks.length;
    metrics.editAcceptanceRate = totalEditAcceptance / tasks.length;
    metrics.meanTagsPerPost = totalTags / tasks.length;
    metrics.categoryCoverage = totalCoverage / tasks.length;
    metrics.removalRate = totalRemoval / tasks.length;
    metrics.editRate = totalEdit / tasks.length;
    metrics.disagreement = totalDisagreement / tasks.length;
  }
  
  if (validTimeCount > 0) {
    metrics.avgCompletionTime = totalTime / validTimeCount;
  }
  
  return metrics;
}

// Calculate comparison metrics between two modes
function calculateComparisonMetrics(modeATasks, modeBTasks, modeAName, modeBName) {
  const modeAMetrics = calculateModeMetrics(modeATasks);
  const modeBMetrics = calculateModeMetrics(modeBTasks);
  
  return {
    comparison: `${modeAName} vs ${modeBName}`,
    modeA: { name: modeAName, ...modeAMetrics },
    modeB: { name: modeBName, ...modeBMetrics },
    differences: {
      acceptanceRate: modeAMetrics.acceptanceRate - modeBMetrics.acceptanceRate,
      meanTagsPerPost: modeAMetrics.meanTagsPerPost - modeBMetrics.meanTagsPerPost,
      categoryCoverage: modeAMetrics.categoryCoverage - modeBMetrics.categoryCoverage,
      avgCompletionTime: modeAMetrics.avgCompletionTime - modeBMetrics.avgCompletionTime
    }
  };
}

// Calculate metrics for a single task
function calculateTaskMetrics(task) {
  return {
    taskId: task.taskId,
    mode: task.mode,
    acceptanceRate: task.getAcceptanceRate(),
    categoryCoverage: task.getCategoryCoverage(),
    completionTime: task.completionTimeSeconds,
    suggestedCount: task.suggested.length,
    finalCount: task.final.length,
    categories: task.final.map(tag => task.inferCategory ? task.inferCategory(tag) : 'Other')
  };
}

export default router;
