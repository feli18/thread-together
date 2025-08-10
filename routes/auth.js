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
  res.render("login.ejs");
});


router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
  if (!user) return res.send("⚠️ User not found");

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.send("⚠️ Wrong password");

  req.session.userId = user._id;
  res.redirect("/profile");
});


router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

export default router;
