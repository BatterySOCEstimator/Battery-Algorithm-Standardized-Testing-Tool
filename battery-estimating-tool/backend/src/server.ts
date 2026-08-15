import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import express from "express";
import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "@/routes/auth.routes";
import modelRoutes from "@/routes/model.routes"
import dataRoutes from "@/routes/data.routes"
import notificationRoutes from "@/routes/notification.routes"
import morgan from 'morgan';
import { logger } from '@/services/logger.service';
import path from "path";

if (!process.env.REACT_APP_FRONTEND_URL) throw new Error("REACT_APP_FRONTEND_URL is not set");

const app = express();
const port = process.env.PORT ?? 8000;

// Security headers
// app.use(helmet());

// Logging with Morgan + Winston
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.http(message.trim()),
    },
}));

app.use(cors({
    origin:   process.env.REACT_APP_FRONTEND_URL,
    credentials: true,
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/model", modelRoutes);
app.use("/api/notifications", notificationRoutes);

// Serve React static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/build');
  app.use(express.static(clientBuildPath));

  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}


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
    logger.error('Unhandled error', { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
});

//listen for all request on port 8000, the reason that we never have to mention server.ts on the frontend
app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
});