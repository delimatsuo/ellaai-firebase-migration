#!/bin/bash

# Firebase Authentication Initialization Script
# This script initializes Firebase Authentication with email/password provider

PROJECT_ID="ellaai-platform-prod"

echo "🔧 Initializing Firebase Authentication for $PROJECT_ID"

# Set the active project
echo "Setting active project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable identitytoolkit.googleapis.com
gcloud services enable firebase.googleapis.com
gcloud services enable firebaseauth.googleapis.com

# Initialize Firebase Auth config via REST API
echo "Configuring Firebase Authentication..."
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Create the authentication configuration
curl -X PATCH \
  "https://identitytoolkit.googleapis.com/v1/projects/$PROJECT_ID/config" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Goog-User-Project: $PROJECT_ID" \
  -d '{
    "signInConfig": {
      "signInOptions": [
        {
          "provider": "password",
          "enabled": true
        }
      ]
    }
  }'

echo ""
echo "✅ Firebase Authentication initialization complete!"
echo "You can now create users with email/password authentication."