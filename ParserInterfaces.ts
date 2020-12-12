// Basics Interfaces for Parser
export interface Declaration {
  type: string;
  name: string;
  params: Statement[];
  body: Declaration[] | Statement[];
}

export interface Statement {
  type: string;
  name?: string;
  Expression?: Expression;
  defined: any;
}

export interface Expression {
  value: string;
  type: string;
  kind?: number;
  length?: number;
}

export interface Defined {
  type: string;
  kind?: number;
  length?: number;
}

export interface NodeState {
  [type: string]: Declaration | Statement | Expression;
}

export interface AST {
  type: string;
  body: NodeState[];
}
