import multer from 'multer';
import path from 'path';
import fs from 'fs';

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/uploads');
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const safeName = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
//     cb(null, safeName);
//   }
// });
let storage;

if (process.env.VERCEL) {
  storage = multer.memoryStorage();
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = 'public/uploads';
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeName = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
      cb(null, safeName);
    }
  });
}


const upload = multer({ storage });
export default upload;
