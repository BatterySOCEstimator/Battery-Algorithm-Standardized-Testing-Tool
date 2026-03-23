import express from "express";
import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import modelRoutes from "./routes/model.routes"
import dataRoutes from "./routes/data.routes"

if (!process.env.REACT_APP_FRONTEND_URL) throw new Error("REACT_APP_FRONTEND_URL is not set");

const app = express();
const port = process.env.PORT ?? 8000;

// Security headers
app.use(helmet());

app.use(cors({
    origin: process.env.REACT_APP_FRONTEND_URL,
    credentials: true,
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/model", modelRoutes);

// Health check
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});


// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[Unhandled error]", err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});