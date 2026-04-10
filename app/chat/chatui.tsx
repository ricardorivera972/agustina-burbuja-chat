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
        const tieneFormulario = data.reply
          ?.toUpperCase()
          .includes("[FORMULARIO]");

        if (tieneFormulario) {
          setShowForm(true);

          const cleanText = data.reply
            .replace(/\[FORMULARIO\]/gi, "")
            .trim();

          setMessages((prev) => [
            ...prev,
            { who: "SISTEMA", text: cleanText },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { who: "SISTEMA", text: data.reply },
          ]);
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
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 14 }}>
                Vendedor digital para servicios metalúrgicos
              </span>
              <span style={{ fontSize: 11, opacity: 0.9 }}>
                Detecta oportunidades de corte, plegado y soldadura y carga automáticamente los datos del cliente
              </span>
            </div>

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
                Hola, puedo ayudarte con consultas sobre nuestros servicios o, si necesitás cotizar un trabajo de corte, plegado o soldadura, contame los detalles y lo gestionamos.
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

            {showForm && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 10,
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                }}
              >
                <b>Completar datos</b>

                <input id="empresa" placeholder="Empresa" style={inputStyle} />
                <input id="nombre" placeholder="Nombre" style={inputStyle} />
                <input id="contacto" placeholder="Teléfono o email" style={inputStyle} />
                <textarea id="detalle" placeholder="Detalle" style={inputStyle} />

                <button
                  onClick={async () => {
                    const contacto = (document.getElementById("contacto") as HTMLInputElement).value;
                    const esEmail = contacto.includes("@");

                    const formData = {
                      empresa: (document.getElementById("empresa") as HTMLInputElement).value,
                      nombre: (document.getElementById("nombre") as HTMLInputElement).value,
                      email: esEmail ? contacto : "",
                      telefono: esEmail ? "" : contacto,
                      descripcion: (document.getElementById("detalle") as HTMLTextAreaElement).value,
                    };

                    try {
                      await fetch("https://script.google.com/macros/s/AKfycbxJ4ZFemcLehp14FTYLgp0frs72utzPxXhxrxxnuhCgzJH-fTCiHtJqQJd5P788_f6yIw/exec", {
                        method: "POST",
                        mode: "no-cors",
                        body: JSON.stringify(formData),
                      });

                      alert("Datos enviados correctamente");

                      setShowForm(false);

                      setMessages((prev) => [
                        ...prev,
                        {
                          who: "SISTEMA",
                          text: "Gracias, ya recibimos tus datos. Un vendedor se va a contactar con vos.",
                        },
                      ]);
                    } catch {
                      alert("Error al enviar los datos");
                    }
                  }}
                  style={buttonStyle}
                >
                  Enviar
                </button>
              </div>
            )}

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
                color: "#000",
                background: "#fff",
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 8,
  padding: 12,
  fontSize: 16,
  border: "1px solid #d0d0d0",
  borderRadius: 8,
  color: "#000",
  background: "#fff",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 10,
  padding: 12,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
};