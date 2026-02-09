import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    return NextResponse.json({
      ok: true,
      mensaje: "Lisa API viva",
      recibido: body,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Error leyendo el body",
      },
      { status: 400 }
    );
  }
}
