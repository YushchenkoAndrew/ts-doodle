import Expression from "../Expression/Expression";
import { OperationTypes } from "../../Parser/Interfaces";
import { Assign, Condition, ForLoop, FuncCall, Return } from "../../Parser/Statement/Interfaces";
import { Types } from "../../Parser/Expression/Interfaces";
import Generator from "../CodeGenerator";
import library from "../LibraryFunc.json";
import { isInclude } from "../../lib/index";

class Statement {
  exp: Expression;

  constructor(exp: Expression) {
    this.exp = exp;
  }

  parse(ptr: Generator, tree: OperationTypes): string {
    let { type } = tree;
    console.log(`Statement   : ${ptr.getTabLevel()}[${type}]`);

    switch (type) {
      case "VAR":
        // FIXME: Initialize variable if it needs to + Add (") to STR
        return `let ${(tree as Assign).name} = ${this.exp.parse((tree as Assign).Expression ?? ({} as Types))};`;

      case "RET":
        return `return ${this.exp.parse((tree as Return).Expression ?? ({} as Types))};`;

      case "LIBRARY_CALL":
      case "FUNC_CALL":
        return this.parseFuncCall(tree as FuncCall);

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
        console.log("Nooo");
    }

    return "";
  }

  private parseFuncCall({ name, params }: FuncCall) {
    // Change function name from the json if it's a library one
    name = isInclude(name, ...Object.keys(library)) ? library[name] : name;

    // TODO: Allow to set the specific arg to value (allow Assign)
    return `${name}(${params.map((arg) => this.exp.parse(arg as Types)).join(", ")});`;
  }

  private parseIf(ptr: Generator, type: string, { body, Expression: exp, else: elseBody }: Condition) {
    let result = `${type} (${this.exp.parse(exp)}) {\n` + ptr.parseBody(body) + `\n${ptr.getTabLevel()}}`;
    if (!elseBody) return result;

    console.log(`Statement   : ${ptr.getTabLevel()}[ELSE]`);
    return result + " else {\n" + ptr.parseBody(elseBody) + `\n${ptr.getTabLevel()}}`;
  }
}

export default Statement;
