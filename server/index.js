import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import Replicate from "replicate";
import { fileURLToPath } from "url";

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Replicate client (requires REPLICATE_API_TOKEN in .env)
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN || "" });

// Helper: ensure directory exists
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Determine __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "uploads");
const processedDir = path.join(__dirname, "processed");
ensureDir(uploadDir);
ensureDir(processedDir);

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Serve static files from uploads & processed outputs
app.use("/uploads", express.static(uploadDir));
app.use("/processed", express.static(processedDir));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Root route
app.get("/", (req, res) => {
  res.send("Background Remover API");
});

app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Relative URL for original image
  const originalUrl = `/uploads/${req.file.filename}`;

  try {
    // Call rembg on Replicate if token is provided
    let processedUrl = originalUrl;

    if (process.env.REPLICATE_API_TOKEN) {
      const modelIdentifier = "cjwbw/rembg"; // latest version

      // Run model (returns URL of transparent PNG)
      const [output] = await replicate.run(modelIdentifier, {
        input: {
          image: fs.createReadStream(path.join(uploadDir, req.file.filename)),
        },
      });

      // Download the resulting image to processedDir so we can serve statically
      if (output) {
        const response = await fetch(output);
        const arrayBuffer = await response.arrayBuffer();
        const processedFilename = `${Date.now()}-nobg.png`;
        const localProcessedPath = path.join(processedDir, processedFilename);
        fs.writeFileSync(localProcessedPath, Buffer.from(arrayBuffer));
        processedUrl = `/processed/${processedFilename}`;
      }
    }

    res.json({
      message: "File processed successfully",
      original: originalUrl,
      cutout: processedUrl,
    });
  } catch (error) {
    console.error("Background removal error:", error);
    res.status(500).json({ error: "Background removal failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});