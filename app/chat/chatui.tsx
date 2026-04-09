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
  const [showForm, setShowForm] = useState(false)

  const bottomRef = useRef<HTMLDivElement | null>(null)

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
    <div style={{ padding: 10 }}>
      <h3>Asistente técnico</h3>

      <div
        style={{
          height: "60vh",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: 10,
          borderRadius: 8,
          marginTop: 10
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: 10 }}>
            <strong>{msg.who === "YO" ? "👤 Vos:" : "📊 Sistema:"}</strong>
            <br />
            {msg.text}
          </div>
        ))}

        {showForm && (
          <div style={{ marginTop: 10 }}>
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
              style={{ marginTop: 8, width: "100%" }}
            >
              Enviar datos
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", marginTop: 10 }}>
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
  )
}