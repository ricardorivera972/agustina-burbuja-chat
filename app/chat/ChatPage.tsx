"use client";

import { useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const enviar = async () => {
    if (!input.trim()) return;

    const userMsg = "👤 " + input;
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/agustina", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const botMsg = "🤖 " + (data.reply || "Sin respuesta");

      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, "🤖 Error al responder"]);
    }

    setInput("");
  };

  return (
    <>
      {/* BURBUJA */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          background: "#2563eb",
          color: "#fff",
          borderRadius: "50%",
          width: 60,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 24,
          zIndex: 999
        }}
      >
        💬
      </div>

      {/* CHAT */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            right: 20,
            width: 320,
            height: 420,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 999
          }}
        >
          {/* HEADER */}
          <div
            style={{
              background: "#2563eb",
              color: "#fff",
              padding: 10,
              fontWeight: "bold"
            }}
          >
            Agustina
          </div>

          {/* MENSAJES */}
          <div
            style={{
              flex: 1,
              padding: 10,
              overflowY: "auto",
              fontSize: 14
            }}
          >
            {messages.length === 0 && (
              <div style={{ color: "#888" }}>
                Escribí tu consulta para comenzar...
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                {msg}
              </div>
            ))}
          </div>

          {/* INPUT */}
          <div style={{ display: "flex", borderTop: "1px solid #ccc" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí..."
              style={{
                flex: 1,
                padding: 10,
                border: "none",
                outline: "none"
              }}
            />

            <button
              onClick={enviar}
              style={{
                padding: "0 15px",
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer"
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}