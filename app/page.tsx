"use client";

import ChatUI from "./chat/chatui";

export default function Page() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 28 }}>Buscador de Prospectos Industriales</h1>
      <ChatUI />
    </div>
  );
}