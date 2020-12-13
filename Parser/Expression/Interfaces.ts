// All types represent a type with value and a defined
// at the same time
export interface Str {
  value?: string;
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

export interface Var {
  value: string;
  type: string;
  defined: Str | Int | Float | Var;
}

export interface BinaryOperation {
  type: string;
  value: string;
  left: Str | Int | Float | Var;
  right: Str | Int | Float | Var | undefined;
  priority: number;
}

export interface UnaryOperation {
  type: string;
  value: string;
  exp: Int | Var;
  priority: number;
}

export type Types = Int | Str | Float | Var;
export type AST = BinaryOperation | UnaryOperation;
