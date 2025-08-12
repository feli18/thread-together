import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageCache = new Map();
const publicImagesPath = path.join(process.cwd(), "public", "images");


try {
  const files = fs.readdirSync(publicImagesPath);
  files.forEach(file => {
    imageCache.set(file, path.join(publicImagesPath, file));
  });
} catch (error) {
  console.error("Failed to preload image paths:", error);
}

router.get("/images/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    
    let imagePath = imageCache.get(filename);
    
    if (!imagePath) {

      imagePath = path.join(publicImagesPath, filename);
    }
    
    if (fs.existsSync(imagePath)) {
      const ext = path.extname(filename).toLowerCase();
      if (ext === '.png') res.setHeader('Content-Type', 'image/png');
      else if (ext === '.jpg' || ext === '.jpeg') res.setHeader('Content-Type', 'image/jpeg');
      else if (ext === '.gif') res.setHeader('Content-Type', 'image/gif');
      
      res.sendFile(imagePath);
    } else {
      let fallbackImage = null;
      
      if (filename.includes('avatar') || filename.includes('default')) {
        fallbackImage = imageCache.get('user.png') || path.join(publicImagesPath, 'user.png');
      } else if (filename.includes('logo') || filename.includes('Logo')) {
        fallbackImage = imageCache.get('Logo.png') || path.join(publicImagesPath, 'Logo.png');
      } else if (filename.includes('post') || filename.includes('cover')) {
        fallbackImage = imageCache.get('post1.jpg') || path.join(publicImagesPath, 'post1.jpg');
      }
      
      if (fallbackImage && fs.existsSync(fallbackImage)) {
        res.sendFile(fallbackImage);
      } else {
        res.status(404).send("Image not found");
      }
    }
  } catch (error) {
    console.error("Static file error:", error);
    res.status(500).send("Internal server error");
  }
});
  
router.get("/favicon.ico", (req, res) => {
  try {
    const faviconPath = imageCache.get('Logo.png') || path.join(publicImagesPath, 'Logo.png');
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
    const faviconPath = imageCache.get('Logo.png') || path.join(publicImagesPath, 'Logo.png');
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

router.get("/test-static", (req, res) => {
  try {
    res.json({ 
      message: "Static routes are working",
      timestamp: new Date().toISOString(),
      cacheSize: imageCache.size,
      logoExists: imageCache.has('Logo.png'),
      userExists: imageCache.has('user.png')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 
