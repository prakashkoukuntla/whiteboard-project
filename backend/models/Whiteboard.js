const mongoose = require("mongoose");

const whiteboardSchema = new mongoose.Schema({
  id: { type: String, required: true },
  imageUrl: { type: String, required: true },
  annotated: { type: Boolean, default: false },
  userId: { type: String, ref: "User", required: true }, // Linked to the user's name as unique ID
});

const Whiteboard = mongoose.model("Whiteboard", whiteboardSchema);

module.exports = Whiteboard;
