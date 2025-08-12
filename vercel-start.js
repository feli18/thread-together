import app from './app.js';

if (process.env.NODE_ENV === 'production') {
  console.log('Production mode: Optimizing for Vercel');
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
