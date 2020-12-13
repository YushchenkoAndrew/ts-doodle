import { Float, Int, Str, Var, BinaryOperation, UnaryOperation } from "../Expression/Interfaces";
import { Operation } from "../Interfaces";

export interface Assign {
  type: string;
  name: string;
  Expression?: Float | Int | Str | Var | BinaryOperation | UnaryOperation;
  defined: Float | Int | Str | Var;
}

export interface FuncCall {
  type: string;
  name: string;
  params: Assign[];
  defined: Float | Int | Str | Var;
}

export interface Condition {
  type: string;
  Expression: Float | Int | Str | Var | BinaryOperation | UnaryOperation;
  body: Operation[];
  else?: Operation[];
}

export interface ForLoop {
  type: string;
  iter: string;
  range: FuncCall;
  body: Operation[];
}
