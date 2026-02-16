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

/* 🔥 DETECCIÓN DE GUARDADO — ROBUSTA */
function wantsSave(text: string) {
  const t = text.toLowerCase().trim();

  return (
    t === "si" ||
    t === "sí" ||
    t === "ok" ||
    t === "dale" ||
    t === "perfecto" ||
    t.includes("carg") ||
    t.includes("guard") ||
    t.includes("regist") ||
    t.includes("agreg") ||
    t.includes("sum") ||
    t.includes("asign") ||
    t.includes("planilla")
  );
}

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
    let clean = reply.trim();

    const match = clean.match(/```json([\s\S]*?)```/i);

    if (match) {
      clean = match[1].trim();
    } else {
      const first = clean.indexOf("{");
      const last = clean.lastIndexOf("}");

      if (first !== -1 && last !== -1) {
        clean = clean.slice(first, last + 1);
      }
    }

    const obj = JSON.parse(clean);

    const empresa = pick(obj, "Empresa");
    if (!empresa) return null;

    return {
      empresa,
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
      area_sugerida: pick(obj, "Area sugerida", "Área sugerida"),
      telefono_sugerido: pick(obj, "Telefono sugerido", "Teléfono sugerido"),
      mail_sugerido: pick(obj, "Mail sugerido", "Email sugerido"),
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

/* 🔥 NUEVO — ahora entiende saved / duplicated */
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

  return {
    saved: data?.saved === true,
    duplicated: data?.duplicated === true,
  };
}

function buildContextMessage(userText: string, p: Prospect) {
  return `Estamos analizando ESTA empresa:

Empresa: ${p.empresa}
Rubro: ${p.rubro}
Ubicación: ${p.ubicacion}

Respondé la pregunta del usuario SIN reiniciar el análisis ni generar otra empresa.

Pregunta:
${userText}`;
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
      /* 🔥 GUARDADO PROFESIONAL */
      if (pendingProspect && wantsSave(text)) {
        const result = await saveProspect(pendingProspect);

        let message = "No se pudo guardar el prospecto.";

        if (result.saved) {
          message = "Listo. Prospecto guardado en la planilla.";
        } 
        else if (result.duplicated) {
          message = "Este prospecto ya estaba cargado en la planilla.";
        }

        setMsgs((m) => [
          ...m,
          {
            who: "LISA",
            text: message,
          },
        ]);

        return;
      }

      const messageToSend = pendingProspect
        ? buildContextMessage(text, pendingProspect)
        : text;

      const r = await fetch("/api/lisa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
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
            text:
              "¿Qué preferís hacer ahora?\n" +
              "- Analizamos si este prospecto es viable para LASERTEC\n" +
              "- Lo cargamos directamente en la planilla\n" +
              "- O lo descartamos y buscamos otro",
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
