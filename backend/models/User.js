const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Unique identifier
  whiteboardsProcessed: { type: Number, default: 0 },
  chunksProcessed: { type: Number, default: 0 },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
