import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/comment.js';
import Notification from "../models/Notification.js";
import User from "../models/User.js";


const router = express.Router({ mergeParams: true });

router.post('/', async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  if (!post) return res.status(404).send("Post not found");

  const comment = new Comment({
    user: req.session.userId,
    post: postId,
    text: req.body.comment,
    replyTo: req.body.replyTo || null
  });

  await comment.save();
  post.comments.push(comment._id);
  await post.save();
  if (post.author.toString() !== req.session.userId) {
    await Notification.create({
      recipient: post.author,
      sender: req.session.userId,
      type: "comment",
      post: post._id,
      comment: comment._id,
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
        comment: comment._id,
      });
    }
  }


  res.redirect(`/posts/${postId}`);
});

router.delete('/:commentId', async (req, res) => {
  const { postId, commentId } = req.params;
  const comment = await Comment.findById(commentId);
  if (!comment) return res.status(404).send("Comment not found");
  if (comment.user.toString() !== req.session.userId) return res.status(403).send("Unauthorized");

  await Post.findByIdAndUpdate(postId, { $pull: { comments: commentId } });
  await Comment.findByIdAndDelete(commentId);

  res.redirect(`/posts/${postId}`);
});

export default router;
