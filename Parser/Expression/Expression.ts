import * as dotenv from "dotenv";
import priorityTable from "./PriorityTable.json";
import allowedOperations from "./AllowedOperations.json";
import Parser from "../Parser";
import { Str, BinaryOperation, UnaryOperation, Types, AST, Var, List, Func } from "./Interfaces";
import ErrorHandler from "../../Error/Error";
import { FuncCall, Assign } from "../Statement/Interfaces";
import { getDefinedToken, copyTree } from "../../lib";
import { Declaration, OperationTypes } from "../Interfaces";
import library from "../Statement/LibraryFunc.json";
import { isInclude } from "../../lib/index";
dotenv.config();

class Expression {
  err: ErrorHandler;

  neg = "Unary";
  parentheses = 0;

  ast = {} as AST;
  type = { prev: {} as Types, curr: {} as Types };

  constructor(err: ErrorHandler) {
    this.err = err;
  }

  parse(ptr: Parser): Types | AST {
    this.ast = {} as AST;
    this.type = { prev: {} as Types, curr: {} as Types };

    this.neg = "Unary";
    this.parentheses = 0;

    return this.parseExpression(ptr, {});
  }

  /**
   *
   * @param params   --   Previous param
   * @param priority --   priority is important
   */
  private parseExpression(
    ptr: Parser,
    { params = {} as Types, priority = null }: { params?: Types | AST; priority?: number | null }
  ): Types | AST | Declaration {
    let { type } = ptr.tokens[ptr.line][ptr.index] || { type: "LINE_END" };

    switch (type.split(/\ /g)[1] || type) {
      case "Boolean":
      case "String":
      case "Number":
        let constant = this.parseConstExpression(ptr);
        this.type = defineType(this.type, { ...constant }, this.ast);

        // Change value of this.neg to unary because after a number can be only
        // a binary operation
        this.neg = "Binary";

        // Check on this syntax => "a = 2 3"
        if (params.type) this.err.message({ name: "SyntaxError", message: `Such syntax is invalid`, ptr });

        // If this.ast is not define then call parseExpression, it's need for start
        // up the recursion
        if (priority === null) return this.parseExpression(ptr, { params: constant, priority });
        return constant;

      case "Variable":
        let { value } = ptr.tokens[ptr.line][ptr.index++];

        // Change value of this.neg to unary because after a number can be only
        // a binary operation
        this.neg = "Binary";

        let varDeclaration =
          (library[value] as OperationTypes) ??
          getDefinedToken(["Statement", "Declaration"], "name", value, ptr.currLevel, () =>
            this.err.message({ name: "NameError", message: `Such Name "${value}" is not defined`, ptr })
          );

        // Set as default value simple Assign template for Variable
        let varType: Var | FuncCall = { value, type: "VAR", defined: (varDeclaration as Assign).defined };
        let defined = (varDeclaration as Assign).defined;
        let { type: nextToken } = ptr.tokens[ptr.line][ptr.index] ?? { type: "" };

        // Check if after all the next operation is not a Variable but a result of
        // Function Caller then change varType to "FuncCall" and change defined Value
        if (isInclude((varDeclaration as Var).defined.type ?? " ", "FUNC", "LIBRARY") && isInclude(nextToken, "Open Parentheses")) {
          varType = ptr.statement.parseFuncCaller(ptr);
          defined = (varType.defined as Var).defined;
        }

        // Check if current variable has any type if so then send itself, else
        // the AST, this need for such situation => (a + b), where a => "ANY",
        // b => "INT"
        this.type = defineType(this.type, { ...defined }, varType.defined.type == "ANY" ? varType : this.ast);

        if (priority === null) return this.parseExpression(ptr, { params: varType });
        return varType;

      case "Unary": {
        let currPriority = priorityTable[type];
        let operator = ptr.tokens[ptr.line][ptr.index++].value;

        // Check Operation type and if it a Neg but also it should be a binary
        // operation then change tokens type and recall parseExpression function
        if (this.neg == "Binary" && operator == "-") {
          ptr.tokens[ptr.line][--ptr.index].type = "Neg Operator";
          return this.parseExpression(ptr, { params: params, priority: priority });
        }

        // Get an expression with priority -1, that mean that after finding a
        // constant value or variable return it immediately, this need when this.ast is undefined
        let exp = this.parseExpression(ptr, { priority: -1 });
        this.err.checkObj(
          "type",
          this.type.curr,
          { name: "TypeError", message: "Such Unary Operation is not allowed", ptr },
          ...allowedOperations[operator][this.type.prev.type]
        );

        if (!priority) return this.parseExpression(ptr, { params: { type: "Unary Operation", value: operator, exp: exp, priority: currPriority } as AST });
        return { type: "Unary Operation", value: operator, exp: exp, priority: currPriority };
      }

      case "Operator": {
        let currPriority = priorityTable[type];
        let operator = ptr.tokens[ptr.line][ptr.index++].value;

        // Change the neg value to "Unary" because after Binary operations could can be only
        // Unary operation
        this.neg = "Unary";

        // Create basic structure for AST, it's need to be done before getting
        // right part of Operation because of the function definedType
        if (priority === null) this.ast = { type: "Binary Operation", value: operator, left: params, right: undefined, priority: currPriority };

        let right = this.parseExpression(ptr, { priority: currPriority });

        // TODO: Work on Boolean Type
        // TODO: Transform the result of the binaryOperation Output
        // For example => (not "str" => { type: "INT" }), ("1" or 1 => { type: "ANY" } )
        this.err.checkObj(
          "type",
          this.type.curr,
          { name: "TypeError", message: "Such Binary Operation is not allowed", ptr },
          ...(allowedOperations[operator]?.[this.type.prev.type] ?? [])
        );

        // Initialize a basic AST if the AST is not define
        if (priority === null) {
          // this.ast = { type: "Binary Operation", value: operator, left: params, right: undefined, priority: currPriority };
          let branch = getLastBranch(["left", "exp"], currPriority, params as AST);

          // If Unary operation have a lower priority than the Binary operation, then swap them
          if (branch && branch.priority != currPriority) {
            (branch as UnaryOperation).exp = {
              type: "Binary Operation",
              value: operator,
              left: (branch as UnaryOperation).exp,
              right: right,
              priority: currPriority,
            } as AST;
            this.ast = copyTree(params) as AST;
          } else (this.ast as BinaryOperation).right = right;

          return this.parseExpression(ptr, { priority: currPriority });
        }

        let branch = getLastBranch(["right", "exp"], currPriority, this.ast);
        let key = branch && "exp" in branch ? "exp" : "right";

        // 1 * 2 + 3
        if (priority - currPriority <= 0) {
          // The main idea here, it's to dynamically change prev priority
          // if it was too high, this approach helps to build new branch
          // on top of another if they've had the same priority
          priority = (branch as AST)?.priority <= currPriority ? (branch as AST).priority : priority;

          if (branch && priority != currPriority)
            branch[key] = { type: "Binary Operation", value: operator, left: branch[key], right: right, priority: currPriority };
          else {
            branch = branch || this.ast;
            updateBranch(branch, { type: "Binary Operation", value: operator, left: branch, right: right, priority: currPriority });
          }
        }
        // 1 + 2 * 3
        else (branch as AST)[key] = { type: "Binary Operation", value: operator, left: (branch as AST)[key], right: right, priority: currPriority };

        return this.parseExpression(ptr, { priority: currPriority });
      }

      case "Parentheses": {
        if (this.parentheses || !type.includes("Close")) ptr.index++;
        let right = undefined;

        if (type.includes("Open")) {
          let saveTree = copyTree(this.ast) as AST;
          this.parentheses++;
          this.ast = {} as AST;
          right = this.parseExpression(ptr, {});

          // Check If Expression in Parentheses is Empty or not
          if (!right.type) this.err.message({ name: "SyntaxError", message: `Such Expression with an Empty Parentheses not allowed`, ptr });

          // Check if Expression in Parentheses is any type of Operation ?
          // If so then set the highest Operation Branch to the maximum
          // priority level that means '0', that need for future ast building
          if (right.type.includes("Operation")) (right as AST).priority = priorityTable[type.split(" ")[1]];
          this.ast = saveTree;
          defineAnyType(this.type.curr, this.ast);

          // Check if this.ast is undefined this mean one of this situation:
          // (1 + 2) * 3   --   In this case I send received right value
          // as a "constant" (send it as a left params)
          if (priority === null) return this.parseExpression(ptr, { params: right });
        } else this.parentheses--;

        return right || (priority !== null ? this.ast : params);
      }

      case "SquareBrackets": {
        if (type.includes("Close")) return priority !== null ? this.ast : params;

        let items = [];
        ptr.index++;

        // Save current state, for now save only current type maybe deal with
        // prev type later
        let prevState = { AST: copyTree(this.ast) as AST, type: {} as Types };

        while (ptr.tokens[ptr.line][ptr.index] && !ptr.tokens[ptr.line][ptr.index].type.includes("Close")) {
          this.err.checkObj(
            "type",
            ptr.tokens[ptr.line][ptr.index],
            { name: "SyntaxError", message: "Wrong List Declaration", ptr },
            "Number",
            "String",
            "Variable",
            "Unary",
            "Parentheses",
            "SquareBrackets"
          );

          items.push(this.parse(ptr));

          // Update list type based on type of the elements
          if (!prevState.type.type) prevState.type = { ...this.type.curr };
          else if (prevState.type.type != this.type.curr.type && prevState.type.type != "ANY") {
            prevState.type = { value: "", type: "ANY" };
          }

          this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index], { name: "SyntaxError", message: "Wrong List Declaration", ptr }, "Close", "Comma");
          ptr.index += Number(ptr.tokens[ptr.line][ptr.index].type.includes("Comma"));
        }

        // Check one more time if exit from the loop was successful and it wasn't happened because of some
        // sort of error
        this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Wrong List Declaration", ptr }, "Close");

        // Restore previous state
        this.type.curr = { type: "LIST", length: items.length, defined: { ...prevState.type } } as List;
        this.ast = prevState.AST;

        return { type: "LIST", value: items, length: items.length, defined: { ...this.type.curr } } as List;
      }

      // TODO: Add type "FUNC"
      case "Function": {
        ptr.index++;
        let args = ptr.statement.getParams(ptr, "Start Block", "Variable");
        let range = { min: args.reduce((acc, curr) => acc + Number(!curr.Expression), 0), max: args.length };

        this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Start Block is missing", ptr }, "Start Block");

        // Create simple Expression Operation for Lambda/Arrow functions
        return {
          type: "FUNC",
          name: "",
          params: args,
          body: [{ Expression: this.parse(ptr) }],
          defined: { type: "FUNC", range, defined: this.type.curr } as Func,
        } as Declaration;
      }

      case "LINE_END":
      default:
        if (priority !== null && process.env.DEBUG) this.drawExpression(this.ast);
        if (this.parentheses != 0) this.err.message({ name: "TypeError", message: `Unmatched Parentheses`, ptr });
        return priority !== null ? this.ast : params;
    }

    function getLastBranch(keys: string[], priority: number, branch: AST): AST | undefined {
      for (let key of keys) if (branch[key] && branch.priority >= priority) return getLastBranch(keys, priority, branch[key]) || branch;
      return undefined;
    }

    function updateBranch(branch: AST | Types, data: AST | Types) {
      // TODO: Check on different examples is it works fine
      data = copyTree(data);
      // data = JSON.parse(JSON.stringify(data));

      if ((branch as UnaryOperation).exp) {
        delete (branch as { exp?: AST }).exp;
        (branch as BinaryOperation).left = {} as AST;
        (branch as BinaryOperation).right = {} as AST;
      }

      // TODO: Check on different examples is it works fine
      // for (let key in data) branch[key] = JSON.parse(JSON.stringify(data[key]));
      for (let key in data) branch[key] = isInclude(key, "left", "right", "exp") ? copyTree(data[key]) : data[key];
      // console.log("*****");
      // console.log(branch, data);
    }

    function defineType({ prev, curr }: { prev: Types; curr: Types }, next: Types, branch: AST | Types) {
      delete (next as { value?: string }).value;

      // Line bellow handle current situation => (0 + b) where b => defined as { type: "ANY" }
      if (curr.type) defineAnyType(curr, branch);

      // Line bellow help with such situation => (a + b + 1) where a, b => defined as { type: "ANY" }
      defineAnyType(next, branch);

      if (!curr.type || curr.type == "ANY") curr = { ...next };
      else if (curr.type == "STR") (next as Str).length += (curr as Str).length;
      return { prev: { ...curr }, curr: (curr.type == "FLOAT" && next.type == "INT") || next.type == "ANY" ? { ...curr } : { ...next } };
    }

    function defineAnyType(type: Types, branch: AST | Types = {} as AST) {
      if ("left" in branch) defineAnyType(type, branch.left);
      if ("right" in branch) defineAnyType(type, branch.right);
      if ("exp" in branch) defineAnyType(type, branch.exp);
      if (branch.type == "VAR" && (branch as Var).defined.type == "ANY") {
        updateBranch((branch as Var).defined, type);
        // console.log("Yeee", branch);
      }
    }
  }

  private parseConstExpression(ptr: Parser): Types {
    let { value, type } = ptr.tokens[ptr.line][ptr.index++];

    // Type converting
    switch (type.split(/\ /g)[0] || type) {
      case "Bin":
        if (isNaN(parseInt(value.substr(2), 2))) break;
        return { value: `0b${value.substr(2)}`, type: "INT", kind: 2 };

      case "Oct":
        if (isNaN(parseInt(value.substr(2), 8))) break;
        return { value: `0o${value.substr(2)}`, type: "INT", kind: 8 };

      case "Hex":
        if (isNaN(parseInt(value.substr(2), 16))) break;
        return { value: `0x${value.substr(2)}`, type: "INT", kind: 16 };

      case "Float":
        return { value: value, type: "FLOAT" };

      case "Number":
        return { value: value, type: "INT", kind: 10 };

      case "String":
        return { value: value, type: "STR", length: value.length };

      case "Boolean":
        return { value: value.toLowerCase(), type: "BOOL" };
    }

    this.err.message({ name: "TypeError", message: `Invalid Type "${type}"`, ptr });
    return {} as Types;
  }

  // Create a simple algorithm for drawing AST, it will improve
  // Expression debugging
  drawExpression(branch: AST | Types, i: number = 0, j: number = 0, lines: string[] = []) {
    let { type } = branch;
    switch (i && type) {
      case "FLOAT":
      case "STR":
      case "VAR":
      case "INT": {
        let { value } = branch as Var;
        lines[i] = spliceStr(lines[i], j, value.length, value);
        break;
      }

      case "FUNC_CALL": {
        let { name } = branch as FuncCall;
        lines[i] = spliceStr(lines[i], j, name.length, name);
        break;
      }

      case "Binary Operation": {
        let { value } = branch as BinaryOperation;
        lines[i] = spliceStr(lines[i], j - 3, value.length + 3, `[${value}]\ `);
        lines[++i] = spliceStr(lines[i], j - 4, 5, "/   \\");
        lines[++i] = spliceStr(lines[i], j - 5, 7, "/     \\");

        // Check the Left and Right side
        type = (branch as BinaryOperation).left.type;
        this.drawExpression((branch as BinaryOperation).left, i + (type.includes("Operation") ? 1 : 0), j - 5, lines);
        if ((branch as BinaryOperation).right?.type?.includes("Operation"))
          this.drawExpression((branch as BinaryOperation).right ?? ({ value: "" } as Var), ++i, j + 4, lines);
        else this.drawExpression((branch as BinaryOperation).right ?? ({ value: "" } as Var), i, j + 1, lines);
        break;
      }

      case "Unary Operation": {
        let { value } = branch as UnaryOperation;
        lines[i] = spliceStr(lines[i], j - 3, value.length + 3, `[${value}]\ `);
        lines[++i] = spliceStr(lines[i], j - 2, 1, "|");
        this.drawExpression((branch as UnaryOperation).exp, ++i, j - 2, lines);
        break;
      }

      // Initialize state run only when "i" equal to 0 || undefined
      case 0:
        lines.push(`+${"=".repeat(22)} Exp AST ${"=".repeat(22)}+`);
        for (let i = 0; i < 20; i++) lines.push(`|${" ".repeat(53)}|`);
        lines.push(`+${"=".repeat(53)}+\n`);

        this.drawExpression(branch, 2, 30, lines);
        console.log();
        for (let line of lines) console.log(" ".repeat(30) + line);
        break;
    }

    // Create simple implementation splice for String
    function spliceStr(str: string, index: number, rm: number, newStr: string) {
      return str.substr(0, index) + newStr + str.substr(index + Math.abs(rm));
    }
  }
}

export default Expression;
