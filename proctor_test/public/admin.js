
// State
let subjectsList = [];
let editingSubjectId = null;
let editingQuestionId = null;

// DOM Elements
const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");

// Navigation

// Sidebar Toggle
document.querySelectorAll(".menu-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".sidebar").classList.toggle("open");
    });
});

// Close sidebar on mobile when a nav item is clicked
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
        if (window.innerWidth <= 768) {
            document.querySelector(".sidebar").classList.remove("open");
        }

        document.querySelectorAll(".nav-item").forEach(nav => nav.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
        
        e.currentTarget.classList.add("active");
        const tabId = e.currentTarget.getAttribute("data-tab");
        document.getElementById(tabId).classList.add("active");
    });
});

// Authentication
document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("admin-email").value;
    const pwd = document.getElementById("admin-password").value;
    const err = document.getElementById("login-error");
    err.textContent = "Authenticating...";
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, pwd);
        // Auth state observer handles the screen switch
    } catch (error) {
        err.textContent = "Login Failed: " + error.message;
    }
});

document.getElementById("logout-btn").addEventListener("click", () => {
    firebase.auth().signOut();
});

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loginScreen.classList.remove("active");
        dashboardScreen.classList.add("active");
        loadSubjects();
        loadQuestions();
        loadDashboard();
    } else {
        loginScreen.classList.add("active");
        dashboardScreen.classList.remove("active");
    }
});

// Subjects Management
async function loadSubjects() {
    const snapshot = await db.collection("subjects").get();
    const tbody = document.getElementById("subjects-table-body");
    const qSelect = document.getElementById("q-subject-select");
    const filterSelect = document.getElementById("q-table-filter");
    
    tbody.innerHTML = "";
    qSelect.innerHTML = "<option value='' disabled selected>Select Subject</option>";
    filterSelect.innerHTML = "<option value='ALL'>All Subjects</option>";
    subjectsList = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        subjectsList.push({ id: doc.id, ...data });
        
        // Table
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${data.class}</td><td>${data.name}</td><td><div style='display: flex; gap: 8px;'><button class='btn edit-btn' onclick='editSubject("${doc.id}", "${data.class}", "${data.name.replace(/'/g, "\\'")}")'>Edit</button><button class='btn danger-btn' onclick='deleteSubject("${doc.id}")'>Delete</button></div></td>`;
        tbody.appendChild(tr);
        
        // Dropdowns
        const opt = `<option value="${doc.id}">${data.class} - ${data.name}</option>`;
        qSelect.innerHTML += opt;
        filterSelect.innerHTML += opt;
    });
}

document.getElementById("add-subject-btn").addEventListener("click", async () => {
    const cls = document.getElementById("new-sub-class").value;
    const name = document.getElementById("new-sub-name").value;
    if(!name) return alert("Enter subject name");
    
    if (editingSubjectId) {
        await db.collection("subjects").doc(editingSubjectId).update({ class: cls, name: name });
        editingSubjectId = null;
        document.getElementById("add-subject-btn").textContent = "Add Subject";
    } else {
        await db.collection("subjects").add({ class: cls, name: name });
    }
    document.getElementById("new-sub-name").value = "";
    loadSubjects();
});

window.editSubject = (id, cls, name) => {
    editingSubjectId = id;
    document.getElementById("new-sub-class").value = cls;
    document.getElementById("new-sub-name").value = name;
    document.getElementById("add-subject-btn").textContent = "Update Subject";
    // Scroll up
    document.getElementById("tab-subjects").scrollIntoView();
}

window.deleteSubject = async (id) => {
    if(confirm("Delete this subject?")) {
        await db.collection("subjects").doc(id).delete();
        loadSubjects();
    }
}

// Question Management
async function loadQuestions() {
    const filter = document.getElementById("q-table-filter").value;
    let query = db.collection("questions");
    if (filter !== "ALL") query = query.where("subjectId", "==", filter);
    
    const snapshot = await query.get();
    const tbody = document.getElementById("questions-table-body");
    tbody.innerHTML = "";
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const tr = document.createElement("tr");
        
        const safeQ = data.question.replace(/'/g, "\\'");
        const safeAns = data.answer.replace(/'/g, "\\'");
        const safeOpts = data.options.map(o => o.replace(/'/g, "\\'"));
        tr.innerHTML = `<td>${data.question}</td><td>${data.answer}</td>
        <td>
            <div style='display: flex; gap: 8px;'>
            <button class='btn edit-btn' onclick='editQuestion("${doc.id}", "${data.subjectId}", "${safeQ}", "${safeAns}", ${JSON.stringify(safeOpts)})'>Edit</button>
            <button class='btn danger-btn' onclick='deleteQuestion("${doc.id}")'>Delete</button>
            </div>
        </td>`;

        tbody.appendChild(tr);
    });
}
document.getElementById("q-table-filter").addEventListener("change", loadQuestions);

document.getElementById("add-question-btn").addEventListener("click", async () => {
    const subjectId = document.getElementById("q-subject-select").value;
    const qText = document.getElementById("q-text").value;
    const opt1 = document.getElementById("q-opt1").value;
    const opt2 = document.getElementById("q-opt2").value;
    const opt3 = document.getElementById("q-opt3").value;
    const opt4 = document.getElementById("q-opt4").value;
    const answer = document.getElementById("q-answer").value;
    
    if(!subjectId || !qText || !opt1 || !opt2 || !opt3 || !opt4 || !answer) {
        return alert("Please fill all fields");
    }
    
    const options = [opt1, opt2, opt3, opt4];
    if(!options.includes(answer)) return alert("Answer must exactly match one of the options");
    
    const payload = { subjectId, question: qText, options, answer };
    
    if (editingQuestionId) {
        await db.collection("questions").doc(editingQuestionId).update(payload);
        alert("Question updated!");
        editingQuestionId = null;
        document.getElementById("add-question-btn").textContent = "Save Question";
    } else {
        await db.collection("questions").add(payload);
        alert("Question added!");
    }
    
    document.getElementById("q-text").value = "";
    document.getElementById("q-opt1").value = "";
    document.getElementById("q-opt2").value = "";
    document.getElementById("q-opt3").value = "";
    document.getElementById("q-opt4").value = "";
    document.getElementById("q-answer").value = "";
    loadQuestions();
});

window.editQuestion = (id, subId, qText, answer, opts) => {
    editingQuestionId = id;
    document.getElementById("q-subject-select").value = subId;
    document.getElementById("q-text").value = qText;
    document.getElementById("q-opt1").value = opts[0];
    document.getElementById("q-opt2").value = opts[1];
    document.getElementById("q-opt3").value = opts[2];
    document.getElementById("q-opt4").value = opts[3];
    document.getElementById("q-answer").value = answer;
    
    document.getElementById("add-question-btn").textContent = "Update Question";
    document.getElementById("tab-questions").scrollIntoView();
}

window.deleteQuestion = async (id) => {
    if(confirm("Delete this question?")) {
        await db.collection("questions").doc(id).delete();
        loadQuestions();
    }
}

// Dashboard Analytics
document.getElementById("dash-class-filter").addEventListener("change", loadDashboard);

async function loadDashboard() {
    const filter = document.getElementById("dash-class-filter").value;
    let query = db.collection("test_results");
    if (filter !== "ALL") query = query.where("class", "==", filter);
    
    const snapshot = await query.get();
    
    let totalTests = 0;
    let totalScorePerc = 0;
    let passedCount = 0;
    let students = [];
    
    const tbody = document.getElementById("recent-tests-body");
    tbody.innerHTML = "";
    
    snapshot.forEach(doc => {
        const data = doc.data();
        totalTests++;
        
        const perc = (data.score / data.totalScore) * 100;
        totalScorePerc += perc;
        if (perc >= 40) passedCount++;
        
        students.push(data);
        
        const tr = document.createElement("tr");
        const date = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : "N/A";
        tr.innerHTML = `<td>${data.studentName}</td><td>${data.class || "-"}</td><td>${data.subjectName || "-"}</td><td>${data.score}/${data.totalScore}</td><td>${data.warnings}</td><td>${date}</td>`;
        tbody.appendChild(tr);
    });
    
    // Update Stats
    document.getElementById("stat-total-tests").textContent = totalTests;
    document.getElementById("stat-avg-score").textContent = totalTests ? Math.round(totalScorePerc / totalTests) + "%" : "0%";
    document.getElementById("stat-pass-rate").textContent = totalTests ? Math.round((passedCount / totalTests) * 100) + "%" : "0%";
    
    // Top 3 Leaderboard
    students.sort((a, b) => b.score - a.score);
    const top3 = students.slice(0, 3);
    const lbContainer = document.getElementById("leaderboard-container");
    lbContainer.innerHTML = "";
    
    top3.forEach((s, idx) => {
        const card = document.createElement("div");
        card.className = `leaderboard-card rank-${idx+1}`;
        card.innerHTML = `
            <div class="rank-badge">Rank ${idx+1}</div>
            <h3>${s.studentName}</h3>
            <p>Score: ${s.score}/${s.totalScore}</p>
        `;
        lbContainer.appendChild(card);
    });
}
