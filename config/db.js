import mongoose from 'mongoose';

let cached = globalThis._mongooseCached;
if (!cached) {
  cached = globalThis._mongooseCached = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is missing');

    mongoose.set('bufferCommands', false);

    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10_000, 
        maxPoolSize: 5,                   
        retryWrites: true,
      })
      .then((m) => {
        console.log('Connected to MongoDB Atlas');
        return m;
      })
      .catch((err) => {
        cached.promise = null; 
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
