#!/bin/bash

# Add all environment variables to Vercel
echo "AIzaSyDSdftFqUvIjCoRhIqLR0sI9B99R4hQcNU" | vercel env add VITE_FIREBASE_API_KEY production
echo "ellaai-platform-prod.firebaseapp.com" | vercel env add VITE_FIREBASE_AUTH_DOMAIN production
echo "ellaai-platform-prod" | vercel env add VITE_FIREBASE_PROJECT_ID production
echo "ellaai-platform-prod.firebasestorage.app" | vercel env add VITE_FIREBASE_STORAGE_BUCKET production
echo "461280362624" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
echo "1:461280362624:web:883037632b2125776c2665" | vercel env add VITE_FIREBASE_APP_ID production
echo "https://api-dl3telj45a-uc.a.run.app" | vercel env add VITE_API_URL production
echo "6Ldu26orAAAAAP79H7arcyg473Oz_e1AA6Sc71NE" | vercel env add VITE_RECAPTCHA_SITE_KEY production
echo "production" | vercel env add VITE_ENV production
echo "https://api-dl3telj45a-uc.a.run.app" | vercel env add VITE_API_BASE_URL production

echo "Environment variables added successfully!"