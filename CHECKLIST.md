# ✅ Deployment Checklist

Use this checklist before deploying to Vercel.

## Pre-Deployment

- [ ] All text is in English
- [ ] `index.html` has proper meta tags
- [ ] `vercel.json` configuration is present
- [ ] `.gitignore` includes Vercel directory
- [ ] `README.md` is complete and helpful
- [ ] Test locally in browser (open `index.html`)
- [ ] Check browser console for errors
- [ ] Test on mobile viewport (F12 → Toggle device toolbar)

## Functionality Testing

- [ ] 3D object loads (or fallback appears)
- [ ] Mouse drag rotates the object
- [ ] Keyboard controls work (WASD, QE)
- [ ] Button controls work
- [ ] Real-time accuracy indicator updates
- [ ] Progress bar moves correctly
- [ ] "Verify Human" button works
- [ ] "New Challenge" button generates new rotation
- [ ] Success alert appears when within 35°
- [ ] Failure alert shows correct error message

## Visual Testing

- [ ] Page layout is centered
- [ ] Both canvases render correctly
- [ ] Labels are visible and clear
- [ ] Buttons have hover effects
- [ ] Color indicators change based on accuracy:
  - [ ] Green when < 35°
  - [ ] Yellow when 35-60°
  - [ ] Red when > 60°
- [ ] Canvas glows when close to target
- [ ] Fine control panel is readable

## Browser Compatibility

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile Chrome
- [ ] Mobile Safari (if available)

## File Structure

```
✅ Must have:
- index.html
- style.css
- script.js
- vercel.json
- README.md
- package.json
- .gitignore

📦 Optional:
- captcha_model.glb
- captcha_model.gltf
- DEPLOY.md
- CHECKLIST.md
```

## Git Repository

- [ ] Repository created on GitHub
- [ ] All files committed
- [ ] Pushed to `main` branch
- [ ] Repository is public (or accessible to Vercel)

## Vercel Setup

- [ ] Vercel account created
- [ ] GitHub account connected to Vercel
- [ ] Ready to import repository

## Post-Deployment

- [ ] Site loads without errors
- [ ] All functionality works on live site
- [ ] Check mobile responsiveness
- [ ] Share deployment URL
- [ ] Update README with live demo link

---

## Quick Test Commands

### Local Testing

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx serve

# Then open: http://localhost:8000
```

### Deploy to Vercel

```bash
# Install CLI (first time only)
npm install -g vercel

# Login (first time only)
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

---

## Verification Steps

After deployment, test these on your live site:

1. **Load Test**: Does the page load quickly?
2. **3D Test**: Does the 3D object appear?
3. **Interaction Test**: Can you rotate with mouse?
4. **Keyboard Test**: Do WASD/QE keys work?
5. **Mobile Test**: Does it work on phone?
6. **Verification Test**: Can you complete a challenge?

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Import map error | Update browser to latest version |
| 3D model missing | Fallback geometry will load automatically |
| Controls not working | Check console for JavaScript errors |
| Styles broken | Clear browser cache and reload |
| Mobile issues | Test in device mode (F12 → mobile view) |

---

## Ready to Deploy?

If all checkboxes are ✅, you're ready to deploy!

Run:
```bash
vercel --prod
```

Or use the Vercel dashboard to deploy from GitHub.

---

**Good luck with your deployment! 🚀**

