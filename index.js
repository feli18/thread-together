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


import mongoose from 'mongoose'; 


const app = express();
const port = 3000;

// 设置视图引擎为 EJS
app.set("view engine", "ejs");



// 静态资源目录（包括 images、videos、styles）
app.use(express.static("public"));


// 会话中间件（保存登录状态）
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
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

app.use(async (req, res, next) => {
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

  next();
});


app.use("/", authRoutes);
app.use("/", userRoutes);
app.use('/posts/:postId/comments', commentRoutes);

// 全局设置 res.locals.user
// app.use(async (req, res, next) => {
//   if (req.session.userId) {
//     res.locals.user = await User.findById(req.session.userId);
//   } else {
//     res.locals.user = null;
//   }
//   next();
// });


// 模拟数据数组（未来可以替换为数据库）
// const posts = [
//   {
//     _id: "12345",
//     title: "Vintage French Embroidery Blouse",
//     author: "sewwithjane",
//     date: "2d",
//     image: "/images/blouse.png",
//     description:
//       "This blouse is inspired by 1950s fashion and made from natural linen, featuring hand embroidery in delicate floral motifs.",
//     tags: ["French", "Vintage", "Linen"],
//     steps: [
//       { type: "image", image: "/images/step1.png", text: "Pinned fabric and hand-embroidered motif." },
//       { type: "image", image: "/images/step2.png", text: "Cutting out the fabric pieces." },
//       { type: "image", image: "/images/step3.png", text: "Assembling the final garment." },
//     ],
//     comments: [
//       { user: "sewlover123", text: "Love the neckline detail! How long did it take to make?" },
//       { user: "handmadecrafts", text: "Can you share the pattern?" },
//     ],
//   },
//   {
//     _id: "video-demo",
//     title: "Sewing with Video Steps Only",
//     author: "videostitcher",
//     date: "1d",
//     image: "/images/blouse.png",
//     description: "This post demonstrates a sewing project where each step is explained through video.",
//     tags: ["Video", "Tutorial", "Modern"],
//     steps: [
//       { type: "video", video: "/videos/step1.mp4", text: "Step 1: Cutting the fabric pieces." },
//       { type: "video", video: "/videos/step2.mp4", text: "Step 2: Stitching the sides together." },
//       { type: "video", video: "/videos/step3.mp4", text: "Step 3: Adding finishing touches." },
//     ],
//     comments: [
//       { user: "videoFan88", text: "Video steps make this so clear, thanks!" }
//     ],
//   },
// ];

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

  // 存储 Post，不把封面图放进 steps
  const newPost = new Post({
    title,
    author: req.session.userId,
    description,
    tags: tags.split(",").map(tag => tag.trim()),
    coverImage: coverImagePath, // <- 独立字段
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
    post.tags = req.body.tags.split(",").map(tag => tag.trim());

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
    // 已点赞 → 取消点赞
    post.likedBy.pull(userId);
  } else {
    // 未点赞 → 添加点赞
    post.likedBy.push(userId);
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
    post.bookmarkedBy.pull(userId); // 取消收藏
  } else {
    post.bookmarkedBy.push(userId); // 添加收藏
  }

  await post.save();
  res.redirect(req.get("referer")); // 返回原页面
});




// 路由：主页
app.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate("author");

    let user = null;
    if (req.session.userId) {
      user = await User.findById(req.session.userId); // 🔁 查询当前登录用户信息
    }

    res.render("index.ejs", { posts});
  } catch (err) {
    console.error("Failed to load posts:", err);
    res.status(500).send("Server error");
  }
});



// 路由：上传页面
app.get("/upload", (req, res) => {
  res.render("upload.ejs");
});

// 路由：消息页面
app.get("/messages", (req, res) => {
  
  res.render("messages.ejs");
});

// 路由：探索页面
app.get("/explore", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author")
      .populate("likedBy")
      .populate("bookmarkedBy");

    res.render("explore.ejs", { posts });
  } catch (err) {
    console.error("Failed to load posts:", err);
    res.status(500).send("Server error");
  }
});


// 详情页：查看某个帖子的内容
app.get("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username' }
      })
      .populate('likedBy'); 

    if (!post) return res.status(404).send("Post not found");

    res.render("post.ejs", { post });
  } catch (err) {
    console.error("Error fetching post:", err);
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

  res.redirect(`/posts/${post._id}`);
});

app.get("/search-users", async (req, res) => {
  const query = req.query.q || '';
  const matchedUsers = await User.find({
    username: { $regex: query, $options: "i" }
  });

  res.render("searchUsers.ejs", {
    matchedUsers,
    query
  });
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
