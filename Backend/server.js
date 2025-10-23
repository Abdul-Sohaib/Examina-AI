require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const searchHistoryRoutes = require("./routes/searchHistory");
const chatRoutes = require("./routes/chatRoutes");
const { handleChatRequest } = require("./controllers/chatController");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");
const rateLimit = require("express-rate-limit");

const mongoURI = process.env.MONGO_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://examina-ai-t2ad.vercel.app";

if (!mongoURI) {
  console.error(" Error: MONGO_URI is missing in .env file");
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY is missing. AI responses may not work.");
}

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(" MongoDB Connected!"))
  .catch((err) => {
    console.error(" MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// Define a schema for storing question papers
const questionPaperSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  filePath: { type: String, required: true },
  originalName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const QuestionPaper = mongoose.model("QuestionPaper", questionPaperSchema);

// Define a schema for storing canvas drawings
const canvasDrawingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  canvasData: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const CanvasDrawing = mongoose.model("CanvasDrawing", canvasDrawingSchema);

// Define a schema for storing test results
const testResultSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  percentage: { type: Number, required: true },
  topic: { type: String }, // Optional: Store the topic or paperId for reference
  paperId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const TestResult = mongoose.model("TestResult", testResultSchema);

const app = express();
const server = http.createServer(app);

// Updated Socket.IO configuration for Vercel compatibility
const allowedOrigins = [
  FRONTEND_URL,
  "https://examina-ai-t2ad.vercel.app",
  "http://localhost:3000" // For local development
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"], // Prioritize polling for Vercel
  allowEIO3: true, // Support for Socket.IO v3 clients
});

// Enhanced CORS for Express
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use("/api/searchHistory", searchHistoryRoutes);
app.use("/api", chatRoutes);

// Rate limiting for /api/questions endpoint
const questionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests to generate questions. Please try again later.",
});

app.use("/api/questions", questionLimiter);

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  },
});

// Endpoint to upload a question paper
app.post("/api/upload-question-paper", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const paper = new QuestionPaper({
      userId,
      filePath: req.file.path,
      originalName: req.file.originalname,
    });

    await paper.save();

    res.status(200).json({
      message: "Question paper uploaded successfully.",
      paperId: paper._id.toString(),
    });
  } catch (error) {
    console.error(" Error uploading question paper:", error.message);
    res.status(500).json({ error: "An error occurred while uploading the question paper." });
  }
});

// Endpoint to handle chat messages via HTTP
app.post("/api/send-message", async (req, res) => {
  try {
    const { userId, message, mode } = req.body;

    if (!userId || !message?.trim() || !mode) {
      return res.status(400).json({ error: "userId, message, and mode are required." });
    }

    const aiResponse = await handleChatRequest(userId, message, mode);
    if (!aiResponse?.answer) {
      return res.status(500).json({ error: "Failed to generate AI response." });
    }

    res.status(200).json({ answer: aiResponse.answer });
  } catch (error) {
    console.error(" Error handling chat message via HTTP:", error.message);
    res.status(500).json({ error: "An internal error occurred. Try again later." });
  }
});

// Endpoint to save canvas drawings
app.post("/api/save-canvas", async (req, res) => {
  try {
    const { userId, canvasData } = req.body;
    if (!userId || !canvasData) {
      return res.status(400).json({ error: "userId and canvasData are required." });
    }

    const drawing = new CanvasDrawing({
      userId,
      canvasData,
    });

    await drawing.save();

    res.status(200).json({ message: "Canvas drawing saved successfully." });
  } catch (error) {
    console.error(" Error saving canvas drawing:", error.message);
    res.status(500).json({ error: "An error occurred while saving the canvas drawing." });
  }
});

// Endpoint to fetch canvas drawings for a user
app.get("/api/get-canvas", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const drawing = await CanvasDrawing.findOne({ userId }).sort({ createdAt: -1 });
    if (!drawing) {
      return res.status(404).json({ error: "No canvas drawing found for this user." });
    }

    res.status(200).json({ canvasData: drawing.canvasData });
  } catch (error) {
    console.error(" Error fetching canvas drawing:", error.message);
    res.status(500).json({ error: "An error occurred while fetching the canvas drawing." });
  }
});

// Endpoint to save test result
app.post("/api/save-test-result", async (req, res) => {
  try {
    const { userId, percentage, topic, paperId } = req.body;
    if (!userId || percentage === undefined) {
      return res.status(400).json({ error: "userId and percentage are required." });
    }

    const testResult = new TestResult({
      userId,
      percentage,
      topic,
      paperId,
    });

    await testResult.save();

    res.status(200).json({ message: "Test result saved successfully." });
  } catch (error) {
    console.error(" Error saving test result:", error.message);
    res.status(500).json({ error: "An error occurred while saving the test result." });
  }
});

// Endpoint to fetch the latest test result for a user
app.get("/api/get-test-result", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const testResult = await TestResult.findOne({ userId }).sort({ createdAt: -1 });
    if (!testResult) {
      return res.status(404).json({ error: "No test result found for this user." });
    }

    res.status(200).json({ percentage: testResult.percentage });
  } catch (error) {
    console.error(" Error fetching test result:", error.message);
    res.status(500).json({ error: "An error occurred while fetching the test result." });
  }
});

// Endpoint to fetch test history for a user
app.get("/api/test-history", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const testHistory = await TestResult.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ history: testHistory });
  } catch (error) {
    console.error(" Error fetching test history:", error.message);
    res.status(500).json({ error: "An error occurred while fetching the test history." });
  }
});

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Endpoint to fetch questions based on paperId or topic
app.get("/api/questions", async (req, res) => {
  try {
    const { paperId, topic, questionCount } = req.query;
    const numQuestions = parseInt(questionCount) || 2;

    if (paperId) {
      const paper = await QuestionPaper.findById(paperId);
      if (!paper) {
        return res.status(404).json({ error: "Question paper not found." });
      }

      const dataBuffer = fs.readFileSync(paper.filePath);
      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData.text;

      // Improved PDF question extraction
      const lines = text.split("\n").map(line => line.trim()).filter(line => line);
      const questions = [];
      let currentQuestion = null;

      for (const line of lines) {
        // Detect a question (e.g., starts with "Q" or a number followed by a dot)
        if (line.match(/^(Q\d*|\d+\.)/)) {
          if (currentQuestion) {
            questions.push(currentQuestion);
          }
          currentQuestion = {
            question: line,
            options: [],
            answer: null,
          };
        }
        // Detect options (e.g., starts with "A)", "B)", etc.)
        else if (currentQuestion && line.match(/^[A-D]\)/)) {
          currentQuestion.options.push(line);
        }
        // Detect answer (e.g., line starting with "Answer:" or "Ans:")
        else if (currentQuestion && line.match(/^(Answer|Ans):/i)) {
          const answerMatch = line.match(/^(Answer|Ans):\s*([A-D]\))/i);
          if (answerMatch) {
            currentQuestion.answer = answerMatch[2];
          }
        }
      }

      // Push the last question if it exists
      if (currentQuestion) {
        // Ensure the question has 4 options and an answer
        if (currentQuestion.options.length < 4) {
          currentQuestion.options = currentQuestion.options.concat(
            Array(4 - currentQuestion.options.length).fill("A) Option Placeholder")
          );
        }
        if (!currentQuestion.answer) {
          currentQuestion.answer = currentQuestion.options[0]; // Default to first option
        }
        questions.push(currentQuestion);
      }

      // Adjust the number of questions to match numQuestions
      const finalQuestions = questions.length >= numQuestions
        ? questions.slice(0, numQuestions)
        : [
            ...questions,
            ...Array.from({ length: numQuestions - questions.length }, (_, i) => ({
              question: `Additional Question ${i + 1} from paper`,
              options: ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
              answer: "A) Option 1",
            })),
          ];

      res.status(200).json({ questions: finalQuestions });
    } else if (topic) {
      const decodedTopic = decodeURIComponent(topic);

      let questions;
      if (!GEMINI_API_KEY) {
        questions = Array.from({ length: numQuestions }, (_, i) => ({
          question: `Mocked Question ${i + 1} about ${decodedTopic}`,
          options: ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
          answer: "A) Option 1",
        }));
      } else {
        const prompt = `Generate ${numQuestions} multiple-choice questions about ${decodedTopic} with 4 options each and the correct answer. Format the response as JSON with the following structure: { questions: [{ question: string, options: [string], answer: string }] }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up the response: Remove Markdown code block markers and extra whitespace
        text = text.replace(/```json\n|```/g, "").trim();

        try {
          const generatedQuestions = JSON.parse(text);
          questions = generatedQuestions.questions || [];
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", parseError.message);
          console.error("Raw response:", text);
          questions = Array.from({ length: numQuestions }, (_, i) => ({
            question: `Fallback Question ${i + 1} about ${decodedTopic}`,
            options: ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
            answer: "A) Option 1",
          }));
        }
      }

      res.status(200).json({ questions });
    } else {
      return res.status(400).json({ error: "Either paperId or topic is required." });
    }
  } catch (error) {
    console.error(" Error fetching questions:", error.message);
    res.status(500).json({ error: "An error occurred while fetching questions." });
  }
});

io.on("connection", (socket) => {
  console.log(` User connected: ${socket.id}, Origin: ${socket.handshake.headers.origin}`);

  // Debug connection issues
  socket.on("connect_error", (error) => {
    console.error(` Connection error for socket ${socket.id}:`, error.message);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { userId, message, mode } = data;

      if (!userId || !message?.trim() || !mode) {
        console.error("❌ Missing required fields:", { userId, message, mode });
        socket.emit("errorMessage", { error: "Message, userId, and mode are required." });
        return;
      }

      console.log("Emitting user message:", { sender: "User", text: `${mode}: ${message}` });
      io.emit("receiveMessage", { sender: "User", text: `${mode}: ${message}` });

      const aiResponse = await handleChatRequest(userId, message, mode);

      if (aiResponse?.answer) {
        console.log("Emitting AI response:", { sender: "Exam-AI", text: aiResponse.answer });
        io.emit("receiveMessage", { sender: "Exam-AI", text: aiResponse.answer });
      } else {
        socket.emit("errorMessage", { error: "Failed to generate AI response." });
      }
    } catch (error) {
      console.error("❌ Error handling chat message:", error.message);
      socket.emit("errorMessage", { error: "An internal error occurred. Try again later." });
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Use Vercel's PORT environment variable
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});