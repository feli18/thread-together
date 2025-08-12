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

    cached.promise = mongoose.connect(uri, {
      dbName,                      
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      maxPoolSize: 5,
      retryWrites: true,
    })
    .then(m => {
      console.log('Connected to MongoDB Atlas');
      return m;
    })
    .catch(err => {
      cached.promise = null; 
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
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
