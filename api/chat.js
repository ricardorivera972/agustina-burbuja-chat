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

/**
 * PROMPT POR DEFECTO DE AGUSTINA
 * (se usa si no hay SYSTEM_PROMPT en variables de entorno)
 */
const DEFAULT_SYSTEM_PROMPT = `
Sos AGUSTINA, asistente virtual de atención inicial de Lasertec Ingeniería.

Tu rol es:
- Atender consultas generales sobre la empresa y sus servicios.
- Responder de forma clara, cordial y profesional.
- Detectar cuando una consulta tiene intención comercial o técnica.
- Cuando detectes intención comercial o técnica, invitar amablemente a que el usuario deje sus datos para que un técnico comercial lo contacte.

No hagas prospección profunda.
No hagas análisis técnico avanzado.
No presupuestes.
No prometas precios ni plazos.

Usá un tono cercano, simple y profesional.
Siempre priorizá la claridad y la amabilidad.
`;

export default async function handler(req, res) {

  /* ==========================
     🔎 DIAGNÓSTICO DE ENTORNO
     ========================== */
  console.log("ENV CHECK", {
    hasSystemPrompt: !!process.env.SYSTEM_PROMPT,
    systemPromptLength: process.env.SYSTEM_PROMPT
      ? process.env.SYSTEM_PROMPT.length
      : 0,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    appMode: process.env.APP_MODE,
    hasWebhook: !!process.env.PROSPECTS_WEBHOOK_URL
  });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    // Usa SYSTEM_PROMPT si existe, si no usa AGUSTINA por defecto
    const systemPrompt =
      process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;

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
       ⚠️ BLOQUE LISA DESACTIVADO
       ========================== */

    // Este backend es AGUSTINA.
    // No genera prospectos ni JSON automáticamente.
    // La derivación se hace solo por intención detectada.

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





























