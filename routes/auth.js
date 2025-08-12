import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();


router.get("/register", (req, res) => {
  res.render("register.ejs");
});


router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.send("⚠️ Email already registered");

  const hash = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, passwordHash: hash });
  await newUser.save();

  req.session.userId = newUser._id;
  res.redirect("/profile");
});

router.get("/login", (req, res) => {
 
  console.log('visit login page');
  console.log('  - Session ID:', req.sessionID);
  console.log('  - Session存在:', !!req.session);
  console.log('  - User ID:', req.session?.userId);
  
  if (req.session && req.session.userId) {
    console.log(' User already logged in, redirecting to profile');
    return res.redirect("/profile");
  }
  
  console.log('show login page');
  res.render("login.ejs");
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
  if (!user) return res.send("⚠️ User not found");

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.send("⚠️ Wrong password");

  req.session.userId = user._id;
  
  console.log('login success');
  console.log('  - Session ID:', req.sessionID);
  console.log('  - User ID:', req.session.userId);
  console.log('  - Session:', !!req.session);
  
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).send("Session error");
    }
    console.log('  - Session saved successfully');
    console.log('  - redirect to /profile');
    res.redirect(303, "/profile");
  });
});


router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

export default router;
