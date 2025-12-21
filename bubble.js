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
  let userMessageCount = 0;
  const messages = [];

  // ======================
  // Datos técnicos
  // ======================
  let industria = "";
  let tipoTrabajo = "";
  let plazo = "";

  /* ======================
     Utilidades detección
     ====================== */

  function isQuestion(text) {
    return text.includes("?") || text.startsWith("cuál") || text.startsWith("cuanto");
  }

  function detectIndustria(text) {
    const t = text.toLowerCase();
    const keywords = ["industria", "aplicación", "sector", "se usa en", "va para"];
    const materialWords = ["aisi", "acero", "inox", "aluminio", "chapa"];

    if (materialWords.some(w => t.includes(w))) return null;
    if (keywords.some(k => t.includes(k))) return text;

    return null;
  }

  function detectTipoTrabajo(text) {
    const t = text.toLowerCase();
    if (isQuestion(t)) return null;

    const trabajos = [
      "corte", "láser", "laser", "plegado",
      "soldadura", "pintura", "mecanizado"
    ];

    if (trabajos.some(w => t.includes(w))) return text;
    return null;
  }

  function detectPlazo(text) {
    const t = text.toLowerCase();
    const palabras = [
      "día", "días", "semana", "semanas",
      "urgente", "para", "fecha", "sin apuro"
    ];

    if (palabras.some(w => t.includes(w))) return text;
    return null;
  }

  function buildChatSummary() {
    let resumen = "Solicitud recibida desde el chat web.\n\n";

    if (tipoTrabajo) resumen += `Trabajo requerido: ${tipoTrabajo}.\n`;
    if (industria) resumen += `Aplicación / industria: ${industria}.\n`;
    if (plazo) resumen += `Plazo estimado: ${plazo}.\n`;

    resumen += "\nMensajes relevantes del cliente:\n";

    messages
      .filter(m => m.role === "user")
      .slice(-5)
      .forEach(m => {
        resumen += `- ${m.content}\n`;
      });

    return resumen;
  }

  /* ======================
     Apertura / cierre
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
     UI
     ====================== */

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = role === "user" ? "user-message" : "ai-message";
    div.innerText = text;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: "smooth" });
  }

  function hasCommercialKeywords(text) {
    const keywords = [
      "precio", "cuanto", "cuánto",
      "cotización", "cotizar", "valor"
    ];
    const lower = text.toLowerCase();
    return keywords.some(k => lower.includes(k));
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
    messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: "smooth" });
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

    // 🔎 Detección inteligente
    if (!industria) industria = detectIndustria(text) || industria;
    if (!tipoTrabajo) tipoTrabajo = detectTipoTrabajo(text) || tipoTrabajo;
    if (!plazo) plazo = detectPlazo(text) || plazo;

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

      if ((data.intent === true || hasCommercialKeywords(text)) && userMessageCount >= 2) {
        showCTA();
      }

    } catch {
      typing.innerText = "Error de conexión. Intentá nuevamente.";
    }
  }

  /* ======================
     Formulario
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
      industria: industria,
      tipo_trabajo: tipoTrabajo,
      plazo: plazo,
      resumen_chat: buildChatSummary(),
      origen: "Chat Agustina Web",
      fecha_hora: new Date().toISOString(),
      dispositivo: navigator.userAgent
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error();

      alert("Gracias. Un técnico comercial va a revisar tu pedido y contactarte.");
      leadModal.classList.add("hidden");
      leadForm.reset();

    } catch {
      alert("Hubo un error al enviar el pedido. Intentá nuevamente.");
    }
  });
});





















