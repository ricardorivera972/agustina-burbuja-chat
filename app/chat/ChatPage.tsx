"use client";

import { useState } from "react";

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

type Msg = {
  who: "YO" | "LISA";
  text: string;
  prospect?: Prospect;
};

function wantsSave(text: string) {
  const t = text.toLowerCase().trim();
  return t === "si" || t === "sí";
}

function wantsNo(text: string) {
  const t = text.toLowerCase().trim();
  return t === "no";
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
    const first = reply.indexOf("{");
    const last = reply.lastIndexOf("}");
    if (first === -1 || last === -1) return null;

    const obj = JSON.parse(reply.slice(first, last + 1));
    const empresa = pick(obj, "Empresa");
    if (!empresa) return null;

    return {
      empresa,
      rubro: pick(obj, "Rubro"),
      ubicacion: pick(obj, "Ubicacion", "Ubicación"),
      web: pick(obj, "Web oficial"),
      telefono_institucional: pick(obj, "Telefono institucional"),
      email_institucional: pick(obj, "Email institucional"),
      mensaje_inicial: pick(obj, "Mensaje inicial sugerido"),
      cargo_sugerido: pick(obj, "Cargo sugerido"),
      area_sugerida: pick(obj, "Area sugerida"),
      telefono_sugerido: pick(obj, "Telefono sugerido"),
      mail_sugerido: pick(obj, "Mail sugerido"),
    };
  } catch {
    return null;
  }
}

function extractAfterJson(reply: string) {
  const last = reply.lastIndexOf("}");
  if (last === -1) return reply.trim();
  return reply.slice(last + 1).trim();
}

function cleanPhone(v?: string) {
  if (!v) return "";
  const digits = v.replace(/\D/g, "");

  if (digits.length < 8) return "";
  if (/123456/.test(digits)) return "";
  if (/(\d)\1{5,}/.test(digits)) return "";

  return digits;
}

function normalizeFront(p: Prospect): Prospect {
  const telInst = cleanPhone(p.telefono_institucional);
  const telSug = cleanPhone(p.telefono_sugerido);

  p.telefono_institucional = telInst;

  if (telInst && telSug && telInst === telSug) {
    p.telefono_sugerido = "";
  }

  const mailInst = (p.email_institucional || "").trim().toLowerCase();
  const mailSug = (p.mail_sugerido || "").trim().toLowerCase();

  if (mailInst && mailSug && mailInst === mailSug) {
    p.mail_sugerido = "";
  }

  return p;
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

    /* =================================
       GUARDAR PROSPECTO
    ================================= */

    if (pendingProspect && wantsSave(text)) {

      try {

        const payload = {
          Empresa: pendingProspect.empresa,
          Rubro: pendingProspect.rubro,
          Ubicacion: pendingProspect.ubicacion,
          Web: pendingProspect.web,
          Mensaje: pendingProspect.mensaje_inicial,
          "Cargo sugerido": pendingProspect.cargo_sugerido || "",
          "Area sugerida": pendingProspect.area_sugerida || ""
        };

        const r = await fetch("/api/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const result = await r.json();

        console.log("Respuesta webhook:", result);

        setPendingProspect(null);

        if (result.saved) {

          setMsgs((m) => [
            ...m,
            { who: "LISA", text: "Prospecto guardado correctamente en la planilla." }
          ]);

        } else {

          setMsgs((m) => [
            ...m,
            {
              who: "LISA",
              text:
                "Error al guardar el prospecto.\n\n" +
                "Dónde falló: " + (result.where || "desconocido") + "\n" +
                "Detalle: " + (result.error || JSON.stringify(result))
            }
          ]);

        }

      } catch (err: any) {

        setMsgs((m) => [
          ...m,
          {
            who: "LISA",
            text:
              "Error de conexión con el servidor.\n\n" +
              (err?.message || "Error desconocido")
          }
        ]);

      }

      return;
    }

    if (pendingProspect && wantsNo(text)) {
      setPendingProspect(null);
      setMsgs((m) => [...m, { who: "LISA", text: "Prospecto descartado." }]);
      return;
    }

    /* =================================
       CONSULTA NORMAL A LISA
    ================================= */

    const r = await fetch("/api/lisa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await r.json();
    const parsed = extractJson(data.reply);

    if (parsed) {
      const clean = normalizeFront(parsed);
      setPendingProspect(clean);

      const comercial = extractAfterJson(data.reply);

      setMsgs((m) => [
        ...m,
        { who: "LISA", text: "", prospect: clean },
        ...(comercial ? [{ who: "LISA", text: comercial }] : []),
      ]);
      return;
    }

    setMsgs((m) => [...m, { who: "LISA", text: data.reply }]);
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Lisa</h1>

      <div style={{ marginTop: 20 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <b>{m.who}:</b>

            {m.prospect ? (
              <div
                style={{
                  marginTop: 10,
                  padding: 20,
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  background: "#f9f9f9",
                }}
              >
                <h2 style={{ margin: 0 }}>{m.prospect.empresa}</h2>

                {m.prospect.rubro && (
                  <p><b>Rubro:</b> {m.prospect.rubro}</p>
                )}

                {m.prospect.ubicacion && (
                  <p><b>Ubicación:</b> {m.prospect.ubicacion}</p>
                )}

                {m.prospect.web && (
                  <p>
                    <b>Web oficial:</b>{" "}
                    <a href={m.prospect.web} target="_blank">
                      {m.prospect.web}
                    </a>
                  </p>
                )}

                <hr />

                {m.prospect.cargo_sugerido && (
                  <p><b>Cargo sugerido:</b> {m.prospect.cargo_sugerido}</p>
                )}

                {m.prospect.area_sugerida && (
                  <p><b>Área sugerida:</b> {m.prospect.area_sugerida}</p>
                )}

                {m.prospect.mensaje_inicial && (
                  <>
                    <hr />
                    <p><b>Mensaje inicial sugerido:</b></p>
                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {m.prospect.mensaje_inicial}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div style={{ whiteSpace: "pre-wrap", marginTop: 5 }}>
                {m.text}
              </div>
            )}
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