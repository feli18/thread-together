import app from '../app.js';
import { connectDB } from '../config/db.js';

export const config = { api: { bodyParser: false, maxDuration: 60 } };

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (e) {
    console.error('DB connect failed:', e);
    return res.status(500).send('Database connection failed');
  }
  return app(req, res); 
}
