import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Detecta intención comercial de cotización
 * (la UI decide qué hacer con esto)
 */
function detectIntent(text) {
  const t = text.toLowerCase();

  const keywords = [
    "cotización",
    "cotizar",
    "presupuesto",
    "precio",
    "costo",
    "valor",
    "cuánto sale",
    "cuanto sale",
    "plazo",
    "entrega",
    "urgente",
    "cantidad",
    "volumen",
    "comprar",
    "necesito",
    "requerimos",
    "pedido",
    "fabricar",
    "producción"
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

    // Prompt blindado de Agustina
    const systemPrompt = `
Sos Agustina, asistente comercial industrial de Lasertec Ingeniería.

Contexto de Lasertec:
- Corte láser, plegado, soldadura y pintura
- Acero al carbono y acero inoxidable
- Industria metalúrgica, energética y ferroviaria

REGLAS OBLIGATORIAS (NO ROMPER):
- NO pedir datos personales (nombre, email, teléfono, empresa).
- NO ofrecer cotizaciones ni presupuestos.
- NO mostrar llamados a la acción.
- NO mencionar formularios, botones ni procesos internos.
- NO prometer precios, plazos ni disponibilidad.

OBJETIVO:
- Ayudar al usuario a definir su necesidad técnica
- Hacer preguntas técnicas solo si aportan claridad
- Mantener un tono profesional, claro y directo
- Nunca cerrar la conversación con una venta

IMPORTANTE:
La detección de intención comercial la maneja el sistema, NO vos.
Vos solo respondés.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    });

    const reply = completion.choices[0].message.content;

    // Detectamos intención solo en el último mensaje del usuario
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




