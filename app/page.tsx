"use client";

import { useState } from "react";

export default function Home() {
  const [logged, setLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  function login() {
    if (password === "laser2026") {
      setLogged(true);
    } else {
      alert("Contraseña incorrecta");
    }
  }

  async function sendMessage() {
    if (!input) return;

    const res = await fetch("/api/lisa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      "Vendedor: " + input,
      "Lisa: " + data.reply,
    ]);

    setInput("");
  }

  if (!logged) {
    return (
      <main style={{ padding: 20 }}>
        <h2>Acceso a Lisa</h2>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={login}>Entrar</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 20 }}>
      <h2>Lisa – Asistente Comercial</h2>

      <div style={{ marginBottom: 20 }}>
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Escribí acá"
      />
      <button onClick={sendMessage}>Enviar</button>
    </main>
  );
}
