import { writeFileSync } from "fs";
import { SyntaxTree, Operation, OperationTypes, Declaration } from "../Parser/Interfaces";
import { Types } from "../Parser/Expression/Interfaces";
import Statement from "./Statement/Statement";
import Expression from "./Expression/Expression";

class Generator {
  keys = ["Declaration", "Statement", "Expression"];
  type = { INT: "number", FLOAT: "number", STR: "string", ANY: "any" };

  syntaxTree: SyntaxTree;

  statement: Statement;
  exp: Expression;

  level = -1;

  constructor(syntaxTree: SyntaxTree) {
    console.log("\x1b[34m", "\n~ Start Code Generator:", "\x1b[0m");

    this.syntaxTree = JSON.parse(JSON.stringify(syntaxTree)) as SyntaxTree;

    this.exp = new Expression();
    this.statement = new Statement(this.exp);
  }

  start(fileName: string = "Test.ts") {
    if (this.syntaxTree.type != "Program") return;

    writeFileSync(fileName, this.parseBody(this.syntaxTree.body) + "\n");
  }

  parseBody(body: Operation[]): string {
    this.level++;
    let code: string[] = [];

    for (let i in body) {
      for (let k of this.keys) if (body[i][k]) code.push(this.parse(k, body[i][k]));
    }

    let shift = this.getTabLevel(2, this.level--);
    return code.map((line) => shift + line).join("\n");
  }

  parse(name: string, tree: OperationTypes | Types): string {
    switch (name) {
      case "Declaration":
        console.log(`Declaration : ${this.getTabLevel()}[${tree.type}]`);

        // Add input params if demands of
        return (
          `function ${(tree as Declaration).name}(${(tree as Declaration).params.map((arg) => `${arg.name}: ${this.type[arg.defined.type]}`).join(", ")}) {\n` +
          this.parseBody((tree as Declaration).body) +
          `\n${this.getTabLevel()}}\n`
        );

      case "Statement":
        return this.statement.parse(this, tree);

      default:
        console.log("\nFailed: " + name);
    }

    return "";
  }

  getTabLevel(step: number = 2, value?: number): string {
    return " ".repeat((value ?? this.level) * step);
  }
}

export default Generator;
