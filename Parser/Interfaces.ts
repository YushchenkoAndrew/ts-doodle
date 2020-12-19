import { Assign, Command, Condition, ForLoop, FuncCall, Return } from "./Statement/Interfaces";
import { Types } from "./Expression/Interfaces";

// Basics Interfaces for Parser
export interface Declaration {
  type: string;
  name: string;
  params: Assign[];
  body: Operation[];
  defined: Types;
}

export interface Operation {
  [type: string]: OperationTypes;
}

export type OperationTypes = Declaration | Assign | Condition | ForLoop | FuncCall | Return | Command;
