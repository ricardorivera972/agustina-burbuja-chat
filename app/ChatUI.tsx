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

  const bottomRef = useRef<HTMLDivElement | null>(null)

  const sendMessage = async () => {
    if (!message.trim()) return

    const userMessage = message

    setMessages(prev => [...prev, { who: "YO", text: userMessage }])
    setMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/lisa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMessage })
      })

      const data = await res.json()

      if (data.reply) {
        setMessages(prev => [...prev, { who: "SISTEMA", text: data.reply }])
      } else {
        setMessages(prev => [...prev, { who: "SISTEMA", text: "⚠️ Sin respuesta del servidor" }])
      }

    } catch (error) {
      setMessages(prev => [...prev, { who: "SISTEMA", text: "❌ Error de conexión" }])
    }

    setLoading(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
            bottom: "90px",
            right: "20px",
            width: "350px",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "10px",
            zIndex: 9999,
            boxShadow: "0 0 10px rgba(0,0,0,0.2)"
          }}
        >
          {/* HEADER */}
          <div style={{
            padding: "10px",
            borderBottom: "1px solid #ccc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <b>Agustina</b>
            <button onClick={() => setOpen(false)}>X</button>
          </div>

          {/* CHAT */}
          <div style={{
            padding: 15,
            height: 300,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
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
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div style={{ display: "flex", gap: 5, padding: 10 }}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describí el prospecto..."
              style={{ flex: 1, padding: 10 }}
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              style={{ padding: 10 }}
            >
              {loading ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}