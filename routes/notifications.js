import express from "express";
const router = express.Router();
import Notification from "../models/Notification.js";

router.get("/", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const notifications = await Notification.find({ recipient: req.session.userId })
    .sort({ createdAt: -1 })
    .populate("sender", "username avatar")
    .populate("post", "coverImage")
    .populate("comment", "text");

  const unreadCommentCount = await Notification.countDocuments({
    recipient: req.session.userId,
    read: false,
    type: { $in: ['comment', 'reply'] }
  });

  const unreadLikeCount = await Notification.countDocuments({
    recipient: req.session.userId,
    read: false,
    type: { $in: ['like', 'bookmark'] }
  });

  res.render("notifications.ejs", {
    notifications,
    unreadCommentCount,
    unreadLikeCount
  });
});



router.post('/mark-read', async (req, res) => {
  const { type } = req.body;
  const query = {
    recipient: req.session.userId,
    read: false
  };

  if (type === 'comments') {
    query.type = { $in: ['comment', 'reply'] };
  } else if (type === 'likes') {
    query.type = { $in: ['like', 'bookmark'] };
  }


  await Notification.updateMany(query, { $set: { read: true } });


  const totalUnread = await Notification.countDocuments({
    recipient: req.session.userId,
    read: false
  });

  res.json({ totalUnread });
});



router.get('/read/:id', async (req, res) => {
  const notificationId = req.params.id;
  const notification = await Notification.findById(notificationId);

  if (!notification) return res.redirect("/notifications");


  notification.read = true;
  await notification.save();


  if (notification.post) {
    res.redirect(`/posts/${notification.post}`);
  } else {
    res.redirect("/notifications");
  }
});
router.get('/count', async (req, res) => {
  if (!req.session.userId) return res.json({ count: 0 });

  const count = await Notification.countDocuments({
    recipient: req.session.userId,
    read: false
  });

  res.json({ count });
});




export default router;
