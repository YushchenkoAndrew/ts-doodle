import ErrorHandler from "../../Error/Error";
import Parser from "../Parser";
import Expression from "../Expression/Expression";
import { Declaration, Operation } from "../Interfaces";
import { Assign, Condition, ForLoop, FuncCall, Return } from "./Interfaces";
import { getDefinedToken, isInclude } from "../../lib/";
import { List, Types } from "../Expression/Interfaces";

class Statement {
  err: ErrorHandler;
  exp: Expression;

  constructor(err: ErrorHandler) {
    this.err = err;
    this.exp = new Expression(this.err);
  }

  // TODO: Improve this to be able to handle such syntax as => "def func(a, b = 2):"
  getParams(ptr: Parser, ...allowed: string[]): string[] {
    let params: string[] = [];

    while (ptr.tokens[ptr.line][ptr.index] && !ptr.tokens[ptr.line][ptr.index].type.includes("Close")) {
      let { value } = ptr.tokens[ptr.line][ptr.index];
      this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Wrong Function declaration Syntax", ptr }, ...allowed);
      params.push(value);
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
    let params = this.getParams(ptr, "Variable").map((param) => ({ type: "VAR", name: `_${param}`, defined: { value: "", type: "ANY" } } as Assign));

    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Close Parentheses are missing", ptr }, "Close Parentheses");
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Indented Block is missing", ptr }, "Start Block");
    return { type: "FUNC", name: `_${value}`, params: params, body: [], defined: { value: "", type: "ANY" } };
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
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Wrong For loop declaration", ptr }, "Variable");

    let range = this.parseVariable(ptr);

    // Check on LIST type
    this.err.checkObj("type", range.defined, { name: "TypeError", message: `${range.defined?.type ?? "Undeclared"} Object is Not Iterable`, ptr }, "LIST");
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Wrong For loop declaration", ptr }, "Start Block");

    // Create a {{value}} as a temporary variable that contain nothing
    ptr.currLevel.header.push({ Statement: { type: "VAR", name: `_${value}`, defined: (range.defined as List)?.defined } });
    return { type: "FOR", iter: `_${value}`, range: range, body: [] as Operation[] };
  }

  parseReturn(ptr: Parser): Return {
    // Delete all spaces
    ptr.tokens[ptr.line].push(...ptr.tokens[ptr.line].splice(ptr.index).filter((token) => token.type != "Space"));

    // Check the pass keyword, let's check if user put some variable after, if so throw an Error
    if (ptr.tokens[ptr.line][ptr.index - 1].type.includes("Pass") && ptr.tokens[ptr.line][ptr.index])
      this.err.message({ name: "SyntaxError", message: `Invalid syntax. Can not return value with "pass"`, ptr });

    // Check if the function return any of the type, if not then put as a return value '0'
    let { type } = ptr.tokens[ptr.line][ptr.index] || { type: "" };
    if (!isInclude(type, "Variable", "Number", "Char", "String", "Unary", "Parentheses")) return { type: "RET", defined: { value: "", type: "NONE" } };
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
    let { type } = ptr.tokens[ptr.line][ptr.index++];

    this.err.checkObj(
      "type",
      ptr.tokens[ptr.line][ptr.index],
      { name: "SyntaxError", message: "Invalid Type", ptr },
      "Variable",
      "Number",
      "String",
      "Unary",
      "Parentheses"
    );

    // Check if it's assign with an operation
    // if (this.isInclude(type, "Add", "Sub", "Mul", "Div", "Mod", "Or", "And", "Xor", "SL", "SR")) changeToken(this.tokens[this.line], this.index - 1);
    return { type: "VAR", name: `_${value}`, Expression: this.exp.parse(ptr), defined: this.exp.type.curr };
  }

  //
  // TODO: TO rebuild type of function's body depends on input value, if it's allowed
  //          For this You need to add another variable which will link to the final
  //          Object
  //
  private getArgs(ptr: Parser, params: Assign[]): Assign[] {
    let args: Assign[] = [];
    // TODO: Change ast copy from JSON to copyTree ...
    let prevState = {
      type: JSON.parse(JSON.stringify(this.exp.type)),
      ast: JSON.parse(JSON.stringify(this.exp.ast)),
      parentheses: this.exp.parentheses,
    };

    this.err.checkObj(
      "type",
      ptr.tokens[ptr.line][ptr.index - 1],
      { name: "SyntaxError", message: "Wrong Function declaration Syntax", ptr },
      "Open Parentheses"
    );

    for (let param of params) {
      let type = param.defined.type == "ANY" ? ["INT", "VAR", "STR", "FLOAT", "ANY"] : [param.defined.type];

      let argv = this.exp.parse(ptr);
      let curr = this.exp.type.curr.type == "INT" && type[0] == "FLOAT" ? { value: "", type: "FLOAT" } : this.exp.type.curr;
      this.err.checkObj("type", curr, { name: "SyntaxError", message: "Wrong arguments declaration", ptr }, ...type);
      // TODO: Somehow update the final body
      // if (param.defined.type == "ANY") param.defined = this.type.curr;

      args.push({ type: "NONE", name: "", Expression: argv, defined: curr });

      // Check next step if it Close Parentheses then exit from the loop
      // Else check if the next token is comma
      if (ptr.tokens[ptr.line][ptr.index]?.type == "Close Parentheses") break;
      this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Wrong Function declaration Syntax", ptr }, "Comma");
    }

    // Check on Closing Parentheses and restore previous State
    this.err.checkObj("type", ptr.tokens[ptr.line][ptr.index++], { name: "SyntaxError", message: "Close Parentheses are missing", ptr }, "Close Parentheses");

    this.exp.type = prevState.type;
    this.exp.ast = prevState.ast;
    this.exp.parentheses = prevState.parentheses;

    return args;
  }

  private parseFuncCaller(ptr: Parser): FuncCall {
    let { value } = ptr.tokens[ptr.line][ptr.index++ - 1];

    // TODO: To improve function name, they should contain a number at the end
    // which will tell the amount of params/args

    type funcProperty = { params: Assign[]; defined: Types; basic?: any[]; require?: any[] };
    // let { params, defined, basic, require = [] } = this.checkOnBasicFunc(value) || this.getDefinedToken("Declaration", "name", `_${value}`, this.currLevel);
    let { params, defined, basic = [], require = [] }: funcProperty =
      (getDefinedToken("Declaration", "name", `_${value}`, ptr.currLevel) as Declaration) ?? ({} as Declaration);
    let args = this.getArgs(ptr, params);

    return {
      type: "FUNC_CALL",
      name: basic ? `${value.toUpperCase()}${args.length}` : `_${value}`,
      params: [...args, ...require],
      defined: defined,
    } as FuncCall;
  }
}

export default Statement;
