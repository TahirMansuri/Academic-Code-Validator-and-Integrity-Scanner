


// State Variables
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let warnings = 0;
let studentName = "";
let stream = null;
let maxWarnings = 2;
let isTestActive = false;
let isModalOpen = false; // Strictness level: 2 warnings, 3rd is instant fail.

// --- AI Proctoring Engine ---
let aiProctorInterval = null;
let faceDetectionInstance = null;
let aiReady = false;

function initMediaPipe() {
    console.log("Initializing MediaPipe Face Detection...");
    
    try {
        if (typeof FaceDetection === 'undefined') {
            console.error("MediaPipe FaceDetection script not loaded!");
            return;
        }

        faceDetectionInstance = new FaceDetection({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        }});

        faceDetectionInstance.setOptions({
            model: 'short',
            minDetectionConfidence: 0.5
        });

        faceDetectionInstance.onResults(onMediaPipeResults);
        
        console.log("MediaPipe initialized successfully!");
        aiReady = true;
    } catch (e) {
        console.error("Failed to initialize MediaPipe:", e);
    }
}

// Start loading immediately
window.addEventListener('load', initMediaPipe);

function onMediaPipeResults(results) {
    if (!isTestActive || isModalOpen) return;
    
    // Draw bounding box
    const overlay = document.getElementById("overlay-canvas");
    const video = document.getElementById("webcam");
    if (overlay && video && video.videoWidth > 0) {
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;
        const ctx = overlay.getContext("2d");
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        
        if (results.detections && results.detections.length > 0) {
            ctx.strokeStyle = "#ff3b30";
            ctx.lineWidth = 4;
            // Optionally add a subtle background for higher visibility
            ctx.fillStyle = "rgba(255, 59, 48, 0.1)"; 
            
            results.detections.forEach(det => {
                const bbox = det.boundingBox;
                
                // Determine coordinates based on MediaPipe bounding box format
                let x, y, w, h;
                
                if (bbox.xMin !== undefined) {
                    // Face Detection might use xMin, yMin
                    x = bbox.xMin * overlay.width;
                    y = bbox.yMin * overlay.height;
                    w = bbox.width * overlay.width;
                    h = bbox.height * overlay.height;
                } else if (bbox.xCenter !== undefined) {
                    // Face Detection might use xCenter, yCenter
                    x = (bbox.xCenter - bbox.width / 2) * overlay.width;
                    y = (bbox.yCenter - bbox.height / 2) * overlay.height;
                    w = bbox.width * overlay.width;
                    h = bbox.height * overlay.height;
                }
                
                // Add a border radius effect by drawing a path
                if (x !== undefined) {
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.stroke();
                    ctx.fill();
                }
            });
        }
    }
    
    if (!results.detections || results.detections.length === 0) {
        handleCheat("Face Not Detected! Please look at the camera.");
    } else if (results.detections.length > 1) {
        handleCheat("Multiple Faces Detected! You must be alone during the exam.");
    }
}

async function analyzeFrame() {
    if (!isTestActive || isModalOpen) return;
    
    const canvas = document.getElementById("proctor-canvas");
    const video = document.getElementById("webcam");
    if (!video || video.paused || video.ended || video.videoWidth === 0) return;

    try {
        // 1. Lighting Analysis (Brightness)
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let colorSum = 0;
        
        // Sample every 40th value for blazing fast performance
        for (let i = 0; i < data.length; i += 40) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            colorSum += (r * 0.299 + g * 0.587 + b * 0.114);
        }
        
        const averageBrightness = colorSum / (data.length / 40);
        
        if (averageBrightness < 30) {
            handleCheat("Low Light Detected. Please turn on a light so your face is clearly visible.");
            return; // Skip face detection if too dark
        }

        // 2. Face Detection via MediaPipe
        if (aiReady && faceDetectionInstance) {
            await faceDetectionInstance.send({ image: video });
        }
    } catch (e) {
        console.error("Frame analysis error:", e);
    }
}
// ----------------------------


// DOM Elements
const setupScreen = document.getElementById("setup-screen");
const testScreen = document.getElementById("test-screen");
const resultScreen = document.getElementById("result-screen");
const startBtn = document.getElementById("start-btn");
const errorMsg = document.getElementById("setup-error");
const webcam = document.getElementById("webcam");
const displayName = document.getElementById("display-name");
const warningCount = document.getElementById("warning-count");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");

// Anti-Cheat: Disable Right Click & Keyboard Shortcuts
document.addEventListener("contextmenu", event => event.preventDefault());
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "p" || e.key === "x")) {
        e.preventDefault();
    }
});
document.addEventListener("keyup", (e) => {
    if (e.key === "PrintScreen" && isTestActive) {
        // Taking screenshots via PrintScreen button
        navigator.clipboard.writeText("Screenshots are disabled.");
        handleCheat("You attempted to take a screenshot!");
    }
});


// Fetch Subjects based on Class
let activeSubjects = [];
document.getElementById("student-class").addEventListener("change", async (e) => {
    const cls = e.target.value;
    const subjSelect = document.getElementById("student-subject");
    subjSelect.innerHTML = "<option value='' disabled selected>Loading subjects...</option>";
    
    try {
        const snapshot = await db.collection("subjects").where("class", "==", cls).get();
        subjSelect.innerHTML = "<option value='' disabled selected>-- Select Subject --</option>";
        activeSubjects = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            activeSubjects.push({ id: doc.id, name: data.name });
            subjSelect.innerHTML += `<option value="${doc.id}">${data.name}</option>`;
        });
    } catch(e) {
        console.error("Error fetching subjects:", e);
    }
});

// Setup & Initialization
startBtn.addEventListener("click", async () => {
    const classInput = document.getElementById("student-class").value;
    const subjInput = document.getElementById("student-subject").value;
    const idInput = document.getElementById("student-id").value.trim();
    const nameInput = document.getElementById("student-name").value.trim();
    const emailInput = document.getElementById("student-email").value.trim();
    
    if (!classInput || !subjInput || !idInput || !nameInput || !emailInput) {
        errorMsg.textContent = "Please fill out all fields before starting.";
        return;
    }
    
    // 1. Validate Student ID (alphanumeric, hyphens, underscores, length 3-20)
    const idRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!idRegex.test(idInput)) {
        errorMsg.textContent = "Invalid Student ID. Must be 3-20 characters long (letters, numbers, hyphens, underscores).";
        return;
    }

    // 2. Validate Student Name (letters and spaces, length 2-50)
    const nameRegex = /^[a-zA-Z\s.]{2,50}$/;
    if (!nameRegex.test(nameInput)) {
        errorMsg.textContent = "Invalid Name. Please use only letters and spaces (min 2 characters).";
        return;
    }

    // 3. Validate Student Email (standard email format)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
        errorMsg.textContent = "Invalid Email ID. Please enter a valid email address.";
        return;
    }
    
    studentName = nameInput;
    window.studentId = idInput;
    window.studentEmail = emailInput;
    // We can also store the chosen class/subject for saving to FB later
    window.studentClass = classInput;
    window.studentSubjectId = subjInput;
    window.studentSubjectName = activeSubjects.find(s => s.id === subjInput)?.name || "";

    try {
        // Request Camera Permission
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcam.srcObject = stream;
        
        // Request Fullscreen
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        }

        // Load Questions dynamically from Firestore
        const qSnapshot = await db.collection("questions").where("subjectId", "==", subjInput).get();
        questions = [];
        qSnapshot.forEach(doc => questions.push(doc.data()));
        
        if (questions.length === 0) {
            // Fallback for demo purposes if DB is empty
            const response = await fetch("questions.json");
            questions = await response.json();
            window.studentSubjectName = "Python (Demo fallback)";
        }


        // Switch Screen
        setupScreen.classList.remove("active");
        testScreen.classList.add("active");
        displayName.textContent = studentName;
        document.getElementById("avatar-initial").textContent = studentName.charAt(0).toUpperCase();
        
        initNavigator();
        loadQuestion(0);
        
        // Start monitoring cheating
        isTestActive = true;
        startCheatingMonitor();
        // Start AI Proctoring loop
        aiProctorInterval = setInterval(analyzeFrame, 1500);
    } catch (err) {
        console.error(err);
        errorMsg.textContent = "Error: Camera access is required to take the test. Please allow permissions and try again.";
    }
});

// Cheating Monitoring (Tab switching / window blur)
function startCheatingMonitor() {
    window.addEventListener("blur", () => {
        if (isTestActive) handleCheat();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && isTestActive) handleCheat();
    });
    
    // Also monitor fullscreen exit
    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement && isTestActive) {
            handleCheat("Exited Fullscreen!");
        }
    });
}

function handleCheat(reason = "You switched tabs or minimized the window!") {
    if (isModalOpen) return; // Prevent multiple warnings at once
    
    warnings++;
    warningCount.textContent = warnings;
    
    if (warnings > maxWarnings) {
        isModalOpen = true; // Lock it
        document.getElementById("warning-message").textContent = "Maximum violations exceeded. Your test is being automatically submitted with a penalty.";
        document.getElementById("modal-warning-count").textContent = warnings;
        document.getElementById("modal-max-warnings").textContent = maxWarnings;
        document.getElementById("return-exam-btn").style.display = "none";
        document.getElementById("warning-modal").classList.remove("hidden");
        
        setTimeout(() => submitTest(), 3000); // Auto submit after 3 seconds
    } else {
        isModalOpen = true;
        document.getElementById("warning-message").textContent = reason + "\nDo not leave the exam window again.";
        document.getElementById("modal-warning-count").textContent = warnings;
        document.getElementById("modal-max-warnings").textContent = maxWarnings;
        document.getElementById("warning-modal").classList.remove("hidden");
    }
}

document.getElementById("return-exam-btn").addEventListener("click", () => {
    document.getElementById("warning-modal").classList.add("hidden");
    isModalOpen = false;
    
    // Attempt to restore fullscreen
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
});

// Question Logic
let userAnswers = [];

function initNavigator() {
    userAnswers = new Array(questions.length).fill(null);
    const navGrid = document.getElementById("navigator-grid");
    navGrid.innerHTML = "";
    
    questions.forEach((_, index) => {
        const btn = document.createElement("button");
        btn.className = "nav-btn";
        btn.textContent = index + 1;
        btn.id = `nav-btn-${index}`;
        btn.addEventListener("click", () => loadQuestion(index));
        navGrid.appendChild(btn);
    });
}

function loadQuestion(index) {
    currentQuestionIndex = index;
    const q = questions[currentQuestionIndex];
    questionText.textContent = `Q${currentQuestionIndex + 1}: ${q.question}`;
    
    // Highlight active nav button
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(`nav-btn-${index}`).classList.add("active");
    
    optionsContainer.innerHTML = "";
    q.options.forEach(opt => {
        const div = document.createElement("div");
        div.className = "option";
        div.textContent = opt;
        
        // Restore previously selected answer if any
        if (userAnswers[currentQuestionIndex] === opt) {
            div.classList.add("selected");
        }
        if (userAnswers[currentQuestionIndex] !== null) {
            div.classList.add("locked");
        }
        
        div.addEventListener("click", () => selectOption(div, opt));
        optionsContainer.appendChild(div);
    });
    
    // Button visibility
    document.getElementById("prev-btn").classList.toggle("hidden", currentQuestionIndex === 0);
    
    if (currentQuestionIndex === questions.length - 1) {
        document.getElementById("next-btn").classList.add("hidden");
        document.getElementById("skip-btn").classList.add("hidden");
        submitBtn.classList.remove("hidden");
    } else {
        document.getElementById("next-btn").classList.remove("hidden");
        document.getElementById("skip-btn").classList.remove("hidden");
        submitBtn.classList.add("hidden");
    }
    
    // Update progress bar
    const answeredCount = userAnswers.filter(a => a !== null).length;
    const progress = (answeredCount / questions.length) * 100;
    document.getElementById("progress-bar").style.width = progress + "%";
}

function selectOption(element, answer) {
    if (userAnswers[currentQuestionIndex] !== null) {
        return; // Locked! Cannot change answer once selected.
    }
    
    document.querySelectorAll(".option").forEach(el => el.classList.remove("selected"));
    element.classList.add("selected");
    userAnswers[currentQuestionIndex] = answer;
    
    // Mark nav grid button as answered
    document.getElementById(`nav-btn-${currentQuestionIndex}`).classList.remove("passed");
    document.getElementById(`nav-btn-${currentQuestionIndex}`).classList.add("answered");
    
    // Update progress instantly
    const answeredCount = userAnswers.filter(a => a !== null).length;
    const progress = (answeredCount / questions.length) * 100;
    document.getElementById("progress-bar").style.width = progress + "%";
}

document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentQuestionIndex > 0) loadQuestion(currentQuestionIndex - 1);
});

document.getElementById("skip-btn").addEventListener("click", () => {
    // Mark as passed if not answered
    if (userAnswers[currentQuestionIndex] === null) {
        document.getElementById(`nav-btn-${currentQuestionIndex}`).classList.add("passed");
    }
    if (currentQuestionIndex < questions.length - 1) loadQuestion(currentQuestionIndex + 1);
});

document.getElementById("next-btn").addEventListener("click", () => {
    // Mark as passed if not answered
    if (userAnswers[currentQuestionIndex] === null) {
        document.getElementById(`nav-btn-${currentQuestionIndex}`).classList.add("passed");
    }
    if (currentQuestionIndex < questions.length - 1) loadQuestion(currentQuestionIndex + 1);
});

submitBtn.addEventListener("click", () => {
    submitTest();
});

function submitTest() {
    isTestActive = false;
    if (typeof aiProctorInterval !== "undefined" && aiProctorInterval) clearInterval(aiProctorInterval);
    
    // Calculate final score
    score = 0;
    questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.answer) {
            score++;
        }
    });
    
    // Stop camera

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    // Exit fullscreen
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(e => console.log(e));
    }
    
    // Switch to result screen
    testScreen.classList.remove("active");
    resultScreen.classList.add("active");
    
    document.getElementById("final-score").textContent = score;
    document.getElementById("total-score").textContent = questions.length;
    document.getElementById("final-warnings").textContent = warnings;
    
    saveToFirebase();
}

async function saveToFirebase() {
    const status = document.getElementById("upload-status");
    try {
        await db.collection("test_results").add({
            studentName: studentName,
            class: window.studentClass || "N/A",
            subjectId: window.studentSubjectId || "N/A",
            subjectName: window.studentSubjectName || "N/A",
            score: score,
            totalScore: questions.length,
            warnings: warnings,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Saving to Firebase...", { studentName, score, warnings });
        status.textContent = "Result saved successfully. You may close this tab.";
        status.style.color = "#2ed573";
    } catch (e) {
        console.error("Error adding document: ", e);
        status.textContent = "Failed to save results. Check your internet connection.";
        status.style.color = "#d63031";
    }
}

