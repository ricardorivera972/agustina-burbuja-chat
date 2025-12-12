document.addEventListener("DOMContentLoaded", () => {
  const bubble = document.getElementById("chat-bubble");
  const container = document.getElementById("chat-container");
  const closeBtn = document.getElementById("chat-close");
  const sendBtn = document.getElementById("send-btn");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");

  let presented = false;

  // Abrir chat
  bubble.addEventListener("click", () => {
    container.style.display = "f





