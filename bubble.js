document.addEventListener("DOMContentLoaded", () => {
  const chatButton = document.getElementById("chat-button");
  const chatWindow = document.getElementById("chat-window");
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-button");

  // Abrir / cerrar burbuja
  chatButton.addEventListener("click", () => {
    chatWindow.classList.toggle("open");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Mensaje del usuario
    chatMessages.innerHTML += `<div class="user-message">${message}</div>`;
    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      // Mensaje de Agustina
      chatMessages.innerHTML += `<div class="ai-message">${data.reply}</div>`;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
      chatMessages.innerHTML += `<div class="ai-message">Error de conexión. Intentá nuevamente.</div>`;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Enviar con botón
  sendButton.addEventListener("click", sendMessage);

  // Enviar con Enter
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});


