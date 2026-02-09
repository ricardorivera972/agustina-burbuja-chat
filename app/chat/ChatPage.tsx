"use client";

import { useState } from "react";

const SHEETS_WEBHOOK_URL = "/api/webhook";

type Msg = { who: "YO" | "LISA"; text: string };

type Prospect = {
  empresa: string;
  rubro: string;
  ubicacion: string;
  web: string;
  telefono_institucional: string;
  email_institucional: string;
  mensaje_inicial: string;

  cargo_sugerido?: string;
  area_sugerida?: string;
  telefono_sugerido?: string;
  mail_sugerido?: string;
};

function wantsSave(text: string) {
  const t = text.toLowerCase();
  return (
    t.includes("si") ||
    t.includes("guard") ||
    t.includes("dale") ||
    t.includes("ok") ||
    t.includes("perfecto")
  );
}

function wantsCancel(text: string) {
  return text.trim().toLowerCase() === "no";
}

/* 🔥 FUNCIÓN CLAVE — BLINDADA */
function pick(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") {
      return String(obj[k]).trim();
    }
  }
  return "";
}

function extractJson(reply: string): Prospect | null {
  try {
    const obj = JSON.parse(reply);

    return {
      empresa: pick(obj, "Empresa"),
      rubro: pick(obj, "Rubro"),

      ubicacion: pick(obj, "Ubicacion", "Ubicación"),

      web: pick(obj, "Web oficial"),

      telefono_institucional: pick(
        obj,
        "Telefono institucional",
        "Teléfono institucional"
      ),

      email_institucional: pick(obj, "Email institucional"),

      mensaje_inicial: pick(obj, "Mensaje inicial sugerido"),

      cargo_sugerido: pick(obj, "Cargo sugerido"),

      // 🔥 LOS QUE FALLABAN
      area_sugerida: pick(obj, "Area sugerida", "Área sugerida"),

      telefono_sugerido: pick(
        obj,
        "Telefono sugerido",
        "Teléfono sugerido"
      ),

      mail_sugerido: pick(
        obj,
        "Mail sugerido",
        "Email sugerido"
      ),
    };
  } catch {
    return null;
  }
}

function formatProspect(p: Prospect) {
  return `Empresa: ${p.empresa}
Rubro: ${p.rubro}
Ubicación: ${p.ubicacion}
Web: ${p.web}
Teléfono institucional: ${p.telefono_institucional}
Email institucional: ${p.email_institucional}

Mensaje inicial:
${p.mensaje_inicial}

Cargo sugerido: ${p.cargo_sugerido || "-"}
Área sugerida: ${p.area_sugerida || "-"}
Teléfono sugerido: ${p.telefono_sugerido || "-"}
Mail sugerido: ${p.mail_sugerido || "-"}`;
}

async function saveProspect(p: Prospect) {
  const params = new URLSearchParams();

  params.append("Empresa", p.empresa);
  params.append("Rubro", p.rubro);
  params.append("Ubicacion", p.ubicacion);
  params.append("Web oficial", p.web);
  params.append("Telefono institucional", p.telefono_institucional);
  params.append("Email institucional", p.email_institucional);
  params.append("Mensaje inicial sugerido", p.mensaje_inicial);

  params.append("Cargo sugerido", p.cargo_sugerido || "");
  params.append("Area sugerida", p.area_sugerida || "");
  params.append("Telefono sugerido", p.telefono_sugerido || "");
  params.append("Mail sugerido", p.mail_sugerido || "");

  const res = await fetch(SHEETS_WEBHOOK_URL, {
    method: "POST",
    body: params,
  });

  const data = await res.json();
  return data?.ok === true;
}

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pendingProspect, setPendingProspect] = useState<Prospect | null>(null);

  async function send() {
    const text = input.trim();
    if (!text) return;

    setMsgs((m) => [...m, { who: "YO", text }]);
    setInput("");

    try {
      if (pendingProspect) {
        if (wantsSave(text)) {
          const ok = await saveProspect(pendingProspect);

          setMsgs((m) => [
            ...m,
            {
              who: "LISA",
              text: ok
                ? "Prospecto guardado correctamente en la planilla."
                : "No pude guardarlo.",
            },
          ]);

          setPendingProspect(null);
          return;
        }

        if (wantsCancel(text)) {
          setMsgs((m) => [
            ...m,
            {
              who: "LISA",
              text: "Perfecto. Lo dejamos en espera.",
            },
          ]);
          return;
        }
      }

      const r = await fetch("/api/lisa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await r.json();
      const parsed = extractJson(data.reply);

      if (parsed) {
        setPendingProspect(parsed);

        setMsgs((m) => [
          ...m,
          { who: "LISA", text: formatProspect(parsed) },
          {
            who: "LISA",
            text: "¿Querés guardar este prospecto en la planilla?",
          },
        ]);

        return;
      }

      setMsgs((m) => [...m, { who: "LISA", text: data.reply }]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          who: "LISA",
          text: "Error inesperado.",
        },
      ]);
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Lisa</h1>

      <div style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>
        {msgs.map((m, i) => (
          <div key={i}>
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
        <button onClick={send}>Enviar</button>
      </div>
    </div>
  );
}
