const express = require("express");
const { NoteModel } = require("../models/NoteModel");
const { authenticator } = require("../middleware/auth");
const { getGroqResponseError, groqFetch, groqJson } = require("../groq");
const noteRouter = express.Router();
noteRouter.use(authenticator);

async function enrichNote(note) {
  if (!process.env.GROQ_API_KEY || !note.body.trim()) return;
  try {
    const response = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.GROQ_FAST_MODEL || "openai/gpt-oss-20b", temperature: 0.2, max_tokens: 180, response_format: { type: "json_object" },
        messages: [{ role: "system", content: "Return JSON only with keys title (short useful title), summary (one sentence), tags (array of at most 5 short tags). Preserve the user's meaning." }, { role: "user", content: `Title: ${note.title}\nBody: ${note.body.slice(0, 12000)}` }] })
    });
    const data = await groqJson(response);
    if (!response.ok) throw getGroqResponseError(response, data);
    const result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    if (typeof result.summary === "string") note.summary = result.summary.slice(0, 500);
    if (Array.isArray(result.tags)) note.tags = result.tags.filter((tag) => typeof tag === "string").slice(0, 5);
    if (typeof result.title === "string" && result.title.trim()) note.title = result.title.trim().slice(0, 160);
  } catch (error) { console.warn("Note metadata generation skipped:", error.message); }
}
noteRouter.get("/", async (req, res) => {
  try {
    const data = await NoteModel.find({ user: String(req.userID) }).sort({ updatedAt: -1 });
    res.json({ data, message: "Successful", status: 1 });
  } catch (error) { console.error("Notes loading failed:", error); res.status(500).json({ message: "Unable to load notes", status: 0 }); }
});

noteRouter.post("/create", async (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const body = typeof req.body.body === "string" ? req.body.body : "";
  if (!title) return res.status(400).json({ message: "A note title is required", status: 0 });
  try {
    const note = new NoteModel({ title, body, user: String(req.userID) });
    await enrichNote(note);
    await note.save();
    return res.json({ message: "Note created", status: 1, note: note });
  } catch (error) { console.error("Note creation failed:", error); res.status(500).json({ message: "Unable to create note", status: 0 }); }
});

noteRouter.patch("/", async (req, res) => {
  const id = req.headers.id;
  const updates = {};
  if (typeof req.body.title === "string" && req.body.title.trim()) updates.title = req.body.title.trim();
  if (typeof req.body.body === "string") updates.body = req.body.body;
  if (!Object.keys(updates).length) return res.status(400).json({ message: "No valid note changes were provided", status: 0 });
  try {
    const note = await NoteModel.findOne({ _id: id, user: String(req.userID) });
    if (!note) return res.status(404).json({ message: "Note not found", status: 0 });
    Object.assign(note, updates);
    await note.save();
    res.json({ message: "Note updated", status: 1 });
  } catch (error) { console.error("Note update failed:", error); res.status(400).json({ message: "Unable to update note", status: 0 }); }
});

noteRouter.delete("/", async (req, res) => {
  try {
    const deleted = await NoteModel.findOneAndDelete({ _id: req.headers.id, user: String(req.userID) });
    if (!deleted) return res.status(404).json({ message: "Note not found", status: 0 });
    res.json({ message: "Note deleted", status: 1 });
  } catch (error) { res.status(400).json({ message: "Unable to delete note", status: 0 }); }
});
module.exports = { noteRouter };


