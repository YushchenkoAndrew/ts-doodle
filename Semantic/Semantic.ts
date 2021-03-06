import { SyntaxTree, Operation, OperationTypes, Declaration } from "../Parser/Interfaces";
import { Assign, Return } from "../Parser/Statement/Interfaces";
import Statement from "./Statement/Statement";
import Expression from "./Expression/Expression";
import { Types } from "../Parser/Expression/Interfaces";
import { access } from "fs";

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

    // Get all Returns in the func and find the unique one
    let returns = this.statement.findStatement("type", "RET", curr.body).map((item) => item.Statement) as Return[];
    let uniqueTypes = Object.values(
      returns.reduce(
        (acc, curr) => ({ ...acc, ...curr.defined.filter((item) => !acc[item.type]).reduce((total, item) => ({ ...total, [item.type]: item }), {}) }),
        {}
      )
    ) as Types[];

    // Define Return types
    (body[0].Declaration as Declaration).defined[0].defined = uniqueTypes.length ? uniqueTypes : [{ value: "", type: "UNDEFINED" }];

    if (process.env.DEBUG) {
      let {
        name,
        defined: [{ defined }],
      } = body[0].Declaration as Declaration;
      console.log(`DEFINE TO FUNC "${name}" RETURN TYPES [${defined.map(({ type }) => type)}]`);
    }

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

    if (process.env.DEBUG) {
      console.log("TRANSFORM FUNC DECLARATION INTO STATEMENT");
      console.dir(body[0], { depth: 3 });
    }
  }

  getTree() {
    return this.syntaxTree;
  }
}

export default Semantic;
