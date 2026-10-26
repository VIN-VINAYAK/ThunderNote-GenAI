const express = require("express");
const { authenticator } = require("../middleware/auth");
const { getGroqResponseError, groqFetch, groqJson } = require("../groq");
const router = express.Router();
router.use(authenticator);
const endpoint = "https://api.groq.com/openai/v1/chat/completions";
async function complete(messages, model = process.env.GROQ_FAST_MODEL || "openai/gpt-oss-20b", options = {}) {
  const response = await groqFetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 1200, ...options }) });
  const data = await groqJson(response);
  if (!response.ok) throw getGroqResponseError(response, data);
  return data.choices?.[0]?.message?.content || "";
}
router.post("/transform", async (req, res) => {
  const { action, text = "", title = "" } = req.body || {};
  const allowed = { summarize: "Summarize the text clearly in a few concise sentences.", expand: "Expand the text with useful detail while preserving its intent.", reformat: "Reformat the text into a clear, well-structured note. Keep all important information.", grammar: "Correct grammar, spelling, and punctuation while preserving voice and meaning.", rewrite: "Rewrite the text to be clear, natural, and polished while preserving its meaning.", translate: "Translate the text into English while preserving its meaning.", actions: "Extract concrete action items as a concise checklist.", metadata: "Return JSON with a concise smart title, one-sentence summary, and up to five short tags." };
  if (!allowed[action] || typeof text !== "string" || !text.trim()) return res.status(400).json({ error: "Choose an AI action and provide note text." });
  try {
    const result = await complete([{ role: "system", content: allowed[action] }, { role: "user", content: `Title: ${String(title).slice(0, 200)}\n\n${text.slice(0, 20000)}` }], undefined, action === "metadata" ? { response_format: { type: "json_object" } } : {});
    res.json({ result });
  } catch (error) { res.status(error.status || 502).json({ error: error.message }); }
});
router.post("/ingest", async (req, res) => {
  const { kind, name, mimeType, data } = req.body || {};
  if (!data || typeof data !== "string" || data.length > 18_000_000) return res.status(400).json({ error: "Choose a file smaller than 13 MB." });
  try {
    if (kind === "audio") {
      const buffer = Buffer.from(data, "base64");
      const form = new FormData();
      form.append("file", new Blob([buffer], { type: mimeType || "audio/webm" }), name || "voice-note.webm");
      form.append("model", process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo");
      form.append("response_format", "json");
      const response = await groqFetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", body: form });
      const result = await groqJson(response);
      if (!response.ok) throw getGroqResponseError(response, result);
      return res.json({ text: result.text || "" });
    }
    if (kind === "image") {
      const result = await complete([{ role: "user", content: [{ type: "text", text: "Read and summarize the important text in this image. Return clean plain text suitable for a note; mention if it contains no readable text." }, { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${data}` } }] }], process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b");
      return res.json({ text: result });
    }
    if (kind === "pdf") {
      const buffer = Buffer.from(data, "base64");
      const pdfText = buffer.toString("latin1").replace(/\\\((.*?)\\\)\s*Tj/g, "$1 ").replace(/\\[\s\S]{1,5}/g, " ").replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
      if (pdfText.length < 40) return res.status(415).json({ error: "This PDF has no extractable text. Please export a text-based PDF or upload page images." });
      return res.json({ text: pdfText.slice(0, 16000) });
    }
    return res.status(400).json({ error: "Unsupported file type." });
  } catch (error) { res.status(error.status || 502).json({ error: error.message || "File processing failed" }); }
});
module.exports = router;


