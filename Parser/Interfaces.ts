import { Assign, Command, Condition, ForLoop, FuncCall, Return } from "./Statement/Interfaces";
import { Types } from "./Expression/Interfaces";

// Basics Interfaces for Parser
export interface Declaration {
  style: string;
  type: string;
  name: string;
  params: Assign[];
  range: Range;
  body: Operation[];
  defined: Types;
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
