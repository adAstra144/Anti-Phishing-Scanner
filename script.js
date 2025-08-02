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
    const res = await fetch("http://localhost:5000/analyze", {
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
    question: "What should you do if a message asks for your password?",
    options: [
      "Reply immediately with your password",
      "Verify the source before responding",
      "Ignore all emails from your company",
      "Click the link and change your password"
    ],
    answer: "Verify the source before responding"
  },
  {
    question: "What is a phishing attack?",
    options: [
      "A fishing technique used in rivers",
      "A way to steal personal information via fake messages",
      "A password recovery method",
      "An antivirus scanning process"
    ],
    answer: "A way to steal personal information via fake messages"
  }
];

let currentQuestion = 0;

function startQuiz() {
  currentQuestion = 0;
  loadQuestion();
}

function loadQuestion() {
  const question = quizData[currentQuestion];
  const quizQuestion = document.getElementById("quizQuestion");
  const quizOptions = document.getElementById("quizOptions");

  quizQuestion.innerText = question.question;
  quizOptions.innerHTML = "";

  question.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.innerText = option;
    btn.onclick = () => checkAnswer(option);
    quizOptions.appendChild(btn);
  });
}

function checkAnswer(selected) {
  const correct = quizData[currentQuestion].answer;
  const quizQuestion = document.getElementById("quizQuestion");
  const quizOptions = document.getElementById("quizOptions");

  if (selected === correct) {
    quizQuestion.innerText = "✅ Correct!";
  } else {
    quizQuestion.innerText = `❌ Incorrect. The correct answer is: ${correct}`;
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

