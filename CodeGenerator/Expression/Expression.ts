import { Int, Types, Str, Var, Float, BinaryOperation, List, UnaryOperation } from "../../Parser/Expression/Interfaces";
import { isInclude } from "../../lib/index";
import { FuncCall } from "../../Parser/Statement/Interfaces";
import commands from "./Commands.json";
import library from "../LibraryFunc";

class Expression {
  parse(tree: Types): string {
    let { type } = tree;

    switch (type) {
      // FIXME: Bug with Parentheses; Create a State Machine
      case "Binary Operation":
        return this.parseBinOperation(tree as BinaryOperation);

      case "Unary Operation":
        return this.parserUnaryOperation(tree as UnaryOperation);

      case "LIBRARY_CALL":
      case "FUNC_CALL":
        return this.parseFuncCall(tree as FuncCall);

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
    if (!isInclude(value, ...Object.keys(commands))) return `${this.parse(left)} ${value} ${this.parse(right)}`;

    // TODO:
    // Some other BinaryOperations that different and depends strictly on language
    return "";
  }

  private parserUnaryOperation({ value, exp }: UnaryOperation) {
    if (!isInclude(value, ...Object.keys(commands))) return `${value}${this.parse(exp)}`;

    // TODO:
    // Some other BinaryOperations that different and depends strictly on language
    return "";
  }

  private parseFuncCall({ name, params }: FuncCall) {
    let args = params.map((arg) => this.parse(arg as Types));

    // Change function name from the json if it's a library one
    if (!isInclude(name, ...Object.keys(library))) return `${name}(${args.join(", ")})`;

    // TODO: Allow to set the specific arg to value (allow Assign)
    return library[name](args);
  }
}

export default Expression;
