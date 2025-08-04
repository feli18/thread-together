import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import bodyParser from "body-parser";

import './config/db.js';
import authRoutes from './routes/auth.js';

import multer from 'multer';
import Post from './models/Post.js';
import User from './models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import Comment from './models/comment.js';
import commentRoutes from './routes/comments.js';
import flash from 'connect-flash';


import userRoutes from './routes/users.js';
import generateTags from './routes/generateTags.js';
import messageRoutes from "./routes/messages.js";
import notificationRoutes from "./routes/notifications.js";
import Notification from './models/Notification.js';
import Message from './models/Message.js';
import tagRoutes from './routes/tags.js';
import exploreRoutes from './routes/explore.js';
import TagView from './models/TagView.js';
import { buildCommentTree } from './utils/buildCommentTree.js';
import searchRoutes from './routes/search.js';


import mongoose from 'mongoose'; 


const app = express();
const port = 3000;
const { ObjectId } = mongoose.Types;
// 设置视图引擎为 EJS
app.set("view engine", "ejs");



// 静态资源目录（包括 images、videos、styles）
app.use(express.static("public"));


// 会话中间件（保存登录状态）
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(methodOverride('_method'));
app.use(session({
  secret: 'threadTogether-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));
app.use(flash());
app.use("/generate-tags", generateTags);

app.use(async (req, res, next) => {
  res.locals.currentPath = req.path;
  const query = req.query.q || '';

  // 登录状态
  res.locals.currentUser = req.session.userId || null;
  res.locals.query = query;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');

  // 登录用户信息（全局 user）
  res.locals.user = req.session.userId
    ? await User.findById(req.session.userId)
    : null;

  // 匹配搜索用户结果（全局 matchedUsers）
  res.locals.matchedUsers = query
    ? await User.find({
        username: { $regex: query, $options: 'i' }
      })
    : [];

  // ✅ 通知和消息数量
  if (req.session.userId) {
    const [notificationCount, messageCount] = await Promise.all([
      Notification.countDocuments({ recipient: req.session.userId, read: false }),
      Message.countDocuments({ recipient: req.session.userId, read: false })
    ]);
    res.locals.unreadNotifications = notificationCount;
    res.locals.unreadMessages = messageCount;
  } else {
    res.locals.unreadNotifications = 0;
    res.locals.unreadMessages = 0;
  }

  next();
});


app.use("/", authRoutes);
app.use("/", userRoutes);
app.use('/posts/:postId/comments', commentRoutes);
app.use("/messages", messageRoutes);
app.use("/notifications", notificationRoutes);
app.use('/tags', tagRoutes);
app.use("/explore", exploreRoutes);
app.use('/',searchRoutes);



// upload funcyion
// ES module 中 __dirname 替代方法
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 设置 multer 存储路径
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });



// 支持上传多个字段
app.post("/upload", upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "stepFiles" },
]), async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const { title, description, tags, stepDescriptions } = req.body;

  // 封面图路径（不要放入 steps）
  const coverImagePath = req.files["coverImage"]?.[0]?.filename
    ? "/uploads/" + req.files["coverImage"][0].filename
    : null;

  // 步骤图/视频
  const stepFiles = req.files["stepFiles"] || [];
  const descriptions = Array.isArray(stepDescriptions) ? stepDescriptions : [stepDescriptions];

  const steps = stepFiles.map((file, idx) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      type: isVideo ? "video" : "image",
      [isVideo ? "video" : "image"]: "/uploads/" + file.filename,
      text: descriptions[idx] || "",
    };
  });

    const rawTags = tags || "";
    const tagsArr = rawTags
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    // 存储 Post，不把封面图放进 steps
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
});


app.post("/posts/:id/delete", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    if (post.author.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized");
    }

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

    if (post.author.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized");
    }

    res.render("edit.ejs", { post });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.post("/posts/:id/edit", upload.fields([
  { name: "coverImage", maxCount: 1 },
]), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    if (post.author.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized");
    }

    post.title = req.body.title;
    post.description = req.body.description;
    const rawTags2 = req.body.tags || "";
    post.tags = rawTags2
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    //正确更新封面图字段
    if (req.files["coverImage"]?.[0]) {
      post.coverImage = "/uploads/" + req.files["coverImage"][0].filename;
    }

    await post.save();
    res.redirect("/posts/" + post._id);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.post("/posts/:id/like", async (req, res) => {
  const post = await Post.findById(req.params.id);
  const userId = req.session.userId;

  if (!post) return res.status(404).send("Post not found");
  if (!userId) return res.status(403).send("Login required");

  const alreadyLiked = post.likedBy.includes(userId);

  if (alreadyLiked) {
    post.likedBy.pull(userId); // 取消点赞
  } else {
    post.likedBy.push(userId);

    if (post.author.toString() !== userId) {
      // ✅ 检查是否已有通知
      const existing = await Notification.findOne({
        recipient: post.author,
        sender: userId,
        post: post._id,
        type: "like"
      });

      if (!existing) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: "like",
          post: post._id
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
      // ✅ 检查是否已有通知
      const existing = await Notification.findOne({
        recipient: post.author,
        sender: userId,
        post: post._id,
        type: "bookmark"
      });

      if (!existing) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: "bookmark",
          post: post._id
        });
      }
    }
  }

  await post.save();
  res.redirect(req.get("referer"));
});




// 路由：主页
app.get("/", async (req, res) => {
  
  try {
    // 1. 最新帖子（主页下方那一块）
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author")
      .lean();

    // 2. 全站 Hot Tags（总量最多的前 8 个）
    const hotTags = await Post.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { name: "$_id", _id: 0 } }
    ]);

    // 3. 过去 7 天出现次数最多的前 5 个标签 —— 用来渲染 “Popular This Week” 按钮
    const oneWeekAgo = new Date();
    oneWeekAgo.setHours(0,0,0,0);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
    const weeklyTagsAgg = await Post.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { name: "$_id", count: 1, _id: 0 } }
    ]);
    // 传给模板：按钮用
    const weeklyTags = weeklyTagsAgg.map(t => t.name);

    // 4. 为折线图准备“过去 7 天”的每天日期
    const days = [];
    for (let d = new Date(oneWeekAgo); d <= new Date(); d.setDate(d.getDate()+1)) {
      days.push(
        d.toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
      );
    }

    // 5. 从 TagView 里先找出“过去 7 天访问量最高的前 5 个标签”
    const popularAgg = await TagView.aggregate([
      { $match: { viewedAt: { $gte: oneWeekAgo } } },
      { $group:   { _id: "$tag", views: { $sum: 1 } } },
      { $sort:    { views: -1 } },
      { $limit:   5 },
      { $project: { name: "$_id", _id: 0 } }
    ]);
    const popularTags = popularAgg.map(t => t.name);

    // 6. 再按天统计这 5 个标签的每日访问量
    // const dailyViewsAgg = await TagView.aggregate([
    //   { $match: {
    //       viewedAt: { $gte: oneWeekAgo },
    //       tag: { $in: popularTags }
    //   }},
    //   { $project: {
    //       tag: 1,
    //       day: { $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" } }
    //   }},
    //   { $group: {
    //       _id: { tag: "$tag", day: "$day" },
    //       count: { $sum: 1 }
    //   }},
    //   { $project: {
    //       tag: "$_id.tag",
    //       day: "$_id.day",
    //       count: 1,
    //       _id: 0
    //   }}
    // ]);


      const dailyViewsAgg = await TagView.aggregate([
      { $match: {
          viewedAt: { $gte: oneWeekAgo },
          tag: { $in: popularTags }
      }},
      { $project: {
          tag: 1,
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$viewedAt",
              timezone: "Europe/London"
            }
          }
      }},
      { $group: {
          _id: { tag: "$tag", day: "$day" },
          count: { $sum: 1 }
      }},
      { $project: {
          tag: "$_id.tag",
          day: "$_id.day",
          count: 1,
          _id: 0
      }}
    ]);


    // 7. 组装成 front-end 需要的 { name, counts } 结构
    const trendMap = {};
    popularTags.forEach(tag => {
      trendMap[tag] = { name: tag, counts: days.map(() => 0) };
    });
    dailyViewsAgg.forEach(({ tag, day, count }) => {
      const idx = days.indexOf(day);
      if (idx >= 0) trendMap[tag].counts[idx] = count;
    });
    const trendingViews = {
      days,
      tags: Object.values(trendMap)
    };
     console.log("Days:", days);
    console.log("Trending tags:", trendingViews.tags);
    console.log('dailyViewsAgg raw:', dailyViewsAgg);


    // 7. 当前登录用户
    const currentUser = req.session.userId
      ? await User.findById(req.session.userId)
      : null;

    // 8. 渲染
    res.render("index.ejs", {
      posts,
      hotTags,
      weeklyTags,       // “Popular This Week” 按钮用
      trendingViews,    // Chart.js 画访问量
      currentUser
    });

  } catch (err) {
    console.error("Failed to load homepage:", err);
    res.status(500).send("Server error");
  }
  
});




// 路由：上传页面
app.get("/upload", (req, res) => {
  res.render("upload.ejs");
});

// 路由：消息页面
// app.get("/notifications", (req, res) => {
  
//   res.render("notifications.ejs");
// });
app.get("/notifications", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const notifications = await Notification.find({ recipient: req.session.userId })
    .sort({ createdAt: -1 })
    .populate("sender", "username avatar")
    .populate("post", "coverImage")
    .populate("comment", "text");

  res.render("notifications.ejs", { notifications });
});



// 详情页：查看某个帖子的内容
app.get("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username avatar" }
      })
      .populate("likedBy");

      const commentTree=buildCommentTree(post.comments);

    if (!post) return res.status(404).send("Post not found");

    // ----------- 记录标签访问 -----------
    // 对 post.tags 数组里的每个标签，都插入一条日志
    const now = new Date();
    const views = post.tags.map(tag => ({
      tag,
      post: post._id,
      user: req.session.userId || null,
      viewedAt: now
    }));
    console.log('即将插入 TagView 记录：', views);
    await TagView.insertMany(views);
    console.log("插入成功")
    // -------------------------------------

    // res.render("post.ejs", { post });
    res.render("post.ejs", { post ,commentTree,currentUser:req.session.userId});
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

  // 4️⃣ 评论通知：给帖子作者
  if (post.author.toString() !== req.session.userId) {
    await Notification.create({
      recipient: post.author,
      sender: req.session.userId,
      type: "comment",
      post: post._id,
      comment: newComment._id,
    });
  }

  // 5️⃣ 回复通知：给被回复的人
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




async function testComments() {
  const post = await Post.findOne().lean(); // 获取一条帖子
  console.log(post.comments);
}
testComments();


// 路由：用户个人主页
app.get("/profile", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  try {
    const userId = req.session.userId;

    const user = await User.findById(userId)
      .populate('followers')  
      .populate('following'); 

    const [userPosts, likedPosts, collectedPosts] = await Promise.all([
      Post.find({ author: userId }).sort({ createdAt: -1 }),
      Post.find({ likedBy: userId }).sort({ createdAt: -1 }),
      Post.find({ bookmarkedBy: userId }).sort({ createdAt: -1 }),
    ]);

    res.render("profile.ejs", {
      user,
      userPosts,
      likedPosts,
      collectedPosts
    });
  } catch (err) {
    console.error("Error loading profile:", err);
    res.status(500).send("Server error");
  }
});


app.use('/uploads', express.static('public/uploads'));



// 启动服务器
app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
});