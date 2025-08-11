# Firestore Security Rules (Starter)

Use the following rules to scope data per account and block unauthenticated access.

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    // User profile and settings
    match /users/{userId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;

      // Products nested under a user
      match /products/{productId} {
        allow read, write: if isSignedIn() && request.auth.uid == userId;
      }
    }
  }
}

Deployment (from Firebase CLI):
1. firebase login
2. firebase init firestore  # if not initialized
3. Replace firestore.rules with the above
4. firebase deploy --only firestore
