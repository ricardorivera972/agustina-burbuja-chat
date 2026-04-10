"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  who: "YO" | "SISTEMA";
  text: string;
};

export default function ChatUI() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setOpen(true);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showForm]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();

    setMessages((prev) => [...prev, { who: "YO", text: userMessage }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/agustina", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (data.reply) {
        const tieneFormulario = data.reply.includes("[FORMULARIO]");

        if (tieneFormulario) {
          setShowForm(true);
          const cleanText = data.reply.replace("[FORMULARIO]", "").trim();
          setMessages((prev) => [...prev, { who: "SISTEMA", text: cleanText }]);
        } else {
          setMessages((prev) => [...prev, { who: "SISTEMA", text: data.reply }]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { who: "SISTEMA", text: "Sin respuesta del servidor" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { who: "SISTEMA", text: "Error de conexión" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const chatBoxStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        background: "#fff",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
      }
    : {
        position: "fixed",
        right: 20,
        bottom: 20,
        width: 360,
        height: 520,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 12px 32px rgba(0,0,0,0.20)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      };

  return (
    <>
      {!isMobile && !open && (
        <div
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#2563eb",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            cursor: "pointer",
            zIndex: 9999,
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          }}
        >
          💬
        </div>
      )}

      {(open || isMobile) && (
        <div style={chatBoxStyle}>
          {/* HEADER */}
          <div
            style={{
              background: "#2563eb",
              color: "#fff",
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 700,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            <span>Agustina</span>
            {!isMobile && (
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* MENSAJES */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 14,
              background: "#fafafa",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  color: "#000",
                }}
              >
                Hola, ¿en qué puedo ayudarte hoy?
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  padding: 12,
                  borderRadius: 10,
                  background: msg.who === "YO" ? "#dbeafe" : "#fff",
                  border: "1px solid #e5e5e5",
                  whiteSpace: "pre-line",
                  color: "#000",
                }}
              >
                <strong>{msg.who === "YO" ? "Vos:" : "Agustina:"}</strong>
                <br />
                {msg.text}
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px",
              borderTop: "1px solid #e5e5e5",
              background: "#fff",
              flexShrink: 0,
              position: "sticky",
              bottom: 0,
            }}
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribí..."
              style={{
                flex: 1,
                padding: "14px",
                fontSize: 16,
                border: "1px solid #d0d0d0",
                borderRadius: 8,
                outline: "none",
                color: "#000",        // 🔥 FIX
                background: "#fff",   // 🔥 FIX
              }}
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                padding: "12px 16px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                minWidth: 80,
              }}
            >
              {loading ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}