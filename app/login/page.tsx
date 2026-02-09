"use client";

import { useState } from "react";



type Msg = { who: "YO" | "LISA"; text: string };

function isYes(text: string) {
  const t = (text || "").trim().toLowerCase();
  return t === "si" || t === "sí" || t === "s" || t === "ok" || t === "dale";
}

function extractJson(reply: string) {
  const start = reply.indexOf("{");
  const end = reply.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  const raw = reply.slice(start, end + 1);
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    return obj as any;
  } catch {
    return null;
  }
}

function fichaProspecto(p: any) {
  const empresa = p?.empresa || "No verificado";
  const contacto = p?.contacto || "No verificado";
  const cargo = p?.cargo || "No verificado";
  const telefono = p?.telefono || "No verificado";
  const email = p?.email || "No verificado";
  const industria = p?.industria || "No verificado";
  const ubicacion = p?.ubicacion || "No verificado";

  return (
    `PROSPECTO DETECTADO:\n` +
    `Empresa: ${empresa}\n` +
    `Contacto: ${contacto}\n` +
    `Cargo: ${cargo}\n` +
    `Teléfono: ${telefono}\n` +
    `Email: ${email}\n` +
    `Industria: ${industria}\n` +
    `Ubicación: ${ubicacion}`
  );
}

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");

  async function send() {
    const text = input.trim();
    if (!text) return;

    setMsgs((m) => [...m, { who: "YO", text }]);
    setInput("");

    // SI = CARGAR ÚLTIMO PROSPECTO
    if (isYes(text)) {
      const last = localStorage.getItem("last_prospect_json");
      if (!last) {
        setMsgs((m) => [...m, { who: "LISA", text: "No hay prospecto para cargar." }]);
        return;
      }

      let p: any;
      try {
        p = JSON.parse(last);
      } catch {
        setMsgs((m) => [...m, { who: "LISA", text: "El prospecto guardado está roto. Pedí otro." }]);
        return;
      }

      // Si no hay empresa, no cargamos
      const empresa = (p?.empresa || "").trim();
      if (!empresa || empresa.toLowerCase() === "no verificado") {
        setMsgs((m) => [
          ...m,
          { who: "LISA", text: "No puedo cargar porque falta el nombre de la empresa. Pedime otro prospecto." },
        ]);
        return;
      }

      const res = await fetch(SHEETS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Empresa: p.empresa || "No verificado",
          Contacto: p.contacto || "No verificado",
          Cargo: p.cargo || "No verificado",
          Telefono: p.telefono || "No verificado",
          Email: p.email || "No verificado",
          Industria: p.industria || "No verificado",
          Ubicacion: p.ubicacion || "No verificado",
          Fecha: new Date().toLocaleDateString("es-AR"),
          Estado: "Nuevo",
        }),
      });

      const txt = await res.text().catch(() => "");

      if (res.ok) {
        setMsgs((m) => [...m, { who: "LISA", text: "✅ Cargado en la planilla." }]);
      } else {
        setMsgs((m) => [
          ...m,
          { who: "LISA", text: `⚠️ No se cargó. (HTTP ${res.status})` },
          { who: "LISA", text: txt ? `Respuesta del webhook: ${txt}` : "Sin respuesta del webhook." },
        ]);
      }
      return;
    }

    // MENSAJE NORMAL
    const r = await fetch("/api/lisa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await r.json();
    const reply: string = data?.reply || "";

    const parsed = extractJson(reply);

    // Siempre mostramos el texto (sin el JSON)
    if (parsed) {
      localStorage.setItem("last_prospect_json", JSON.stringify(parsed));

      setMsgs((m) => [
        ...m,
        { who: "LISA", text: reply.slice(0, reply.indexOf("{")).trim() || "OK." },
        { who: "LISA", text: fichaProspecto(parsed) },
        { who: "LISA", text: "¿Querés cargar este prospecto? (sí / no)" },
      ]);
    } else {
      setMsgs((m) => [...m, { who: "LISA", text: reply || "Sin respuesta." }]);
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Lisa</h1>

      <div style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <b>{m.who}:</b> {m.text}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: 10 }}
          placeholder="Escribí acá…"
        />
        <button onClick={send} style={{ padding: "10px 16px" }}>
          Enviar
        </button>
      </div>
    </div>
  );
}
