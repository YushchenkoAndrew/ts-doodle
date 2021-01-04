import { Operation, OperationTypes } from "../../Parser/Interfaces";
import { BinaryOperation, Types, UnaryOperation } from "../../Parser/Expression/Interfaces";

class Expression {
  erase(curr: OperationTypes): OperationTypes | null {
    let { type } = curr;

    switch (type) {
      case "Binary Operation":
        let left = this.erase((curr as BinaryOperation).left);
        let right = this.erase((curr as BinaryOperation).right ?? ({} as OperationTypes));

        if (left && right) {
          // Change left and right Expression to found one
          (curr as BinaryOperation).left = left as Types;
          (curr as BinaryOperation).right = right as Types;
          return curr;
        }

        return left || right;

      case "Unary Operation":
        return this.erase((curr as UnaryOperation).exp);

      case "VAR_CALL":
      case "LIBRARY_CALL":
      case "FUNC_CALL":
        return curr;

      default:
        return null;
    }
  }
}

export default Expression;
