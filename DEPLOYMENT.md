# 🚀 Deployment Guide - Carrom Pool PWA

## ✅ Firebase Configuration Complete

Your Firebase project is now fully configured:
- **Project ID**: `carrompool-94dfd`
- **Region**: Asia Southeast 1
- **Services**: Authentication, Firestore, Realtime Database, Storage, Analytics

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure these Firebase services are enabled in your [Firebase Console](https://console.firebase.google.com/):

### 1. **Authentication**
   - Go to: Authentication → Sign-in method
   - Enable: **Anonymous** authentication
   - Click "Save"

### 2. **Firestore Database**
   - Go to: Firestore Database
   - Click "Create database"
   - Choose: **Production mode**
   - Location: **asia-southeast1** (or your preferred region)
   - Click "Enable"

### 3. **Firebase Hosting**
   - Go to: Hosting
   - Click "Get started" if not already enabled

---

## 🛠️ Local Development

### Install Dependencies (if not already done)
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

### Build Production Bundle
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## 🔥 Firebase CLI Setup

### 1. Install Firebase Tools (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Deploy Firestore Rules and Indexes
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy database indexes
firebase deploy --only firestore:indexes
```

**Important**: Wait for indexes to build (can take a few minutes). Check status:
```bash
firebase firestore:indexes
```

---

## 🌐 Deploy to Firebase Hosting

### Option A: Quick Deploy (Recommended)
```bash
# Build and deploy in one command
npm run build && firebase deploy --only hosting
```

### Option B: Deploy Everything
```bash
# Build the app
npm run build

# Deploy all Firebase services
firebase deploy
```

### Your App Will Be Live At:
```
https://carrompool-94dfd.web.app
https://carrompool-94dfd.firebaseapp.com
```

---

## 📱 Testing the PWA

### On Mobile Devices

#### Android (Chrome):
1. Open the app URL in Chrome
2. Tap the menu (⋮) → "Add to Home screen"
3. Confirm installation
4. Launch from home screen

#### iOS (Safari):
1. Open the app URL in Safari
2. Tap the Share button
3. Scroll down → "Add to Home Screen"
4. Confirm installation
5. Launch from home screen

### On Desktop

#### Chrome/Edge:
1. Open the app URL
2. Look for the install icon in the address bar
3. Click "Install"
4. App will open in standalone window

---

## 🔒 Security Configuration

### Firestore Security Rules

The `firestore.rules` file is already configured with:

```javascript
// Leaderboard - Read all, write own
match /leaderboard/{userId} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == userId;
}

// Multiplayer Games - Read all, write if participant
match /games/{gameId} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update: if request.auth != null && (
    request.auth.uid == resource.data.player1Id ||
    request.auth.uid == resource.data.player2Id
  );
}
```

### Firebase Console Checks:
1. **Authentication** → Check anonymous users can sign in
2. **Firestore** → Verify rules are deployed
3. **Hosting** → Ensure SSL is enabled (automatic)

---

## 🧪 Testing Checklist

After deployment, test these features:

### Authentication
- [ ] Can sign in as guest
- [ ] Username is displayed correctly
- [ ] Can sign out

### Single Player Mode
- [ ] Can start game against AI
- [ ] AI makes moves automatically
- [ ] Pieces move with realistic physics
- [ ] Score updates correctly
- [ ] Game ends properly

### Multiplayer Mode
- [ ] Can create a game room
- [ ] Another player can join
- [ ] Game state syncs in real-time
- [ ] Turn switching works
- [ ] Winner is determined correctly

### Leaderboard
- [ ] Displays top players
- [ ] Updates after game completion
- [ ] Shows wins/losses/score

### PWA Features
- [ ] App can be installed
- [ ] Works offline (after first load)
- [ ] Service worker updates automatically
- [ ] Manifest icons appear correctly

### Responsive Design
- [ ] Works on mobile portrait/landscape
- [ ] Works on tablet
- [ ] Works on desktop
- [ ] Touch controls work smoothly
- [ ] Mouse controls work properly

---

## 🔧 Troubleshooting

### Build Errors

**Issue**: TypeScript errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

**Issue**: Environment variables not loading
```bash
# Ensure .env file exists
cp .env.example .env
# Restart dev server
npm run dev
```

### Firebase Deployment Errors

**Issue**: "Permission denied" during deploy
```bash
# Re-login to Firebase
firebase login --reauth
```

**Issue**: Firestore indexes not ready
```bash
# Check index build status
firebase firestore:indexes
# Wait a few minutes and try again
```

**Issue**: Authentication not working
1. Go to Firebase Console → Authentication
2. Ensure "Anonymous" is enabled
3. Check browser console for errors

### PWA Installation Issues

**Issue**: Install prompt doesn't appear
- Ensure you're on HTTPS (or localhost)
- Check browser console for service worker errors
- Verify manifest.json is being served

**Issue**: App doesn't work offline
- Clear browser cache
- Reinstall the PWA
- Check Service Worker is registered in DevTools

---

## 📊 Monitoring & Analytics

### Firebase Console
- **Analytics**: View user engagement, active users
- **Authentication**: Monitor sign-ins
- **Firestore**: Check database usage
- **Hosting**: View bandwidth and requests

### Access Analytics
```javascript
// Already configured in src/config/firebase.ts
import { analytics } from './config/firebase';
```

---

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: carrompool-94dfd
```

---

## 🎯 Next Steps

1. **Deploy Now**: Follow the deployment steps above
2. **Test Thoroughly**: Use the testing checklist
3. **Share**: Get the app URL and share with users
4. **Monitor**: Check Firebase Console for analytics
5. **Iterate**: Gather feedback and improve

---

## 📞 Support

### Useful Commands
```bash
# Check Firebase project
firebase projects:list

# View current deployments
firebase hosting:sites:list

# Rollback to previous deployment
firebase hosting:rollback

# View logs
firebase functions:log
```

### Useful Links
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

---

## 🎉 Success!

Once deployed, your Carrom Pool PWA will be:
- ✅ Accessible worldwide
- ✅ Installable on all devices
- ✅ Working offline
- ✅ Scalable with Firebase
- ✅ Production-ready

**Enjoy your game! 🎯**
