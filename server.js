import express from "express";
import db from "./db.js";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import formatResponseText from "./formatResponseText.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Enhanced error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  const status = err.status || 500;
  const message = err.message || "An unexpected error occurred";
  res.status(status).json({ 
    error: err.name, 
    message,
    timestamp: new Date().toISOString()
  });
};

// Database query wrapper
const executeQuery = async (query, params = []) => {
  try {
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Query error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

// Routes
app.get("/", async (req, res, next) => {
  try {
    const rows = await executeQuery("SELECT * FROM semesters");
    res.json(rows);
  } catch (error) {
    next({ status: 500, message: "Failed to fetch semesters" });
  }
});

app.get("/subjects/:sem_key", async (req, res, next) => {
  try {
    const rows = await executeQuery(
      "SELECT * FROM subjects WHERE semester_id = $1",
      [req.params.sem_key]
    );
    res.json(rows);
  } catch (error) {
    next({ status: 500, message: "Failed to fetch subjects for the semester" });
  }
});

app.get("/lab_manual/:sem_id", async (req, res, next) => {
  try {
    const rows = await executeQuery(
      "SELECT * FROM semesters WHERE id = $1",
      [req.params.sem_id]
    );
    res.json(rows);
  } catch (error) {
    next({ status: 500, message: "Failed to fetch lab manuals" });
  }
});

app.get("/subject/papers/:sub_id", async (req, res, next) => {
  try {
    const rows = await executeQuery(
      "SELECT * FROM question_papers WHERE subject_id = $1",
      [req.params.sub_id]
    );
    res.json(rows);
  } catch (error) {
    next({ status: 500, message: "Failed to fetch question papers" });
  }
});

app.get("/subject/notes/:sub_id", async (req, res, next) => {
  try {
    const rows = await executeQuery(
      "SELECT * FROM notes WHERE subject_id = $1 ORDER BY note_title ASC",
      [req.params.sub_id]
    );
    res.json(rows);
  } catch (error) {
    next({ status: 500, message: "Failed to fetch notes" });
  }
});

app.post("/generate", async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      throw { status: 400, message: "Invalid prompt. It must be a non-empty string." };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = await result.response;
    let text = await response.text();

    if (!text) {
      throw new Error("No text generated from the model");
    }

    text = formatResponseText(text);
    res.json({ text });
  } catch (error) {
    next({
      status: error.response?.status || 500,
      message: error.message || "An error occurred while generating the response",
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Use error handler middleware
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  try {
    await db.end();
    console.log('Database connections closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Server Initialization
app.listen(port, () => {
  console.log(`Server is running successfully`);
});