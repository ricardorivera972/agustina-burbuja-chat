import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `
PEGÁ AQUÍ TU SYSTEM_PROMPT COMPLETO EXACTAMENTE COMO LO TENÍAS
SIN MODIFICAR NADA
`;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 memoria simple en runtime
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
    // 🔥 REGISTRO EN GOOGLE SHEETS
    // ============================================

    if (
      userMessage.toLowerCase().includes("registr")
      && ultimoProspecto
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
    // 🔥 GENERACIÓN NORMAL CON OPENAI
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

    // ============================================
    // 🔥 DETECCIÓN AUTOMÁTICA DE JSON DE PROSPECTO
    // ============================================

    try {
      const posibleJson = JSON.parse(texto);

      if (
        posibleJson &&
        typeof posibleJson === "object" &&
        posibleJson.Empresa
      ) {
        ultimoProspecto = posibleJson;
      }

    } catch {
      // No era JSON válido, no hacemos nada
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
