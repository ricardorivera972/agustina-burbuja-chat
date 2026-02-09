import { NextResponse } from "next/server";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwsUCGrl7mda5qfpIenrNMh7R-_1bO6nnKUthPnehTs7UQLcdH2Cdc-S6l75LLhOZfkIQ/exec";

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

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: new URLSearchParams(payload),
    });

    const text = await response.text();

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      preview: text.slice(0, 120),
    });

  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
