// Elementos UI
const chatButton = document.getElementById("chatButton");
const chatWindow = document.getElementById("chatWindow");
const chatClose = document.getElementById("chatClose");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

// Mostrar ventana
chatButton.addEventListener("click", () => {
    chatWindow.style.display = "flex";
});

// Cerrar ventana
chatClose.addEventListener("click", () => {
    chatWindow.style.display = "none";
});

// Enviar mensaje
chatSend.addEventListener("click", async () => {
    const texto = chatInput.value.trim();
    if (!texto) return;

    // Mostrar mensaje del usuario
    chatMessages.innerHTML += `<div class="user-msg">${texto}</div>`;
    chatInput.value = "";

    try {
        const request = await fetch("https://agustina-burbuja-chat.vercel.app/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensaje: texto })   // <<< ESTA ES LA CLAVE
        });

        const data = await request.json();
        const respuesta = data.respuesta || "Error al generar respuesta.";

        chatMessages.innerHTML += `<div class="bot-msg">${respuesta}</div>`;

    } catch (error) {
        console.error("Error:", error);
        chatMessages.innerHTML += `<div class="bot-msg">Error al conectar con el servidor.</div>`;
    }
});
