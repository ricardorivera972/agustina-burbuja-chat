document.addEventListener("DOMContentLoaded", () => {
  const bubble = document.getElementById("chat-bubble");
  const chat = document.getElementById("chat-container");
  const closeBtn = document.getElementById("chat-close");
  const sendBtn = document.getElementById("send-btn");
  const input = document.getElementById("chat-input");
  const messagesDiv = document.getElementById("chat-messages");

  if (!bubble || !chat || !closeBtn || !sendBtn || !input || !messagesDiv) {
    console.error("Agustina: falta algún elemento del DOM");
    return;
  }

  let presented = false;

  // Historial que la API espera
  const messages = [];

  // Abrir chat
  bubble.addEventListener("click", () => {
    chat.style.display = "block";
    bubble.style.display = "none";

    if (!presented) {
      addMessage(
        "assistant",
        "Hola, soy Agustina, tu asistente virtual de Lasertec Ingeniería. ¿En qué puedo ayudarte hoy?"
      );
      presented = true;
    }

    setTimeout(() => input.focus(), 100);
  });

  // Cerrar chat
  closeBtn.addEventListener("click", () => {
    chat.style.display = "none";
    bubble.style.display = "block";
  });

  // Enviar mensaje
  sendBtn.addEventListener("click", sendMessage);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = role === "user" ? "user-message" : "ai-message";
    div.innerText = text;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    messages.push({ role: "user", content: text });
    input.value = "";

    const typing = document.createElement("div");
    typing.className = "ai-message";
    typing.innerText = "Agustina está escribiendo...";
    messagesDiv.appendChild(typing);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });

      const data = await res.json();

      typing.remove();

      addMessage("assistant", data.reply);
      messages.push({ role: "assistant", content: data.reply });

      // data.intent queda listo para CTA (más adelante)

    } catch (err) {
      typing.innerText = "Error de conexión. Intentá nuevamente.";
    }
  }
});










