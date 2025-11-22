import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", async (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

healthRouter.get("/ready", async (req, res) => {
  // Check database connection
  const { getDb } = await import("../database/db");
  const db = await getDb();
  
  if (!db) {
    return res.status(503).json({ status: "not ready", reason: "database not connected" });
  }
  
  res.json({ status: "ready", timestamp: new Date().toISOString() });
});

