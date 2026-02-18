"use client"

import { useState } from "react"

export default function ChatUI() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!message.trim()) return

    const userMessage = message
    setMessages(prev => [...prev, "👤 " + userMessage])
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
        setMessages(prev => [...prev, "🤖 " + data.reply])
      } else {
        setMessages(prev => [...prev, "⚠️ Sin respuesta del servidor"])
      }
    } catch (error) {
      setMessages(prev => [...prev, "❌ Error conectando con Lisa"])
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Lisa Chat</h2>

      <div style={{
        border: "1px solid #ccc",
        padding: 10,
        height: 300,
        overflowY: "auto",
        marginBottom: 10
      }}>
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribí tu mensaje..."
        style={{ width: "80%", padding: 8 }}
      />

      <button
        onClick={sendMessage}
        disabled={loading}
        style={{ padding: 8, marginLeft: 5 }}
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </div>
  )
}
