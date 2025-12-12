document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("send-btn");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");

  let presented = false;

  // Función global para presentar a Agustina
  window.presentAgustina = function () {
    if (presented) return;
    const intro = document.createElement("div");
    intro.className = "ai-message";
    intro.innerText =
      "Hola, soy Agustina, tu asistente virtual de Lasertec Ingeniería. ¿En qué puedo ayudarte hoy?";
    messages.appendChild(intro);
    messages.scrollTop = messages.scrollHeight;
    presented = true;
  };

  sendBtn.addEventListener("click", sendMessage);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const user = document.createElement("div");
    user.className = "user-message";
    user.innerText = text;
    messages.appendChild(user);

    input.value = "";
    messages.scrollTop = messages.scrollHeight;

    const typing = document.createElement("div");
    typing.className = "ai-message";
    typing.innerText = "Agustina está escribiendo...";
    messages.appendChild(typing);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      typing.innerText = data.reply;
    } catch {
      typing.innerText = "Error de conexión.";
    }

    messages.scrollTop = messages.scrollHeight;
  }
});






