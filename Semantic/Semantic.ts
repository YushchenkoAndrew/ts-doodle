import { SyntaxTree, Operation, OperationTypes } from "../Parser/Interfaces";
import { Assign } from "../Parser/Statement/Interfaces";
import Statement from "./Statement/Statement";
import { Types } from "../Parser/Expression/Interfaces";
import { findOperations } from "../lib";

class Semantic {
  syntaxTree: SyntaxTree;
  keys = ["Declaration", "Statement", "Expression"];

  statement: Statement;

  constructor(syntaxTree: SyntaxTree) {
    console.log("\x1b[34m", "\n~ Start Semantic Analysis:", "\x1b[0m");

    this.syntaxTree = JSON.parse(JSON.stringify(syntaxTree));

    this.statement = new Statement();

    // this.postAnalysis(this.syntaxTree);
    if (this.syntaxTree.type == "Program") this.parseBody(this.syntaxTree.body);
  }

  parseBody(body: Operation[]) {
    for (let i in body) {
      for (let k of this.keys) if (body[i][k]) this.postAnalysis(k, body[i][k], body.slice(Number(i)));
    }
  }

  postAnalysis(state: string, curr: OperationTypes | Types, body: Operation[]) {
    switch (state) {
      case "Declaration":
        break;

      case "Statement": {
        this.statement.parse(curr, body);
        break;
      }

      case "Expression":
        break;
    }
  }

  findAssignments({ name }: Assign, body = [] as Operation[]): any {
    return body.filter((item) => (item.Statement as Assign).name == name && !(item.Statement as Assign).init);
  }

  filterByType(type: string, operationName: string, body = [] as Operation[]) {
    return body.filter((item) => item?.[operationName]?.type == type);
  }

  getTree() {
    return this.syntaxTree;
  }
}

export default Semantic;
