import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    const lowerMessage = message.toLowerCase()

    // 🔴 DETECCIÓN DE LEAD (MEJORADA)
    const isLead =
      lowerMessage.includes("cotizar") ||
      lowerMessage.includes("presupuesto") ||
      lowerMessage.includes("precio") ||
      lowerMessage.includes("trabajo") ||
      lowerMessage.includes("cortar") ||
      lowerMessage.includes("corte") ||
      lowerMessage.includes("chapas") ||
      lowerMessage.includes("chapa") ||
      lowerMessae.includes("plegar") ||
      lowerMessage.includes("plegado") ||
      lowerMessage.includes("soldar") ||
      lowerMessage.includes("soldadura") ||
      lowerMessage.includes("fabricar") ||
      lowerMessage.includes("fabricación")

    // 🟡 EXCEPCIÓN: ASESORAMIENTO (NO abrir formulario)
    if (lowerMessage.includes("asesoramiento") && !isLead) {
      return NextResponse.json({
        reply: "Para poder asesorarte mejor, ¿podés contarme qué tipo de trabajo necesitás?"
      })
    }

    // 🔴 SI ES LEAD → FORMULARIO DIRECTO
    if (isLead) {
      return NextResponse.json({
        reply: `[FORMULARIO]
Perfecto, con esto ya podemos avanzar.

Completá el siguiente formulario y un especialista analiza tu caso: [LINK]`
      })
    }

    // 🔵 SI NO ES LEAD → USA IA
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: `
Sos Agustina, asistente comercial de una empresa metalúrgica (corte láser, plegado, soldadura, acero al carbono e inoxidable).

Tu objetivo es entender la necesidad del cliente.

IMPORTANTE:
- No pidas datos de contacto
- No digas que alguien se va a comunicar
- No menciones formularios
- Hacé preguntas claras para detectar si hay una necesidad concreta

- Si el cliente menciona trabajos específicos (corte, plegado, soldadura, fabricación, etc.), orientalo brevemente pero sin cerrar la conversación

Respondé de forma clara, profesional y breve.
`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    })

    const data = await response.json()

    const reply =
      data.output?.[0]?.content?.[0]?.text || "No pude generar respuesta"

    return NextResponse.json({ reply })

  } catch (error) {
    return NextResponse.json({
      reply: "Error en servidor"
    })
  }
}