export interface TTSConfig {
  apiKey: string;
  voice: string;
  text: string;
}

export interface GeneratedAudio {
  id: string;
  text: string;
  voice: string;
  blobUrl: string;
  createdAt: string;
}

export const GEMINI_VOICES: string[] = [
  "Puck",
  "Kore",
  "Charon",
  "Zephyr",
  "Fenrir",
  "Leda",
  "Orus",
  "Aoede",
  "Callirrhoe",
  "Autonoe",
  "Enceladus",
  "Iapetus",
  "Umbriel",
  "Algieba",
  "Despina",
  "Erinome",
  "Algenib",
  "Rasalgethi",
  "Laomedeia",
  "Achernar",
  "Schedar",
  "Gacrux",
  "Alnilam",
  "Pulcherrima"
];

// Mapeos o descripciones para las voces de Gemini
export const VOICE_DETAILS: Record<string, { desc: string; type: string }> = {
  Puck: { desc: "Cálida y juvenil", type: "Masculina / Neutra" },
  Kore: { desc: "Suave y clara", type: "Femenina" },
  Charon: { desc: "Madura y expresiva", type: "Masculina" },
  Zephyr: { desc: "Fresca y dinámica", type: "Femenina / Neutra" },
  Fenrir: { desc: "Profunda y resonante", type: "Masculina" },
  Leda: { desc: "Serena y articulada", type: "Femenina" },
  Orus: { desc: "Directa y nítida", type: "Masculina" },
  Aoede: { desc: "Melódica y fluida", type: "Femenina" },
  Callirrhoe: { desc: "Suave y relajada", type: "Femenina" },
  Autonoe: { desc: "Clara y consistente", type: "Femenina" },
  Enceladus: { desc: "Robusta y potente", type: "Masculina" },
  Iapetus: { desc: "Narrativa y pausada", type: "Masculina" },
  Umbriel: { desc: "Mate y reservada", type: "Masculina / Neutra" },
  Algieba: { desc: "Brillante y profesional", type: "Femenina" },
  Despina: { desc: "Rápida y concisa", type: "Femenina" },
  Erinome: { desc: "Cálida y amena", type: "Femenina" },
  Algenib: { desc: "Segura e informativa", type: "Masculina" },
  Rasalgethi: { desc: "Fuerte y autoritaria", type: "Masculina" },
  Laomedeia: { desc: "Suave y misteriosa", type: "Femenina" },
  Achernar: { desc: "Enérgica y clara", type: "Masculina" },
  Schedar: { desc: "Luminosa y conversacional", type: "Femenina" },
  Gacrux: { desc: "Acentuada y natural", type: "Masculina" },
  Alnilam: { desc: "Corporativa y sobria", type: "Masculina" },
  Pulcherrima: { desc: "Elegante y artística", type: "Femenina" }
};

export const PRESET_PHRASES = [
  {
    category: "Literatura 📚",
    text: "En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor."
  },
  {
    category: "Tecnología y Futuro 🌌",
    text: "La inteligencia artificial no reemplazará a los humanos, pero los humanos que utilizan la inteligencia artificial reemplazarán a los que no lo hacen. El futuro ya está aquí."
  },
  {
    category: "Trabalenguas 👅",
    text: "Tres tristes tigres tragaban trigo en un trigal. En tres tristes trastos, tragaban trigo tres tristes tigres. El trigal se quedó sin trigo y los tigres se quedaron tristes."
  },
  {
    category: "Inspiración ✨",
    text: "El único modo de hacer un gran trabajo es amar lo que haces. Si no lo has encontrado todavía, sigue buscando. No te conformes."
  }
];
