const express = require("express");
const cors = require("cors");
const { connection } = require("./db");
const { userRouter } = require("./routes/user_routes");
const { noteRouter } = require("./routes/note_routes");
const chatRouter = require("./routes/chat_routes");
const aiRouter = require("./routes/ai_routes");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use("/user", userRouter);
app.use("/note", noteRouter);
app.use("/api", chatRouter);
app.use("/api/ai", aiRouter);
app.get("/", (req, res) => res.send({ message: "API is working now" }));
app.listen(port, async () => {
  try { await connection; console.log("DB connected"); }
  catch (error) { console.error("DB connection error:", error.message); }
  console.log(`Server running on port ${port}`);
});
