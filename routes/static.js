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
    
    console.log(`Static file request: /images/${filename}`);
    console.log(`Looking for file at: ${imagePath}`);
    
    if (fs.existsSync(imagePath)) {
      console.log(`File found, sending: ${filename}`);
      res.sendFile(imagePath);
    } else {
      console.log(`File not found: ${filename}`);
      
      let defaultImage = null;
      
      if (filename.includes('avatar') || filename.includes('default')) {
        defaultImage = path.join(process.cwd(), "public", "images", "user.png");
      } else if (filename.includes('logo') || filename.includes('Logo')) {
        defaultImage = path.join(process.cwd(), "public", "images", "Logo.png");
      } else if (filename.includes('post') || filename.includes('cover')) {
        defaultImage = path.join(process.cwd(), "public", "images", "post1.jpg");
      } else if (filename.includes('placeholder')) {
        defaultImage = path.join(process.cwd(), "public", "images", "post1.jpg");
      }
      
      if (defaultImage && fs.existsSync(defaultImage)) {
        console.log(`Sending default image: ${defaultImage}`);
        res.sendFile(defaultImage);
      } else {
        console.log(`No default image found, returning 404`);
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

router.get("/test-static", (req, res) => {
  try {
    const imagesDir = path.join(process.cwd(), "public", "images");
    const files = fs.readdirSync(imagesDir);
    
    res.json({ 
      message: "Static routes are working",
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
      publicPath: imagesDir,
      availableFiles: files,
      logoExists: fs.existsSync(path.join(imagesDir, "Logo.png")),
      userExists: fs.existsSync(path.join(imagesDir, "user.png"))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; 
