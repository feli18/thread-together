// utils/buildCommentTree.js
export function buildCommentTree(flatComments) {
  const map = new Map();
  const roots = [];

  // 初始化每条评论节点
  flatComments.forEach(comment => {
    map.set(comment._id.toString(), { ...comment.toObject(), children: [] });
  });

  // 构建树状结构
  flatComments.forEach(comment => {
    if (comment.replyTo) {
      const parent = map.get(comment.replyTo.toString());
      if (parent) {
        parent.children.push(map.get(comment._id.toString()));
      }
    } else {
      roots.push(map.get(comment._id.toString()));
    }
  });

  return roots;
}
