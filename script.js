const messageInput = document.getElementById("messageInput");
const chatWindow = document.getElementById("chatWindow");
const historyList = document.getElementById("historyList");
const themeToggle = document.getElementById("themeToggle");

// Theme Toggle
themeToggle.addEventListener("change", () => {
  document.body.setAttribute("data-theme", themeToggle.checked ? "dark" : "light");
});

// Add chat-style message
function addChatMessage(content, type = "user") {
  const msg = document.createElement("div");
  msg.className = `chat-message ${type}`;
  msg.textContent = content;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Save to history list
function saveToHistory(input, result) {
  const entry = document.createElement("li");
  entry.textContent = `${result.toUpperCase()}: ${input.slice(0, 35)}...`;
  historyList.prepend(entry);
}

// Trigger scan and handle response
async function triggerScan() {
  const text = messageInput.value.trim();
  if (!text) return;

  // Add user message
  addChatMessage(text, "user");
  messageInput.value = "";

  // Show scanning message
  addChatMessage("🔍 Scanning message...", "system");

  try {
    const res = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    if (data.result) {
      const type = data.result.toLowerCase().includes("phishing") ? "warning" : "safe";
      const display = `${data.result.toUpperCase()}:\n${data.reasoning || "No detailed explanation provided."}`;

      addChatMessage(display, type);
      saveToHistory(text, data.result);
    } else {
      addChatMessage("⚠️ Unexpected response format.", "warning");
    }

  } catch (err) {
    console.error("Scan error:", err);
    addChatMessage("❌ Could not connect to the backend.", "warning");
  }
}
