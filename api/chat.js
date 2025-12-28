import OpenAI from "openai";
import fetch from "node-fetch";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Detecta intención comercial REAL (no búsquedas)
 */
function detectIntent(text) {
  if (!text) return false;

  const t = text.toLowerCase();

  const keywords = [
    "cotización", "cotizar", "presupuesto", "precio", "costo", "valor",
    "comprar", "pedido", "fabricar", "producción",
    "necesito que me coticen", "quiero encargar",
    "hablar con un asesor", "contacto", "que me llamen",
    "quiero avanzar", "necesito hablar"
  ];

  return keywords.some(k => t.includes(k));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const systemPrompt = process.env.SYSTEM_PROMPT;

    if (!systemPrompt) {
      console.error("SYSTEM_PROMPT no definido");
      return res.status(500).json({
        reply: "Error interno de configuración.",
        intent: false
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    });

    let reply = completion.choices?.[0]?.message?.content || "";

    /* ==========================
       CARGA DE PROSPECTOS LISA3
       ========================== */

    const startTag = "<<<PROSPECTOS_JSON>>>";
    const endTag = "<<<FIN_PROSPECTOS_JSON>>>";

    if (
      process.env.APP_MODE === "LISA3" &&
      reply.includes(startTag) &&
      reply.includes(endTag)
    ) {
      try {
        const jsonBlock = reply
          .split(startTag)[1]
          .split(endTag)[0]
          .trim();

        const prospects = JSON.parse(jsonBlock);

        if (Array.isArray(prospects)) {
          for (const prospect of prospects) {
            await fetch(process.env.PROSPECTS_WEBHOOK_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(prospect)
            });
          }
        }

        // 🔑 CLAVE: limpiamos el JSON del texto visible
        reply = reply.replace(
          new RegExp(`${startTag}[\\s\\S]*?${endTag}`, "g"),
          ""
        ).trim();

        // Si quedó vacío, ponemos respuesta humana mínima
        if (!reply) {
          reply = "Listo. Ya cargué los prospectos detectados en la planilla.";
        }

      } catch (e) {
        console.error("Error cargando prospectos:", e);
      }
    }

    /* ==========================
       INTENCIÓN COMERCIAL
       ========================== */

    const lastUserMessage = [...messages]
      .reverse()
      .find(m => m.role === "user")?.content || "";

    const intent = detectIntent(lastUserMessage);

    return res.status(200).json({
      reply,
      intent
    });

  } catch (error) {
    console.error("API chat error:", error);

    return res.status(500).json({
      reply: "En este momento no puedo responder. Intentá nuevamente.",
      intent: false
    });
  }
}













