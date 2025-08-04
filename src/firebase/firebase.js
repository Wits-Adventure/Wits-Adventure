// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjatUHRXn-vb8yZS_G2I9qRjr49G0Uqjg",
  authDomain: "bloobase2.firebaseapp.com",
  projectId: "bloobase2",
  storageBucket: "bloobase2.firebasestorage.app",
  messagingSenderId: "911192519911",
  appId: "1:911192519911:web:6a15e3e1773d69fc305e42",
  measurementId: "G-KW51J2YSJR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);