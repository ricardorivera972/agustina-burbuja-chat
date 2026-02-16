import { NextResponse } from "next/server";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwcveUls1-w3UJ1l92p-SiF108YAJBlqjOYW5b02ozzM2nSn1jNjKV2mgGlAIwnsAtFiQ/exec";

export async function GET() {
  return NextResponse.json({
    ok: true,
    apps_script_url_used: APPS_SCRIPT_URL,
  });
}

export async function POST(req: Request) {
  try {
    let payload: any;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const form = await req.formData();
      payload = Object.fromEntries(form.entries());
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let response;

    try {
      response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: new URLSearchParams(payload),
        signal: controller.signal,
      });
    } catch {
      return NextResponse.json({
        ok: false,
        duplicated: false,
        saved: false,
        message:
          "No se pudo conectar con la planilla. Intentá nuevamente.",
      });
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text();

    if (!text || text.trim() === "") {
      return NextResponse.json({
        ok: false,
        duplicated: false,
        saved: false,
        message:
          "La planilla no respondió correctamente.",
      });
    }

    try {
      const parsed = JSON.parse(text);

      if (parsed?.status === "EXISTS") {
        return NextResponse.json({
          ok: true,
          duplicated: true,
          saved: false,
          message:
            "Este prospecto ya estaba cargado en la planilla.",
        });
      }

      if (parsed?.status === "SAVED") {
        return NextResponse.json({
          ok: true,
          duplicated: false,
          saved: true,
          message:
            "Prospecto guardado correctamente.",
        });
      }

      return NextResponse.json({
        ok: false,
        duplicated: false,
        saved: false,
        message:
          "La planilla respondió en un formato inesperado.",
      });

    } catch {
      return NextResponse.json({
        ok: false,
        duplicated: false,
        saved: false,
        message:
          "Respuesta inválida desde la planilla.",
      });
    }

  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        duplicated: false,
        saved: false,
        message:
          "Error interno del servidor.",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
