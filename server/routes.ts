import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for potential future features such as:
  // - Saving/loading game progress
  // - User authentication
  // - Leaderboards, etc.
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // For now, we'll keep this minimal as most functionality is client-side
  // Additional routes will be added as needed

  const httpServer = createServer(app);

  return httpServer;
}
