document.addEventListener("DOMContentLoaded", () => {
  const bubble = document.getElementById("chat-bubble");
  const chat = document.getElementById("chat-container");
  const closeBtn = document.getElementById("chat-close");
  const sendBtn = document.getElementById("send-btn");
  const input = document.getElementById("chat-input");
  const messagesDiv = document.getElementById("chat-messages");

  const leadModal = document.getElementById("lead-modal");
  const leadCancel = document.getElementById("lead-cancel");
  const leadForm = document.getElementById("lead-form");

  if (
    !bubble || !chat || !closeBtn || !sendBtn ||
    !input || !messagesDiv || !leadModal ||
    !leadCancel || !leadForm
  ) {
    console.error("Agustina: falta algún elemento del DOM");
    return;
  }

  let presented = false;
  let ctaShown = false;
  const messages = [];

  let industria = "";

  /* ======================
     APERTURA / CIERRE CHAT
     ====================== */

  bubble.addEventListener("click", () => {
    chat.style.display = "flex";
    bubble.style.display = "none";

    if (!presented) {
      addMessage(
        "assistant",
        "Hola, soy Agustina, tu asistente virtual de Lasertec Ingeniería. ¿En qué puedo ayudarte?"
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
     UTILIDADES
     ====================== */

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = role === "user" ? "user-message" : "ai-message";
    div.innerText = text;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: "smooth" });
  }

  function hasTechnicalIntent(text) {
    const keywords = [
      "asesoramiento",
      "ayuda",
      "quiero que me asesoren",
      "evaluación técnica",
      "hablar con un técnico"
    ];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  function detectIndustria(text) {
    const t = text.toLowerCase();
    if (t.includes("industria") || t.includes("sector") || t.includes("rubro")) {
      return text;
    }
    return null;
  }

  function buildChatResumen() {
    const userMessages = messages
      .filter(m => m.role === "user")
      .map(m => m.content)
      .join(" | ");

    return userMessages || "Consulta iniciada desde el chat web.";
  }

  /* ======================
     ENVÍO DE MENSAJES
     ====================== */

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    messages.push({ role: "user", content: text });
    input.value = "";

    if (!industria) industria = detectIndustria(text) || industria;

    if (hasTechnicalIntent(text)) {
      showCTA();
      return;
    }

    const typing = document.createElement("div");
    typing.className = "ai-message";
    typing.innerText = "Agustina está escribiendo...";
    messagesDiv.appendChild(typing);

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

    } catch {
      typing.innerText = "Error de conexión. Intentá nuevamente.";
    }
  }

  /* ======================
     CTA
     ====================== */

  function showCTA() {
    if (ctaShown) return;

    const cta = document.createElement("div");
    cta.className = "cta-box";
    cta.innerHTML = `
      <p><strong>Un técnico comercial puede evaluar tu caso directamente.</strong></p>
      <button id="cta-btn">Solicitar asesoramiento técnico</button>
    `;

    messagesDiv.appendChild(cta);
    messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: "smooth" });
    ctaShown = true;

    document.getElementById("cta-btn").addEventListener("click", () => {
      leadModal.classList.remove("hidden");
    });
  }

  /* ======================
     FORMULARIO (SOLO CONTACTO)
     ====================== */

  leadCancel.addEventListener("click", () => {
    leadModal.classList.add("hidden");
  });

  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      origen: "Chat Agustina Web",
      empresa: document.getElementById("lead-company").value,
      nombre: document.getElementById("lead-name").value,
      email: document.getElementById("lead-email").value,
      telefono: document.getElementById("lead-phone").value,
      industria: industria || "No informado",
      comentarios: buildChatResumen()
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error();

      alert("Gracias. Un técnico comercial va a contactarte.");
      leadModal.classList.add("hidden");
      leadForm.reset();

    } catch {
      alert("Hubo un error al enviar el pedido.");
    }
  });
});





























