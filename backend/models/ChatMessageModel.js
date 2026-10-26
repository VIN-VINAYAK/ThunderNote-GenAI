const mongoose = require("mongoose");
const chatMessageSchema = new mongoose.Schema({
  user: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true }
}, { timestamps: true, versionKey: false });
chatMessageSchema.index({ user: 1, sessionId: 1, createdAt: 1 });
const ChatMessageModel = mongoose.model("chat_message", chatMessageSchema);
module.exports = { ChatMessageModel };
