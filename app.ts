import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { logReq, logInfo } from "./middleware/log";
const app = express();

const HOST: string = process.env.HOST || "127.0.0.1";
const PORT: number = Number(process.env.PORT) || 8000;

// parse requests of content-type - application/json
app.use(cors());

// middleware for headers
app.use(helmet());

// Simple request logger
app.use(logReq);

app.use("/", routes);

app.listen(PORT, HOST, () => {
  logInfo("Server Started ...");
  logInfo(`Listening on Port ${PORT}`);
});
