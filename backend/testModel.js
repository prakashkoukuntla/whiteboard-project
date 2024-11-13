const mongoose = require("mongoose");
const User = require("./models/User");
const Whiteboard = require("./models/Whiteboard");
const Annotation = require("./models/Annotation");

// Connect to MongoDB Atlas using your connection string
const dbURI =
  "mongodb+srv://prakashk:1uLLLXPBWoEn7OfV@cluster0.pwh1x.mongodb.net/whiteboardDB?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB for testing"))
  .catch((err) => console.error("Failed to connect for testing", err));

async function testModels() {
  try {
    // Create a test user
    const user = await User.create({ name: "testUser" });
    console.log("User created:", user);

    // Create a test whiteboard for this user
    const whiteboard = await Whiteboard.create({
      id: "wb_test",
      imageUrl: "https://example.com/image.png",
      annotated: false,
      userId: user.name,
    });
    console.log("Whiteboard created:", whiteboard);

    // Create a test annotation for the whiteboard
    const annotation = await Annotation.create({
      whiteboardId: whiteboard.id,
      userId: user.name,
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      confidenceLevel: "medium",
      transcription: "Sample text",
    });
    console.log("Annotation created:", annotation);
  } catch (error) {
    console.error("Error during model testing:", error);
  } finally {
    mongoose.connection.close();
  }
}

testModels();
