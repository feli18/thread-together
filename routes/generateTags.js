import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

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

    // Use native undici FormData/Blob for maximum compatibility
    const form = new FormData();

    if (process.env.VERCEL) {
      const blob = new Blob([req.file.buffer], { type: contentType });
      form.append("image", blob, filename);
    } else {
      const fs = await import("fs/promises");
      const buf = await fs.readFile(req.file.path);
      const blob = new Blob([buf], { type: contentType });
      form.append("image", blob, filename);
    }

    // 12s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const k = req.body.k || 10;
    const model = req.body.model || "clip";
    form.append("k", k.toString());
    form.append("model", model);
    
    const response = await fetch(`${AI_API_URL}/predict`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    }).catch(err => {
      throw new Error(`AI API network error: ${err.message}`);
    });

    clearTimeout(timeout);

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!response.ok) {
      console.error("AI API error", {
        status: response.status,
        statusText: response.statusText,
        body: text,
        AI_API_URL
      });
      return res.status(502).json({ error: "AI API failed", details: data, status: response.status });
    }

    // 清理本地临时文件
    if (!process.env.VERCEL && req.file?.path) {
      try {
        const fs = await import("fs/promises");
        await fs.unlink(req.file.path);
      } catch {}
    }

    return res.json({ 
      tags: Array.isArray(data.tags) ? data.tags : [],
      model: data.model || "clip"
    });
  } catch (err) {
    console.error("Error calling FastAPI:", err);
    return res.status(500).json({ error: "Failed to generate tags", message: err.message, AI_API_URL });
  }
});

export default router;
