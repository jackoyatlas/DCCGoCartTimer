import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCIc6Ey_WzWYcjTdHGgSZli7iHotB65Em0",
  authDomain: "go-cart-timer-5389e.firebaseapp.com",
  projectId: "go-cart-timer-5389e",
  storageBucket: "go-cart-timer-5389e.firebasestorage.app",
  messagingSenderId: "808226367337",
  appId: "1:808226367337:web:37cf12a25dd81fdacf7ff8"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);