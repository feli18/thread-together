import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);     
mongoose.set('strictQuery', false);        

const g = globalThis;
g.__mongooseCache ??= { conn: null, promise: null };
const cached = g.__mongooseCache;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is missing');

    const dbName = process.env.MONGODB_DB_NAME; 

    // Enhanced connection options for better network resilience
    const connectionOptions = {
      dbName,                      
      serverSelectionTimeoutMS: 30_000,  // Increased from 10s to 30s
      connectTimeoutMS: 30_000,          // Added explicit connect timeout
      socketTimeoutMS: 45_000,
      maxPoolSize: 5,
      minPoolSize: 1,                    // Added min pool size
      retryWrites: true,
      retryReads: true,                  // Added retry reads
      maxIdleTimeMS: 30_000,            // Added max idle time
      // DNS and network options
      family: 4,                         // Force IPv4
      keepAlive: true,                   // Enable keep-alive
      keepAliveInitialDelay: 30000,     // Keep-alive delay
    };

    cached.promise = mongoose.connect(uri, connectionOptions)
    .then(m => {
      console.log('✅ Connected to MongoDB Atlas');
      return m;
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      console.error('🔍 Error details:', {
        name: err.name,
        code: err.code,
        message: err.message
      });
      
      // Clear cache on error to allow retry
      cached.promise = null; 
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // Clear cache and retry once
    if (cached.promise) {
      cached.promise = null;
      cached.conn = null;
      
      console.log('🔄 Retrying MongoDB connection...');
      return connectDB(); // Recursive retry
    }
    throw error;
  }
}

export async function getMongoClient() {
  const m = await connectDB();
  return m.connection.getClient();
}

export async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

// Add connection health check
export async function checkConnection() {
  try {
    const conn = await connectDB();
    return conn.connection.readyState === 1; // 1 = connected
  } catch (error) {
    console.error('❌ Connection health check failed:', error.message);
    return false;
  }
}
