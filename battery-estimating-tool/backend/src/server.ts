import express from "express";
import "dotenv/config";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import modelRoutes from "./routes/model.routes"
import dataRoutes from "./routes/data.routes"


const app = express();
const port = 8000;


app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true
  })
);

// Better-Auth routes
//app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json());

// Mount betterauth routes
app.use("/api/auth", authRoutes);
// Mount data routes 
app.use("/api/data", dataRoutes);
app.use("/api/model", modelRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`App server listening on port ${port}`);
});