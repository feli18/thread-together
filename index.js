import express from "express";

const app = express();
const port = 3000;


app.use(express.static("public"))
app.get("/",(req,res)=>{
  res.render("index.ejs")
})
app.get("/messages",(req,res)=>{
  res.render("messages.ejs")
})
app.get("/upload",(req,res)=>{
  res.render("upload.ejs")
})
app.get("/explore",(req,res)=>{
    res.render("explore.ejs")
  })


// login 按钮跳转到个人主页
app.get("/profile", (req, res) => {
  res.render("profile.ejs"); // 渲染你写好的 profile.ejs
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
