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
  const [showForm, setShowForm] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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
          const cleanText = data.reply
            .replace(/\[FORMULARIO\]/gi, "")
            .trim();

          // 1. Mostrar mensaje SIEMPRE
          setMessages((prev) => [
            ...prev,
            { who: "SISTEMA", text: cleanText },
          ]);

          // 2. Scroll al mensaje (asegura visibilidad)
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 150);

          // 3. Mostrar formulario después (UX natural)
          setTimeout(() => {
            setShowForm(true);
          }, 600);
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

  return (
    <div
      style={{
        margin: "40px auto",
        width: "100%",
        maxWidth: 420,
        height: "90vh",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 12px 32px rgba(0,0,0,0.20)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "#2563eb",
          color: "#fff",
          padding: "14px 16px",
          fontWeight: 700,
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
      </div>

      {/* MENSAJES */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 14,
          background: "#fafafa",
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
            Hola, soy el asistente comercial.

            Puedo ayudarte con consultas técnicas o, si necesitás cotizar un trabajo de corte, plegado o soldadura, contame qué necesitás y lo gestionamos.

            Si corresponde, también puedo tomar tus datos para que un vendedor te contacte.
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
          <div style={{ marginTop: 10 }}>
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

                await fetch("https://script.google.com/macros/s/AKfycbxJ4ZFemcLehp14FTYLgp0frs72utzPxXhxrxxnuhCgzJH-fTCiHtJqQJd5P788_f6yIw/exec", {
                  method: "POST",
                  mode: "no-cors",
                  body: JSON.stringify(formData),
                });

                alert("Datos enviados");

                setShowForm(false);

                // reset limpio
                setMessages([
                  {
                    who: "SISTEMA",
                    text: "Gracias, recibimos tus datos. Un vendedor se va a contactar con vos.\n\n¿Te puedo ayudar con algo más?",
                  },
                ]);
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
          padding: 10,
          borderTop: "1px solid #e5e5e5",
        }}
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribí..."
          style={{
            flex: 1,
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ccc",
            color: "#000",
            background: "#fff",
          }}
        />

        <button onClick={sendMessage} style={buttonStyle}>
          {loading ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  marginTop: 8,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 16,
  color: "#000",
  background: "#fff",
};

const buttonStyle = {
  padding: 10,
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
};