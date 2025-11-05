#!/bin/bash

# Carrom Pool PWA - Quick Deploy Script
# This script builds and deploys the app to Firebase Hosting

set -e

echo "🎯 Carrom Pool PWA - Deployment Script"
echo "======================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI not found!"
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

echo "✅ Firebase CLI found"
echo ""

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null
then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

echo "✅ Logged in to Firebase"
echo ""

# Build the app
echo "🏗️  Building production bundle..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
    echo ""
else
    echo "❌ Build failed!"
    exit 1
fi

# Deploy Firestore rules first
echo "📋 Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo "✅ Firestore configuration deployed"
echo ""

# Deploy to Firebase Hosting
echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "🌐 Your app is live at:"
    echo "   https://carrompool-94dfd.web.app"
    echo "   https://carrompool-94dfd.firebaseapp.com"
    echo ""
    echo "📱 Test the PWA installation on your mobile device!"
    echo ""
else
    echo "❌ Deployment failed!"
    exit 1
fi
