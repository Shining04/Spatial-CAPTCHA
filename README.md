# Spatial CAPTCHA

A 3D spatial CAPTCHA system that verifies users by requiring them to rotate a 3D object to match a target orientation.

![Spatial CAPTCHA Demo](https://img.shields.io/badge/Three.js-0.160.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Features

- **3D Object Rotation**: Interactive 3D object manipulation using mouse drag
- **Real-time Feedback**: Live accuracy display with color-coded indicators
- **Fine Control**: Precision adjustment using keyboard shortcuts or buttons
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Random Challenges**: Each verification presents a new random orientation
- **Visual Feedback**: Progress bar and glow effects based on accuracy

## 🚀 Quick Start

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd spatial-captcha
```

2. Open `index.html` in your browser:
```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx serve
```

3. Navigate to `http://localhost:8000`

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

#### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Option 2: Using Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

## 🎮 How to Use

### Basic Controls

1. **Mouse Drag**: Click and drag to rotate the object freely
2. **Match Target**: Rotate to match the green preview on the right
3. **Verify**: Click "Verify Human" when the indicator turns green

### Keyboard Shortcuts

- **W / S**: Rotate on X-axis (up/down)
- **A / D**: Rotate on Y-axis (left/right)
- **Q / E**: Rotate on Z-axis (counter-clockwise/clockwise)

### Accuracy Indicators

- 🟢 **Green** (< 35°): Ready to verify
- 🟡 **Yellow** (35-60°): Almost there
- 🔴 **Red** (> 60°): Keep rotating

## 🛠️ Technology Stack

- **Three.js**: 3D graphics rendering
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern styling with animations
- **HTML5**: Semantic markup

## 📁 Project Structure

```
spatial-captcha/
├── index.html          # Main HTML file
├── style.css           # Styles and animations
├── script.js           # Three.js logic and interactions
├── vercel.json         # Vercel deployment configuration
├── README.md           # Documentation
└── captcha_model.glb   # (Optional) Custom 3D model
```

## 🎨 Customization

### Using Custom 3D Models

Place your `.glb` or `.gltf` file in the root directory named `captcha_model.glb`:

```javascript
// The loader will automatically try to load:
// 1. captcha_model.glb
// 2. captcha_model.gltf
// 3. Fallback to procedural geometry
```

### Adjusting Difficulty

Edit `script.js` to change the tolerance:

```javascript
// Line 406: Change the angle threshold
if (angleDegrees < 35) {  // Change 35 to your desired value
  // Success
}
```

### Changing Colors

Edit `style.css` to customize the color scheme:

```css
/* Primary colors */
.canvas-section.preview-canvas {
  background: radial-gradient(circle at top, #e8f5e9 0%, #c8e6c9 100%);
  border: 3px solid #4caf50;
}
```

## 🔒 Security Features

- **Random Orientation**: Each challenge uses a random target rotation
- **Quaternion Comparison**: Accurate 3D rotation verification
- **Configurable Threshold**: Adjustable tolerance for verification
- **No Server Required**: Runs entirely client-side

## 📱 Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 15+)
- Opera: ✅ Full support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) - 3D graphics library
- [Vercel](https://vercel.com/) - Hosting platform

## 📞 Support

If you have any questions or issues, please open an issue on GitHub.

---

Made with ❤️ using Three.js

