export function buildCommentTree(flatComments) {
  const map = new Map();
  const roots = [];

  flatComments.forEach(comment => {
    map.set(comment._id.toString(), { ...comment.toObject(), children: [] });
  });

  
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
