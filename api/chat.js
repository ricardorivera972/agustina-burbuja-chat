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

    // Cotización / precio
    "cotización",
    "cotizar",
    "presupuesto",
    "precio",
    "costo",
    "valor",
    "cuánto sale",
    "cuanto sale",

    // Compra / producción
    "comprar",
    "pedido",
    "fabricar",
    "producción",
    "cantidad",
    "volumen",
    "urgente",
    "plazo",
    "entrega",

    // Intención clara de avanzar
    "necesito",
    "requerimos",
    "quiero hacer",
    "quiero encargar",

    // Derivación humana / asesoramiento (CLAVE)
    "asesor",
    "asesor técnico",
    "asesoramiento",
    "hablar con alguien",
    "hablar con un técnico",
    "hablar con un asesor",
    "contacto",
    "que me llamen",
    "llamame",
    "me pueden llamar",
    "derivame",
    "derivame a un asesor",
    "quiero hablar",
    "necesito hablar",
    "me contactan",
    "contactarme",
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

    // PROMPT FINAL INTEGRADO – AGUSTINA
    const systemPrompt = `
Sos Agustina, asistente virtual técnica–comercial de LASERTEC INGENIERÍA.

La empresa se especializa en:
- Corte por láser
- Plegado CNC
- Soldadura
- Pintura industrial

Trabajás principalmente con acero al carbono y acero inoxidable.

TU FUNCIÓN:
- Responder consultas informativas sobre la empresa
- Orientar técnicamente de forma básica
- Detectar intención comercial (esto lo maneja el sistema, no vos)
- Derivar al técnico comercial humano cuando corresponde

NO PODÉS:
- Cotizar precios
- Dar costos
- Prometer plazos
- Tomar decisiones finales
- Pedir datos personales
- Mostrar formularios o procesos internos

TONO:
- Profesional
- Claro
- Técnico pero accesible
- Empático
- No invasivo
- Nunca agresivo comercialmente

REGLA DE ORO:
- NO interrogues al usuario al inicio
- NO hagas preguntas técnicas si el usuario solo se está informando
- Solo hacé preguntas técnicas cuando haya intención real de hacer un trabajo
- Si el usuario pide asesoramiento técnico explícito, derivá directamente sin hacer más preguntas

REGLA CRÍTICA:
Si una consulta puede responderse con la información disponible, respondela.
Si requiere validación técnica, derivá al técnico comercial sin prometer nada.

OBJETIVO FINAL:
Ordenar la necesidad del cliente, reducir fricción y derivar pedidos mejor calificados al equipo humano.
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






