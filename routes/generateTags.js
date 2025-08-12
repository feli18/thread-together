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
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filename = req.file.originalname || "image.jpg";
    const contentType = req.file.mimetype || "image/jpeg";

    let fileBody;
    if (process.env.VERCEL) {
      fileBody = req.file.buffer;
    } else {
      const fs = await import("fs");
      fileBody = fs.createReadStream(req.file.path);
    }

    const form = new FormData();
    form.append("image", fileBody, { filename, contentType });

    // 10s 超时，避免函数挂住
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${AI_API_URL}/predict`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
      signal: controller.signal
    }).catch(err => {
      throw new Error(`AI API network error: ${err.message}`);
    });

    clearTimeout(timeout);

    let data;
    const text = await response.text();
    try { data = JSON.parse(text); } catch (e) { data = { error: "Invalid JSON from AI API", raw: text }; }

    if (!response.ok) {
      console.error("AI API error", {
        status: response.status,
        statusText: response.statusText,
        body: text,
        AI_API_URL
      });
      return res.status(502).json({ error: "AI API failed", details: data, status: response.status });
    }

    if (!process.env.VERCEL && req.file?.path) {
      const fs = await import("fs");
      fs.unlinkSync(req.file.path);
    }

    return res.json({ tags: data.tags || [] });
  } catch (err) {
    console.error("Error calling FastAPI:", err);
    return res.status(500).json({ error: "Failed to generate tags", message: err.message, AI_API_URL });
  }
});

export default router;
