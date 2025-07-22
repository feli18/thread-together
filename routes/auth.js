// routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

// 注册页面
router.get("/register", (req, res) => {
  res.render("register.ejs");
});

// 注册提交逻辑
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

// 登录页面
router.get("/login", (req, res) => {
  res.render("login.ejs");
});

// 登录提交逻辑
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
  if (!user) return res.send("⚠️ User not found");

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.send("⚠️ Wrong password");

  req.session.userId = user._id;
  res.redirect("/profile");
});

// 登出
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

export default router;
