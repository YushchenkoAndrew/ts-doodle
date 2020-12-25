import { Int, Types, Str, Var, Float, BinaryOperation, List, UnaryOperation } from "../../Parser/Expression/Interfaces";
import { isInclude } from "../../lib/index";
import { FuncCall } from "../../Parser/Statement/Interfaces";
import commands from "./Commands.json";

class Expression {
  parse(tree: Types): string {
    let { type } = tree;

    switch (type) {
      case "Binary Operation":
        return this.parseBinOperation(tree as BinaryOperation);

      case "Unary Operation":
        return this.parserUnaryOperation(tree as UnaryOperation);

      case "FUNC_CALL":
        // TODO: Allow to set the specific arg to value (allow Assign)
        return `${(tree as FuncCall).name}(${(tree as FuncCall).params.map((arg) => this.parse(arg as Types)).join(", ")})`;

      case "LIBRARY_CALL":
        console.log(tree);
        return "";

      case "LIST":
        return `[${(tree as List).value.map((item) => this.parse(item)).join(", ")}]`;

      // Rest of types such as INT, STR, FLOAT, VAR
      default:
        return (tree as Int | Float | Str | Var).value;
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
}

export default Expression;
