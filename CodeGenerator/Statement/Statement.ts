import * as dotenv from "dotenv";
import Expression from "../Expression/Expression";
import { OperationTypes } from "../../Parser/Interfaces";
import { Assign, Condition, ForLoop, FuncCall, Return } from "../../Parser/Statement/Interfaces";
import { Types } from "../../Parser/Expression/Interfaces";
import Generator from "../CodeGenerator";
import { getType, isInclude } from "../../lib/index";
dotenv.config();

class Statement {
  exp: Expression;

  constructor(exp: Expression) {
    this.exp = exp;
  }

  parse(ptr: Generator, tree: OperationTypes): string {
    let { type } = tree;
    if (process.env.DEBUG) console.log(`Statement   : ${ptr.getTabLevel()}[${type}]`);

    switch (type) {
      case "VAR":
        return this.parseVariable(getType((tree as Assign).defined), tree as Assign);

      case "RET":
        return `return ${this.exp.parse((tree as Return).Expression ?? ({} as Types))};`;

      case "WHILE":
      case "IF":
        return this.parseIf(ptr, type.toLowerCase(), tree as Condition);

      case "FOR":
        return (
          `for (let ${(tree as ForLoop).iter} of ${this.exp.parse((tree as ForLoop).range)}) {\n` +
          ptr.parseBody((tree as ForLoop).body) +
          `\n${ptr.getTabLevel()}}`
        );

      case "CONTINUE":
      case "BREAK":
        return type.toLowerCase() + ";";

      default:
        console.log("Nooo", type);
    }

    return "";
  }

  private parseVariable(type: string, { name, init, binOpr, Expression: exp = {} as Types, defined }: Assign) {
    if (init.init) return `${init.type == "CONST" ? "const" : "let"} ${name}: ${type} ${binOpr}= ${this.exp.parse(exp)};`;
    return `${name} ${binOpr}= ${this.exp.parse(exp)};`;
  }

  private parseIf(ptr: Generator, type: string, { body, Expression: exp, else: elseBody }: Condition) {
    let result = `${type} (${this.exp.parse(exp)}) {\n` + ptr.parseBody(body) + `\n${ptr.getTabLevel()}}`;
    if (!elseBody) return result;

    if (process.env.DEBUG) console.log(`Statement   : ${ptr.getTabLevel()}[ELSE]`);
    return result + " else {\n" + ptr.parseBody(elseBody) + `\n${ptr.getTabLevel()}}`;
  }
}

export default Statement;
