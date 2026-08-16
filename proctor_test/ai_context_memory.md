# AI Context Memory

This file serves as the memory state for the "Anti-Cheat Proctored MCQ Platform & LMS". When passing this project to another AI, provide this file to give it full context.

## Project Architecture
- **Directory**: `/proctor_test/`
- **Tech Stack**: HTML5, CSS3 (Glassmorphism), Vanilla JavaScript, Firebase (Firestore & Auth & Hosting).
- **Purpose**: A strict online multiple-choice exam environment with a built-in Learning Management System (LMS) and Admin Dashboard.

## Key Features
### 1. Student Portal (`index.html`)
- **Dynamic Exam Selection**: Students select their Class (FYBCA, SYBCA, TYBCA) and Subject from fully themed Glassmorphism dropdowns.
- **Strict Proctoring**: Enforces fullscreen, requires webcam (recording indicator), tracks tab switches via `window.blur` and `visibilitychange`, blocks right-click/PrintScreen. 3 violations = auto-submit and fail.
- **UI UX**: Question Navigator (Grid to jump to questions), State Locks (passed = grey, answered = green and locked).

### 2. Admin Dashboard (`admin.html`)
- **Authentication**: Secured via Firebase Email/Password Auth.
- **Responsive Layout**: The dashboard is fully mobile-responsive. Features an off-canvas sliding sidebar menu controlled by a hamburger toggle on mobile screens, with horizontally scrollable data tables.
- **Analytics Dashboard**: Tracks Total Tests, Average Score, Pass Rate (>40%), and displays a Top 3 Leaderboard. Supports filtering by class.
- **Subject & Question Managers (Full CRUD)**: 
  - Admins can dynamically Create, Read, Update (Edit), and Delete subjects.
  - Admins can Create, Read, Update (Edit), and Delete multiple-choice questions mapped to those subjects.
- **Firestore DB Structure**: 
  - `subjects` collection: `{ name: "Python", class: "SYBCA" }`
  - `questions` collection: `{ subjectId: "...", question: "...", options: [...], answer: "..." }`
  - `test_results` collection: `{ studentName, class, subjectId, subjectName, score, totalScore, warnings, timestamp }`
