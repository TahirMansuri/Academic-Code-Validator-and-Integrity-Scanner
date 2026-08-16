// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqWTCYw3JirMa8_1XgNwT2qcOHa7FUpxc",
  authDomain: "proctor-test-mcq.firebaseapp.com",
  projectId: "proctor-test-mcq",
  storageBucket: "proctor-test-mcq.firebasestorage.app",
  messagingSenderId: "273728180770",
  appId: "1:273728180770:web:6af8de90d60f1633e6f07b",
  measurementId: "G-F1SXJ6RZFJ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
