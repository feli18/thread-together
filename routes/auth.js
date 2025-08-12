import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

router.get("/register", (req, res) => {
  res.render("register.ejs");
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.send("⚠️ Email already registered");

    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, passwordHash: hash });
    await newUser.save();

    req.session.userId = newUser._id;
    res.redirect("/profile");
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).send("Registration failed");
  }
});

router.get("/login", (req, res) => {
  console.log('=== Login Page Visit ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  console.log('User ID:', req.session?.userId);
  
  if (req.session && req.session.userId) {
    console.log('User already logged in, redirecting to profile');
    return res.redirect("/profile");
  }
  
  console.log('Showing login page');
  res.render("login.ejs");
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('=== Login Attempt ===');
    console.log('Username:', username);
    console.log('Session ID:', req.sessionID);

    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found');
      return res.send("⚠️ User not found");
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      console.log('Wrong password');
      return res.send("⚠️ Wrong password");
    }

    req.session.userId = user._id;
    
    console.log('Login success');
    console.log('Session ID:', req.sessionID);
    console.log('User ID:', req.session.userId);
    console.log('Session exists:', !!req.session);
    
    // 确保session保存后再重定向
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).send("Session error");
      }
      console.log('Session saved successfully');
      console.log('Redirecting to /profile');
      res.redirect("/profile");
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send("Login failed");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

export default router;
