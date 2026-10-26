const assert = require("node:assert/strict");
const { test } = require("node:test");
const { NoteModel } = require("../models/NoteModel");
const { runTool } = require("../routes/chat_routes");

test("AI note creation saves the note under the signed-in user's account", async () => {
  const originalSave = NoteModel.prototype.save;
  let savedNote;
  NoteModel.prototype.save = async function save() {
    savedNote = this;
    return this;
  };

  try {
    const result = JSON.parse(await runTool("test-user-id", {
      function: {
        name: "create_note",
        arguments: JSON.stringify({ title: "Morning Melody", body: "A new idea" }),
      },
    }));

    assert.equal(result.created, true);
    assert.equal(result.title, "Morning Melody");
    assert.ok(result.id);
    assert.equal(savedNote.user, "test-user-id");
    assert.equal(savedNote.body, "A new idea");
  } finally {
    NoteModel.prototype.save = originalSave;
  }
});
