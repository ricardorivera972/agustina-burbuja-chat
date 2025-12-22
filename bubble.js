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

  /* ======================
     Datos técnicos detectados
     ====================== */
  let industria = "";
  let tipoTrabajo = "";
  let plazo = "";

  /* ======================
     APERTURA / CIERRE CHAT
     ====================== */

  bubble.addEventListener("click", () => {
    console.log("CLICK BURBUJA OK");
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
    const keywords = [
      "precio", "cuanto", "cuánto",
      "cotización", "cotizar", "valor"
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
    if (t.includes("industria") || t.includes("aplicación") || t.includes("sector")) {
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

  function detectPlazo(text) {
    const t = text.toLowerCase();
    const palabras = ["día", "días", "semana", "semanas", "urgente", "fecha"];
    if (palabras.some(w => t.includes(w))) return text;
    return null;
  }

  function buildResumenInterno() {
    let resumen = "Solicitud de cotización desde el chat web.\n";
    if (tipoTrabajo) resumen += `Trabajo: ${tipoTrabajo}. `;
    if (industria) resumen += `Aplicación: ${industria}. `;
    if (plazo) resumen += `Plazo: ${plazo}. `;
    return resumen.trim();
  }

  function buildDescripcionFallback() {
    let desc = "Cliente solicita evaluación técnica.";
    if (tipoTrabajo) desc += ` Trabajo: ${tipoTrabajo}.`;
    if (industria) desc += ` Aplicación: ${industria}.`;
    if (plazo) desc += ` Plazo: ${plazo}.`;
    return desc;
  }

  /* ======================
     ENVÍO DE MENSAJES
     ====================== */

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    userMessageCount++;
    addMessage("user", text);
    messages.push({ role: "user", content: text });
    input.value = "";

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
      nombre: document.getElementById("lead-name").value,
      empresa: document.getElementById("lead-company").value,
      email: document.getElementById("lead-email").value,
      telefono: document.getElementById("lead-phone").value,
      comentarios: descripcionUsuario || buildDescripcionFallback(),
      industria: industria,
      tipo_trabajo: tipoTrabajo,
      plazo: plazo,
      resumen_chat: buildResumenInterno(),
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

      alert("Gracias. Un técnico comercial va a revisar tu pedido.");
      leadModal.classList.add("hidden");
      leadForm.reset();

    } catch {
      alert("Hubo un error al enviar el pedido.");
    }
  });
});























