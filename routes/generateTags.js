import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fetch from 'node-fetch';
import FormData from 'form-data'; 

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AI API base URL: set AI_API_URL in env for production, fall back to local dev
const AI_API_URL = process.env.AI_API_URL || "http://localhost:8000";

let upload;
if (process.env.VERCEL) {
  upload = multer({ storage: multer.memoryStorage() });
} else {
  upload = multer({ dest: path.join(__dirname, "../temp") });
}

router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imageBuffer;
    
    if (process.env.VERCEL) {
      imageBuffer = req.file.buffer;
    } else {
      const fs = await import("fs");
      imageBuffer = fs.createReadStream(req.file.path);
    }

    const form = new FormData();
    form.append("image", imageBuffer);

    const response = await fetch(`${AI_API_URL}/predict`, {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    }); 

    const data = await response.json();
    
    if (!process.env.VERCEL && req.file?.path) {
      const fs = await import("fs");
      fs.unlinkSync(req.file.path);
    }
    
    res.json({ tags: data.tags });
  } catch (err) {
    console.error("Error calling FastAPI:", err);
    res.status(500).json({ error: "Failed to generate tags" });
  }
});

export default router;
