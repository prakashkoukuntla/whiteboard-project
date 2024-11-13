const mongoose = require("mongoose");

const annotationSchema = new mongoose.Schema({
  whiteboardId: { type: String, ref: "Whiteboard", required: true },
  userId: { type: String, ref: "User", required: true },
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  confidenceLevel: {
    type: String,
    enum: [0, 1, 2],
    required: true,
  },
  transcription: String,
});

const Annotation = mongoose.model("Annotation", annotationSchema);

module.exports = Annotation;
