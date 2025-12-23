import express, { Express, Request, Response } from "express";
import { formatMessage, type ApiResponse } from "@rewrlution/papyrus-shared";

export function createServer(): Express {
  const app = express();

  // middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    const response: ApiResponse<{ status: string; timestamp: string }> = {
      success: true,
      message: formatMessage("API is healthy"),
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  });
  return app;
}
