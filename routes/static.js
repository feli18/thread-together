import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/images/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(process.cwd(), "public", "images", filename);
    
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
    }
  } catch (error) {
    console.error("Static file error:", error);
    res.status(500).send("Internal server error");
  }
});
  
router.get("/favicon.ico", (req, res) => {
  try {
    const faviconPath = path.join(process.cwd(), "public", "images", "Logo.png");
    if (fs.existsSync(faviconPath)) {
      res.setHeader("Content-Type", "image/x-icon");
      res.sendFile(faviconPath);
    } else {
      res.status(404).send("Favicon not found");
    }
  } catch (error) {
    console.error("Favicon error:", error);
    res.status(500).send("Internal server error");
  }
});

router.get("/favicon.png", (req, res) => {
  try {
    const faviconPath = path.join(process.cwd(), "public", "images", "Logo.png");
    if (fs.existsSync(faviconPath)) {
      res.setHeader("Content-Type", "image/png");
      res.sendFile(faviconPath);
    } else {
      res.status(404).send("Favicon not found");
    }
  } catch (error) {
    console.error("Favicon error:", error);
    res.status(500).send("Internal server error");
  }
});

export default router; 
