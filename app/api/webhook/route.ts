import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const googleUrl = process.env.GOOGLE_WEBHOOK_URL;

    if (!googleUrl) {
      return NextResponse.json(
        {
          saved: false,
          where: "webhook-route",
          error: "Falta GOOGLE_WEBHOOK_URL en .env.local"
        },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const params = new URLSearchParams();

    for (const [k, v] of form.entries()) {
      params.append(String(k), String(v));
    }

    const body = params.toString();

    console.log("➡️ Enviando a Google:", body);

    const r = await fetch(googleUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body
    });

    const raw = await r.text();

    console.log("⬅️ Respuesta cruda de Google:", raw);
    console.log("Status:", r.status);

    let parsed: any = null;

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    if (!r.ok) {
      return NextResponse.json(
        {
          saved: false,
          where: "google-webhook",
          status: r.status,
          error: parsed?.error || raw || "Google respondió error"
        },
        { status: 500 }
      );
    }

    if (parsed && parsed.saved === false) {
      return NextResponse.json(
        {
          saved: false,
          where: "apps-script",
          status: r.status,
          error: parsed.error || "Apps Script devolvió saved:false",
          details: parsed
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        saved: true,
        where: "ok",
        status: r.status,
        raw,
        parsed
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        saved: false,
        where: "catch-webhook-route",
        error: err?.message || "Error desconocido"
      },
      { status: 500 }
    );
  }
}