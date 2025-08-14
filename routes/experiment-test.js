import express from 'express';

const router = express.Router();

// 最简单的测试路由
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Experiment route working!', 
    timestamp: new Date().toISOString(),
    mode: 'test'
  });
});

// 健康检查
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'experiment-test',
    time: new Date().toISOString()
  });
});

export default router;
