import { db } from "./firebase.js";
import { collection, getDocs, updateDoc, doc, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Function to fetch all users (for debugging)
async function fetchAllUsers() {
    try {
        console.log("Fetching all users from Firestore...");
        const q = collection(db, "users");
        const querySnapshot = await getDocs(q);
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        console.log("All users in database:", users);
        return users;
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
}

// Function to fetch pending users
async function fetchPendingUsers() {
    try {
        const q = query(collection(db, "users"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    } catch (error) {
        console.error("Error fetching pending users:", error);
        return [];
    }
}

// Function to approve a user
async function approveUser(userId) {
    try {
        await updateDoc(doc(db, "users", userId), {
            status: "approved"
        });
        alert("User approved successfully!");
        loadPendingUsers(); // Reload the list
    } catch (error) {
        console.error("Error approving user:", error);
        alert("Error approving user.");
    }
}

// Function to decline a user
async function declineUser(userId) {
    try {
        await updateDoc(doc(db, "users", userId), {
            status: "declined"
        });
        alert("User declined successfully!");
        loadPendingUsers(); // Reload the list
    } catch (error) {
        console.error("Error declining user:", error);
        alert("Error declining user.");
    }
}

// Function to remove a user
async function removeUser(userId) {
    try {
        await deleteDoc(doc(db, "users", userId));
        alert("User removed successfully!");
        loadAllUsers(); // Reload the list
    } catch (error) {
        console.error("Error removing user:", error);
        alert("Error removing user.");
    }
}



// Function to load and display all users (for debugging)
async function loadAllUsers() {
    console.log("Loading all users...");
    const users = await fetchAllUsers();
    console.log("Fetched users:", users);
    const userList = document.getElementById("pending-users-list");
    userList.innerHTML = "";
    if (users.length === 0) {
        userList.innerHTML = "<p>No users found.</p>";
        console.log("No users found");
        return;
    }
    console.log(`Displaying ${users.length} users`);
    users.forEach(user => {
        console.log("User:", user);
        const userDiv = document.createElement("div");
        userDiv.className = "pending-user";
        const statusText = user.status ? ` (${user.status})` : "";
        const approveButton = user.status === "pending" ? `<button onclick="approveUser('${user.id}')">Approve</button>` : "";
        const declineButton = user.status === "pending" ? `<button class="decline-btn" onclick="declineUser('${user.id}')">Decline</button>` : "";
        const removeButton = `<button onclick="removeUser('${user.id}')">Remove</button>`;
        userDiv.innerHTML = `
            <span>${user.email || user.displayName || user.id}${statusText}</span>
            ${approveButton}
            ${declineButton}
            ${removeButton}
        `;
        userList.appendChild(userDiv);
    });
}

// Function to load and display pending users
async function loadPendingUsers() {
    console.log("Loading pending users...");
    const users = await fetchPendingUsers();
    console.log("Fetched users:", users);
    const userList = document.getElementById("pending-users-list");
    userList.innerHTML = "";
    if (users.length === 0) {
        userList.innerHTML = "<p>No pending users.</p>";
        console.log("No pending users found");
        return;
    }
    console.log(`Displaying ${users.length} pending users`);
    users.forEach(user => {
        console.log("User:", user);
        const userDiv = document.createElement("div");
        userDiv.className = "pending-user";
        userDiv.innerHTML = `
            <span>${user.email || user.displayName || user.id}</span>
            <button onclick="approveUser('${user.id}')">Approve</button>
            <button class="decline-btn" onclick="declineUser('${user.id}')">Decline</button>
        `;
        userList.appendChild(userDiv);
    });
}

// Function to generate and show report
async function showReport() {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }

    try {
        // Assuming there's a "timers" collection with fields like cartName, time, createdAt, etc.
        const startTimestamp = new Date(startDate);
        const endTimestamp = new Date(endDate);
        endTimestamp.setHours(23, 59, 59, 999); // Set to end of day
        const q = query(collection(db, "timers"), where("createdAt", ">=", startTimestamp), where("createdAt", "<=", endTimestamp));
        const querySnapshot = await getDocs(q);
        const timers = [];
        querySnapshot.forEach((doc) => {
            timers.push({ id: doc.id, ...doc.data() });
        });

        // Generate report content
        const reportContent = generateReportContent(timers, startDate, endDate);
        document.getElementById("report-content").innerHTML = reportContent;
        document.getElementById("report-display").style.display = "block";
    } catch (error) {
        console.error("Error generating report:", error);
        alert("Error generating report.");
    }
}

// Function to generate HTML content for the report
function generateReportContent(timers, startDate, endDate) {
    if (timers.length === 0) {
        return "<p>No timer data found for the selected date range.</p>";
    }

    let html = `
        <h3>Report from ${startDate} to ${endDate}</h3>
        <p>Total Timers: ${timers.length}</p>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Cart Name</th>
                    <th>Time</th>
                    <th>Date Created</th>
                </tr>
            </thead>
            <tbody>
    `;

    timers.forEach(timer => {
        const date = timer.createdAt ? new Date(timer.createdAt.seconds * 1000).toLocaleDateString() : "N/A";
        html += `
            <tr>
                <td>${timer.cartName || "N/A"}</td>
                <td>${timer.time || "N/A"}</td>
                <td>${date}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    return html;
}

// Function to export report as PDF
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    doc.text(`Go Cart Timer Report - ${startDate} to ${endDate}`, 20, 20);

    // Get table data
    const table = document.querySelector("#report-content table");
    if (table) {
        const rows = table.querySelectorAll("tr");
        let y = 40;
        rows.forEach(row => {
            const cells = row.querySelectorAll("td, th");
            let x = 20;
            cells.forEach(cell => {
                doc.text(cell.textContent, x, y);
                x += 50;
            });
            y += 10;
        });
    }

    doc.save(`go-cart-report-${startDate}-to-${endDate}.pdf`);
}

// Function to export report as Excel
function exportExcel() {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    // Get table data
    const table = document.querySelector("#report-content table");
    if (!table) {
        alert("No report data to export.");
        return;
    }

    const data = [];
    const rows = table.querySelectorAll("tr");
    rows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll("td, th");
        cells.forEach(cell => {
            rowData.push(cell.textContent);
        });
        data.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `go-cart-report-${startDate}-to-${endDate}.xlsx`);
}

// Function to clear the report
function clearReport() {
    document.getElementById("report-display").style.display = "none";
    document.getElementById("report-content").innerHTML = "";
    document.getElementById("start-date").value = "";
    document.getElementById("end-date").value = "";
}

// Function to load and display chart
async function loadChart(period = 'daily') {
    try {
        console.log(`Loading chart data for ${period}...`);
        const q = collection(db, "timers");
        const querySnapshot = await getDocs(q);
        const timers = [];
        querySnapshot.forEach((doc) => {
            timers.push({ id: doc.id, ...doc.data() });
        });

        let startDate, groupBy, labelFormat, chartLabel;

        switch (period) {
            case 'daily':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                groupBy = 'day';
                labelFormat = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                chartLabel = 'Daily Total Time (seconds)';
                break;
            case 'weekly':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 90); // 12 weeks
                groupBy = 'week';
                labelFormat = (date) => `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                chartLabel = 'Weekly Total Time (seconds)';
                break;
            case 'monthly':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 12); // 12 months
                groupBy = 'month';
                labelFormat = (date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                chartLabel = 'Monthly Total Time (seconds)';
                break;
            default:
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                groupBy = 'day';
                labelFormat = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                chartLabel = 'Daily Total Time (seconds)';
        }

        // Process data for chart
        const totals = {};

        timers.forEach(timer => {
            if (timer.createdAt && timer.createdAt.seconds) {
                const date = new Date(timer.createdAt.seconds * 1000);
                if (date >= startDate) {
                    let key;
                    if (groupBy === 'day') {
                        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
                    } else if (groupBy === 'week') {
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
                        key = weekStart.toISOString().split('T')[0];
                    } else if (groupBy === 'month') {
                        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
                    }
                    const time = parseFloat(timer.time) || 0;
                    totals[key] = (totals[key] || 0) + time;
                }
            }
        });

        // Sort keys and prepare data
        const sortedKeys = Object.keys(totals).sort();
        const labels = sortedKeys.map(key => {
            const date = new Date(key + (groupBy === 'month' ? '-01' : ''));
            return labelFormat(date);
        });
        const data = sortedKeys.map(key => totals[key]);

        // Destroy existing chart if it exists
        const existingChart = Chart.getChart('timerChart');
        if (existingChart) {
            existingChart.destroy();
        }

        // Create chart
        const ctx = document.getElementById('timerChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: chartLabel,
                    data: data,
                    backgroundColor: 'rgba(232, 76, 76, 0.1)',
                    borderColor: 'rgba(232, 76, 76, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(232, 76, 76, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f0f0f0'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#f0f0f0',
                        bodyColor: '#f0f0f0'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#f0f0f0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#f0f0f0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        console.log(`Chart loaded successfully for ${period}`);
    } catch (error) {
        console.error("Error loading chart:", error);
        alert("Error loading chart.");
    }
}

// Make functions global for onclick
window.loadAllUsers = loadAllUsers;
window.approveUser = approveUser;
window.declineUser = declineUser;
window.removeUser = removeUser;
window.showReport = showReport;
window.exportPDF = exportPDF;
window.exportExcel = exportExcel;
window.clearReport = clearReport;
window.loadChart = loadChart;

// Initialize
loadPendingUsers();
