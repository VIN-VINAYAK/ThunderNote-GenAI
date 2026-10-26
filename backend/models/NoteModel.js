const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, default: "" },
  user: { type: String, required: true, index: true },
  summary: { type: String, default: "" },
  tags: { type: [String], default: [] },
  category: { type: String, default: "" }
}, { timestamps: true, versionKey: false });
const NoteModel = mongoose.model("note", noteSchema);
module.exports = { NoteModel };
