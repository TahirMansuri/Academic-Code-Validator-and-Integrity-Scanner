# Features & Future Roadmap

This document outlines all the features currently implemented in the **Anti-Cheat Proctored MCQ Platform**, as well as planned future enhancements.

## ✅ Completed Features

### 1. Security & Proctoring Engine
- **Fullscreen & Webcam**: Enforces fullscreen mode and requires active webcam access (with floating recording bubble).
- **Tab & Window Tracking**: Detects if a student switches tabs or minimizes the window.
- **Screenshot Prevention**: Blocks right-click and common shortcuts. Intercepts `PrintScreen`.
- **Three-Strike Rule**: Warns the student of violations. On the 3rd strike, the test auto-submits.

### 2. Student Interface (LMS)
- **Dynamic Test Selection**: Students select their Class (e.g., SYBCA) and Subject before testing via styled Glassmorphism dropdowns.
- **Question Navigator & Locking**: A grid allows jumping between questions. Skipped questions turn grey, answered questions lock in and turn green.

### 3. Admin Dashboard & Cloud DB
- **Secure Authentication**: Firebase Email/Password login.
- **Mobile Responsive**: Off-canvas sliding sidebar menu, hamburger toggle, and horizontally scrollable data tables for mobile screens.
- **Analytics & Leaderboards**: Real-time stats showing Total Tests, Pass Rates, and Top 3 students per class.
- **Subject & Question Managers**: Full CRUD (Create, Read, Update, Delete) interface for managing subjects and linking dynamic questions directly to the Firestore cloud database.

---

## 🚀 Future Enhancements (Roadmap)

### 1. Advanced Proctoring
- **Strict Timer Enforcement**: Auto-submit the test when a countdown timer reaches `00:00`.
- **Cloud Video Recording**: Capture 5-second video snippets of the webcam feed at the exact moment a cheating violation occurs, uploading it to Firebase Storage.
- **AI Eye Tracking**: Integrate a lightweight TensorFlow.js model to detect if the student is constantly looking off-screen.

### 2. Test Configuration
- **Randomization**: Shuffle the order of questions and multiple-choice options dynamically so no two student screens are exactly alike.
