import express, { Request, Response } from "express";
const routes = express.Router();

// Create a basic endpoint
routes.get("/", (req: Request, res: Response) => {
  res.send({
    success: true,
    message: "OK",
  });
});

export default routes;
