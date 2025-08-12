import app from '../app.js';
import { connectDB } from '../config/db.js';

export const config = { 
  api: { 
    bodyParser: false, 
    maxDuration: 30 
  } 
};

// 连接池管理
let dbConnected = false;
let connectionPromise = null;

async function ensureDBConnection() {
  if (dbConnected) return;
  
  if (!connectionPromise) {
    connectionPromise = connectDB().then(() => {
      dbConnected = true;
      console.log('Database connected successfully');
    }).catch(err => {
      console.error('Database connection failed:', err);
      dbConnected = false;
      connectionPromise = null;
      throw err;
    });
  }
  
  return connectionPromise;
}

export default async function handler(req, res) {
  // Set CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 快速数据库连接检查
    await ensureDBConnection();
  } catch (e) {
    console.error('DB connect failed:', e);
    return res.status(500).send('Database connection failed');
  }
  
  return app(req, res); 
}
