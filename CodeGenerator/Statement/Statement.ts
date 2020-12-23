import Expression from "../Expression/Expression";
import { OperationTypes } from "../../Parser/Interfaces";
import { Assign, Condition, FuncCall, Return } from "../../Parser/Statement/Interfaces";
import { Types } from "../../Parser/Expression/Interfaces";
import Generator from "../CodeGenerator";

class Statement {
  exp: Expression;

  constructor(exp: Expression) {
    this.exp = exp;
  }

  parse(ptr: Generator, tree: OperationTypes): string {
    let { type } = tree;

    switch (type) {
      case "VAR":
        // FIXME: Initialize variable if it needs to + Add (") to STR
        return `let ${(tree as Assign).name} = ${this.exp.parse((tree as Assign).Expression ?? ({} as Types))};`;

      case "RET":
        return `return ${this.exp.parse((tree as Return).Expression ?? ({} as Types))}`;

      case "FUNC_CALL":
        return `${(tree as FuncCall).name}(${(tree as FuncCall).params.map((arg) => this.exp.parse(arg as Types)).join(", ")});`;

      case "IF":
        return `if (${this.exp.parse((tree as Condition).Expression)}) {\n` + ptr.parseBody((tree as Condition).body) + `\n${" ".repeat(ptr.level * 4)}}\n`;

      case "WHILE":
        // this.func.body.push(`; WHILE LOOP ${this.labels.loop}`);
        // this.createWhileDistribution(tree, params);
        break;

      case "FOR":
        // this.func.body.push(`; FOR LOOP ${this.labels.loop}`);
        // this.createForDistribution(tree, params);
        break;

      case "CONTINUE":
      case "BREAK":
        // this.func.body.push("");
        // this.func.body.push(`; ${type}`);
        // this.func.body.push(`JMP @${type == "BREAK" ? "END" : "LOOP"}${this.labels.loop}`);
        break;

      default:
        console.log("Nooo");
    }

    return "";
  }
}

export default Statement;
