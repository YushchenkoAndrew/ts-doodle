import * as dotenv from "dotenv";
import { writeFileSync } from "fs";
import { SyntaxTree, Operation, OperationTypes, Declaration } from "../Parser/Interfaces";
import { List, Types } from "../Parser/Expression/Interfaces";
import Statement from "./Statement/Statement";
import Expression from "./Expression/Expression";
import { Return } from "../Parser/Statement/Interfaces";
dotenv.config();

class Generator {
  keys = ["Declaration", "Statement", "Expression"];
  types = { INT: "number", FLOAT: "number", STR: "string", ANY: "any" };

  syntaxTree: SyntaxTree;
  codeText: string = "";

  statement: Statement;
  exp: Expression;

  level = -1;

  constructor(syntaxTree: SyntaxTree) {
    console.log("\x1b[34m", "\n~ Start Code Generator:", "\x1b[0m");

    this.syntaxTree = JSON.parse(JSON.stringify(syntaxTree)) as SyntaxTree;

    this.exp = new Expression();
    this.statement = new Statement(this.exp);

    if (this.syntaxTree.type == "Program") this.codeText = this.parseBody(this.syntaxTree.body) + "\n";
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
        if (process.env.DEBUG) console.log(`Declaration : ${this.getTabLevel()}[${tree.type}]`);

        // Add input params if demands of
        return this.parseFuncDeclaration(tree as Declaration);

      case "Statement":
        return this.statement.parse(this, tree);

      default:
        console.log("\nFailed: " + name);
    }

    return "";
  }

  private parseFuncDeclaration({ style, name, params, body, defined }: Declaration) {
    let args = params.map((arg) => `${arg.name}: ${this.getType(arg.defined)}${arg.Expression ? ` = ${this.statement.exp.parse(arg.Expression)}` : ""}`);

    if (style == "ARROW") {
      let { Expression: exp = {} as Types } = body[0].Statement as Return;
      return `let ${name} = (${args.join(", ")}): ${this.getType(defined)} => ` + this.statement.exp.parse(exp);
    }

    return `function ${name}(${args.join(", ")}): ${this.getType(defined)} {\n` + this.parseBody(body) + `\n${this.getTabLevel()}}\n`;
  }

  getType(defined: Types): string {
    if ((defined as List).defined) return `${this.getType((defined as List).defined)}[]`;
    return `${this.types[defined.type]}`;
  }

  getTabLevel(step: number = 2, value?: number): string {
    return " ".repeat((value ?? this.level) * step);
  }

  getCode() {
    return this.codeText;
  }

  save(fileName: string = "") {
    writeFileSync(fileName, this.codeText);
  }
}

export default Generator;
