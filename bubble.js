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

  /* ======================
     Datos técnicos detectados
     ====================== */
  let industria = "";
  let tipoTrabajo = "";

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
     UTILIDADES UI
     ====================== */

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = role === "user" ? "user-message" : "ai-message";
    div.innerText = text;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: "smooth" });
  }

  function hasCommercialKeywords(text) {
    const keywords = ["precio", "cuanto", "cuánto", "cotización", "cotizar", "valor"];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  function hasTechnicalIntent(text) {
    const keywords = [
      "asesoramiento",
      "asesoren",
      "ayuda",
      "necesito ayuda",
      "no sé qué pedir",
      "quiero que me asesoren",
      "orientación",
      "evaluación técnica",
      "asesoramiento técnico",
      "hablar con un técnico"
    ];
    return keywords.some(k => text.toLowerCase().includes(k));
  }

  /* ======================
     DETECCIÓN SIMPLE
     ====================== */

  function detectIndustria(text) {
    const t = text.toLowerCase();
    const materiales = ["aisi", "acero", "inox", "aluminio", "chapa"];
    if (materiales.some(w => t.includes(w))) return null;
    if (t.includes("industria") || t.includes("sector") || t.includes("rubro")) {
      return text;
    }
    return null;
  }

  function detectTipoTrabajo(text) {
    const t = text.toLowerCase();
    const trabajos = ["corte", "láser", "laser", "plegado", "soldadura", "pintura"];
    if (trabajos.some(w => t.includes(w))) return text;
    return null;
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
    if (!tipoTrabajo) tipoTrabajo = detectTipoTrabajo(text) || tipoTrabajo;

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

      if (!ctaShown && (data.intent === true || hasCommercialKeywords(text))) {
        showCTA();
      }

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
     FORMULARIO
     ====================== */

  leadCancel.addEventListener("click", () => {
    leadModal.classList.add("hidden");
  });

  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const descripcionUsuario = document.getElementById("lead-notes").value;

    const payload = {
      fecha_hora: new Date().toISOString(),
      origen: "Chat Agustina Web",
      empresa: document.getElementById("lead-company").value,
      nombre: document.getElementById("lead-name").value,
      email: document.getElementById("lead-email").value,
      telefono: document.getElementById("lead-phone").value,
      industria: industria || "No informado",
      tipo_trabajo: tipoTrabajo || "No informado",
      descripcion_requerimiento:
        (descripcionUsuario || "").trim() ||
        "Necesidad expresada durante la conversación en el chat.",
      estado: "Nuevo",
      notas_internas: ""
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




























