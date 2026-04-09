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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

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
        const tieneFormulario = data.reply.includes("[FORMULARIO]")

        if (tieneFormulario) {
          setShowForm(true)
          const cleanText = data.reply.replace("[FORMULARIO]", "").trim()

          setMessages(prev => [
            ...prev,
            { who: "SISTEMA", text: cleanText }
          ])
        } else {
          setMessages(prev => [
            ...prev,
            { who: "SISTEMA", text: data.reply }
          ])
        }
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { who: "SISTEMA", text: "Error de conexión" }
      ])
    }

    setLoading(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, showForm])

  return (
    <>
      {/* BURBUJA */}
      {!open && (
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

      {/* CHAT */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: isMobile ? "0" : "20px",
            right: isMobile ? "0" : "20px",
            width: isMobile ? "100%" : "360px",
            minWidth: isMobile ? "100%" : "320px",
            maxWidth: "100vw",
            height: isMobile ? "100%" : "500px",
            background: "white",
            borderRadius: isMobile ? "0" : "12px",
            boxShadow: "0 0 20px rgba(0,0,0,0.2)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box"
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: "12px",
              background: "#2563eb",
              color: "white",
              borderTopLeftRadius: isMobile ? "0" : "12px",
              borderTopRightRadius: isMobile ? "0" : "12px",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            <b>Agustina</b>
            {!isMobile && (
              <button onClick={() => setOpen(false)}>X</button>
            )}
          </div>

          {/* MENSAJES */}
          <div
            style={{
              flex: 1,
              padding: 10,
              overflowY: "auto"
            }}
          >
            {messages.length === 0 && (
              <div style={{ marginBottom: 10 }}>
                Hola, ¿en qué puedo ayudarte hoy?
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <strong>{msg.who === "YO" ? "Vos:" : "Agustina:"}</strong>
                <br />
                {msg.text}
              </div>
            ))}

            {showForm && (
              <div style={{ marginTop: 10 }}>
                <b>Completar datos</b>

                <input id="empresa" placeholder="Empresa" style={{ width: "100%", marginTop: 5 }} />
                <input id="nombre" placeholder="Nombre" style={{ width: "100%", marginTop: 5 }} />
                <input id="contacto" placeholder="Teléfono o email" style={{ width: "100%", marginTop: 5 }} />
                <textarea id="detalle" placeholder="Detalle" style={{ width: "100%", marginTop: 5 }} />

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

                    alert("Datos enviados")
                    setShowForm(false)
                  }}
                  style={{ width: "100%", marginTop: 5 }}
                >
                  Enviar
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div style={{ display: "flex", padding: 10 }}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ flex: 1 }}
              placeholder="Escribí..."
            />
            <button onClick={sendMessage}>
              {loading ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}