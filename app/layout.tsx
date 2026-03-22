"use client";

import ChatPage from "./ChatPage";

export default function Page() {
  return (
    <>
      {/* Tu sistema actual sigue funcionando abajo */}
      <div style={{ padding: 40 }}>
        <h1>Buscador de Prospectos Industriales</h1>
      </div>

      {/* CHAT FORZADO (siempre visible) */}
      <ChatPage />
    </>
  );
}