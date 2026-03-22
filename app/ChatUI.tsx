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
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "Arial" }}>
      
      <h2>Evaluador de Prospectos Industriales</h2>

      {/* CHAT */}
      <div style={{
        border: "1px solid #ccc",
        padding: 15,
        height: 400,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: 10
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
      <div style={{ display: "flex", gap: 5 }}>
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
          {loading ? "Analizando..." : "Evaluar"}
        </button>
      </div>
    </div>
  )
}