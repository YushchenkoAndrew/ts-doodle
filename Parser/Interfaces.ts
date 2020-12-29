import { Assign, Command, Condition, ForLoop, FuncCall, Return } from "./Statement/Interfaces";
import { Func, Types } from "./Expression/Interfaces";

// Basics Interfaces for Parser
export interface Declaration {
  type: string;
  name: string;
  params: Assign[];
  body: Operation[];
  defined: Func;
}

export interface Range {
  min: string | number;
  max: string | number;
}

export interface Operation {
  [type: string]: OperationTypes;
}

export interface SyntaxTree {
  type: string;
  body: Operation[];
}

export type OperationTypes = Declaration | Assign | Condition | ForLoop | FuncCall | Return | Command;
