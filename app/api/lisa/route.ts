import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `
Sos un evaluador de prospectos industriales de una empresa metalúrgica.

La empresa ofrece:

• corte por láser
• plegado
• soldadura
• pintura
• fabricación de piezas metálicas
• armado de conjuntos y subconjuntos

OBJETIVO:
Evaluar oportunidades comerciales reales.

---

COMPORTAMIENTO:

1. Si el usuario saluda:
Responder normal.

2. Si menciona empresa o rubro:
Intentar analizar directamente.

3. Si no se entiende la actividad:
Preguntar UNA sola vez:
"¿A qué se dedica la empresa?"

---

4. SI hay info suficiente:

👉 RESPONDER SOLO CON JSON (OBLIGATORIO)
👉 SIN TEXTO EXTRA

Formato:

{
  "Empresa": "",
  "Rubro": "",
  "Actividad detallada": "",
  "Nivel de compatibilidad": "ALTA | MEDIA | BAJA",
  "Justificación compatibilidad": "",
  "Ubicacion": "",
  "Web oficial": "",
  "Mensaje inicial sugerido": "",
  "Cargo sugerido": "",
  "Area sugerida": ""
}

---

PERFIL DE CLIENTE IDEAL:

Priorizar empresas que:

• sean industriales o productivas  
• trabajen con acero (carbono o inoxidable)  
• fabriquen maquinaria, estructuras o componentes metálicos  
• integren piezas metálicas  
• tengan producción continua  
• tercericen procesos  

• necesiten:
  - corte láser  
  - plegado  
  - soldadura  
  - pintura  
  - fabricación de piezas  
  - armado de conjuntos  

• busquen mejorar tiempos o calidad  
• valoren proveedores técnicos  

---

Evitar:

• empresas comerciales  
• software  
• servicios sin producción  
• grandes corporaciones  

---

CRITERIO:

ALTA → fabricación + metal + tercerización  
MEDIA → posible necesidad futura  
BAJA → sin relación industrial  

---

REGLAS:

- No inventar teléfono/email
- Inferir si es razonable
`;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwil6xY98evZU4bIUpr6stk1tx9B0c0FhS0GH_wZQOGUf8RsBY8C2jbqREMeS5-dipmMw/exec";

let ultimoProspecto: any = null;

function norm(text: string) {
  return (text || "").toLowerCase().trim();
}

function esGuardar(text: string) {
  const t = norm(text);
  return t === "si" || t === "sí" || t.includes("guardar");
}

function esNo(text: string) {
  return norm(text) === "no";
}

function esSaludo(text: string) {
  const t = norm(text);
  return t === "hola" || t === "buen día" || t === "buenas";
}

async function guardarEnSheets(url: string, payload: any) {
  try {
    const form = new URLSearchParams();

    for (const key in payload) {
      form.append(key, payload[key] || "");
    }

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    return r.ok;
  } catch {
    return false;
  }
}

function formatearProspecto(p: any) {
  return `
━━━━━━━━━━━━━━━━━━━━━━
🏢 DATOS DEL PROSPECTO
━━━━━━━━━━━━━━━━━━━━━━

Empresa: ${p["Empresa"] || ""}
Rubro: ${p["Rubro"] || ""}
Actividad: ${p["Actividad detallada"] || ""}

Ubicación: ${p["Ubicacion"] || ""}
Web oficial: ${p["Web oficial"] || ""}

Cargo sugerido: ${p["Cargo sugerido"] || ""}
Área sugerida: ${p["Area sugerida"] || ""}

✉️ Mensaje inicial sugerido:
${p["Mensaje inicial sugerido"] || ""}
`;
}

function generarAnalisis(p: any) {
  const empresa = p["Empresa"] || "";
  const rubro = p["Rubro"] || "";
  const compat = p["Nivel de compatibilidad"] || "";
  const motivo = p["Justificación compatibilidad"] || "";

  return `
━━━━━━━━━━━━━━━━━━━━━━
📊 ANÁLISIS DE OPORTUNIDAD
━━━━━━━━━━━━━━━━━━━━━━

🏢 Empresa: ${empresa}
🏭 Rubro: ${rubro}

🔎 Compatibilidad: ${compat}

🧠 Motivo:
${motivo}

━━━━━━━━━━━━━━━━━━━━━━
💡 PROPUESTA COMERCIAL
━━━━━━━━━━━━━━━━━━━━━━

Ofrecer servicios de:

• corte por láser  
• plegado  
• soldadura  
• pintura  
• fabricación de piezas  
• armado de conjuntos  

━━━━━━━━━━━━━━━━━━━━━━
📈 ESTRATEGIA RECOMENDADA
━━━━━━━━━━━━━━━━━━━━━━

Abordaje técnico y consultivo.
Detectar necesidades productivas y ofrecer mejoras en costos, tiempos o calidad.

━━━━━━━━━━━━━━━━━━━━━━
🚀 PLAN DE ACCIÓN
━━━━━━━━━━━━━━━━━━━━━━

1. Buscar responsables en LinkedIn  
2. Conectar  
3. Iniciar conversación técnica  
4. Detectar necesidad  
5. Proponer solución  
`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body?.message ?? "";

    if (esSaludo(userMessage)) {
      return NextResponse.json({
        reply: "Hola 👋 Pasame una empresa y la evaluamos.",
      });
    }

    if (ultimoProspecto && esGuardar(userMessage)) {
      const ok = await guardarEnSheets(SHEETS_WEBHOOK_URL, ultimoProspecto);
      ultimoProspecto = null;

      return NextResponse.json({
        reply: ok ? "Guardado correctamente." : "Error al guardar.",
      });
    }

    if (ultimoProspecto && esNo(userMessage)) {
      ultimoProspecto = null;
      return NextResponse.json({ reply: "Descartado." });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const content = completion.choices[0].message?.content || "";

    let prospecto = null;
    try {
      prospecto = JSON.parse(content);
    } catch {}

    if (prospecto?.Empresa) {
      ultimoProspecto = prospecto;

      return NextResponse.json({
        reply:
          formatearProspecto(prospecto) +
          "\n" +
          generarAnalisis(prospecto) +
          "\n¿Querés guardarla?",
      });
    }

    return NextResponse.json({ reply: content });
  } catch (err) {
    return NextResponse.json(
      { reply: "ERROR SERVIDOR" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}