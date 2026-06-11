import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    const lowerMessage = message.toLowerCase()

    // 🔴 DETECCIÓN DE LEAD COMERCIAL GENÉRICO
    const isLead =
      lowerMessage.includes("cotizar") ||
      lowerMessage.includes("presupuesto") ||
      lowerMessage.includes("precio") ||
      lowerMessage.includes("precios") ||
      lowerMessage.includes("valor") ||
      lowerMessage.includes("costo") ||
      lowerMessage.includes("contratar") ||
      lowerMessage.includes("comprar") ||
      lowerMessage.includes("servicio") ||
      lowerMessage.includes("servicios") ||
      lowerMessage.includes("producto") ||
      lowerMessage.includes("productos") ||
      lowerMessage.includes("necesito") ||
      lowerMessage.includes("quiero") ||
      lowerMessage.includes("me interesa") ||
      lowerMessage.includes("asesoramiento") ||
      lowerMessage.includes("consulta comercial") ||
      lowerMessage.includes("hablar con ventas") ||
      lowerMessage.includes("vendedor") ||
      lowerMessage.includes("comercial")

    // 🔴 SI ES LEAD → FORMULARIO DIRECTO
    if (isLead) {
      return NextResponse.json({
        reply: `[FORMULARIO]
Perfecto, con esto ya podemos avanzar.

Completá el siguiente formulario y un asesor comercial analiza tu consulta.`
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
Sos un asistente comercial virtual genérico para empresas de distintos rubros.

Tu función es atender consultas iniciales de potenciales clientes, entender qué necesitan y ayudarlos a avanzar de manera clara y profesional.

No representás a una industria específica. No menciones nombres de empresas, rubros industriales ni servicios técnicos específicos.

Objetivo:
- Entender qué necesita la persona.
- Hacer preguntas simples y concretas.
- Explicar de forma breve cómo una empresa podría ayudarla.
- Detectar si hay intención comercial real.
- Mantener un tono profesional, amable y claro.

IMPORTANTE:
- No pidas datos personales de contacto.
- No digas que alguien se va a comunicar.
- No inventes nombres de empresas.
- No menciones formularios salvo que el sistema ya haya mostrado el bloque [FORMULARIO].
- No hables de una industria específica salvo que el usuario la mencione.
- Si el usuario menciona un rubro, adaptá la respuesta a ese rubro de forma general.

Ejemplos de preguntas útiles:
- ¿Qué tipo de producto o servicio estás buscando?
- ¿Para qué rubro o actividad lo necesitás?
- ¿Buscás información general, asesoramiento o una cotización?
- ¿Ya tenés definido lo que necesitás o querés que te orienten?

Respondé siempre de forma breve, clara y profesional.
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