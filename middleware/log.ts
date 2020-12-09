import { Request, Response } from "express";

function getTime(): string {
  let arr = new Date().toString().split(" ");
  return "\x1b[35m[" + arr[4] + " " + [arr[2], arr[1], arr[3]].join("-") + "]\x1b[0m";
}

export function logInfo(...message: string[]) {
  console.log("\x1b[32m[INFO]\x1b[0m", ...message);
}

export function logErr(...err: string[]) {
  console.log(`\x1b[31m[ERROR ${status}]\x1b[0m${getTime()}`, ...err);
}

export function logReq(req: Request, res: Response, next: Function) {
  console.log(`\x1b[34m[${req.method} REQUEST]\x1b[0m${getTime()}\x1b[33m[PATH: ${req.path} ]\x1b[0m`);
  next();
}
