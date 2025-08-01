// db.js
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';

// dotenv.config();

// mongoose.connect(process.env.MONGODB_URI, {
//   // useNewUrlParser: true,
//   // useUnifiedTopology: true
// });

// const db = mongoose.connection;

// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//   console.log('Connected to MongoDB Atlas');
// });
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// export default db;
