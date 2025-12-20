document.addEventListener("DOMContentLoaded", () => {
  const bubble = document.getElementById("chat-bubble");
  const chat = document.getElementById("chat-container");
  const closeBtn = document.getElementById("chat-close");
  const sendBtn = document.getElementById("send-btn");
  const input = document.getElementById("chat-input");
  const messagesDiv = document.getElementById("chat-messages");

  // Modal formulario
  const leadModal = document.getElementById("lead-modal");
  const leadCancel = document.getElementById("lead-cancel");
  const leadForm = document.getElementById("lead-form");

  if (
    !bubble ||
    !chat ||
    !closeBtn ||
    !sendBtn ||
    !input ||
    !messagesDiv ||
    !leadModal ||
    !leadCancel ||
    !leadForm
  ) {
    console.error("Agustina: falta algún elemento del DOM");
    return;
  }

  let presented = false;
  let ctaShown = false;

  const messages = [];
  let userMessageCount = 0;

  const WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycbzr7dN6DwP3FnWgnIzcFAFehEDrQQ-bpuUaJm_HydCc-CbjE5hWx8pTezERWpzYqKGq/exec";

  /* ======================
     Apertura / cierre chat
     ====================== */

  bubble.addEventListener("click", () => {
    chat.style.display = "flex";
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

  /* ======================
     Utilidades
     ====================== */

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = role === "user" ? "user-message" : "ai-message";
    div.innerText = text;
    messagesDiv.appendChild(div);

    messagesDiv.scrollTo({
      top: messagesDiv.scrollHeight,
      behavior: "smooth"
    });
  }

  function buildChatSummary() {
    return messages
      .filter(m => m.role === "user")
      .map(m => `- ${m.content}`)
      .join("\n");
  }

  /* ======================
     CTA
     ====================== */

  function showCTA() {
    if (ctaShown) return;

    const cta = document.createElement("div");
    cta.className = "cta-box";
    cta.innerHTML = `
      <p><strong>¿Querés que un técnico comercial evalúe técnicamente tu pedido?</strong></p>
      <button id="cta-btn">Solicitar evaluación técnica</button>
    `;

    messagesDiv.appendChild(cta);
    messagesDiv.scrollTo({
      top: messagesDiv.scrollHeight,
      behavior: "smooth"
    });

    ctaShown = true;

    document.getElementById("cta-btn").addEventListener("click", () => {
      leadModal.classList.remove("hidden");
    });
  }

  /* ======================
     Envío de mensajes
     ====================== */

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

    messagesDiv.scrollTo({
      top: messagesDiv.scrollHeight,
      behavior: "smooth"
    });

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

      if (data.intent === true && userMessageCount >= 2) {
        showCTA();
      }

    } catch (err) {
      typing.innerText = "Error de conexión. Intentá nuevamente.";
    }
  }

  /* ======================
     Formulario → Webhook
     ====================== */

  leadCancel.addEventListener("click", () => {
    leadModal.classList.add("hidden");
  });

  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      nombre: document.getElementById("lead-name").value,
      empresa: document.getElementById("lead-company").value,
      email: document.getElementById("lead-email").value,
      telefono: document.getElementById("lead-phone").value,
      comentarios: document.getElementById("lead-notes").value,
      resumen_chat: buildChatSummary(),
      origen: "Chat Agustina Web",
      fecha: new Date().toISOString()
    };

    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload)
      });

      alert(
        "Gracias. Un técnico comercial va a revisar tu pedido y contactarte."
      );

      leadModal.classList.add("hidden");
      leadForm.reset();

    } catch (err) {
      alert("Hubo un error al enviar el pedido. Intentá nuevamente.");
    }
  });
});
















