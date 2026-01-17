import { db, auth } from "./firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

let cartId = 0;
const carts = {};
const START_TIME = 30 * 60;
const DATE_FORMAT = new Date().toISOString().split('T')[0];

// Format seconds to mm:ss
const formatTime = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

// Helper to get cart element
const getCartElement = id => document.getElementById(`cart-${id}`);

// Helper to get cart data from DOM
const getCartData = id => {
    const el = getCartElement(id);
    if (!el) return null;
    return {
        name: el.querySelector("h3.cart-name").textContent,
        desc: el.querySelector("textarea").value,
        seconds: carts[id].seconds
    };
};

// Helper to create cart HTML
const createCartHTML = (id, name = `Cart ${id}`, desc = "", time = "30:00") => `
    <h3 class="cart-name">${name}</h3>
    <textarea placeholder="Description...">${desc}</textarea>
    <div class="time" id="display-${id}">${time}</div>
    <button class="start" onclick="startCart(${id})">Start</button>
    <button class="pause" onclick="pauseCart(${id})">Pause</button>
    <button class="reset" onclick="resetCart(${id})">Reset</button>
    <button class="delete" onclick="deleteCart(${id})">Delete</button>
`;

// Helper to create and append cart to DOM
const createCartElement = (id, name, desc, time) => {
    const div = document.createElement("div");
    div.className = "timer";
    div.id = `cart-${id}`;
    div.innerHTML = createCartHTML(id, name, desc, time);
    document.getElementById("timers").appendChild(div);
};

// Add new cart
window.addCart = async () => {
    const name = prompt("Enter cart name:");
    if (!name || name.trim() === "") return; // Cancel if empty
    
    cartId++;
    const created = new Date().toISOString();
    carts[cartId] = { seconds: START_TIME, interval: null, created, name: name.trim() };
    createCartElement(cartId, name.trim());
    await saveCart(cartId, created);
};

// Start timer
window.startCart = id => {
    const cart = carts[id];
    if (!cart || cart.interval || cart.seconds <= 0) return;
    cart.interval = setInterval(() => {
        cart.seconds--;
        const display = document.getElementById(`display-${id}`);
        display.textContent = formatTime(cart.seconds);
        if (cart.seconds <= 0) {
            clearInterval(cart.interval);
            cart.interval = null;
            display.classList.add("expired");
        }
    }, 1000);
};

// Pause timer
window.pauseCart = id => {
    const cart = carts[id];
    if (!cart) return;
    clearInterval(cart.interval);
    cart.interval = null;
};

// Reset timer
window.resetCart = id => {
    pauseCart(id);
    carts[id].seconds = START_TIME;
    const display = document.getElementById(`display-${id}`);
    display.textContent = formatTime(START_TIME);
    display.classList.remove("expired");
};

// Delete cart
window.deleteCart = id => {
    pauseCart(id);
    delete carts[id];
    getCartElement(id)?.remove();
};

// Save cart to Firebase
window.saveCart = async id => {
    const data = getCartData(id);
    if (!data) return;
    // Attach created timestamp if provided
    let created = carts[id]?.created;
    if (!created) created = new Date().toISOString();
    try {
        await addDoc(collection(db, "users", auth.currentUser.uid, "carts"), {
            ...data,
            created
        });
    } catch (e) {
        console.error("Error saving cart:", e.message);
    }
};

// Load carts on auth
onAuthStateChanged(auth, async user => {
    if (!user) return;
    // Do not load/display already saved carts

});