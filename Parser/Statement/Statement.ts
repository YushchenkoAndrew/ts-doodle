import ErrorHandler from "../../Error/Error";
import Parser from "../Parser";
import Expression from "../Expression/Expression";
import { Token } from "../../Lexer/Lexing";
import { Declaration } from "../Interfaces";
import { Assign, Condition, ForLoop, FuncCall } from "./Interfaces";

class Statement {
  err = new ErrorHandler();
  exp = new Expression();

  // stateChecker(key: string, token: Token, error: string, ...expect: string[]) {
  //   if (!token || !token[key] || !this.isInclude(token[key], ...expect)) this.errorMessageHandler(error, token || { line: this.line, char: 0 });
  // }

  // TODO: Improve this to be able to handle such syntax as => "def func(a, b = 2):"
  getParams(ptr: Parser, ...allowed: string[]): string[] {
    let params: string[] = [];

    while (ptr.tokens[ptr.line][ptr.index] && !ptr.tokens[ptr.line][ptr.index].type.includes("Close")) {
      let { value } = ptr.tokens[ptr.line][ptr.index];
      this.err.stateChecker("type", ptr.tokens[ptr.line], ptr.index++, "Wrong Function declaration Syntax", ...allowed);
      params.push(value);
      this.err.stateChecker("type", ptr.tokens[ptr.line], ptr.index, "Wrong Function declaration Syntax", "Close", "Comma");
      ptr.index += Number(ptr.tokens[ptr.line][ptr.index].type.includes("Comma"));
    }
    return params;
  }

  parseFunc(ptr: Parser): Declaration {
    // Delete all spaces
    ptr.tokens[ptr.line].push(...ptr.tokens[ptr.line].splice(ptr.index).filter((token) => token.type != "Space"));
    this.err.stateChecker("type", ptr.tokens[ptr.line], ptr.index, "Wrong Function Declaration", "Variable");
    let { value } = ptr.tokens[ptr.line][ptr.index++];

    this.err.stateChecker("type", ptr.tokens[ptr.line], ptr.index++, "Open Parentheses are missing", "Open Parentheses");

    // Create type "ANY" which is mean that variable is undefined
    // TODO: Think about it, do I need to create arguments (params) as Statements ?
    // Complete Expression part
    let params = this.getParams(ptr, "Variable").map((param) => ({ type: "VAR", name: `_${param}`, defined: { value: "", type: "ANY" } } as Assign));

    this.err.stateChecker("type", ptr.tokens[ptr.line], ptr.index++, "Close Parentheses are missing", "Close Parentheses");
    this.err.stateChecker("type", ptr.tokens[ptr.line], ptr.index++, "Indented Block is missing", "Start Block");
    return { type: "FUNC", name: `_${value}`, params: params, body: [], defined: { value: "", type: "INT", kind: 10 } };
  }

  // function parseIf() {
  //   // Delete all spaces
  //   this.tokens[this.line].push(...this.tokens[this.line].splice(this.index).filter((token) => token.type != "Space"));
  //   this.stateChecker("type", this.tokens[this.line][this.index], "Wrong If Statement declaration", "Variable", "Number", "String", "Unary", "Parentheses");
  //   let exp = this.parseExpression({});
  //   this.stateChecker("type", this.tokens[this.line][this.index++], "Wrong If Statement declaration", "Start Block");
  //   return { type: "IF", Expression: exp, defined: this.type.curr };
  // }

  // // Continue of method Parse If but here we can handle the else and else-if statement
  // function parseElse(level, body) {
  //   let { type } = this.tokens[this.line][this.index];

  //   // Small parser for Else Statement and else if statement
  //   // In a switch I just get an array of elements without the last one
  //   switch (type.split(/\ /).slice(0, -1).join("-")) {
  //     case "ELSE": {
  //       // Delete all spaces
  //       this.tokens[this.line].push(...this.tokens[this.line].splice(this.index++).filter((token) => token.type != "Space"));
  //       this.stateChecker("type", this.tokens[this.line][this.index++], "Wrong ELSE Statement declaration", "Start Block");

  //       // Save if body for using it as a header after that
  //       let header = JSON.parse(JSON.stringify(this.currLevel.body));

  //       // Create a new (Empty body)
  //       this.currLevel.header.push(...body.slice(0, -1));
  //       this.currLevel.body = [];

  //       level = this.initStateMachine(level + 1, true);
  //       body.slice(-1)[0].Statement.else = this.currLevel.body;
  //       this.currLevel.header.push(...header);
  //       break;
  //     }

  //     case "ELSE-IF": {
  //       // Change "ELSE IF" token to the ELSE-IF for calling the if parser
  //       // Because it should be a similar one
  //       this.tokens[this.line][this.index].type = "ELSE-IF Keyword";

  //       // Go down to the previous level, that needs because
  //       // "else if" statement doesn't create a "Depth Tree"
  //       this.currLevel.level--;

  //       // Save if body for using it as a header after that
  //       let header = JSON.parse(JSON.stringify(this.currLevel.body));

  //       // Create a new (Empty body)
  //       this.currLevel.header.push(...body.slice(0, -1));
  //       this.currLevel.body = [];

  //       level = this.initStateMachine(level, true);
  //       body.slice(-1)[0].Statement.else = this.currLevel.body;

  //       // Restore level
  //       this.currLevel.level++;
  //       this.currLevel.header.push(...header);
  //       break;
  //     }
  //   }

  //   return level;
  // }

  // function parseWhile() {
  //   // Delete all spaces
  //   this.tokens[this.line].push(...this.tokens[this.line].splice(this.index).filter((token) => token.type != "Space"));
  //   this.stateChecker("type", this.tokens[this.line][this.index], "Wrong While loop declaration", "Variable", "Number", "String", "Unary", "Parentheses");

  //   let exp = this.parseExpression({});
  //   this.stateChecker("type", this.tokens[this.line][this.index++], "Wrong While loop declaration", "Start Block");
  //   return { type: "WHILE", Expression: exp, defined: this.type.curr };
  // }

  // function parseFor() {
  //   // Delete all spaces
  //   this.tokens[this.line].push(...this.tokens[this.line].splice(this.index).filter((token) => token.type != "Space"));
  //   this.stateChecker("type", this.tokens[this.line][this.index], "Wrong For loop declaration", "Variable");

  //   let { value } = this.tokens[this.line][this.index++];
  //   this.stateChecker("type", this.tokens[this.line][this.index++], "Wrong For loop declaration", "IN Keyword");
  //   this.stateChecker("type", this.tokens[this.line][this.index++], "Wrong For loop declaration", "Variable");

  //   let range = this.parseVariable();

  //   // Check on LIST type
  //   this.stateChecker("type", range.defined, `${range.defined.type} Object is Not Iterable`, "LIST");
  //   this.stateChecker("type", this.tokens[this.line][this.index++], "Wrong For loop declaration", "Start Block");

  //   // Create a {{value}} as a temporary variable that contain nothing
  //   this.currLevel.header.push({ Statement: { type: "VAR", name: `_${value}`, defined: range.defined.defined } });
  //   return { type: "FOR", iter: `_${value}`, range: range };
  // }

  // function parseReturn() {
  //   // Delete all spaces
  //   this.tokens[this.line].push(...this.tokens[this.line].splice(this.index).filter((token) => token.type != "Space"));

  //   // Check the pass keyword, let's check if user put some variable after, if so throw an Error
  //   if (this.tokens[this.line][this.index - 1].type.includes("Pass") && this.tokens[this.line][this.index])
  //     this.errorMessageHandler("Invalid syntax", this.tokens[this.line][this.index - 1]);

  //   // Check if the function return any of the type, if not then put as a return value '0'
  //   let { type } = this.tokens[this.line][this.index] || { type: "" };
  //   if (!this.isInclude(type, "Variable", "Number", "Char", "String", "Unary", "Parentheses"))
  //     return { type: "RET", Expression: { value: "0", type: "INT", kind: 10 }, defined: { type: "INT", kind: 10 } };
  //   return { type: "RET", Expression: this.parseExpression({}), defined: this.type.curr };
  // }

  parseVariable(ptr: Parser): Assign | FuncCall {
    // Delete all spaces
    ptr.tokens[ptr.line].push(...ptr.tokens[ptr.line].splice(ptr.index).filter((token) => token.type != "Space"));
    this.err.stateChecker("type", ptr.tokens[ptr.line], ptr.index, "Wrong Variable Syntax", "Assignment", "Open Parentheses");

    if (ptr.tokens[ptr.line][ptr.index].type.includes("Assignment")) return this.parseVariableAssign(ptr);
    // return this.parseFuncCaller();
    return {} as FuncCall;
  }

  private parseVariableAssign(ptr: Parser): Assign {
    let { value } = ptr.tokens[ptr.line][ptr.index - 1];
    let { type } = ptr.tokens[ptr.line][ptr.index++];

    this.err.stateChecker("type", ptr.tokens[ptr.line], ptr.index, "Type error", "Variable", "Number", "String", "Unary", "Parentheses");

    // Check if it's assign with an operation
    // if (this.isInclude(type, "Add", "Sub", "Mul", "Div", "Mod", "Or", "And", "Xor", "SL", "SR")) changeToken(this.tokens[this.line], this.index - 1);
    return { type: "VAR", name: `_${value}`, Expression: this.exp.parseExpression(ptr, { priority: null }), defined: this.exp.type.curr };
  }

  // //
  // // TODO: TO rebuild type of function's body depends on input value, if it's allowed
  // //          For this You need to add another variable which will link to the final
  // //          Object
  // //
  // function getArgs(params) {
  //   let args = [];
  //   // TODO: Change ast copy from JSON to copyTree ...
  //   let prevState = { type: JSON.parse(JSON.stringify(this.type)), ast: this.ast && JSON.parse(JSON.stringify(this.ast)), parentheses: this.parentheses };
  //   this.stateChecker("type", this.tokens[this.line][this.index - 1], "Wrong Function declaration Syntax", "Open Parentheses");

  //   for (let param of params) {
  //     let type = param.defined.type == "ANY" ? ["INT", "VAR", "STR", "FLOAT", "ANY"] : [param.defined.type];
  //     this.type = { prev: {}, curr: {} };
  //     this.ast = undefined;
  //     this.parentheses = 0;

  //     args.push(this.parseExpression({}));
  //     let curr = this.type.curr.type == "INT" && type[0] == "FLOAT" ? { type: "FLOAT" } : this.type.curr;
  //     this.stateChecker("type", curr, "Wrong arguments declaration", ...type);
  //     // TODO: Somehow update the final body
  //     // if (param.defined.type == "ANY") param.defined = this.type.curr;

  //     args.push({ type: "NONE", Expression: args.pop(), defined: curr });

  //     // Check next step if it Close Parentheses then exit from the loop
  //     // Else check if the next token is comma
  //     if ((this.tokens[this.line][this.index] || {}).type == "Close Parentheses") break;
  //     this.stateChecker("type", this.tokens[this.line][this.index++], "Wrong Function declaration Syntax", "Comma");
  //   }

  //   // Check on Closing Parentheses and restore previous State
  //   this.stateChecker("type", this.tokens[this.line][this.index++], "Close Parentheses are missing", "Close Parentheses");

  //   this.type = prevState.type;
  //   this.ast = prevState.ast;
  //   this.parentheses = prevState.parentheses;

  //   return args;
  // }

  // function parseFuncCaller() {
  //   let { value } = this.tokens[this.line][this.index++ - 1];

  //   // TODO: To improve function name, they should contain a number at the end
  //   // which will tell the amount of params/args

  //   let { params, defined, basic, require = [] } = this.checkOnBasicFunc(value) || this.getDefinedToken("Declaration", "name", `_${value}`, this.currLevel);
  //   let args = this.getArgs(params);
  //   return { type: "FUNC_CALL", name: basic ? `${value.toUpperCase()}${args.length}` : `_${value}`, params: [...args, ...require], defined: defined };
  // }
}

export default Statement;
