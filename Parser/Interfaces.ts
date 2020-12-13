import { Assign, Condition, ForLoop, FuncCall } from "./Statement/Interfaces";

// Basics Interfaces for Parser
export interface Declaration {
  type: string;
  name: string;
  params: Assign[];
  body: Operation[];
}

export interface Operation {
  [type: string]: Declaration | Assign | Condition | ForLoop | FuncCall;
}
