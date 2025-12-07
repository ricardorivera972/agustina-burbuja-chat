export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { mensaje } = req.body;

    if (!mensaje) {
        return res.status(400).json({ error: "No se envió ningún mensaje" });
    }

    try {
        const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
               model:  "gpt-4.1",

                messages: [
    { role: "system", content: "Sos Agustina, una asistente cordial." },
    { role: "user", content: mensaje }
]
});

        });

        const data = await respuesta.json();
        const texto = data.choices?.[0]?.message?.content || "No pude generar respuesta.";

        res.status(200).json({ respuesta: texto });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno en el servidor" });
    }
}
