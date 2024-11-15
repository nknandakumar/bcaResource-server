import express from "express";
import db from "./db.js"; // Assuming db.js exports the configured PostgreSQL client with a connection pool
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import formatResponseText from "./formatResponseText.js"; // Moved formatting to a separate file

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Unified error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  const status = err.status || 500;
  const message = err.message || "An unexpected error occurred";
  res.status(status).json({ error: err.name, message });
};

// Routes
app.get("/", async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM semesters");
    res.json(rows);
  } catch (error) {
    next({ status: 500, message: "Failed to fetch semesters" });
  }
});

app.get("/subjects/:sem_key", async (req, res, next) => {
  const { sem_key } = req.params;
  try {
    const { rows } = await db.query("SELECT * FROM subjects WHERE semester_id = $1", [sem_key]);
    res.json(rows);
  } catch (error) {
    next({ status: 500, message: "Failed to fetch subjects for the semester" });
  }
});

app.get("/lab_manual/:sem_id", async (req, res, next) => {
  const { sem_id } = req.params;
  try {
    const { rows } = await db.query("SELECT * FROM semesters WHERE id = $1", [sem_id]);
    res.json(rows);
  } catch (error) {
    next({ status: 500, message: "Failed to fetch lab manuals" });
  }
});

app.get("/subject/papers/:sub_id", async (req, res, next) => {
  const { sub_id } = req.params;
  try {
    const { rows } = await db.query("SELECT * FROM question_papers WHERE subject_id = $1", [sub_id]);
    res.json(rows);
  } catch (error) {
    next({ status: 500, message: "Failed to fetch question papers" });
  }
});

app.get("/subject/notes/:sub_id", async (req, res, next) => {
  const { sub_id } = req.params;
  try {
    const { rows } = await db.query("SELECT * FROM notes WHERE subject_id = $1 ORDER BY note_title ASC", [sub_id]);
    res.json(rows);
  } catch (error) {
    next({ status: 500, message: "Failed to fetch notes" });
  }
});

app.post("/generate", async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return next({ status: 400, message: "Invalid prompt. It must be a non-empty string." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = await result.response;
    let text = await response.text();

    if (!text) throw new Error("No text generated from the model");

    text = formatResponseText(text); // Apply formatting
    res.json({ text });
  } catch (error) {
    next({
      status: error.response?.status || 500,
      message: error.message || "An error occurred while generating the response",
    });
  }
});

// Use unified error handler middleware
app.use(errorHandler);

// Server Initialization
app.listen(port, () => {
  console.log(`server is started `);
});
