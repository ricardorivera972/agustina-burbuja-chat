document.addEventListener("DOMContentLoaded", function () {

    const chatButton = document.getElementById("chatButton");
    const chatWindow = document.getElementById("chat-window");
    const chatClose = document.getElementById("chat-close");
    const chatSend = document.getElementById("chat-send");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages");

    if (!chatButton || !chatWindow || !chatClose || !chatSend || !chatInput || !chatMessages) {
        console.error("Error: No se encontraron elementos del chat en el HTML");
        return;
    }

    // Mostrar ventana del chat
    chatButton.addEventListener("click", () => {
        chatWindow.style.display = "block";
    });

    // Cerrar ventana del chat
    chatClose.addEventListener("click", () => {
        chatWindow.style.display = "none";
    });

    // Enviar mensaje
    chatSend.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        chatMessages.innerHTML += `<div class="user-message">${message}</div>`;
        chatInput.value = "";

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        chatMessages.innerHTML += `<div class="ai-message">${data.reply || "Error en la respuesta"}</div>`;
    });

});

