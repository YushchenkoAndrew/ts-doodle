import ErrorHandler from "../../Error/Error";
import Parser from "../Parser";
import Expression from "../Expression/Expression";
import { Declaration, Operation, Range } from "../Interfaces";
import { Assign, Condition, ForLoop, FuncCall, Return } from "./Interfaces";
import { copyTree, getDefinedToken, isInclude } from "../../lib/";
import { AST, Int, List, Types } from "../Expression/Interfaces";
import library from "./LibraryFunc.json";
import { isEqual } from "../../lib/index";

class Statement {
  err: ErrorHandler;
  exp: Expression;

  constructor(err: ErrorHandler) {
    this.err = err;
    this.exp = new Expression(this.err);
  }

  // TODO: Improve this to be able to handle such syntax as => "def func(a, b = 2):"
  getParams(ptr: Parser, ...allowed: string[]): Assign[] {
    let params: Assign[] = [];
    let assignParams = false;

    while (ptr.tokens[ptr.line][ptr.index] && !ptr.tokens[ptr.line][ptr.index].type.includes("Close")) {
      let { value } = ptr.tokens[ptr.line][ptr.index];
      this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Wrong Function declaration Syntax", ptr }, ...allowed);

      // Check if the arg(param) has a default value
      if (!isEqual(ptr.tokens[ptr.line][ptr.index].type, "Assignment Operator")) {
        if (assignParams) this.err.message({ name: "SyntaxError", message: "Such params Sequence not allowed. Wrong assign param position", ptr });
        params.push({ type: "VAR", name: value, init: true, binOpr: "", defined: { value: "", type: "ANY" } } as Assign);
      } else {
        assignParams = true;
        params.push(this.parseVariableAssign(ptr));
      }

      this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index], { name: "SyntaxError", message: "Wrong Function declaration Syntax", ptr }, "Close", "Comma");
      ptr.index += Number(ptr.tokens[ptr.line][ptr.index].type.includes("Comma"));
    }

    return params;
  }

  parseFunc(ptr: Parser): Declaration {
    // Delete all spaces
    ptr.tokens[ptr.line].push(...ptr.tokens[ptr.line].splice(ptr.index).filter((token) => token.type != "Space"));
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index], { name: "SyntaxError", message: "Wrong Function Declaration", ptr }, "Variable");
    let { value } = ptr.tokens[ptr.line][ptr.index++];

    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Open Parentheses are missing", ptr }, "Open Parentheses");

    // Create type "ANY" which is mean that variable is undefined
    // TODO: Think about it, do I need to create arguments (params) as Statements ?
    // Complete Expression part
    // let params = this.getParams(ptr, "Variable").map((param) => ({ type: "VAR", name: param, defined: { value: "", type: "ANY" } } as Assign));
    let params = this.getParams(ptr, "Variable");
    let range = { min: params.reduce((acc, curr) => acc + Number(!curr.Expression), 0), max: params.length };

    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Close Parentheses are missing", ptr }, "Close Parentheses");
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Indented Block is missing", ptr }, "Start Block");
    return { type: "FUNC", name: value, params: params, range, body: [], defined: { value: "", type: "ANY" } };
  }

  parseIf(ptr: Parser): Condition {
    // Delete all spaces
    ptr.tokens[ptr.line].push(...ptr.tokens[ptr.line].splice(ptr.index).filter((token) => token.type != "Space"));
    this.err.checkObj(
      "type",
      ptr.tokens[ptr.line][ptr.index],
      { name: "SyntaxError", message: "Wrong If Statement declaration", ptr },
      "Variable",
      "Number",
      "String",
      "Unary",
      "Parentheses"
    );
    let exp = this.exp.parse(ptr);
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Wrong If Statement declaration", ptr }, "Start Block");
    return { type: "IF", Expression: exp, body: [] as Operation[] };
  }

  // Continue of method Parse If but here we can handle the else and else-if statement
  parseElse(ptr: Parser, level: number, body: Operation[]) {
    let { type } = ptr.tokens[ptr.line][ptr.index];

    // Small parser for Else Statement and else if statement
    // In a switch I just get an array of elements without the last one
    switch (type.split(/\ /).slice(0, -1).join("-")) {
      case "ELSE": {
        // Delete all spaces
        ptr.tokens[ptr.line].push(...ptr.tokens[ptr.line].splice(ptr.index++).filter((token) => token.type != "Space"));
        this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Wrong ELSE Statement declaration", ptr }, "Start Block");

        // Save if body for using it as a header after that
        let header = JSON.parse(JSON.stringify(ptr.currLevel.body));

        // Create a new (Empty body)
        ptr.currLevel.header.push(...body.slice(0, -1));
        ptr.currLevel.body = [];

        level = ptr.initStateMachine(level + 1, true);
        (body.slice(-1)[0].Statement as Condition).else = ptr.currLevel.body;
        ptr.currLevel.header.push(...header);
        break;
      }

      case "ELSE-IF": {
        // Change "ELSE IF" token to the ELSE-IF for calling the if parser
        // Because it should be a similar one
        ptr.tokens[ptr.line][ptr.index].type = "ELSE-IF Keyword";

        // Go down to the previous level, that needs because
        // "else if" statement doesn't create a "Depth Tree"
        ptr.currLevel.level--;

        // Save if body for using it as a header after that
        let header = JSON.parse(JSON.stringify(ptr.currLevel.body));

        // Create a new (Empty body)
        ptr.currLevel.header.push(...body.slice(0, -1));
        ptr.currLevel.body = [];

        level = ptr.initStateMachine(level, true);
        (body.slice(-1)[0].Statement as Condition).else = ptr.currLevel.body;

        // Restore level
        ptr.currLevel.level++;
        ptr.currLevel.header.push(...header);
        break;
      }
    }

    return level;
  }

  parseWhile(ptr: Parser): Condition {
    // Delete all spaces
    ptr.tokens[ptr.line].push(...ptr.tokens[ptr.line].splice(ptr.index).filter((token) => token.type != "Space"));
    this.err.checkObj(
      "type",
      ptr.tokens[ptr.line][ptr.index],
      { name: "SyntaxError", message: "Wrong While loop initialization", ptr },
      "Variable",
      "Number",
      "String",
      "Unary",
      "Parentheses"
    );

    let exp = this.exp.parse(ptr);
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Wrong While loop initialization", ptr }, "Start Block");
    return { type: "WHILE", Expression: exp, body: [] as Operation[] };
  }

  parseFor(ptr: Parser): ForLoop {
    // Delete all spaces
    ptr.tokens[ptr.line].push(...ptr.tokens[ptr.line].splice(ptr.index).filter((token) => token.type != "Space"));
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index], { name: "SyntaxError", message: "Wrong For loop declaration", ptr }, "Variable");

    let { value } = ptr.tokens[ptr.line][ptr.index++];
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Wrong For loop declaration", ptr }, "IN Keyword");
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index], { name: "SyntaxError", message: "Wrong For loop declaration", ptr }, "Variable");

    // TODO:
    // Create simple solution for iterate though array witch located in the variable
    let range = getDefinedToken("Statement", "name", ptr.tokens[ptr.line][ptr.index++].value, ptr.currLevel, () =>
      this.err.message({ name: "NameError", message: `Variable with this Name "${value}" is not defined`, ptr })
    ) as Assign;

    // Check on LIST type
    this.err.checkObj("type", range.defined, { name: "TypeError", message: `${range.defined?.type ?? "Undeclared"} Object is Not Iterable`, ptr }, "LIST");
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Wrong For loop declaration", ptr }, "Start Block");

    // Create a {{value}} as a temporary variable that contain nothing
    ptr.currLevel.header.push({ Statement: { type: "VAR", name: value, defined: (range.defined as List)?.defined } });
    return { type: "FOR", iter: value, range: { value: range.name, type: "VAR", defined: range.defined }, body: [] as Operation[] };
  }

  parseReturn(ptr: Parser): Return {
    // Delete all spaces
    ptr.tokens[ptr.line].push(...ptr.tokens[ptr.line].splice(ptr.index).filter((token) => token.type != "Space"));

    // Check the pass keyword, let's check if user put some variable after, if so throw an Error
    if (ptr.tokens[ptr.line][ptr.index - 1].type.includes("Pass") && ptr.tokens[ptr.line][ptr.index])
      this.err.message({ name: "SyntaxError", message: `Invalid syntax. Can not return value with "pass"`, ptr });

    // Check if the function return any of the type, if not then put as a return value '0'
    let { type } = ptr.tokens[ptr.line][ptr.index] || { type: "" };
    if (!isInclude(type, "Variable", "Number", "Char", "String", "Unary", "Parentheses")) return { type: "RET", defined: { value: "", type: "NULL" } };
    return { type: "RET", Expression: this.exp.parse(ptr), defined: this.exp.type.curr };
  }

  parseVariable(ptr: Parser): Assign | FuncCall {
    // Delete all spaces
    ptr.tokens[ptr.line].push(...ptr.tokens[ptr.line].splice(ptr.index).filter((token) => token.type != "Space"));
    this.err.checkObj(
      "type",
      ptr.tokens[ptr.line][ptr.index],
      { name: "SyntaxError", message: "Wrong Variable Syntax", ptr },
      "Assignment",
      "Open Parentheses"
    );

    if (ptr.tokens[ptr.line][ptr.index].type.includes("Assignment")) return this.parseVariableAssign(ptr);
    return this.parseFuncCaller(ptr);
  }

  private parseVariableAssign(ptr: Parser): Assign {
    let { value } = ptr.tokens[ptr.line][ptr.index - 1];
    let { type, value: binOpr } = ptr.tokens[ptr.line][ptr.index++];

    this.err.checkObj(
      "type",
      ptr.tokens[ptr.line][ptr.index],
      { name: "SyntaxError", message: "Invalid Type", ptr },
      "Variable",
      "Number",
      "String",
      "Unary",
      "Parentheses",
      "SquareBrackets"
    );

    // let range = getDefinedToken("Statement", "name", ptr.tokens[ptr.line][ptr.index++].value, ptr.currLevel, () =>
    let init = !getDefinedToken("Statement", "name", value, ptr.currLevel);
    binOpr = binOpr.replace(/=/g, "");

    // TODO:
    // Check if it's assign with an operation and it's specific to the input language
    // if (isInclude(type, "Add", "Sub", "Mul", "Div", "Mod", "Or", "And", "Xor", "SL", "SR")) console.log("TODO:");
    return { type: "VAR", name: value, init, binOpr, Expression: this.exp.parse(ptr), defined: this.exp.type.curr };
  }

  //
  // TODO: TO rebuild type of function's body depends on input value, if it's allowed
  //          For this You need to add another variable which will link to the final
  //          Object
  //
  private getArgs(ptr: Parser, params: Assign[], range: Range): (Assign | Types)[] {
    let args: (Assign | Types)[] = [];
    let index = -1;

    // TODO: Change ast copy from JSON to copyTree ...
    let prevState = {
      type: JSON.parse(JSON.stringify(this.exp.type)),
      // ast: JSON.parse(JSON.stringify(this.exp.ast)),
      ast: copyTree(this.exp.ast),
      parentheses: this.exp.parentheses,
    };

    this.err.checkObj(
      "type",
      ptr.tokens[ptr.line][ptr.index - 1],
      { name: "SyntaxError", message: "Wrong Function declaration Syntax", ptr },
      "Open Parentheses"
    );

    // Create a while loop that need to goes trough all params
    // Now it's possible to compile such syntax "...[1, 2, 3]"
    // Because range.max can contain Infinity
    while (++index < Number(range.max)) {
      let i = index < Number(range.min) ? index : Number(range.min) - 1;
      let type = params[i].defined.type == "ANY" ? ["INT", "VAR", "STR", "FLOAT", "LIST", "ANY"] : [params[i].defined.type];

      let argv = this.exp.parse(ptr);
      let curr = this.exp.type.curr.type == "INT" && type[0] == "FLOAT" ? { value: "", type: "FLOAT" } : this.exp.type.curr;
      curr = this.exp.type.curr.type === "FLOAT" && type[0] == "INT" ? ({ value: "", type: "INT", kind: 10 } as Int) : curr;

      this.err.checkObj(
        "type",
        curr,
        { name: "SyntaxError", message: `Wrong arguments declaration, type should be "${params[i].defined.type}" but "${curr.type}" was given`, ptr },
        ...type
      );
      // TODO: Somehow update the final body
      // if (param.defined.type == "ANY") param.defined = this.type.curr;

      args.push(argv);

      // Check next step if it Close Parentheses then exit from the loop
      // Else check if the next token is comma
      if (ptr.tokens[ptr.line][ptr.index]?.type == "Close Parentheses" && index >= Number(range.min) - 1) break;
      this.err.checkObj(
        "type",
        ptr.tokens[ptr.line][ptr.index++],
        { name: "SyntaxError", message: `Func missing ${params.length - i - 1} params`, ptr },
        "Comma"
      );
    }

    // Check on Closing Parentheses and restore previous State
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Close Parentheses are missing", ptr }, "Close Parentheses");

    this.exp.type = prevState.type;
    this.exp.ast = prevState.ast as AST;
    this.exp.parentheses = prevState.parentheses;

    return args;
  }

  parseFuncCaller(ptr: Parser): FuncCall {
    let { value } = ptr.tokens[ptr.line][ptr.index++ - 1];

    let { type, params, range, defined } =
      (library[value] as Declaration) ??
      (getDefinedToken("Declaration", "name", value, ptr.currLevel, () =>
        this.err.message({ name: "NameError", message: `Func with this Name "${value}" is not defined`, ptr })
      ) as Declaration);

    let args = this.getArgs(ptr, params, range);

    return {
      type: `${type}_CALL`,
      name: value,
      params: [...args],
      defined: defined,
    } as FuncCall;
  }
}

export default Statement;
