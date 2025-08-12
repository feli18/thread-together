import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import flash from "connect-flash";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import 'dotenv/config';


import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import commentRoutes from "./routes/comments.js";
import generateTags from "./routes/generateTags.js";
import messageRoutes from "./routes/messages.js";
import notificationRoutes from "./routes/notifications.js";
import tagRoutes from "./routes/tags.js";
import exploreRoutes from "./routes/explore.js";
import searchRoutes from "./routes/search.js";

import Post from "./models/Post.js";
import User from "./models/User.js";
import Comment from "./models/comment.js";
import Notification from "./models/Notification.js";
import Message from "./models/Message.js";
import TagView from "./models/TagView.js";
import { buildCommentTree } from "./utils/buildCommentTree.js";
import { connectDB, getMongoClient } from './config/db.js';

const app = express();
const { ObjectId } = mongoose.Types;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.set('trust proxy', 1);

app.use(express.static(path.join(process.cwd(), "public")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(session({
  name: 'tt.sid',                                
  secret: process.env.SESSION_SECRET || 'threadTogether-secret-key',
  resave: true,  
  saveUninitialized: false,                      
  rolling: true,  
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,                 
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    domain: process.env.VERCEL ? '.vercel.app' : undefined,
    path: '/'
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    clientPromise:getMongoClient(),
    collectionName: 'sessions',
    ttl: 60 * 60 * 24 * 7,                       
    touchAfter: 24 * 3600                        
  })
}));
app.use(flash());

let upload;
if (process.env.VERCEL) {
  upload = multer({ storage: multer.memoryStorage() });
} else {
  const storage = multer.diskStorage({
    destination: (req, file, cb) =>
      cb(null, path.join(__dirname, "public/uploads")),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
  });
  upload = multer({ storage });
}
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));
app.use((req, res, next) => {
  
  if (req.sessionID && !req.session) {
    res.clearCookie('tt.sid'); 
  }
  next();
});
app.use(async (req, res, next) => {
  res.locals.currentPath = req.path;
  const query = req.query.q || "";
  const userId = req.session.userId || null;

  let currentUser = null;
  if (userId) {
    try {
      currentUser = await User.findById(userId)
        .select("_id username avatar")
        .lean()
        .maxTimeMS(5000); 
    } catch (err) {
      console.error('User query timeout:', err);
      currentUser = null;
    }
  }
  
  res.locals.currentUser = currentUser;
  res.locals.query = query;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");

  res.locals.matchedUsers = [];

  if (userId) {
    try {
      const [notificationCount, messageCount] = await Promise.all([
        Notification.countDocuments({ recipient: userId, read: false }).maxTimeMS(3000),
        Message.countDocuments({ recipient: userId, read: false }).maxTimeMS(3000),
      ]);
      res.locals.unreadNotifications = notificationCount;
      res.locals.unreadMessages = messageCount;
    } catch (err) {
      console.error('Count query timeout:', err);
      res.locals.unreadNotifications = 0;
      res.locals.unreadMessages = 0;
    }
  } else {
    res.locals.unreadNotifications = 0;
    res.locals.unreadMessages = 0;
  }
  next();
});

app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/posts/:postId/comments", commentRoutes);
app.use("/messages", messageRoutes);
app.use("/notifications", notificationRoutes);
app.use("/tags", tagRoutes);
app.use("/explore", exploreRoutes);
app.use("/", searchRoutes);
app.use("/generate-tags", generateTags);

app.use((err, req, res, next) => {
  console.error('❌ global error handling:', err);
  console.error('  - Request path:', req.path);
  console.error('  - Error stack:', err.stack);
  
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  
  res.status(500).send('Something broke!');
});

// 404处理
app.use((req, res) => {
  console.log('❌ 404 Not Found:', req.path);
  res.status(404).send('Page not found');
});

app.post(
  "/upload",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "stepFiles" },
  ]),
  async (req, res) => {
    if (!req.session.userId) return res.redirect("/login");

    const { title, description, tags, stepDescriptions } = req.body;

    const coverImagePath =
      req.files?.["coverImage"]?.[0]?.filename
        ? "/uploads/" + req.files["coverImage"][0].filename
        : null;

    const stepFiles = req.files?.["stepFiles"] || [];
    const descriptions = Array.isArray(stepDescriptions)
      ? stepDescriptions
      : [stepDescriptions];

    const steps = stepFiles.map((file, idx) => {
      const isVideo = file.mimetype.startsWith("video/");
      return {
        type: isVideo ? "video" : "image",
        [isVideo ? "video" : "image"]:
          coverImagePath && !process.env.VERCEL
            ? "/uploads/" + file.filename
            : "", 
        text: descriptions[idx] || "",
      };
    });

    const rawTags = tags || "";
    const tagsArr = rawTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newPost = new Post({
      title,
      author: req.session.userId,
      description,
      tags: tagsArr,
      coverImage: coverImagePath,
      steps,
      comments: [],
    });

    await newPost.save();
    res.redirect("/explore");
  }
);

app.post("/posts/:id/delete", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    if (post.author.toString() !== req.session.userId)
      return res.status(403).send("Unauthorized");

    await Post.findByIdAndDelete(req.params.id);
    res.redirect("/profile");
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Server error");
  }
});

app.get("/posts/:id/edit", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    if (post.author.toString() !== req.session.userId)
      return res.status(403).send("Unauthorized");

    res.render("edit.ejs", { post });
  } catch {
    res.status(500).send("Server error");
  }
});

app.post(
  "/posts/:id/edit",
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).send("Post not found");
      if (post.author.toString() !== req.session.userId)
        return res.status(403).send("Unauthorized");

      post.title = req.body.title;
      post.description = req.body.description;
      const rawTags2 = req.body.tags || "";
      post.tags = rawTags2
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      if (req.files?.["coverImage"]?.[0] && !process.env.VERCEL) {
        post.coverImage = "/uploads/" + req.files["coverImage"][0].filename;
      }
      await post.save();
      res.redirect("/posts/" + post._id);
    } catch {
      res.status(500).send("Server error");
    }
  }
);

app.post("/posts/:id/like", async (req, res) => {
  const post = await Post.findById(req.params.id);
  const userId = req.session.userId;
  if (!post) return res.status(404).send("Post not found");
  if (!userId) return res.status(403).send("Login required");

  const alreadyLiked = post.likedBy.includes(userId);
  if (alreadyLiked) {
    post.likedBy.pull(userId);
  } else {
    post.likedBy.push(userId);
    if (post.author.toString() !== userId) {
      const existing = await Notification.findOne({
        recipient: post.author,
        sender: userId,
        post: post._id,
        type: "like",
      });
      if (!existing) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: "like",
          post: post._id,
        });
      }
    }
  }
  await post.save();
  res.redirect(`/posts/${post._id}`);
});

app.post("/posts/:id/bookmark", async (req, res) => {
  const post = await Post.findById(req.params.id);
  const userId = req.session.userId;
  if (!post) return res.status(404).send("Post not found");
  if (!userId) return res.redirect("/login");

  const alreadyBookmarked = post.bookmarkedBy.includes(userId);
  if (alreadyBookmarked) {
    post.bookmarkedBy.pull(userId);
  } else {
    post.bookmarkedBy.push(userId);
    if (post.author.toString() !== userId) {
      const existing = await Notification.findOne({
        recipient: post.author,
        sender: userId,
        post: post._id,
        type: "bookmark",
      });
      if (!existing) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: "bookmark",
          post: post._id,
        });
      }
    }
  }
  await post.save();
  res.redirect(req.get("referer"));
});

app.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate("author").lean();

    const hotTags = await Post.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { name: "$_id", _id: 0 } },
    ]);

    const oneWeekAgo = new Date();
    oneWeekAgo.setHours(0, 0, 0, 0);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);

    const weeklyTagsAgg = await TagView.aggregate([
      { $match: { viewedAt: { $gte: oneWeekAgo } } },
      { $group: { _id: "$tag", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 15 },
      { $project: { name: "$_id", _id: 0 } },
    ]);
    const weeklyTags = weeklyTagsAgg.map((t) => t.name);

    const days = [];
    for (let d = new Date(oneWeekAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      days.push(d.toLocaleDateString("en-CA", { timeZone: "Europe/London" }));
    }

    const popularAgg = await TagView.aggregate([
      { $match: { viewedAt: { $gte: oneWeekAgo } } },
      { $group: { _id: "$tag", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 5 },
      { $project: { name: "$_id", _id: 0 } },
    ]);
    const popularTags = popularAgg.map((t) => t.name);

    const dailyViewsAgg = await TagView.aggregate([
      { $match: { viewedAt: { $gte: oneWeekAgo }, tag: { $in: popularTags } } },
      {
        $project: {
          tag: 1,
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$viewedAt",
              timezone: "Europe/London",
            },
          },
        },
      },
      { $group: { _id: { tag: "$tag", day: "$day" }, count: { $sum: 1 } } },
      { $project: { tag: "$_id.tag", day: "$_id.day", count: 1, _id: 0 } },
    ]);

    const trendMap = {};
    popularTags.forEach((tag) => {
      trendMap[tag] = { name: tag, counts: days.map(() => 0) };
    });
    dailyViewsAgg.forEach(({ tag, day, count }) => {
      const idx = days.indexOf(day);
      if (idx >= 0) trendMap[tag].counts[idx] = count;
    });

    const trendingViews = { days, tags: Object.values(trendMap) };
    res.render("index.ejs", { posts, hotTags, weeklyTags, trendingViews, currentUser: req.session.userId ? await User.findById(req.session.userId) : null });
  } catch (err) {
    console.error("Failed to load homepage:", err);
    res.status(500).send("Server error");
  }
});

app.get("/upload", (req, res) => res.render("upload.ejs"));

app.get("/notifications", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  const notifications = await Notification.find({ recipient: req.session.userId })
    .sort({ createdAt: -1 })
    .populate("sender", "username avatar")
    .populate("post", "coverImage")
    .populate("comment", "text");
  res.render("notifications.ejs", { notifications });
});

app.get("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author")
      .populate({ path: "comments", populate: { path: "user", select: "username avatar" } })
      .populate("likedBy");

    if (!post) return res.status(404).render("404", { message: "Post not found" });

    const commentTree = buildCommentTree(post.comments || []);

    const now = new Date();
    const views = (post.tags || []).map((tag) => ({
      tag,
      post: post._id,
      user: req.session.userId || null,
      viewedAt: now,
    }));
    if (views.length) await TagView.insertMany(views);

    res.render("post.ejs", { post, commentTree });
  } catch (err) {
    console.error("详情页加载失败：", err);
    res.status(500).send("Server error");
  }
});

app.post("/posts/:id/comments", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).send("Post not found");

  const newComment = new Comment({
    user: req.session.userId,
    post: post._id,
    text: req.body.comment,
    replyTo: req.body.replyTo || null,
  });
  await newComment.save();

  post.comments.push(newComment._id);
  await post.save();

  if (post.author.toString() !== req.session.userId) {
    await Notification.create({
      recipient: post.author,
      sender: req.session.userId,
      type: "comment",
      post: post._id,
      comment: newComment._id,
    });
  }

  if (req.body.replyTo) {
    const parentComment = await Comment.findById(req.body.replyTo).populate("user");
    if (parentComment && parentComment.user._id.toString() !== req.session.userId) {
      await Notification.create({
        recipient: parentComment.user._id,
        sender: req.session.userId,
        type: "reply",
        post: post._id,
        comment: newComment._id,
      });
    }
  }

  res.redirect(`/posts/${post._id}`);
});

export default app;
