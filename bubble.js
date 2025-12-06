// Configuración del chat burbuja
const chatButton = document.getElementById("chat-button");
const chatWindow = document.getElementById("chat-window");
const chatClose = document.getElementById("chat-close");
const chatSend = document.getElementById("chat-send");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

// Mostrar ventana del chat
chatButton.addEventListener("click", () => {
    chatWindow.style.display = "flex";
});

// Cerrar ventana
chatClose.addEventListener("click", () => {
    chatWindow.style.display = "none";
});

// Enviar mensaje
chatSend.addEventListener("click", async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage("user", text);
    chatInput.value = "";

    // Enviar mensaje al servidor Vercel API
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
    });

    const data = await response.json();
    addMessage("bot", data.reply);
});

// Agregar mensaje en el chat
function addMessage(sender, text) {
    const msg = document.createElement("div");
    msg.className = sender === "user" ? "user-msg" : "bot-msg";
    msg.innerText = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
