// Función del servidor (Vercel). Recibe los apuntes y devuelve las preguntas.
// Variables de entorno en Vercel:
//   GEMINI_API_KEY  (obligatoria) clave de Google AI Studio
//   GEMINI_MODEL    (opcional) por defecto gemini-3.5-flash
//   ACCESS_CODES    (opcional) códigos separados por comas, ej: "ALEX-001,ALEX-002".
//                   Si la dejas vacía, la app es libre para todos.

const MAX_QUESTIONS = 15;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "Falta configurar GEMINI_API_KEY en el servidor." });

  const { texto = "", archivo, mime, n = 10, tipo = "mixto", nivel = "intermedia", codigo = "" } = req.body || {};

  // Acceso por código (para vender acceso)
  const codes = (process.env.ACCESS_CODES || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  if (codes.length && !codes.includes(String(codigo).trim().toUpperCase())) {
    return res.status(401).json({ error: "Código de acceso inválido. Pídelo a quien te compartió la app." });
  }

  const cantidad = Math.min(Math.max(parseInt(n) || 10, 3), MAX_QUESTIONS);
  const textoLimpio = String(texto).slice(0, 30000);
  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const tieneArchivo = archivo && tiposPermitidos.includes(mime);

  if (textoLimpio.trim().length < 80 && !tieneArchivo) {
    return res.status(400).json({ error: "Pega más apuntes (al menos un párrafo) o sube una foto o PDF." });
  }

  const estilo = tipo === "caso" ? "todas como viñetas de caso clínico breves"
    : tipo === "directa" ? "preguntas directas de concepto"
    : "mezcla de casos clínicos breves y preguntas directas";

  const instruccion = `Eres profesor de medicina y escribes preguntas de examen para estudiantes de medicina de Latinoamérica, en español.
Con base SOLO en los apuntes del estudiante (texto y/o archivo adjunto), crea ${cantidad} preguntas de opción múltiple, ${estilo}, dificultad ${nivel}.
Reglas: 4 opciones por pregunta, una sola correcta, distractores plausibles, varía la posición de la respuesta correcta, explicación breve (1-2 oraciones). No contradigas los apuntes. Si los apuntes no son de medicina o ciencias de la salud, igual haz preguntas sobre su contenido.
Responde SOLO con un arreglo JSON con este formato:
[{"tema":"subtema corto","pregunta":"...","opciones":["...","...","...","..."],"correcta":0,"explicacion":"..."}]`;

  const parts = [{ text: instruccion }];
  if (textoLimpio.trim()) parts.push({ text: "APUNTES:\n" + textoLimpio });
  if (tieneArchivo) parts.push({ inline_data: { mime_type: mime, data: archivo } });

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
      })
    });
    const data = await r.json();
    if (!r.ok) {
      const msg = data?.error?.message || "";
      if (r.status === 429) return res.status(429).json({ error: "La app está muy usada ahora mismo. Intenta en un minuto." });
      console.error("Gemini error", r.status, msg);
      return res.status(502).json({ error: "No se pudo generar el simulacro. Intenta de nuevo." });
    }
    const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    let preguntas;
    try { preguntas = JSON.parse(raw); }
    catch { const m = raw.match(/\[[\s\S]*\]/); preguntas = m ? JSON.parse(m[0]) : []; }

    preguntas = (Array.isArray(preguntas) ? preguntas : [])
      .filter(q => q && q.pregunta && Array.isArray(q.opciones) && q.opciones.length >= 2
        && Number.isInteger(+q.correcta) && +q.correcta >= 0 && +q.correcta < q.opciones.length)
      .map(q => ({ tema: String(q.tema || ""), pregunta: String(q.pregunta), opciones: q.opciones.map(String),
                   correcta: +q.correcta, explicacion: String(q.explicacion || "") }));

    if (!preguntas.length) return res.status(502).json({ error: "La respuesta salió vacía. Intenta de nuevo." });
    return res.status(200).json({ preguntas });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error de conexión. Intenta de nuevo." });
  }
}
