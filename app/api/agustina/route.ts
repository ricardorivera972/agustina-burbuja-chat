import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    const lowerMessage = message.toLowerCase()

    // 🟡 EXCEPCIÓN: ASESORAMIENTO (NO abrir formulario)
    if (lowerMessage.includes("asesoramiento")) {
      return NextResponse.json({
        reply: "Perfecto, contame un poco más sobre lo que necesitás así te orientamos mejor."
      })
    }

    const isLead =
      lowerMessage.includes("cotizar") ||
      lowerMessage.includes("presupuesto") ||
      lowerMessage.includes("trabajo") ||
      lowerMessage.includes("cortar") ||
      lowerMessage.includes("corte") ||
      lowerMessage.includes("plegar") ||
      lowerMessage.includes("plegado")

    if (isLead) {
      return NextResponse.json({
        reply: `[FORMULARIO]
Perfecto, con esto ya podemos cotizarte. Completá el siguiente formulario y un vendedor se va a contactar con vos.`
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

Tu objetivo es ayudar al cliente y entender qué necesita.

IMPORTANTE:
- No pidas datos de contacto
- No digas que un asesor se va a comunicar
- No menciones formularios
- Solo hacé preguntas para entender mejor la necesidad

Respondé como una persona normal, ayudando al cliente.
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