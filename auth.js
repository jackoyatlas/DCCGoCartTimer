import { auth } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

// --- FORM ELEMENTS ---
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const forgotForm = document.getElementById("forgot-form");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const forgotEmail = document.getElementById("forgot-email");

const loginStatus = document.getElementById("auth-status");
const signupStatus = document.getElementById("signup-status");
const forgotStatus = document.getElementById("forgot-status");

// --- AUTH FUNCTIONS ---
const showForm = form => {
    loginForm.style.display = "none";
    signupForm.style.display = "none";
    forgotForm.style.display = "none";

    form.style.display = "block";
};

const showStatus = (statusEl, msg) => {
    statusEl.textContent = msg;
};

window.login = () => {
    signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value)
        .catch(e => showStatus(loginStatus, e.message));
};

window.signup = () => {
    createUserWithEmailAndPassword(auth, signupEmail.value, signupPassword.value)
        .catch(e => showStatus(signupStatus, e.message));
};

window.forgot = () => {
    sendPasswordResetEmail(auth, forgotEmail.value)
        .then(() => showStatus(forgotStatus, "Password reset email sent"))
        .catch(e => showStatus(forgotStatus, e.message));
};

window.logout = () => signOut(auth);

onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById("app").style.display = "block";
        document.querySelector(".auth-wrapper").style.display = "none";
    } else {
        document.getElementById("app").style.display = "none";
        document.querySelector(".auth-wrapper").style.display = "flex";
        showForm(loginForm);
    }
});

// --- SWITCH FORMS ---
document.getElementById("to-signup").onclick = () => showForm(signupForm);
document.getElementById("to-login").onclick = () => showForm(loginForm);
document.getElementById("forgot-link").onclick = () => showForm(forgotForm);
document.getElementById("back-to-login").onclick = () => showForm(loginForm);

// --- BUTTON EVENTS ---
document.getElementById("login-btn").onclick = login;
document.getElementById("signup-btn").onclick = signup;
document.getElementById("forgot-btn").onclick = forgot;

// --- INITIALIZE ---
showForm(loginForm);