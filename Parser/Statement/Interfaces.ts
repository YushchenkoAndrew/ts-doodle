import { Types, AST, Var } from "../Expression/Interfaces";
import { Operation } from "../Interfaces";

export interface Assign {
  type: string;
  name: string;
  Expression?: Types | AST;
  defined: Types;
}

export interface Return {
  type: string;
  Expression?: Types | AST;
  defined: Types;
}

export interface FuncCall {
  type: string;
  name: string;
  params: (Assign | Types)[];
  defined: Types;
}

export interface Condition {
  type: string;
  Expression: Types | AST;
  body: Operation[];
  else?: Operation[];
}

export interface ForLoop {
  type: string;
  iter: string;
  range: FuncCall | Var;
  body: Operation[];
}

export interface Command {
  type: string;
}
