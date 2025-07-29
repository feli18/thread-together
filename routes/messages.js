import express from "express";
const router = express.Router();

import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import Message from "../models/Message.js";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 设置上传配置
const chatStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const chatUpload = multer({ storage: chatStorage });

// ✅ 必须添加：GET /messages 聊天列表页
router.get("/", async (req, res) => {
  const currentUserId = req.session.userId;

  const messages = await Message.find({
    $or: [{ sender: currentUserId }, { recipient: currentUserId }],
  })
    .sort({ createdAt: -1 })
    .populate("sender", "username avatar")
    .populate("recipient", "username avatar");

  const conversationUsers = new Map();
  messages.forEach((msg) => {
    const otherUser =
      msg.sender._id.toString() === currentUserId
        ? msg.recipient
        : msg.sender;
    if (!conversationUsers.has(otherUser._id.toString())) {
      conversationUsers.set(otherUser._id.toString(), {
        user: otherUser,
        lastMessage: msg,
      });
    }
  });

  res.render("messages/index", {
    conversations: Array.from(conversationUsers.values()),
  });
});

// ✅ 私聊页面（不需要变）
router.get("/:userId", async (req, res) => {
  const currentUserId = req.session.userId;
  const targetUserId = req.params.userId;

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, recipient: targetUserId },
      { sender: targetUserId, recipient: currentUserId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("sender", "username");

  const targetUser = await User.findById(targetUserId);

  res.render("messages/chat", {
    messages,
    targetUser,
    currentUser: currentUserId,
  });
});

// ✅ POST 发送消息（含图片）
router.post("/:userId", chatUpload.single("image"), async (req, res) => {
  const currentUserId = req.session.userId;
  const targetUserId = req.params.userId;
  const text = req.body.text || "";
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  await Message.create({
    sender: currentUserId,
    recipient: targetUserId,
    text,
    image,
  });

  res.redirect(`/messages/${targetUserId}`);
});

export default router;
