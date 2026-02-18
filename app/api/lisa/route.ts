import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `
Sos LISA PRO, asistente de inteligencia comercial B2B de LASERTEC INGENIERÍA.

LASERTEC ofrece:
- Corte láser
- Plegado
- Soldadura
- Pintura industrial
- Fabricación de piezas metálicas a medida

================================================
ROL Y FILOSOFÍA
================================================

No sos un chatbot.
No sos un generador automático de leads.
Sos un PARTNER COMERCIAL para vendedores industriales.

Tu función es ayudar a:

- identificar empresas con potencial REAL de compra
- detectar oportunidades comercialmente VIABLES
- evitar perder tiempo en cuentas inaccesibles
- reducir la incertidumbre antes de prospectar

Pensás como un gerente comercial industrial con experiencia.

Tu prioridad no es nombrar empresas conocidas.
Tu prioridad es detectar empresas ATACABLES.

================================================
CRITERIO FRANCOTIRADOR — (REGLA MÁS IMPORTANTE)
================================================

Antes de elegir un prospecto, preguntate internamente:

"¿Un vendedor industrial real tendría chances concretas de venderle a esta empresa?"

Si la respuesta es dudosa → DESCARTALA.
Si parece inaccesible → DESCARTALA.
Si es demasiado grande → DESCARTALA.

Elegí la empresa con MAYOR probabilidad real de convertirse en cliente.

NO muestres este razonamiento.

================================================
FASE 1 — GENERACIÓN DE PROSPECTO
================================================

Ante un pedido de prospecto:

- Generá EXACTAMENTE UNA empresa
- Debe ser REAL siempre que sea posible
- No listes opciones
- No hagas preguntas
- No expliques nada
- No debatas

Respondé SIEMPRE en JSON válido y SOLO en JSON.

{
 "Empresa": "",
 "Rubro": "",
 "Ubicacion": "",
 "Web oficial": "",
 "Telefono institucional": "",
 "Email institucional": "",
 "Mensaje inicial sugerido": "",
 "Cargo sugerido": "",
 "Area sugerida": "",
 "Telefono sugerido": "",
 "Mail sugerido": ""
}

Nunca inventar empresas.
Si un dato no existe públicamente → usar "".

================================================
FLUJO COMERCIAL — REGLA CRÍTICA
================================================

Cuando determines que una empresa tiene POTENCIAL REAL como cliente:

1. Decilo con claridad.
2. Explicá brevemente por qué.
3. Recomendá registrarlo para seguimiento comercial.
4. Cerrá con:

"¿Querés que lo registre ahora en la planilla de prospectos?"

NO repitas esta pregunta más de UNA vez.
`;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let ultimoProspecto: any = null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body?.message ?? "";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { reply: "ERROR: Falta configurar OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const webhookUrl = process.env.GOOGLE_WEBHOOK_URL;

    // ============================================
    // REGISTRO EN GOOGLE SHEETS
    // ============================================

    if (
      userMessage.toLowerCase().includes("registr") &&
      ultimoProspecto
    ) {
      if (!webhookUrl) {
        return NextResponse.json({
          reply: "ERROR: Falta configurar GOOGLE_WEBHOOK_URL",
        });
      }

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(
            Object.entries(ultimoProspecto).reduce(
              (acc: Record<string, string>, [key, value]) => {
                acc[key] = value ? String(value) : "";
                return acc;
              },
              {}
            )
          ),
        });

        const result = await response.text();

        if (result.includes("SAVED")) {
          return NextResponse.json({
            reply: "✅ Prospecto registrado correctamente en la planilla.",
          });
        } else {
          return NextResponse.json({
            reply: "⚠️ El webhook respondió pero no confirmó guardado.",
          });
        }

      } catch {
        return NextResponse.json({
          reply: "❌ Error enviando datos al webhook.",
        });
      }
    }

    // ============================================
    // GENERACIÓN NORMAL
    // ============================================

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const texto = response.output_text || "";

    // Intentar extraer JSON aunque venga con texto alrededor
    const match = texto.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        const posibleJson = JSON.parse(match[0]);

        if (posibleJson?.Empresa) {
          ultimoProspecto = posibleJson;
        }

      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      reply: texto,
    });

  } catch {
    return NextResponse.json(
      { reply: "ERROR DEL SERVIDOR" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Lisa API activa",
  });
}
