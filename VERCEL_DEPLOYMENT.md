# Vercel Deployment Guide

## Problem Diagnosis
The main reasons for 404 errors on Vercel are:
1. Incomplete route configuration
2. Static file handling issues
3. Missing environment variables

## Issues Fixed
Fixed `vercel.json` configuration
Enhanced `api/server.js` with CORS and request handling
Fixed syntax errors in `app.js`

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
git commit -m "Fix Vercel deployment issues"
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

## Support
If issues persist, please:
1. Check Vercel function logs
2. Confirm all environment variables are set
3. Verify MongoDB connection status
