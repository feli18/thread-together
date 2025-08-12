export function isLoggedIn(req, res, next) {
  console.log('🔍 isLoggedIn middleware check:');
  console.log('  - Session ID:', req.sessionID);
  console.log('  - Session exists:', !!req.session);
  console.log('  - User ID:', req.session?.userId);
  console.log('  - Headers:', req.headers.cookie ? 'Cookie present' : 'No cookie');
  
  if (!req.session || !req.session.userId) {
    console.log('User not logged in, redirecting to /login');
    return res.redirect('/login');
  }
  
  console.log('User is logged in, proceeding');
  next();
}
