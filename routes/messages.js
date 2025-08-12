import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { isLoggedIn } from "../middleware/middleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


let chatUpload;
if (process.env.VERCEL) {
  chatUpload = multer({ storage: multer.memoryStorage() });
} else {
  const chatStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, uniqueName);
    }
  });
  chatUpload = multer({ storage: chatStorage });
}


router.get("/", async (req, res) => {
  const currentUserId = req.session.userId;

  const messages = await Message.find({
    $or: [{ sender: currentUserId }, { recipient: currentUserId }],
  })
    .sort({ createdAt: -1 })
    .populate("sender", "username avatar")
    .populate("recipient", "username avatar");


    const conversationUsers = new Map();

    for (let msg of messages) {
    const otherUser =
        msg.sender._id.toString() === currentUserId
        ? msg.recipient
        : msg.sender;

    if (!conversationUsers.has(otherUser._id.toString())) {
        const unreadCount = await Message.countDocuments({
        sender: otherUser._id,
        recipient: currentUserId,
        read: false
        });

        conversationUsers.set(otherUser._id.toString(), {
        user: otherUser,
        lastMessage: msg,
        unreadCount
        });
    }
    }


  res.render("message", {
    conversations: Array.from(conversationUsers.values()),
  });
});


router.get("/:userId", async (req, res) => {
  const currentUserId = req.session.userId;
  const targetUserId = req.params.userId;

    await Message.updateMany(
    {
        sender: targetUserId,
        recipient: currentUserId,
        read: false
    },
    { $set: { read: true } }
    );

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, recipient: targetUserId },
      { sender: targetUserId, recipient: currentUserId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("sender", "username");

    const allMsgs = await Message.find({
    $or: [{ sender: currentUserId }, { recipient: currentUserId }]
  })
  .sort({ createdAt: -1 })
  .populate("sender",    "username avatar")
  .populate("recipient", "username avatar");

  const convMap = new Map();
  for (let msg of allMsgs) {
    const other = msg.sender._id.toString() === currentUserId
                  ? msg.recipient
                  : msg.sender;
    if (!convMap.has(other._id.toString())) {
      const unread = await Message.countDocuments({
        sender: other._id,
        recipient: currentUserId,
        read: false
      });
      convMap.set(other._id.toString(), {
        _id:         other._id,
        withUsername: other.username,
        avatar:      other.avatar,
        lastMessage: msg.text || (msg.image ? "📷 Image" : ""),
        unreadCount: unread
      });
    }
  }
  const conversations = Array.from(convMap.values());

  const targetUser = await User.findById(targetUserId);

  res.render("chat", {
    messages,
    targetUser,
    currentUser: currentUserId,
    conversations,
    currentConvId: targetUserId
  });

});

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
