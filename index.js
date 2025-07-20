import express from "express";

const app = express();
const port = 3000;

// 设置视图引擎为 EJS
app.set("view engine", "ejs");

// 静态资源目录（包括 images、videos、styles）
app.use(express.static("public"));

// 模拟数据数组（未来可以替换为数据库）
const posts = [
  {
    _id: "12345",
    title: "Vintage French Embroidery Blouse",
    author: "sewwithjane",
    date: "2d",
    image: "/images/blouse.jpg",
    description:
      "This blouse is inspired by 1950s fashion and made from natural linen, featuring hand embroidery in delicate floral motifs.",
    tags: ["French", "Vintage", "Linen"],
    steps: [
      { type: "image", image: "/images/step1.png", text: "Pinned fabric and hand-embroidered motif." },
      { type: "image", image: "/images/step2.png", text: "Cutting out the fabric pieces." },
      { type: "image", image: "/images/step3.png", text: "Assembling the final garment." },
    ],
    comments: [
      { user: "sewlover123", text: "Love the neckline detail! How long did it take to make?" },
      { user: "handmadecrafts", text: "Can you share the pattern?" },
    ],
  },
  {
    _id: "video-demo",
    title: "Sewing with Video Steps Only",
    author: "videostitcher",
    date: "1d",
    image: "/images/blouce.png",
    description: "This post demonstrates a sewing project where each step is explained through video.",
    tags: ["Video", "Tutorial", "Modern"],
    steps: [
      { type: "video", video: "/videos/step1.mp4", text: "Step 1: Cutting the fabric pieces." },
      { type: "video", video: "/videos/step2.mp4", text: "Step 2: Stitching the sides together." },
      { type: "video", video: "/videos/step3.mp4", text: "Step 3: Adding finishing touches." },
    ],
    comments: [
      { user: "videoFan88", text: "Video steps make this so clear, thanks!" }
    ],
  },
];

// 路由：主页
app.get("/", (req, res) => {
  res.render("index.ejs");
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
app.get("/explore", (req, res) => {
  res.render("explore.ejs", { posts }); // 可传入 posts 做卡片展示
});

// 路由：动态加载某个帖子详情
app.get("/posts/:id", (req, res) => {
  const postId = req.params.id;
  const post = posts.find((p) => p._id === postId);

  if (post) {
    res.render("post.ejs", { post });
  } else {
    res.status(404).send("Post not found");
  }
});

// 路由：用户个人主页
app.get("/profile", (req, res) => {
  res.render("profile.ejs");
});

// 启动服务器
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
