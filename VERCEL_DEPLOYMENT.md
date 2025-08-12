# Vercel Deployment Guide

## Problem Diagnosis
The main reasons for 404 errors on Vercel are:
1. Incomplete route configuration
2. Static file handling issues
3. Missing environment variables
4. Package.json configuration errors
5. Dependency version incompatibilities
6. **CPU and memory limitations (Hobby plan)**
7. **Function execution timeouts**
8. **Invalid vercel.json configuration**


## Recent Fixes (Latest)
- **Removed invalid `regions` property** from functions configuration
- **Simplified vercel.json** to use only valid properties
- **Fixed schema validation errors** that caused build failures

## CPU Optimization Strategies

### 1. Function Configuration
- **maxDuration**: Reduced to 30 seconds
- **Memory**: Using default Vercel allocation
- **Configuration**: Simplified to avoid schema errors

### 2. Database Optimization
- Connection pooling to reduce connection overhead
- Query timeouts (5s for user queries, 3s for counts)
- Lazy loading of non-essential data

### 3. Middleware Optimization
- Reduced database queries in middleware
- Added error handling for timeouts
- Disabled heavy operations in production

## Deployment Steps

### 1. Environment Variables Configuration
Add the following environment variables in your Vercel project settings:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/threadtogether?retryWrites=true&w=majority
SESSION_SECRET=your-super-secret-session-key-here
NODE_ENV=production
VERCEL=true
```

### 2. Redeploy
```bash
# Commit changes
git add .
git commit -m "Fix vercel.json schema validation errors"
git push

# Vercel will automatically redeploy
```

### 3. Verify Deployment
After deployment, check if these routes work properly:
- `/` - Homepage
- `/profile` - User profile page
- `/login` - Login page
- `/register` - Registration page

## Troubleshooting

### If 404 errors persist:
1. Check Vercel function logs
2. Confirm all environment variables are set correctly
3. Verify MongoDB connection is working
4. Check package.json configuration
5. Verify dependency versions

### Build Failures:
If Vercel build fails:
1. **Check vercel.json schema** - ensure all properties are valid
2. Check that `package.json` has correct `main` field (`app.js`)
3. Ensure `type: "module"` is set
4. Verify Node.js version compatibility (18.x)
5. Check for syntax errors in code

### Schema Validation Errors:
Common vercel.json errors:
- **Invalid properties**: `regions`, `memory` in functions
- **Wrong property types**: ensure values match expected types
- **Missing required fields**: check Vercel documentation

### CPU/Memory Issues:
If you hit Vercel limits:
1. **Upgrade to Pro plan** for more resources
2. **Reduce function complexity** - move heavy operations to background
3. **Use edge functions** for simple operations
4. **Implement caching** to reduce database calls

### Database Connection Issues:
Ensure MongoDB Atlas IP whitelist includes Vercel's IP addresses:
- Add `0.0.0.0/0` to IP access list in MongoDB Atlas

### Session Issues:
If sessions are lost after login, check:
- `SESSION_SECRET` is set correctly
- MongoDB connection is working properly

## Technical Details

### Route Configuration
All requests now go through `/api/server.js`, ensuring:
- Static files are served correctly
- API routes work properly
- Page rendering functions normally

### File Upload
In Vercel environment, file uploads use memory storage and won't persist to disk.

### Package Configuration
- Main entry point: `app.js`
- Node version: 18.x
- Module type: ES modules
- Build script: `vercel-build`

### Performance Optimizations
- Database connection pooling
- Query timeouts and error handling
- Lazy loading of non-critical data
- Reduced middleware complexity

## Support
If issues persist, please:
1. Check Vercel function logs
2. Confirm all environment variables are set
3. Verify MongoDB connection status
4. Check build logs for errors
5. Verify package.json configuration
6. **Check vercel.json schema validation**
7. **Consider upgrading Vercel plan** if hitting resource limits
