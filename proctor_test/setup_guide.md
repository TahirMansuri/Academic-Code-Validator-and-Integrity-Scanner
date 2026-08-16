# Complete Setup Guide

Follow this guide to set up and run the Proctor Test web application on a brand new laptop or machine.

## Prerequisites
1. Install **Node.js & npm**.
2. Install **Git** to clone the repository.

---

## Setting up the Project

### 1. Clone the Project
```bash
git clone <your-github-repo-url>
cd ClassroomCode-Validator/proctor_test
```

### 2. Install Firebase CLI & Login
```bash
npm install -g firebase-tools
firebase login
```

### 3. Initialize & Deploy
If the project is already linked in your account, simply deploy it to push the latest rules and hosting files:
```bash
firebase deploy
```
*Note: Make sure `firestore.rules` is securely deployed so students can only write test results, and only authenticated admins can edit subjects/questions.*

### 4. Admin Account Setup (Required!)
To log into `/admin.html`, you MUST create your account in the Firebase Console:
1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Open the **Proctor Test** project.
3. On the left menu, click **Build** -> **Authentication**.
4. Click **Get Started**, then click **Email/Password**.
5. Enable the toggle and click **Save**.
6. Go to the **Users** tab (next to Sign-in method) and click **Add User**.
7. Create your admin email (e.g., `admin@college.edu`) and a secure password.
8. Use these credentials to log in to the admin dashboard!
