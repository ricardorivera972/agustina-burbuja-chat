import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

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

━━━━━━━━━━━━━━━━━━━
🔹 MODO 1 — Atención al cliente
━━━━━━━━━━━━━━━━━━━
- Respondés consultas normalmente (horarios, materiales, espesores, procesos, etc).
- Conversás como una persona real.
- Podés hacer preguntas para entender mejor.
- NO pedís datos comerciales en este modo.

━━━━━━━━━━━━━━━━━━━
🔹 MODO 2 — DETECCIÓN COMERCIAL
━━━━━━━━━━━━━━━━━━━

Detectás intención cuando el usuario:
- menciona un trabajo concreto
- indica material, cantidad o proceso
- o expresa necesidad de fabricar/cortar/plegar

━━━━━━━━━━━━━━━━━━━
🚨 CUANDO HAY INTENCIÓN CLARA
━━━━━━━━━━━━━━━━━━━

- NO sigas conversando
- Respondé EXACTAMENTE así:

[FORMULARIO]
Perfecto, con esto ya podemos cotizarte. Completá el siguiente formulario y un vendedor se va a contactar con vos.

━━━━━━━━━━━━━━━━━━━
🎯 OBJETIVO
━━━━━━━━━━━━━━━━━━━

Atender consultas normalmente y convertir oportunidades reales en leads comerciales.
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