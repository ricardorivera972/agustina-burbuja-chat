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
  let ctaShown = false;

  const messages = [];
  let userMessageCount = 0;

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

  closeBtn.addEventListener("click", () => {
    chat.style.display = "none";
    bubble.style.display = "block";
  });

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

  function showCTA() {
    if (ctaShown) return;

    const cta = document.createElement("div");
    cta.className = "cta-box";
    cta.innerHTML = `
      <p><strong>¿Querés que un técnico comercial evalúe técnicamente tu pedido?</strong></p>
      <button id="cta-btn">Solicitar evaluación técnica</button>
    `;

    messagesDiv.appendChild(cta);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    ctaShown = true;

    document.getElementById("cta-btn").addEventListener("click", () => {
      alert("Evaluación técnica solicitada. En el próximo paso conectamos el formulario.");
    });
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    userMessageCount++;

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

      // CTA: solo con intención + conversación mínima
      if (data.intent === true && userMessageCount >= 2) {
        showCTA();
      }

    } catch (err) {
      typing.innerText = "Error de conexión. Intentá nuevamente.";
    }
  }
});












