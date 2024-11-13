const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const User = require("./models/User");
const Whiteboard = require("./models/Whiteboard");
const Annotation = require("./models/Annotation");
const loadWhiteboardsFromCSV = require("./csvLoader");
const cors = require("cors");
const MongoStore = require("connect-mongo");

const app = express();

// Enable CORS - Should be placed before other routes
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    credentials: true, // Allow credentials
  })
);

// Enable JSON parsing for POST requests
app.use(express.json());

// Connect to MongoDB
const dbURI =
  "mongodb+srv://prakashk:1uLLLXPBWoEn7OfV@cluster0.pwh1x.mongodb.net/whiteboardDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Configure session middleware with MongoDB as the session store
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: dbURI, // Use your MongoDB connection URI
      collectionName: "sessions", // Optional: specify the collection name for sessions
    }),
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      sameSite: "Lax", // Change to "None" for cross-origin requests in production
    },
  }),
  (req, res, next) => {
    console.log("Session ID:", req.session.id); // Logs the session ID
    console.log("Session Data:", req.session); // Logs full session data
    next(); // Move to the next middleware
  }
);

// Login route
app.post("/login", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).send("Name is required");
  }

  try {
    let user = await User.findOne({ name });
    if (!user) {
      user = new User({ name });
      await user.save();

      // Load initial whiteboards from CSV
      console.log("Calling loadWhiteboardsFromCSV...");
      const initialWhiteboards = loadWhiteboardsFromCSV();
      if (initialWhiteboards.length === 0) {
        console.warn("Warning: No whiteboards loaded from CSV.");
      }
      const whiteboardsForUser = initialWhiteboards.map((wb) => ({
        ...wb,
        userId: user.name,
      }));
      const insertedWhiteboards = await Whiteboard.insertMany(
        whiteboardsForUser
      );
      console.log("Inserted whiteboards for user:", insertedWhiteboards);
    }

    req.session.userId = user.name;
    console.log("Session userId set to:", req.session.userId);

    // Retrieve the whiteboards for the logged-in user
    const whiteboards = await Whiteboard.find({ userId: user.name });
    res.json({ message: `Welcome, ${name}`, user, whiteboards });
  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).send("An error occurred during login");
  }
});

// Route to retrieve all whiteboards for the logged-in user
app.get("/whiteboards", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const whiteboards = await Whiteboard.find({ userId: req.session.userId });
    res.json(whiteboards);
  } catch (error) {
    console.error("Error retrieving whiteboards:", error);
    res.status(500).send("Failed to retrieve whiteboards");
  }
});

// Route to retrieve a specific whiteboard by custom string-based ID
app.get("/whiteboards/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const whiteboard = await Whiteboard.findOne({ id }); // Use custom `id` field as a string
    if (!whiteboard) {
      return res.status(404).send("Whiteboard not found");
    }
    res.json(whiteboard);
  } catch (error) {
    console.error("Error retrieving whiteboard:", error);
    res.status(500).send("Failed to retrieve whiteboard");
  }
});

app.post("/whiteboards/:whiteboardId/annotations", async (req, res) => {
  console.log(req.session);
  const { whiteboardId } = req.params;
  const { x, y, width, height, confidenceLevel, transcription } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const newAnnotation = new Annotation({
      whiteboardId,
      userId,
      x,
      y,
      width,
      height,
      confidenceLevel,
      transcription,
    });

    await newAnnotation.save();
    res.status(201).json(newAnnotation);
  } catch (error) {
    console.error("Error saving annotation:", error); // Enhanced logging
    res.status(500).send("Failed to save annotation");
  }
});

// PATCH route to update an existing annotation
app.patch("/annotations/:id", async (req, res) => {
  const annotationId = req.params.id;
  const { confidenceLevel, transcription } = req.body;

  try {
    const updatedAnnotation = await Annotation.findByIdAndUpdate(
      annotationId,
      { confidenceLevel, transcription },
      { new: true }
    );
    res.json(updatedAnnotation);
  } catch (error) {
    console.error("Error updating annotation:", error);
    res.status(500).send("Failed to update annotation");
  }
});

// // // GET route to fetch annotations for a specific whiteboard
// app.get("/whiteboards/:whiteboardId/annotations", async (req, res) => {
//   const whiteboardId = req.params.whiteboardId;

//   try {
//     const annotations = await Annotation.find({ whiteboardId });
//     res.json(annotations);
//   } catch (error) {
//     console.error("Error retrieving annotations:", error);
//     res.status(500).send("Failed to retrieve annotations");
//   }
// });

// GET route to fetch annotations for a specific whiteboard and logged-in user
app.get("/whiteboards/:whiteboardId/annotations", async (req, res) => {
  const whiteboardId = req.params.whiteboardId;
  const userId = req.session.userId; // Assuming userId is stored in the session

  if (!userId) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const annotations = await Annotation.find({ whiteboardId, userId });
    res.json(annotations);
  } catch (error) {
    console.error("Error retrieving annotations:", error);
    res.status(500).send("Failed to retrieve annotations");
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("An error occurred:", err);
  res.status(500).send("An internal server error occurred");
});
