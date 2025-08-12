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
9. **Missing build script**
10. **Configuration conflicts**
11. **Deprecated Node.js version**
12. **File system permission errors (EROFS)**
13. **Static file loading issues (logo, avatars)**

## Recent Fixes (Latest)
- **Removed invalid `regions` property** from functions configuration
- **Simplified vercel.json** to use only valid properties
- **Fixed schema validation errors** that caused build failures
- **Added proper build script** to package.json
- **Removed conflicting functions configuration**
- **Cleaned up .vercel directory** to avoid conflicts
- **Updated Node.js version** from 18.x to 22.x (Vercel requirement)
- **Fixed file system permission errors** by using memory storage in Vercel
- **Fixed static file loading issues** by adding dedicated static file routes

## Static File Loading Fixes
**Issue**: Logo and avatar images not loading in Vercel deployment

### What was fixed:
- **Added dedicated static file routes** in `routes/static.js`
- **Enhanced static file handling** for images, favicon, and other assets
- **Added explicit image handling** for logo and avatar files
- **Fixed favicon loading** issues

### Why this happened:
- Vercel's static file handling can be inconsistent
- Express static middleware may not work properly in serverless environment
- Need explicit routes for critical static files

## File System Permission Fixes
**Critical Issue**: Vercel serverless environment has a read-only file system (`EROFS: read-only file system`)

### What was fixed:
- **generateTags.js**: Changed from `DiskStorage` to `memoryStorage` for Vercel
- **messages.js**: Updated multer configuration to use memory storage in Vercel
- **multer.js**: Already correctly configured for Vercel environment

### Why this happened:
- Vercel's `/var/task` directory is read-only
- `multer` was trying to create directories and write files
- Solution: Use `multer.memoryStorage()` in Vercel environment

## Node.js Version Update
**Important**: Vercel now requires Node.js 22.x. Deployments with Node.js 18.x will fail after September 1, 2025.

### What was changed:
- Updated `"engines": { "node": "22.x" }` in package.json
- This ensures compatibility with Vercel's latest requirements

## CPU Optimization Strategies

### 1. Function Configuration
- **Configuration**: Simplified to avoid schema errors
- **Builds**: Using standard @vercel/node builder
- **Routes**: Simple catch-all routing

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

### 2. Clean Deployment
```bash
# Remove any conflicting configuration
rm -rf .vercel

# Commit changes
git add .
git commit -m "Fix static file loading issues for Vercel deployment"
git push

# Vercel will automatically redeploy
```

### 3. Verify Deployment
After deployment, check if these routes work properly:
- `/` - Homepage
- `/profile` - User profile page
- `/login` - Login page
- `/register` - Registration page
- **Static files**: Logo, avatars, CSS, JS files

## Troubleshooting

### If 404 errors persist:
1. Check Vercel function logs
2. Confirm all environment variables are set correctly
3. Verify MongoDB connection is working
4. Check package.json configuration
5. Verify dependency versions

### Build Failures:
If Vercel build fails:
1. **Check Node.js version** - must be 22.x for new deployments
2. **Check vercel.json schema** - ensure all properties are valid
3. **Verify build script exists** in package.json
4. Check that `package.json` has correct `main` field (`app.js`)
5. Ensure `type: "module"` is set
6. Check for syntax errors in code

### Static File Issues:
**Problem**: Logo, avatars, CSS, JS files not loading

**Solutions**:
1. **Check static file routes** in `routes/static.js`
2. **Verify file paths** in `public` directory
3. **Check vercel.json** routing configuration
4. **Use explicit file routes** for critical assets

### File System Errors (EROFS):
**Error**: `EROFS: read-only file system, mkdir '/var/task/temp'`

**Solutions**:
1. **Use memory storage**: `multer.memoryStorage()` in Vercel
2. **Avoid disk operations**: Don't create directories or write files
3. **Environment detection**: Check `process.env.VERCEL` before using disk storage
4. **File handling**: Use `req.file.buffer` instead of `req.file.path` in Vercel

### Node.js Version Issues:
- **Error**: "Node.js version 18.x is deprecated"
- **Solution**: Update to Node.js 22.x in package.json
- **Deadline**: September 1, 2025 for new deployments

### Configuration Conflicts:
Common issues and solutions:
- **Conflicting functions and builds**: Use only one configuration method
- **Invalid properties**: Remove unsupported properties like `regions`, `memory`
- **Schema validation errors**: Use only documented Vercel properties
- **Build script missing**: Ensure `build` script exists in package.json

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
- Node version: **22.x** (Vercel requirement)
- Module type: ES modules
- Build script: `build`

### Performance Optimizations
- Database connection pooling
- Query timeouts and error handling
- Lazy loading of non-critical data
- Reduced middleware complexity

### File System Handling
- **Vercel**: Uses `multer.memoryStorage()` and `req.file.buffer`
- **Local**: Uses `multer.diskStorage()` and `req.file.path`
- **Environment detection**: Automatically switches based on `process.env.VERCEL`

### Static File Handling
- **Dedicated routes**: Explicit handling for images, CSS, JS, videos
- **Fallback images**: Default avatar if image not found
- **Favicon support**: Proper favicon.ico and favicon.png handling
- **Error handling**: Graceful fallbacks for missing files

## Support
If issues persist, please:
1. Check Vercel function logs
2. Confirm all environment variables are set
3. Verify MongoDB connection status
4. Check build logs for errors
5. Verify package.json configuration
6. **Check vercel.json schema validation**
7. **Remove .vercel directory** if conflicts persist
8. **Verify Node.js version is 22.x**
9. **Check for file system permission errors**
10. **Verify static file routes are working**
11. **Consider upgrading Vercel plan** if hitting resource limits
