import { FuncCall, Condition } from "../Statement/Interfaces";
import { Range } from "../Interfaces";
// All types represent a type with value and a defined
// at the same time
export interface Str {
  value: string;
  type: string;
  length: number;
}

export interface Int {
  value: string;
  type: string;
  kind: number;
}

export interface Float {
  value: string;
  type: string;
}

export interface List {
  value: Types[];
  type: string;
  length: number;
  defined: Types[];
}

export interface Var {
  value: string;
  type: string;
  defined: Types[];
}

export interface Func {
  type: string;
  range: Range;
  defined: Types[];
}

export interface BinaryOperation {
  type: string;
  value: string;
  left: Types;
  right?: Types;
  priority: number;
}

export interface UnaryOperation {
  type: string;
  value: string;
  exp: Types;
  priority: number;
}

export type Types = Int | Str | Float | Var | List | FuncCall | Func | Condition;
export type AST = BinaryOperation | UnaryOperation;
