# 🎯 Carrom Pool PWA

A complete, production-ready Progressive Web App (PWA) for playing Carrom Pool online with realistic physics. Features single-player AI mode, multiplayer online gameplay, leaderboards, and offline support.

## ✨ Features

- 🎮 **Single Player Mode** - Play against intelligent AI opponents with adjustable difficulty
- 👥 **Multiplayer Mode** - Real-time online multiplayer using Firebase
- 🏆 **Leaderboard** - Global leaderboard to track top players
- 📱 **PWA Support** - Installable on all mobile devices with offline capabilities
- 🎯 **Realistic Physics** - Built with Matter.js for authentic carrom physics
- 🔥 **Firebase Integration** - Authentication, Firestore database, and hosting
- 📊 **Score Tracking** - Real-time score updates and game statistics
- 🎨 **Responsive Design** - Works seamlessly on desktop and mobile devices
- ⚡ **Fast & Optimized** - Built with Vite for optimal performance

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account (free tier works fine)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd carrom_pool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase is already configured!**

   The app is connected to Firebase project: `carrompool-94dfd`

   ⚠️ **Important**: Before running, enable these in [Firebase Console](https://console.firebase.google.com/):
   - ✅ Authentication → Anonymous sign-in
   - ✅ Firestore Database (Production mode)
   - ✅ Firebase Hosting

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Build for Production

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Preview production build**
   ```bash
   npm run preview
   ```

## 🔥 Firebase Deployment

### ⚡ Quick Deploy (Recommended)

**One-command deployment:**
```bash
./deploy.sh
```

This script will:
- ✅ Build the production bundle
- ✅ Deploy Firestore rules and indexes
- ✅ Deploy to Firebase Hosting
- ✅ Show your live app URLs

**Your app will be live at:**
- https://carrompool-94dfd.web.app
- https://carrompool-94dfd.firebaseapp.com

### 📋 Manual Deployment

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Deploy Firestore rules**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

4. **Build and deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## 📱 PWA Installation

### On Mobile (iOS/Android):

1. Open the app in your browser
2. Click the browser menu (⋮ or share button)
3. Select "Add to Home Screen"
4. Confirm installation

### On Desktop:

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Confirm installation

## 🎮 How to Play

1. **Start a Game**
   - Choose Single Player or Multiplayer mode
   - Enter your name

2. **Gameplay**
   - Click and drag on the striker to aim
   - Pull back to set power
   - Release to shoot
   - Pocket pieces to score points

3. **Scoring**
   - White pieces: 10 points
   - Black pieces: 20 points
   - Queen (red): 50 points
   - Pocketing striker: -10 points

4. **Winning**
   - Player with highest score when all pieces are pocketed wins
   - Game ends automatically when conditions are met

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Physics Engine**: Matter.js
- **Backend**: Firebase (Auth + Firestore)
- **PWA**: Vite PWA Plugin with Workbox
- **Styling**: CSS3 with CSS Variables
- **State Management**: React Context API

## 📂 Project Structure

```
carrom_pool/
├── src/
│   ├── components/        # React components
│   │   ├── Game.tsx       # Main game orchestrator
│   │   ├── GameBoard.tsx  # Physics-based game board
│   │   ├── Menu.tsx       # Main menu screen
│   │   ├── ScoreBoard.tsx # Score display
│   │   └── Leaderboard.tsx # Leaderboard view
│   ├── context/           # React contexts
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── GameContext.tsx    # Game state
│   ├── services/          # External services
│   │   └── firebase.ts    # Firebase API calls
│   ├── utils/             # Utility functions
│   │   ├── physics.ts     # Physics engine setup
│   │   └── ai.ts          # AI opponent logic
│   ├── types/             # TypeScript types
│   │   └── game.ts        # Game-related types
│   ├── config/            # Configuration
│   │   └── firebase.ts    # Firebase config
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── vite.config.ts         # Vite configuration
└── package.json           # Dependencies
```

## 🔧 Configuration

### Firebase Security Rules

The `firestore.rules` file contains security rules for:
- Leaderboard: Read-only for all, write for authenticated users
- Games: Read/write for participants only

### PWA Configuration

The PWA is configured in `vite.config.ts` with:
- Auto-update registration
- Offline caching
- Custom manifest
- Service worker with Workbox

## 🎨 Customization

### Game Physics

Adjust physics constants in `src/utils/physics.ts`:
```typescript
export const FRICTION = 0.08;
export const RESTITUTION = 0.85;
```

### AI Difficulty

Modify AI behavior in `src/utils/ai.ts`:
```typescript
enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}
```

### Styling

Update CSS variables in `src/index.css`:
```css
:root {
  --board-color: #d4a574;
  --accent-color: #FFD700;
  /* ... */
}
```

## 🐛 Troubleshooting

### Build Issues

- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check Node version: `node --version` (should be v16+)

### Firebase Issues

- Verify Firebase config in `.env`
- Check Firebase console for enabled services
- Review Firestore security rules

### PWA Not Installing

- Ensure HTTPS (or localhost)
- Check browser console for service worker errors
- Verify manifest.json is being served

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Future Enhancements

- [ ] Add sound effects and background music
- [ ] Implement different board themes
- [ ] Add achievements and badges
- [ ] Tournament mode
- [ ] Player profiles and avatars
- [ ] Chat functionality in multiplayer
- [ ] Replay system
- [ ] Advanced AI with machine learning

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review Firebase console logs

## 🙏 Acknowledgments

- Matter.js for the physics engine
- Firebase for backend services
- Vite for blazing-fast development
- React community for excellent tools

---

**Enjoy playing Carrom Pool! 🎯**
