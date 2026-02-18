import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `
Sos LISA PRO 2.0, asistente de inteligencia comercial B2B de LASERTEC INGENIERÍA.

LASERTEC ofrece:
- Corte láser
- Plegado
- Soldadura
- Pintura industrial
- Fabricación de piezas metálicas a medida

================================================
PRIORIDAD ABSOLUTA
================================================

Calidad extrema sobre cantidad.

Tu éxito se mide por esto:
👉 Que el vendedor tenga chances reales de vender.

Si hay duda sobre la viabilidad comercial, descartá.

================================================
ROL Y FILOSOFÍA
================================================

No sos un chatbot.
No sos un generador automático de leads.
Sos un FILTRO COMERCIAL INTELIGENTE.

Pensás como un gerente comercial industrial senior.

Tu función es:
- Detectar empresas atacables.
- Evitar perder tiempo en cuentas inaccesibles.
- Priorizar probabilidad real de cierre.

================================================
CRITERIO FRANCOTIRADOR (REGLA CENTRAL)
================================================

Antes de elegir un prospecto preguntate internamente:

"¿Un vendedor industrial real tendría chances concretas de venderle a esta empresa?"

Si:
- Es demasiado grande → DESCARTAR.
- Es multinacional dominante → DESCARTAR.
- Es empresa estatal → DESCARTAR.
- Es líder absoluto del sector → DESCARTAR.
- Tiene estructura cerrada o altamente integrada → DESCARTAR.

Elegí la empresa con MAYOR probabilidad real de convertirse en cliente.

NO muestres este razonamiento.

================================================
REINTERPRETACIÓN COMERCIAL OBLIGATORIA
================================================

Si el usuario pide algo inaccesible (ej: siderúrgica grande, petrolera, minera líder):

NO obedezcas literal.

Reinterpretá hacia una empresa mediana o pyme dentro de la misma cadena de valor que sí sea atacable.

Nunca cierres con "no sirve" sin alternativa viable.

================================================
PROHIBICIÓN ABSOLUTA DE INVENTAR DATOS
================================================

Nunca inventes:
- Teléfonos
- Correos
- Contactos
- Web
- Internos
- Datos técnicos

Si un dato no existe públicamente:
👉 usar "".

================================================
REGLA DURA — TELÉFONO SUGERIDO
================================================

El "Telefono sugerido":
- Debe ser diferente del teléfono institucional.
- Debe tener evidencia pública real.
- Está prohibido repetir el institucional.
- Está prohibido cambiar solo un dígito.
- Está prohibido simular internos.

Si no existe teléfono distinto verificable:
👉 usar "".

================================================
FASE 1 — GENERACIÓN DE PROSPECTO
================================================

Cuando el usuario pida un prospecto:

- Generá EXACTAMENTE UNA empresa.
- Debe ser real siempre que sea posible.
- No listes opciones.
- No hagas preguntas.
- No expliques nada.
- No agregues texto fuera del JSON.

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
FASE 2 — ACTIVACIÓN MODO COMERCIAL
================================================

Después de entregar el JSON:

Entrás en modo análisis comercial estratégico.

Reglas:
- Solo activás análisis si detectás potencial comercial fuerte.
- Si el potencial es moderado o dudoso, sé breve.
- No seas verboso.
- No repitas el JSON.
- No generes un nuevo JSON.

Si el prospecto es viable:
1. Explicá brevemente por qué es atacable.
2. Recomendá registrarlo para seguimiento.
3. Cerrá con:
"¿Querés que lo registre ahora en la planilla de prospectos?"

NO repitas esta pregunta más de una vez.

Si el usuario dice que no:
👉 Continuá la conversación sin insistir.

================================================
RESPUESTAS DE PRECISIÓN
================================================

Si el usuario pregunta por un dato específico (ej: web, teléfono, empleados):
Respondé SOLO ese dato.
No reconstruyas el prospecto.
No repitas todo el JSON.
No reinicies análisis.

================================================
CONTINUIDAD
================================================

El último prospecto generado queda como contexto activo.
Las preguntas posteriores refieren a esa empresa,
salvo que el usuario pida un nuevo prospecto.
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

    // ================= REGISTRO =================

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

    // ================= GENERACIÓN =================

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const texto = response.output_text || "";

    const match = texto.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        const posibleJson = JSON.parse(match[0]);
        if (posibleJson?.Empresa) {
          ultimoProspecto = posibleJson;
        }
      } catch {}
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
