import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parsea bodies JSON grandes para el texto y las claves de API
  app.use(express.json({ limit: "10mb" }));

  // Ruta POST API para síntesis de voz (Text-to-Speech)
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice, apiKeyOverride } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "El texto es obligatorio." });
      }
      if (!voice || typeof voice !== "string") {
        return res.status(400).json({ error: "La voz seleccionada es obligatoria." });
      }

      // Preferir la API Key ingresada por el usuario en el cliente, de lo contrario la del servidor
      const apiKey = apiKeyOverride?.trim() || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(401).json({ 
          error: "Clave de API no especificada. Por favor agrega tu propia clave de API usando el botón arriba a la derecha." 
        });
      }

      console.log(`[TTS] Generando audio de ${text.length} caracteres usando la voz '${voice}'...`);

      // Inicialización del cliente de Gemini
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Llamar al modelo de TTS de Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        console.error("Gemini API no retornó datos de audio válidos:", response);
        return res.status(500).json({ 
          error: "Gemini no devolvió audio. Revisa que tu texto sea apropiado y que tu clave de API sea válida." 
        });
      }

      return res.json({ audio: base64Audio });
    } catch (error: any) {
      console.error("[TTS Error]:", error);
      const msg = error.message || error.toString();
      
      // Mensaje amigable para el usuario ante errores comunes
      if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
        return res.status(401).json({ error: "La clave de API de Gemini ingresada es inválida o expiró. Por favor verifica tus credenciales." });
      }
      if (msg.includes("User location is not supported")) {
        return res.status(403).json({ error: "El servicio de Gemini no está disponible en su región actual o con la clave de API ingresada." });
      }
      
      return res.status(500).json({ error: `Ocurrió un error al generar el audio: ${msg}` });
    }
  });

  // Integración con el middleware de Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Corriendo en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error al arrancar el servidor:", err);
});
