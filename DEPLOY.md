# 🚀 Deployment Guide

This guide will help you deploy your Spatial CAPTCHA to Vercel.

## Prerequisites

- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free tier is sufficient)

---

## Method 1: Deploy via Vercel Dashboard (Recommended for Beginners)

### Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Initialize git in your project folder:

```bash
git init
git add .
git commit -m "Initial commit: Spatial CAPTCHA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository
5. Configure project settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
6. Click **"Deploy"**

### Step 3: Done! 🎉

Your site will be deployed in seconds. You'll get a URL like:
```
https://your-project-name.vercel.app
```

---

## Method 2: Deploy via Vercel CLI (For Developers)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
# Navigate to your project directory
cd "C:\Users\ShiningS\Documents\Spatial Captcha"

# Deploy
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **Project name?** → Press Enter (or type a custom name)
- **Directory?** → Press Enter (current directory)

### Step 4: Production Deployment

```bash
vercel --prod
```

---

## Method 3: One-Click Deploy

Click this button to deploy immediately:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO_NAME)

---

## Configuration

### Custom Domain

1. Go to your project on Vercel dashboard
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

### Environment Variables (if needed)

1. Go to project **Settings** → **Environment Variables**
2. Add variables as needed
3. Redeploy for changes to take effect

---

## Project Structure

Your deployed files:

```
/
├── index.html          # Main page
├── style.css           # Styles
├── script.js           # JavaScript logic
├── vercel.json         # Vercel configuration
└── captcha_model.gltf  # (Optional) 3D model
```

---

## Troubleshooting

### Issue: Import Map not working

**Solution**: Vercel serves static files correctly. If you see errors, make sure:
- Your browser supports Import Maps (Chrome 89+, Safari 16.4+, Firefox 108+)
- Files are served with correct MIME types

### Issue: 3D model not loading

**Solution**: 
- Ensure `captcha_model.glb` is in the root directory
- Check the browser console for network errors
- The fallback procedural geometry will load automatically if the model is missing

### Issue: CORS errors

**Solution**: Vercel automatically handles CORS for same-origin resources. If you're loading external resources, ensure they have proper CORS headers.

---

## Performance Tips

1. **Enable Compression**: Vercel automatically compresses responses
2. **CDN**: All files are served via Vercel's global CDN
3. **Cache Headers**: Vercel sets optimal cache headers automatically

---

## Monitoring

View your deployment stats:

1. Go to your project dashboard
2. Click on **Analytics**
3. Monitor:
   - Page views
   - Load time
   - Geographic distribution

---

## Updating Your Deployment

### Automatic (via Git)

Once connected to GitHub, every push to `main` branch triggers a new deployment:

```bash
git add .
git commit -m "Update description"
git push
```

### Manual (via CLI)

```bash
vercel --prod
```

---

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- GitHub Issues: [Your repo's issues page]

---

## Cost

- **Hobby Plan (Free)**:
  - Unlimited personal projects
  - 100 GB bandwidth/month
  - Perfect for this project

- **Pro Plan ($20/month)** (only if you need):
  - More bandwidth
  - Advanced analytics
  - Team features

---

**Your Spatial CAPTCHA is now live! 🎉**

Share your deployment URL with the world!

