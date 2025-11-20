const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { spawn } = require("child_process");
const Database = require("better-sqlite3");
const crypto = require("crypto");
const { start } = require("repl");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(cors());

// Initialize DB
const db = new Database("db/database.db");

// Ensure models directory exists
const modelsFolder = path.join(__dirname, "db/models");
if (!fs.existsSync(modelsFolder)) {
  fs.mkdirSync(modelsFolder, { recursive: true });
}

// Create table for storing model info
db.exec(`
  CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    filename TEXT NOT NULL,
    description TEXT,
    author TEXT,
    academic_affiliation TEXT,
    model_type TEXT,
    file_path TEXT NOT NULL,
    evaluation_result TEXT,
    attributes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const upload = multer({ dest: "db/models" });

// Function to generate random attributes 
function generateRandomAttributes() {
  const attributes = {
    "Weighted Error": Math.random() * 0.1,
    "All Cells": Math.random() * 0.05,
    "Blind Cells": Math.random() * 0.08,
    "Non-Blinded Cells": Math.random() * 0.03,
    Charging: Math.random() * 0.06,
    "80kg Payload": Math.random() * 0.04,
    "448kg Payload with HVAC": Math.random() * 0.07,
    "448kg Payload no HVAC": Math.random() * 0.05,
    "1000kg Payload": Math.random() * 0.09,
    "Standard Cycles": Math.random() * 0.04,
    "Custom Cycles": Math.random() * 0.05,
    n20C: Math.random() * 0.08,
    n10C: Math.random() * 0.06,
    "0C": Math.random() * 0.04,
    "10C": Math.random() * 0.03,
    "25C": Math.random() * 0.02,
    "40C": Math.random() * 0.05,
    "iSOC Error": Math.random() * 0.02,
    "Current Sensor Error": Math.random() * 0.01,
    "All Drive Cycles Average RMSE": Math.random() * 0.04,
    "All Drive Cycles Average MAE": Math.random() * 0.03,
    "All Drive Cycles Average MAXE": Math.random() * 0.07,
  };
  let attributesString = JSON.stringify(attributes);
  return attributesString;
}

// POST Evaluate endpoint
app.post("/evaluate", upload.single("model"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  //Record start time
  const startTime = new Date().toISOString().replace('T', ' ').split('.')[0];
  // Create a unique UUID for the model
  const modelUUID = crypto.randomUUID();
  const modelPath = path.resolve(req.file.path);
  const originalFilename = req.file.originalname;

  const author = req.body.author || "Unknown Author";
  const academicAffiliation =
    req.body.academic_affiliation || "Unknown Affiliation";
  const modelType = req.body.model_type || "Unknown Type";

  // If uploaded file is a .pth or .pt, evaluate it
  if (
    originalFilename.toLowerCase().endsWith(".pth") ||
    originalFilename.toLowerCase().endsWith(".pt")
  ) {
    // Spawn Python process to evaluate the model
    const python = spawn("python", ["eval_model.py", modelPath]);

    // Capture stdout and stderr
    let output = "";
    python.stdout.on("data", (data) => {
      output += data.toString();
    });
    let errorOutput = "";
    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error("ERROR: ", data.toString());
    });

    // Process completion
    python.on("close", (code) => {
      // Handle non-zero exit codes
      if (code !== 0) {
        fs.unlink(modelPath, (err) => {
          if (err) console.error("Failed to delete temp file:", err);
        });

        return res.status(500).json({
          error: "Python script failed",
          code: code,
          stderr: errorOutput,
          stdout: output,
        });
      }

      try {
        const jsonResult = JSON.parse(output.trim());
        const resultString = JSON.stringify(jsonResult);

        // Create permanent file path
        const fileExtension = path.extname(originalFilename);
        const permanentFilePath = path.join(
          modelsFolder,
          `${modelUUID}${fileExtension}`
        );

        // Generate random attributes for the model, *FOR DEMO PURPOSES*
        const attributesString = generateRandomAttributes();

        //Record end time
        const endTime = new Date().toISOString().replace('T', ' ').split('.')[0];

        // Insert model record into the database
        const insertModel = db.prepare(`
                    INSERT INTO models (uuid, author, model_type, academic_affiliation, filename, file_path, evaluation_result, attributes, created_at, completed_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
        insertModel.run(
          modelUUID,
          author,
          modelType,
          academicAffiliation,
          originalFilename,
          modelPath,
          resultString,
          attributesString,
          startTime,
          endTime
        );

        fs.rename(modelPath, permanentFilePath, (moveErr) => {
          if (moveErr) {
            console.error("Failed to save file:", moveErr);
          }
        });

        // Send response
        res.json({
          uuid: modelUUID,
          filename: originalFilename,
          evaluation: jsonResult,
        });

        // Catch JSON parse errors
      } catch (e) {
        res.status(500).json({
          error: "Failed to parse JSON output",
          parseError: e.message,
          raw: output,
        });
      }
    });

    // Handle spawn errors
    python.on("error", (err) => {
      // Clean up temp file on error
      fs.unlink(modelPath, (err) => {
        if (err) console.error("Failed to delete temp file:", err);
      });

      res.status(500).json({
        error: "Failed to spawn Python process",
        details: err.message,
      });
    });
  } else {
    // Unsupported file type

    try {
      // Generate random attributes for the model, *FOR DEMO PURPOSES*
      const attributesString = generateRandomAttributes();

      // Insert model record into the database
      const insertModel = db.prepare(`
                INSERT INTO models (uuid, filename, file_path, attributes, created_at, completed_at) 
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);
      insertModel.run(
        modelUUID,
        originalFilename,
        modelPath,
        attributesString,
        startTime
      );

      fs.unlink(modelPath, (err) => {
        if (err) console.error("Failed to delete temp file:", err);
      });

      // Send response
      res.json({
        uuid: modelUUID,
        filename: originalFilename,
        evaluation: jsonResult,
      });

      // Catch JSON parse errors
    } catch (e) {
      res.status(500).json({
        error: "Failed to parse JSON output",
        parseError: e.message,
        raw: output,
      });
    }
  }
});


app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
  console.log("SQLite database: database.db");
  console.log("Upload directory: db/models/");
});
