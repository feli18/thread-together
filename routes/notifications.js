import express from "express";
const router = express.Router();
import Notification from "../models/Notification.js";

router.get("/", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const notifications = await Notification.find({ recipient: req.session.userId })
    .sort({ createdAt: -1 })
    .populate("sender", "username avatar")
    .populate("post")
    .populate("comment");

  res.render("notifications.ejs", { notifications });
});

export default router;
