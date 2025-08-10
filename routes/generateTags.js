import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fetch from 'node-fetch';
import FormData from 'form-data'; 
import fs from "fs";



const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: path.join(__dirname, "../temp") });

router.post("/", upload.single("image"), async (req, res) => {
  const imagePath = req.file.path;

  const form = new FormData();
  form.append("image", fs.createReadStream(imagePath));

  try {
    const response = await fetch("http://localhost:8000/predict", {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    }); 

    const data = await response.json();
    fs.unlinkSync(imagePath);
    res.json({ tags: data.tags });
  } catch (err) {
    console.error("调用 FastAPI 出错：", err);
    res.status(500).json({ error: "标签生成失败" });
  }
});
export default router;
