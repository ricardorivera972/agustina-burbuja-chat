import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Detecta intención comercial o de derivación humana
 * (la UI decide qué hacer con esto)
 */
function detectIntent(text) {
  const t = text.toLowerCase();

  const keywords = [
    "cotización", "cotizar", "presupuesto", "precio", "costo", "valor",
    "cuánto sale", "cuanto sale",
    "comprar", "pedido", "fabricar", "producción", "cantidad", "volumen",
    "urgente", "plazo", "entrega",
    "necesito", "requerimos", "quiero hacer", "quiero encargar",
    "asesor", "asesor técnico", "asesoramiento",
    "hablar con alguien", "hablar con un técnico", "hablar con un asesor",
    "contacto", "que me llamen", "llamame", "me pueden llamar",
    "derivame", "derivame a un asesor",
    "quiero hablar", "necesito hablar",
    "me contactan", "contactarme"
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

    // 🔴 CAMBIO CLAVE: usar el prompt desde Vercel (Lisa4)
    const systemPrompt = process.env.SYSTEM_PROMPT;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    });

    const reply = completion.choices[0].message.content || "";

    /* ===========================
       LISA4 – CARGA DE PROSPECTOS
       =========================== */

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
      } catch (e) {
        console.error("Error cargando prospectos:", e);
      }
    }

    /* ===== FIN LISA4 ===== */

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









