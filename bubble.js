// Elementos del chat
const chatButton = document.getElementById("chat-button");
const chatWindow = document.getElementById("chat-window");
const chatClose = document.getElementById("chat-close");
const chatSend = document.getElementById("chat-send");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

// Mostrar ventana
chatButton.addEventListener("click", () => {
    chatWindow.style.display = "flex";
});

// Cerrar ventana
chatClose.addEventListener("click", () => {
    chatWindow.style.display = "none";
});

// Enviar mensaje al backend de OpenAI
chatSend.addEventListener("click", async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    // Mostrar mensaje del usuario
    addMessage("usuario", text);
    chatInput.value = "";

    try {
        const respuesta = await fetch("https://agustina-burbuja-chat.vercel.app/api/chat", {

            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensaje: text })
        });

        const data = await respuesta.json();

        addMessage("agustina", data.mensaje);
    } catch (error) {
        addMessage("agustina", "Error al conectar con el servidor.");
    }
});

// Función para agregar mensajes al chat
function addMessage(remitente, texto) {
    const burbuja = document.createElement("div");
    burbuja.className = remitente === "usuario" ? "msg-user" : "msg-ai";
    burbuja.textContent = texto;
    chatMessages.appendChild(burbuja);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

   
