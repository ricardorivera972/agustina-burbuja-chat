import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `
Sos LISA PRO, asistente comercial industrial de LASERTEC INGENIERÍA.

LASERTEC realiza:
• corte por láser
• plegado
• soldadura
• pintura
• armado de conjuntos metálicos

COMPORTAMIENTO:

1. Si el usuario saluda o escribe algo general (ej: "hola", "buen día"):
Responder como asistente humano.

Ejemplo:
"Hola, soy Lisa de Lasertec 👋  
Puedo ayudarte a detectar empresas que necesiten servicios metalmecánicos.  
Pasame el nombre de una empresa o un rubro y lo analizamos."

2. Solo si el usuario muestra intención comercial clara:
Generar un prospecto.

3. NUNCA generar prospectos automáticamente sin contexto.

4. SOLO cuando haya intención clara, responder con este JSON:

{
  "Empresa": "",
  "Rubro": "",
  "Actividad detallada": "",
  "Nivel de compatibilidad": "",
  "Justificación compatibilidad": "",
  "Ubicacion": "",
  "Web oficial": "",
  "Mensaje inicial sugerido": "",
  "Cargo sugerido": "",
  "Area sugerida": ""
}

5. En cualquier otro caso, responder como asistente conversacional.

REGLAS:
- No inventar datos
- No incluir teléfono
- No incluir email
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
  return (
    t === "hola" ||
    t === "buen día" ||
    t === "buenos dias" ||
    t === "buenas" ||
    t === "hola lisa"
  );
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

    if (!r.ok) {
      throw new Error("Sheets respondió error");
    }

    return true;
  } catch (err) {
    console.error("Error guardando en Sheets:", err);
    return false;
  }
}

function generarAnalisis(p: any) {
  const empresa = p["Empresa"] || "";
  const rubro = p["Rubro"] || "";
  const compat = p["Nivel de compatibilidad"] || "MEDIA";
  const motivo = p["Justificación compatibilidad"] || "";

  return `
ANÁLISIS DE OPORTUNIDAD COMERCIAL

Empresa analizada: ${empresa}
Sector: ${rubro}

Compatibilidad con Lasertec
${compat}

Motivo:
${motivo}

---

PROPUESTA COMERCIAL SUGERIDA:
Ofrecer servicios de corte por láser, plegado y fabricación de piezas o subconjuntos metálicos.

---

ESTRATEGIA RECOMENDADA:
Abordaje técnico y consultivo.

---

PLAN DE ACCIÓN:
1. Buscar perfiles en LinkedIn
2. Conectar
3. Conversación técnica
4. Seguimiento

---

MENSAJE INICIAL SUGERIDO:

Hola, ¿cómo estás?
Estuve viendo ${empresa} y el tipo de trabajos que manejan.

Trabajo con una empresa metalúrgica enfocada en corte láser y fabricación.
Me interesaba conectar para conocer cómo están resolviendo procesos productivos.

Saludos.
`;
}

function formatearProspecto(p: any) {
  return `
PROSPECTO DETECTADO

Empresa: ${p["Empresa"] || ""}
Rubro: ${p["Rubro"] || ""}
Actividad: ${p["Actividad detallada"] || ""}

Ubicación: ${p["Ubicacion"] || ""}
Web oficial: ${p["Web oficial"] || ""}

Mensaje inicial sugerido:
${p["Mensaje inicial sugerido"] || ""}

Cargo sugerido: ${p["Cargo sugerido"] || ""}
Área sugerida: ${p["Area sugerida"] || ""}
`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body?.message ?? "";

    // 🔥 SALUDO COMERCIAL
    if (esSaludo(userMessage)) {
      return NextResponse.json({
        reply:
          "Hola, soy Lisa 👋\n\n" +
          "Puedo ayudarte a detectar empresas que necesiten servicios de corte láser, plegado y fabricación metalmecánica.\n\n" +
          "Pasame el nombre de una empresa o un rubro y lo analizamos.",
      });
    }

    // 🔥 GUARDAR
    if (ultimoProspecto && esGuardar(userMessage)) {
      const payload = {
        Empresa: ultimoProspecto["Empresa"] || "",
        Rubro: ultimoProspecto["Rubro"] || "",
        Ubicacion: ultimoProspecto["Ubicacion"] || "",
        "Web oficial": ultimoProspecto["Web oficial"] || "",
        "Mensaje inicial sugerido":
          ultimoProspecto["Mensaje inicial sugerido"] || "",
        Fecha: "",
        "Cargo sugerido": ultimoProspecto["Cargo sugerido"] || "",
        "Area sugerida": ultimoProspecto["Area sugerida"] || "",
      };

      const guardado = await guardarEnSheets(
        SHEETS_WEBHOOK_URL,
        payload
      );

      ultimoProspecto = null;

      return NextResponse.json({
        reply: guardado
          ? "Prospecto guardado correctamente en la planilla."
          : "Error al guardar el prospecto.",
      });
    }

    // 🔥 DESCARTAR
    if (ultimoProspecto && esNo(userMessage)) {
      ultimoProspecto = null;
      return NextResponse.json({
        reply: "Prospecto descartado.",
      });
    }

    // 🔥 CONSULTA A OPENAI
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

    // 🔥 SI DETECTA PROSPECTO
    if (prospecto?.Empresa) {
      ultimoProspecto = prospecto;

      const prospectoTxt = formatearProspecto(prospecto);
      const analisis = generarAnalisis(prospecto);

      return NextResponse.json({
        reply:
          prospectoTxt +
          "\n" +
          analisis +
          "\nDetecté una oportunidad interesante 👇\n\n¿Querés guardarla para seguimiento?",
      });
    }

    return NextResponse.json({
      reply: content,
    });
  } catch (err) {
    console.error("ERROR BACKEND:", err);

    return NextResponse.json(
      { reply: "ERROR SERVIDOR" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}