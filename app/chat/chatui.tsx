"use client"

import { useState, useEffect, useRef } from "react"

type Message = {
  who: "YO" | "SISTEMA"
  text: string
}

export default function ChatUI() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const bottomRef = useRef<HTMLDivElement | null>(null)

  // 🔴 detectar mobile
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // abrir automático en celular
      if (mobile) {
        setOpen(true)
      }
    }
  }, [])

  const sendMessage = async () => {
    if (!message.trim()) return

    const userMessage = message

    setMessages(prev => [...prev, { who: "YO", text: userMessage }])
    setMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/agustina", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMessage })
      })

      const data = await res.json()

      if (data.reply) {
        const tieneFormulario =
          data.reply.includes("[FORMULARIO]")

        if (tieneFormulario) {
          setShowForm(true)

          const cleanText = data.reply.replace("[FORMULARIO]", "").trim()

          setMessages(prev => [
            ...prev,
            {
              who: "SISTEMA",
              text: cleanText
            }
          ])
        } else {
          setMessages(prev => [
            ...prev,
            {
              who: "SISTEMA",
              text: data.reply
            }
          ])
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            who: "SISTEMA",
            text: "⚠️ Sin respuesta del servidor"
          }
        ])
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          who: "SISTEMA",
          text: "❌ Error de conexión"
        }
      ])
    }

    setLoading(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, showForm])

  return (
    <>
      {/* 🔵 BURBUJA SOLO EN DESKTOP */}
      {!open && !isMobile && (
        <div
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "60px",
            height: "60px",
            backgroundColor: "#2563eb",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
            zIndex: 9999
          }}
        >
          💬
        </div>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: isMobile ? "0" : "90px",
            right: isMobile ? "0" : "20px",
            width: isMobile ? "100%" : "350px",
            height: isMobile ? "100%" : "auto",
            background: "white",
            border: isMobile ? "none" : "1px solid #ccc",
            borderRadius: isMobile ? "0" : "10px",
            zIndex: 9999,
            boxShadow: isMobile ? "none" : "0 0 10px rgba(0,0,0,0.2)"
          }}
        >
          <div
            style={{
              padding: "10px",
              borderBottom: "1px solid #ccc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <b>Asistente técnico</b>
            {!isMobile && <button onClick={() => setOpen(false)}>X</button>}
          </div>

          <div
            style={{
              padding: 15,
              height: isMobile ? "calc(100% - 120px)" : "380px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: msg.who === "YO" ? "#dbeafe" : "#f5f5f5",
                  whiteSpace: "pre-line"
                }}
              >
                <strong>{msg.who === "YO" ? "👤 Vos:" : "📊 Sistema:"}</strong>
                <br />
                {msg.text}
              </div>
            ))}

            {showForm && (
              <div style={{ border: "1px solid #ddd", padding: "10px", borderRadius: "8px" }}>
                <b>📋 Completar datos</b>

                <input id="empresa" placeholder="Empresa" style={{ width: "100%", marginTop: 5 }} />
                <input id="nombre" placeholder="Nombre" style={{ width: "100%", marginTop: 5 }} />
                <input id="contacto" placeholder="Teléfono o email" style={{ width: "100%", marginTop: 5 }} />
                <textarea id="detalle" placeholder="Detalle del trabajo" style={{ width: "100%", marginTop: 5 }} />

                <button
                  onClick={async () => {
                    const contacto = (document.getElementById("contacto") as HTMLInputElement).value
                    const esEmail = contacto.includes("@")

                    const formData = {
                      empresa: (document.getElementById("empresa") as HTMLInputElement).value,
                      nombre: (document.getElementById("nombre") as HTMLInputElement).value,
                      email: esEmail ? contacto : "",
                      telefono: esEmail ? "" : contacto,
                      descripcion: (document.getElementById("detalle") as HTMLTextAreaElement).value,
                    }

                    await fetch("https://script.google.com/macros/s/AKfycbxJ4ZFemcLehp14FTYLgp0frs72utzPxXhxrxxnuhCgzJH-fTCiHtJqQJd5P788_f6yIw/exec", {
                      method: "POST",
                      mode: "no-cors",
                      body: JSON.stringify(formData),
                    })

                    alert("Datos enviados correctamente")
                    setShowForm(false)
                  }}
                >
                  Enviar datos
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div style={{ display: "flex", gap: 5, padding: 10 }}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribí tu consulta..."
              style={{ flex: 1 }}
            />

            <button onClick={sendMessage} disabled={loading}>
              {loading ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}