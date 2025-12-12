const bubble = document.getElementById("chat-bubble");
const container = document.getElementById("chat-container");
const closeBtn = document.getElementById("chat-close");
const sendBtn = document.getElementById("send-btn");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

bubble.addEventListener("click", () => {
  container.style.display = "flex";
  bubble.style.display = "none";
});

closeBtn.addEventListener("click", () => {
  container.style.display = "none";
  bubble.style.display = "block";
});

sendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  chatMessages.innerHTML += `<div class="user-message">${message}</div>`;
  chatInput.value = "";
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await response.json();

  chatMessages.innerHTML += `<div class="ai-message">${data.reply}</div>`;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}



