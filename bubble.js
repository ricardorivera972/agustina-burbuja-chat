document.addEventListener("DOMContentLoaded", () => {
  const bubble = document.getElementById("chat-bubble");
  const container = document.getElementById("chat-container");
  const closeBtn = document.getElementById("chat-close");
  const sendBtn = document.getElementById("send-btn");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");

  // Abrir chat
  bubble.addEventListener("click", () => {
    container.style.display = "flex";
    bubble.style.display = "none";
    chatInput.focus();
  });

  // Cerrar chat
  closeBtn.addEventListener("click", () => {
    container.style.display = "none";
    bubble.style.display = "block";
  });

  // Botón enviar
  sendBtn.addEventListener("click", sendMessage);

  // Enter envía / Shift+Enter baja línea
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Mensaje del usuario
    const userMsg = document.createElement("div");
    userMsg.className = "user-message";
    userMsg.innerText = message;
    chatMessages.appendChild(userMsg);

    chatInput.value = "";

    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 0);

    // Mensaje "escribiendo"
    const typingMsg = document.createElement("div");
    typingMsg.className = "ai-message";
    typingMsg.innerText = "Agustina está escribiendo...";
    chatMessages.appendChild(typingMsg);

    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 0);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      typingMsg.innerText = data.reply;
    } catch (error) {
      typingMsg.innerText = "Ups, hubo un error. Intentá de nuevo.";
    }

    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 0);
  }
});




