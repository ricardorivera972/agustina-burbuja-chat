document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("send-btn");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  const container = document.getElementById("chat-container");

  let presented = false;

  // Presentación automática (segura)
  window.presentAgustina = function () {
    if (presented) return;

    // Asegurar que el chat esté visible
    container.style.display = "flex";

    const intro = document.createElement("div");
    intro.className = "ai-message";
    intro.innerText =
      "Hola, soy Agustina, tu asistente virtual de Lasertec Ingeniería. ¿En qué puedo ayudarte hoy?";
    messages.appendChild(intro);

    messages.scrollTop = messages.scrollHeight;
    presented = true;

    // Foco real en el input
    setTimeout(() => {
      input.focus();
    }, 100);
  };

  // Enviar mensaje
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







