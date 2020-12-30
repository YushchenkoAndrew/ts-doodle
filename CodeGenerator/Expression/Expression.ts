import { Int, Types, Str, Var, Float, BinaryOperation, List, UnaryOperation, AST } from "../../Parser/Expression/Interfaces";
import { getType, isInclude } from "../../lib/index";
import { FuncCall } from "../../Parser/Statement/Interfaces";
import commands from "./Commands";
import library from "./LibraryFunc";
import { Declaration } from "../../Parser/Interfaces";
import Generator from "../CodeGenerator";

class Expression {
  parse(tree: Types | AST | Declaration): string {
    let { type } = tree;

    switch (type) {
      // FIXME: Bug with Parentheses; Create a State Machine
      case "Binary Operation":
        return this.parseBinOperation(tree as BinaryOperation);

      case "Unary Operation":
        return this.parserUnaryOperation(tree as UnaryOperation);

      case "LIBRARY_CALL":
      case "FUNC_CALL":
      case "VAR_CALL":
        return this.parseFuncCall(tree as FuncCall);

      case "FUNC":
        return this.parseArrowFunction(tree as Declaration);

      case "LIST":
        return `[${(tree as List).value.map((item) => this.parse(item)).join(", ")}]`;

      case "STR":
        return `"${(tree as Str).value}"`;

      // Rest of types such as INT, FLOAT, VAR
      default:
        return (tree as Int | Float | Var).value;
    }
  }

  private parseBinOperation({ value, left, right = {} as Types }: BinaryOperation) {
    // The flag shows BinaryOperations that different and depends strictly on language
    // if (isInclude(value, ...Object.keys(commands))) return commands[value](this.parse(left), this.parse(right));
    let flag = !isInclude(value, ...Object.keys(commands));

    // Get binary state
    let state = [left, right].reduce((acc, curr, i) => acc + Number(curr.type == "Binary Operation") * Math.pow(2, i), 0);

    switch (state) {
      // Next left and right values a Constant
      case 0:
        return flag ? `${this.parse(left)} ${value} ${this.parse(right)}` : commands[value](this.parse(left), this.parse(right));

      // Next Left value is Operation and the right is Constant
      case 1:
        return flag ? `(${this.parse(left)}) ${value} ${this.parse(right)}` : commands[value](`(${this.parse(left)})`, this.parse(right));

      // Next right value is Operation and the left is Constant
      case 2:
        return flag ? `${this.parse(left)} ${value} (${this.parse(right)})` : commands[value](this.parse(left), `(${this.parse(right)})`);

      // Both left and right are Operations
      case 3:
        return flag ? `(${this.parse(left)}) ${value} (${this.parse(right)})` : commands[value](`(${this.parse(left)})`, `(${this.parse(right)})`);
    }

    return "";
  }

  private parserUnaryOperation({ value, exp }: UnaryOperation) {
    // Some other Unary Operation that different and depends strictly on language
    return !isInclude(value, ...Object.keys(commands)) ? `${value}${this.parse(exp)}` : commands[value](this.parse(exp));
  }

  private parseFuncCall({ name, params }: FuncCall) {
    let args = params.map((arg) => this.parse(arg as Types));

    // Change function name from the json if it's a library one
    if (!isInclude(name, ...Object.keys(library))) return `${name}(${args.join(", ")})`;

    // TODO: Allow to set the specific arg to value (allow Assign)
    return library[name](args);
  }

  private parseArrowFunction({ params, body: [{ Expression: exp }], defined: [{ defined }] }: Declaration) {
    let args = params.map((arg) => `${arg.name}: ${getType(arg.defined)}${arg.Expression ? ` = ${this.parse(arg.Expression)}` : ""}`);
    return `(${args.join(", ")}): ${getType(defined)} => ` + this.parse(exp as Types | AST);
  }
}

export default Expression;
