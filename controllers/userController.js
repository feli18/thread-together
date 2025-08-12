import User from '../models/User.js';

export const followUser = async (req, res) => {
  const currentUser = await User.findById(req.session.userId);
  const targetUser = await User.findById(req.params.id);

  if (!targetUser.followers.includes(currentUser._id)) {
    targetUser.followers.push(currentUser._id);
    currentUser.following.push(targetUser._id);

    await targetUser.save();
    await currentUser.save();
    req.flash('success', `你已关注 ${targetUser.username}`);
  }

  res.redirect(303, `/users/${req.params.id}`);
};

export const unfollowUser = async (req, res) => {
  const currentUser = await User.findById(req.session.userId);
  const targetUser = await User.findById(req.params.id);

  targetUser.followers.pull(currentUser._id);
  currentUser.following.pull(targetUser._id);

  await targetUser.save();
  await currentUser.save();
  req.flash('success', `你已取消关注 ${targetUser.username}`);

  res.redirect(303, `/users/${req.params.id}`);
};
