import { SyntaxTree, Operation, OperationTypes, Declaration } from "../Parser/Interfaces";
import { Assign, Return } from "../Parser/Statement/Interfaces";
import Statement from "./Statement/Statement";
import Expression from "./Expression/Expression";
import { Types } from "../Parser/Expression/Interfaces";

class Semantic {
  syntaxTree: SyntaxTree;
  keys = ["Declaration", "Statement", "Expression"];

  statement: Statement;
  exp: Expression;

  constructor(syntaxTree: SyntaxTree) {
    console.log("\x1b[34m", "\n~ Start Semantic Analysis:", "\x1b[0m");

    this.syntaxTree = JSON.parse(JSON.stringify(syntaxTree));

    this.statement = new Statement();
    this.exp = new Expression();

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
        this.parseFuncDeclaration(curr as Declaration, body);
        break;

      case "Statement": {
        this.statement.parse(this, curr, body);
        break;
      }

      case "Expression":
        let useful = this.exp.erase(curr);

        // Check if any changes was given to the top layer
        if (useful === curr) break;

        // Check if useful does even exist
        if (!useful) {
          if (process.env.DEBUG) {
            console.log("ERASED USELESS CODE:");
            console.dir(body[0], { depth: 3 });
          }

          delete body[0].Expression;
          break;
        }

        if (process.env.DEBUG) {
          console.log("SIMPLIFY EXPRESSION TO:");
          console.dir({ Expression: useful }, { depth: 3 });
        }

        body[0].Expression = useful;
    }
  }

  // TODO: Check and define params type if its doesn't defined in parser
  private parseFuncDeclaration(curr: Declaration, body: Operation[]) {
    // TODO: To think about saving level
    this.parseBody(curr.body);
    let size = curr.body.filter((opr) => opr.Declaration || opr.Statement || opr.Expression).length;

    // TODO: To create types post Analyses
    console.log(this.statement.findStatement("type", "RET", curr.body).map((item) => item.Statement));

    if (size > 1 || curr.body[0].Statement?.type != "RET") return;

    // Copy function Declaration and delete it from Object
    let func = JSON.parse(JSON.stringify(body[0].Declaration)) as Declaration;
    delete body[0].Declaration;

    // Transform Operation Syntax: Declaration => Statement
    body[0].Statement = {
      type: "VAR",
      name: func.name,
      init: { type: "VAR", init: true },
      binOpr: "",
      Expression: {
        type: "FUNC",
        name: "",
        params: func.params,
        body: [{ Expression: (func.body[0].Statement as Return).Expression }],
        defined: func.defined,
      } as Declaration,
      defined: func.defined,
    } as Assign;
  }

  getTree() {
    return this.syntaxTree;
  }
}

export default Semantic;
