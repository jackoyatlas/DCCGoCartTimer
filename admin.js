// admin.js
// Admin authentication and report generation functionality

import { db, auth } from "./firebase.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const START_TIME = 30 * 60;
const DATE_FORMAT = new Date().toISOString().split('T')[0];

// Format seconds to mm:ss
const formatTime = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

// --- FORM ELEMENTS ---
const authWrapper = document.querySelector(".auth-wrapper");
const adminLoginForm = document.getElementById("admin-login-form");
const adminSignupForm = document.getElementById("admin-signup-form");
const adminForgotForm = document.getElementById("admin-forgot-form");
const adminControls = document.getElementById("admin-controls");

const adminEmail = document.getElementById("admin-email");
const adminPassword = document.getElementById("admin-password");
const adminSignupEmail = document.getElementById("admin-signup-email");
const adminSignupPassword = document.getElementById("admin-signup-password");
const adminForgotEmail = document.getElementById("admin-forgot-email");

const adminAuthStatus = document.getElementById("admin-auth-status");
const adminSignupStatus = document.getElementById("admin-signup-status");
const adminForgotStatus = document.getElementById("admin-forgot-status");

// --- AUTH FUNCTIONS ---
const showForm = form => {
    adminLoginForm.style.display = "none";
    adminSignupForm.style.display = "none";
    adminForgotForm.style.display = "none";
    form.style.display = "block";
};

const showStatus = (statusEl, msg) => {
    statusEl.textContent = msg;
};

window.adminLogin = () => {
    signInWithEmailAndPassword(auth, adminEmail.value, adminPassword.value)
        .catch(e => showStatus(adminAuthStatus, e.message));
};

window.adminSignup = () => {
    createUserWithEmailAndPassword(auth, adminSignupEmail.value, adminSignupPassword.value)
        .catch(e => showStatus(adminSignupStatus, e.message));
};

window.adminForgot = () => {
    sendPasswordResetEmail(auth, adminForgotEmail.value)
        .then(() => showStatus(adminForgotStatus, "Password reset email sent"))
        .catch(e => showStatus(adminForgotStatus, e.message));
};

window.adminLogout = () => signOut(auth);

// Auth state listener
onAuthStateChanged(auth, user => {
    if (user) {
        authWrapper.style.display = "none";
        adminControls.style.display = "block";
    } else {
        authWrapper.style.display = "flex";
        adminControls.style.display = "none";
        showForm(adminLoginForm);
    }
});

// --- SWITCH FORMS ---
document.getElementById("admin-to-signup").onclick = () => showForm(adminSignupForm);
document.getElementById("admin-to-login").onclick = () => showForm(adminLoginForm);
document.getElementById("admin-forgot-link").onclick = () => showForm(adminForgotForm);
document.getElementById("admin-back-to-login").onclick = () => showForm(adminLoginForm);

// --- BUTTON EVENTS ---
document.getElementById("admin-login-btn").onclick = window.adminLogin;
document.getElementById("admin-signup-btn").onclick = window.adminSignup;
document.getElementById("admin-forgot-btn").onclick = window.adminForgot;

// --- REPORT FUNCTIONS ---

// Report display helpers
window.showReport = async () => {
    const data = await getReportData();
    displayReport(data);
};

window.clearReport = () => {
    document.getElementById("report-display").style.display = "none";
    document.getElementById("report-content").innerHTML = "";
};

const displayReport = (data) => {
    const reportContent = document.getElementById("report-content");
    const reportDisplay = document.getElementById("report-display");
    
    // Calculate date range
    let started = null, ended = null;
    const dates = data.map(item => item.created).filter(d => d);
    let dateRange = "All time";
    if (dates.length > 0) {
        dates.sort((a, b) => a - b);
        started = dates[0];
        ended = dates[dates.length - 1];
        const options = { month: 'long', day: 'numeric' };
        dateRange = started.getFullYear() === ended.getFullYear() && started.getMonth() === ended.getMonth()
            ? `${started.toLocaleDateString(undefined, options)}-${ended.getDate()}, ${ended.getFullYear()}`
            : `${started.toLocaleDateString(undefined, options)} - ${ended.toLocaleDateString(undefined, options)}, ${ended.getFullYear()}`;
    }
    
    let html = `<p><strong>Date Range:</strong> ${dateRange}</p>`;
    html += `<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>`;
    
    if (data.length === 0) {
        html += `<p>No carts found for the selected date range.</p>`;
    } else {
        html += `<p><strong>Total Carts:</strong> ${data.length}</p>`;
        html += `<table class="report-table"><thead><tr><th>Cart ID</th><th>Name</th><th>Description</th><th>Starting Time</th><th>Added Time</th><th>Current Time</th></tr></thead><tbody>`;
        data.forEach(item => {
            const addedTime = item.created ? item.created.toLocaleString() : "N/A";
            html += `<tr><td>${item.id}</td><td>${item.name}</td><td>${item.desc || "N/A"}</td><td>30:00</td><td>${addedTime}</td><td>${item.time}</td></tr>`;
        });
        html += `</tbody></table>`;
    }
    
    reportContent.innerHTML = html;
    reportDisplay.style.display = "block";
    
    // Store data for download
    window.currentReportData = data;
};

// Get formatted report data from Firebase
const getReportData = async () => {
    if (!auth.currentUser) return [];
    // Get date range from UI
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    let startDate = startInput && startInput.value ? new Date(startInput.value) : null;
    let endDate = endInput && endInput.value ? new Date(endInput.value) : null;
    if (endDate) endDate.setHours(23,59,59,999); // include full end day
    try {
        const snap = await getDocs(collection(db, "users", auth.currentUser.uid, "carts"));
        const data = [];
        snap.forEach(docData => {
            const d = docData.data();
            const created = d.created ? new Date(d.created) : null;
            // Filter by date range if set
            if (created && startDate && created < startDate) return;
            if (created && endDate && created > endDate) return;
            data.push({
                id: docData.id,
                name: d.name,
                desc: d.desc || "",
                seconds: d.seconds,
                time: formatTime(d.seconds),
                created
            });
        });
        return data.filter(item => item.name);
    } catch (e) {
        console.error("Error loading carts for report:", e.message);
        return [];
    }
};

// Generate report (text file)
window.generateReport = async () => {
    const data = await getReportData();
    let report = "GO CART COUNTDOWN REPORT\n========================\n";
    // Calculate started and ended date range
    let started = null, ended = null;
    const dates = data.map(item => item.created).filter(d => d);
    if (dates.length > 0) {
        dates.sort((a, b) => a - b);
        started = dates[0];
        ended = dates[dates.length - 1];
        const options = { month: 'long', day: 'numeric' };
        let range = started.getFullYear() === ended.getFullYear() && started.getMonth() === ended.getMonth()
            ? `${started.toLocaleDateString(undefined, options)}-${ended.getDate()}, ${ended.getFullYear()}`
            : `${started.toLocaleDateString(undefined, options)} - ${ended.toLocaleDateString(undefined, options)}, ${ended.getFullYear()}`;
        report += `Date Range: ${range}\n`;
    }
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    if (data.length === 0) {
        report += "No carts found.\n";
    } else {
        report += `Total Carts: ${data.length}\n\n`;
        data.forEach(item => {
            const addedTime = item.created ? item.created.toLocaleString() : "N/A";
            report += `Cart ID: ${item.id}\nName: ${item.name}\nDescription: ${item.desc || "N/A"}\nStarting Time: 30:00\nAdded Time: ${addedTime}\nCurrent Time: ${formatTime(item.seconds)}\n---\n`;
        });
    }
    const element = document.createElement("a");
    element.href = "data:text/plain;charset=utf-8," + encodeURIComponent(report);
    element.download = `cart-report-${DATE_FORMAT}.txt`;
    element.click();

    // Save report to Firebase as plain text
    saveReportToFirebase("text", report);
};

// Export as PDF
window.exportPDF = async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = window.currentReportData || await getReportData();
    let yPosition = 10;
    doc.setFontSize(16);
    doc.text("GO CART COUNTDOWN REPORT", 10, yPosition);
    yPosition += 10;
    // Calculate started and ended date range
    let started = null, ended = null;
    const dates = data.map(item => item.created).filter(d => d);
    if (dates.length > 0) {
        dates.sort((a, b) => a - b);
        started = dates[0];
        ended = dates[dates.length - 1];
        const options = { month: 'long', day: 'numeric' };
        let range = started.getFullYear() === ended.getFullYear() && started.getMonth() === ended.getMonth()
            ? `${started.toLocaleDateString(undefined, options)}-${ended.getDate()}, ${ended.getFullYear()}`
            : `${started.toLocaleDateString(undefined, options)} - ${ended.toLocaleDateString(undefined, options)}, ${ended.getFullYear()}`;
        doc.text(`Date Range: ${range}`, 10, yPosition);
        yPosition += 10;
    }
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 10, yPosition);
    yPosition += 10;
    if (data.length === 0) {
        doc.text("No carts found.", 10, yPosition);
    } else {
        doc.text(`Total Carts: ${data.length}`, 10, yPosition);
        yPosition += 10;
        data.forEach(item => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 10;
            }
            const addedTime = item.created ? item.created.toLocaleString() : "N/A";
            doc.text(`Cart ID: ${item.id}`, 10, yPosition);
            yPosition += 6;
            doc.text(`Name: ${item.name}`, 10, yPosition);
            yPosition += 6;
            doc.text(`Description: ${item.desc || "N/A"}`, 10, yPosition);
            yPosition += 6;
            doc.text(`Starting Time: 30:00`, 10, yPosition);
            yPosition += 6;
            doc.text(`Added Time: ${addedTime}`, 10, yPosition);
            yPosition += 6;
            doc.text(`Current Time: ${item.time}`, 10, yPosition);
            yPosition += 8;
        });
    }
    doc.save(`cart-report-${DATE_FORMAT}.pdf`);

    // Save report to Firebase as structured JSON
    saveReportToFirebase("pdf", data);
};

// Export as Excel
window.exportExcel = async () => {
    const header = ["Cart ID", "Name", "Description", "Starting Time", "Added Time", "Current Time", "Seconds", "Created Date"];
    const cartData = window.currentReportData || await getReportData();
    // Calculate started and ended date range
    let started = null, ended = null;
    const dates = cartData.map(item => item.created).filter(d => d);
    if (dates.length > 0) {
        dates.sort((a, b) => a - b);
        started = dates[0];
        ended = dates[dates.length - 1];
        const options = { month: 'long', day: 'numeric' };
        let range = started.getFullYear() === ended.getFullYear() && started.getMonth() === ended.getMonth()
            ? `${started.toLocaleDateString(undefined, options)}-${ended.getDate()}, ${ended.getFullYear()}`
            : `${started.toLocaleDateString(undefined, options)} - ${ended.toLocaleDateString(undefined, options)}, ${ended.getFullYear()}`;
        // Optionally, you can add this range to the Excel sheet as a header row
        header.push(`Date Range: ${range}`);
    }
    const data = [header];
    cartData.forEach(item => {
        const addedTime = item.created ? item.created.toLocaleString() : "N/A";
        data.push([
            item.id,
            item.name,
            item.desc || "",
            "30:00",
            addedTime,
            item.time,
            item.seconds,
            item.created ? item.created.toLocaleDateString() : ""
        ]);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Carts");
    worksheet['!cols'] = [
        { wch: 8 },  // Cart ID
        { wch: 15 }, // Name
        { wch: 25 }, // Description
        { wch: 12 }, // Starting Time
        { wch: 18 }, // Added Time
        { wch: 12 }, // Current Time
        { wch: 10 }, // Seconds
        { wch: 14 }  // Created Date
    ];
    XLSX.writeFile(workbook, `cart-report-${DATE_FORMAT}.xlsx`);

    // Save report to Firebase as structured JSON
    saveReportToFirebase("excel", cartData);
};

// Save generated report to Firebase
const saveReportToFirebase = async (type, reportData) => {
    if (!auth.currentUser) return;
    try {
        await addDoc(collection(db, "users", auth.currentUser.uid, "reports"), {
            type,
            generated: new Date().toISOString(),
            data: reportData
        });
    } catch (e) {
        console.error("Error saving report:", e.message);
    }
};
