export function isLoggedIn(req, res, next) {
 
  console.log('isLoggedIn middleware check:');
  console.log('  - Request path:', req.path);
  console.log('  - Session ID:', req.sessionID);
  console.log('  - Session exists:', !!req.session);
  console.log('  - User ID:', req.session?.userId);
  console.log('  - Cookie:', req.headers.cookie ? 'exist' : 'not exist');
  
  if (!req.session || !req.session.userId) {
    console.log(' User not logged in, redirecting to /login');
    return res.redirect('/login');
  }
  
  console.log(' User is logged in, proceeding');
  next();
}
