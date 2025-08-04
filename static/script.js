const scanBtn = document.getElementById("scanBtn");
const messageInput = document.getElementById("messageInput");
const chatWindow = document.getElementById("chatWindow");
const progressBar = document.getElementById("scanProgressBar");
const historyList = document.getElementById("historyList");

const totalScansEl = document.getElementById("totalScans");
const phishingScansEl = document.getElementById("phishingScans");
const safeScansEl = document.getElementById("safeScans");

let totalScans = 0;
let phishingScans = 0;
let safeScans = 0;

// Auto-resize input
messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height = messageInput.scrollHeight + "px";
});

// Ctrl + Enter to scan
messageInput.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") {
    scanMessage();
  }
});

// Sidebar toggle
function toggleSection(id) {
  const sections = document.querySelectorAll(".sidebar-section");
  sections.forEach((sec) => {
    if (sec.id === id) {
      sec.classList.toggle("hidden");
    } else {
      sec.classList.add("hidden");
    }
  });
}

// Append message
function appendMessage(content, sender = "user", isTyping = false) {
  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${sender}`;
  bubble.innerHTML = `
    <div class="bubble-text">${content}</div>
    ${!isTyping ? `<div class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>` : ""}
  `;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Typing effect
function showTypingIndicator() {
  const typing = document.createElement("div");
  typing.id = "typing";
  typing.className = "typing-indicator";
  typing.innerText = "AI is typing...";
  chatWindow.appendChild(typing);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}

// Animate progress bar
function animateProgressBar() {
  progressBar.classList.remove("hidden");
  progressBar.style.width = "0%";
  let width = 0;
  const interval = setInterval(() => {
    if (width >= 100) {
      clearInterval(interval);
    } else {
      width += 10;
      progressBar.style.width = width + "%";
    }
  }, 100);
}

// Run scan
async function scanMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  messageInput.value = "";
  messageInput.style.height = "auto";
  showTypingIndicator();
  animateProgressBar();

  try {
    const res = await fetch("http://192.168.1.7:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    removeTypingIndicator();
    progressBar.classList.add("hidden");

    appendMessage(data.result, "ai");
    saveToHistory(message, data.result);
    updateStats(data.result);
  } catch (error) {
    removeTypingIndicator();
    progressBar.classList.add("hidden");
    appendMessage("❌ Cannot connect to backend.", "ai");
    console.error("Fetch error:", error);
  }
}

// Save to history
function saveToHistory(message, result) {
  const item = document.createElement("li");
  item.innerText = `[${new Date().toLocaleTimeString()}] ${message.slice(0, 30)}...`;
  item.title = result;
  historyList.appendChild(item);
}

// Update stats
function updateStats(result) {
  totalScans++;
  if (result.toLowerCase().includes("phishing")) {
    phishingScans++;
  } else {
    safeScans++;
  }

  totalScansEl.innerText = totalScans;
  phishingScansEl.innerText = phishingScans;
  safeScansEl.innerText = safeScans;
}

// === Quiz Logic ===

const quizData = [
  {
    question: "Which of the following is a sign of a phishing email?",
    options: [
      "An email from a known contact asking for a file",
      "Grammatical errors and suspicious links",
      "A secure website address (https://)",
      "A welcome email from a trusted service"
    ],
    answer: "Grammatical errors and suspicious links"
  },
  {
    question: "Which website is most likely fake?",
    options: [
      "https://secure-paypal.com.login.verify",
      "https://paypal.com/settings",
      "https://accounts.google.com",
      "https://github.com/login"
    ],
    answer: "https://secure-paypal.com.login.verify"
  },
  {
    question: "What should you do before clicking on a suspicious link?",
    options: [
      "Check the URL carefully",
      "Click quickly before it disappears",
      "Open it in incognito mode",
      "Forward to a friend"
    ],
    answer: "Check the URL carefully"
  },
  // Add more as needed...
];

let currentQuestion = 0;

function startQuiz() {
  currentQuestion = 0;
  loadQuestion();
}

let quizTimer;
let timeLimit = 10; // seconds

function startTimer() {
  let timeLeft = timeLimit;
  const quizQuestion = document.getElementById("quizQuestion");
  quizQuestion.innerText += ` (${timeLeft}s)`;

  quizTimer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(quizTimer);
      checkAnswer(null); // auto fail
    } else {
      quizQuestion.innerText = quizData[currentQuestion].question + ` (${timeLeft}s)`;
    }
  }, 1000);
}

function loadQuestion() {
  clearInterval(quizTimer); // Clear any previous
  const question = quizData[currentQuestion];
  const quizQuestion = document.getElementById("quizQuestion");
  const quizOptions = document.getElementById("quizOptions");

  quizQuestion.innerText = question.question;
  quizOptions.innerHTML = "";

  question.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.innerText = option;
    btn.onclick = () => {
      clearInterval(quizTimer);
      checkAnswer(option);
    };
    quizOptions.appendChild(btn);
  });

  startTimer();
}

function checkAnswer(selected) {
  const correct = quizData[currentQuestion].answer;
  const quizQuestion = document.getElementById("quizQuestion");
  const quizOptions = document.getElementById("quizOptions");

  if (selected === correct) {
    quizQuestion.innerText = "✅ Correct!";
  } else if (selected === null) {
    quizQuestion.innerText = `⏰ Time's up! Correct answer: ${correct}`;
  } else {
    quizQuestion.innerText = `❌ Incorrect. Correct answer: ${correct}`;
  }

  setTimeout(() => {
    currentQuestion++;
    if (currentQuestion < quizData.length) {
      loadQuestion();
    } else {
      quizQuestion.innerText = "🎉 Quiz completed!";
      quizOptions.innerHTML = `<button onclick="startQuiz()">Try Again</button>`;
    }
  }, 2000);
}
// === URL Checker ===

function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

function checkURL() {
  const url = document.getElementById("urlInput").value.trim();
  const feedback = document.getElementById("urlFeedback");

  if (!url) {
    feedback.innerHTML = "⚠️ Please enter a URL.";
    return;
  }

  if (!isValidURL(url)) {
    feedback.innerHTML = "❌ Invalid URL format.";
    return;
  }

  // Simulated real-time analysis (replace this with actual backend/API later)
  if (url.includes("free") || url.includes("login") || url.includes("verify") || url.includes("click")) {
    feedback.innerHTML = "⚠️ This URL may be suspicious. Be cautious.";
  } else {
    feedback.innerHTML = "✅ This URL appears to be safe.";
  }
}

// === Smart Feedback System ===

function toggleFeedbackInput() {
  const feedbackInput = document.getElementById("feedbackInput");
  const submitBtn = document.getElementById("submitFeedbackBtn");

  feedbackInput.classList.toggle("hidden");
  submitBtn.classList.toggle("hidden");
}

function submitFeedback() {
  const type = document.getElementById("feedbackType").value;
  const message = document.getElementById("feedbackInput").value.trim();

  if (!message) {
    alert("Please write your feedback before submitting.");
    return;
  }

  console.log("📩 Feedback Submitted:", { type, message });

  alert("✅ Thank you for your feedback!");
  document.getElementById("feedbackInput").value = "";
  toggleFeedbackInput();
}

// === THEME TOGGLE ===
function toggleTheme() {
  const body = document.body;
  const themeSwitch = document.getElementById("themeSwitch");

  // Toggle class on body
  body.classList.toggle("light-mode");

  // Optional: Persist theme (uncomment to use)
  // localStorage.setItem("theme", body.classList.contains("light-mode") ? "light" : "dark");
}

// Optional: Load saved theme on startup (uncomment to use)
/*
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    document.getElementById("themeSwitch").checked = true;
  }
});
*/



// Attach scan button
scanBtn.addEventListener("click", scanMessage);




// === Smooth Scroll for Mouse Wheel ===
let scrollTarget = chatWindow.scrollTop;
let isScrolling = false;

chatWindow.addEventListener("wheel", (e) => {
  e.preventDefault(); // Stop the default instant scroll
  scrollTarget += e.deltaY;
  scrollTarget = Math.max(0, Math.min(scrollTarget, chatWindow.scrollHeight - chatWindow.clientHeight));

  if (!isScrolling) smoothScrollChat();
}, { passive: false });

function smoothScrollChat() {
  isScrolling = true;
  const distance = scrollTarget - chatWindow.scrollTop;
  const step = distance * 0.2;
  chatWindow.scrollTop += step;

  if (Math.abs(step) > 0.5) {
    requestAnimationFrame(smoothScrollChat);
  } else {
    isScrolling = false;
  }
}

/* Tutorial */
function beginTutorial() {
  document.getElementById("introOverlay").style.display = "none";
  startTutorial(); // Call the actual tutorial logic
}


function closeOverlay() {
  document.getElementById("introOverlay").style.display = "none";
}

// Show overlay only once per user (optional)
window.addEventListener("DOMContentLoaded", () => {
  const visited = localStorage.getItem("visitedBefore");
  if (!visited) {
    document.getElementById("introOverlay").style.display = "flex";
    localStorage.setItem("visitedBefore", true);
  }
});


const tutorialPopup = document.getElementById("tutorialPopup");
const tutorialOverlay = document.getElementById("tutorialOverlay");
const tutorialText = document.getElementById("tutorialText");
const highlightBox = document.getElementById("highlightBox");
const stepBox = document.getElementById("tutorialStepBox");

let tutorialSteps = [
  { selector: ".sidebar button:nth-child(1)", text: "📁 Scan History shows your past scans." },
  { selector: ".sidebar button:nth-child(2)", text: "📊 Stats Dashboard tracks your activity." },
  { selector: ".sidebar button:nth-child(3)", text: "🧠 Training Quiz helps you learn anti-phishing." },
  { selector: ".sidebar button:nth-child(4)", text: "🔗 URL Checker lets you check suspicious links." },
  { selector: ".sidebar button:nth-child(5)", text: "💬 Feedback lets you send your thoughts." },
  { selector: ".input-area", text: "This is where you type your message and scan it!" }
];

let currentStep = 0;

function startTutorial() {
  tutorialPopup.classList.add("hidden");
  tutorialOverlay.classList.remove("hidden");
  showStep(currentStep);
}

function skipTutorial() {
  tutorialPopup.classList.add("hidden");
  localStorage.setItem("tutorialSeen", "true");
}

function showStep(index) {
  const step = tutorialSteps[index];
  const target = document.querySelector(step.selector);
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  highlightBox.style.top = rect.top + "px";
  highlightBox.style.left = rect.left + "px";
  highlightBox.style.width = rect.width + "px";
  highlightBox.style.height = rect.height + "px";

  tutorialText.innerText = step.text;

  // Position message box intelligently
  const stepBoxHeight = 80; // estimated height of the tutorial message box
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  if (spaceBelow < stepBoxHeight && spaceAbove > stepBoxHeight) {
    // Not enough space below — place above
    stepBox.style.top = (rect.top - stepBoxHeight - 10) + "px";
  } else {
    // Default: place below
    stepBox.style.top = (rect.bottom + 10) + "px";
  }

  stepBox.style.left = rect.left + "px";
}


function nextTutorialStep() {
  currentStep++;
  if (currentStep < tutorialSteps.length) {
    showStep(currentStep);
  } else {
    tutorialOverlay.classList.add("hidden");
    localStorage.setItem("tutorialSeen", "true");
  }
}

// Show popup only on first visit
window.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("tutorialSeen")) {
    tutorialPopup.classList.remove("hidden");
  }
});
