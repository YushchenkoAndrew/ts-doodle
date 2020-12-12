import { Token } from "./Lexing";
import { Declaration, NodeState, Defined, AST } from "./ParserInterfaces";

class Parser {
  tokens: Token[][];
  syntaxTree: AST = {
    type: "SyntaxTree",
    body: [],
  };

  line = 0; // Curr line
  index = 0; // Curr Index for tokens
  currLevel: { level: number; header: NodeState[]; body: NodeState[] } = {
    level: 0, // Define Statement Depth
    header: [], // Put created upper head variables in header
    body: [],
  };

  ast: any;
  neg = "Unary";
  type: { prev: any; curr: any } = { prev: {}, curr: {} };
  parentheses = 0;

  constructor(tokens: Token[][]) {
    console.log("\x1b[34m", "\n~ Start Parser:", "\x1b[0m");
    // Input modules
    // this.inputModule(require("./Expression"));
    // this.inputModule(require("./Statement"));

    // Deep copy data, for remove linking
    this.tokens = JSON.parse(JSON.stringify(tokens));

    // this.allowedOperations = require("./AllowedOperations.json");
    // this.basicFunc = require("./BasicFunc.json");
  }

  // inputModule(mod) {
  //   for (let key in mod) this[key] = mod[key].bind(this);
  // }

  start() {
    try {
      this.initStateMachine();
    } catch (err) {
      console.log("\x1b[31m", `~ Error:\n\t${err.message}`, "\x1b[0m");
      this.syntaxTree.body = [];
      return {};
    }

    this.syntaxTree = { type: "Program", body: this.currLevel.body };

    console.log();
    console.dir(this.syntaxTree, { depth: null });

    return this.syntaxTree;
  }

  errorMessageHandler(message: string, token: Token) {
    throw new Error(
      [
        `Error in line ${token.line + 1}, col ${token.char + 1}`,
        this.tokens[this.line].map((token) => token.value).join(""),
        `${" ".repeat(token.char)}^`,
        `${message}:`,
      ].join("\n")
    );
  }

  initStateMachine(level: number = 0, forcedBlock: boolean = false): number {
    let { type } = this.tokens[this.line][this.index] || { type: this.tokens[this.line + 1] ? "NEXT" : "EOF" };

    this.ast = undefined;
    this.neg = "Unary";
    this.type = { prev: {}, curr: {} };
    this.parentheses = 0;

    switch (type.split(/\ /)[0]) {
      case "Function": {
        console.log(`FUNCTION: LEVEL ${level}`, this.tokens[this.line][this.index]);

        if (!this.checkLevel(level, forcedBlock)) return level;
        this.index++;
        this.currLevel.level++;
        // this.currLevel.body.push({ Declaration: { type: "FUNC", ...this.parseFunc() } });

        // Save previous data
        let header = JSON.parse(JSON.stringify(this.currLevel.header));
        let body = JSON.parse(JSON.stringify(this.currLevel.body));

        // TODO: Not the best solution, have some issues
        // Put created upper head variables in header
        // this.currLevel.header.push(...header, ...this.currLevel.body, ...body.slice(-1)[0].Declaration.params.map((param) => ({ Statement: param })));
        this.currLevel.body = [];

        // Get a next level, because of the recursion I could not save
        // the moment where "jump" is happening so I just return the level
        // (this "jump")
        level = this.initStateMachine(level + 1, true);
        body.slice(-1)[0].Declaration.body = this.currLevel.body;

        // Set the type of return value
        // let define = this.getDefinedToken("Statement", "type", "RET", this.currLevel, false);
        // if (define) body.slice(-1)[0].Declaration.defined = define.defined;

        this.currLevel.level--;
        this.currLevel.header = header;
        this.currLevel.body = body;
        break;
      }

      // TODO: Take into account variables that defined into if statement
      // Make them visible some how
      case "ELSE-IF":
      case "IF": {
        console.log(`IF:       LEVEL ${level}`, this.tokens[this.line][this.index]);

        if (!this.checkLevel(level, forcedBlock)) return level;
        this.index++;
        this.currLevel.level++;
        // this.currLevel.body.push({ Statement: this.parseIf() });

        // Save previous data
        let header = JSON.parse(JSON.stringify(this.currLevel.header));
        let body = JSON.parse(JSON.stringify(this.currLevel.body));

        // Put created upper head variables in header
        this.currLevel.header.push(...body);
        this.currLevel.body = [];

        // Get a next level, because of the recursion I could not save
        // the moment where "jump" is happening so I just return the level
        // (this "jump")
        level = this.initStateMachine(level + 1, true);
        body.slice(-1)[0].Statement.body = this.currLevel.body;
        // if (checkLevel.call(this, level + 1, false)) level = this.parseElse(level, body);

        // TODO:
        // Save all Assignment Statement into a header, not the best solution but works for now
        // When I put assignment Statement into a header that means that it was defined before
        // the function which is not true, so I need to reconsider it in the future, or not
        this.currLevel.level--;
        this.currLevel.header = [...header, ...JSON.parse(JSON.stringify([...this.currLevel.body]))];
        this.currLevel.body = body;

        // Check if it was the else-if statement, if so then go back to
        // the else-if parser
        if (type.includes("ELSE-IF")) return level;
        break;
      }

      case "ELSE":
        console.log(`ELSE:     LEVEL ${level}`, this.tokens[this.line][this.index]);
        this.checkLevel(level, forcedBlock);
        return level;

      case "FOR":
      case "WHILE":
        console.log(`WHILE:    LEVEL ${level}`, this.tokens[this.line][this.index]);

        if (!this.checkLevel(level, forcedBlock)) return level;
        this.index++;
        this.currLevel.level++;
        // this.currLevel.body.push({ Statement: type.includes("WHILE") ? this.parseWhile() : this.parseFor() });

        // Save previous data
        let header = JSON.parse(JSON.stringify(this.currLevel.header));
        let body = JSON.parse(JSON.stringify(this.currLevel.body));

        // Put created upper head variables in header
        this.currLevel.header.push(...body);
        this.currLevel.body = [];

        // Get a next level, because of the recursion I could not save
        // the moment where "jump" is happening so I just return the level
        // (this "jump")
        level = this.initStateMachine(level + 1, true);
        body.slice(-1)[0].Statement.body = this.currLevel.body;

        this.currLevel.level--;
        this.currLevel.header = [...header, ...JSON.parse(JSON.stringify([...this.currLevel.body]))];
        this.currLevel.body = body;
        break;

      case "Continue":
      case "Break":
        console.log(`BREAK:    LEVEL ${level}`, this.tokens[this.line][this.index]);

        if (!this.checkLevel(level, forcedBlock)) return level;
        this.index++;

        // Get the last loop
        // let loop = this.getDefinedToken("Statement", "type", "WHILE", this.currLevel, false);
        // loop = loop && !loop.body ? loop : this.getDefinedToken("Statement", "type", "FOR", this.currLevel, false);

        // Check if received loop even exist if so check if
        // We still working with it, if not the throw an error
        // if (!loop || loop.body) this.errorMessageHandler(`${type.split(/\ /)[0]} outside of the loop`, this.tokens[this.line][this.index - 1]);

        // this.currLevel.body.push({ Statement: { type: type.split(/\ /)[0].toUpperCase() } });
        break;

      case "Pass":
      case "Return":
        console.log(`RETURN:   LEVEL ${level}`, this.tokens[this.line][this.index]);

        if (!this.checkLevel(level, forcedBlock)) return level;
        this.index++;
        // this.currLevel.body.push({ Statement: this.parseReturn() });
        break;

      case "Variable":
        console.log(`VARIABLE: LEVEL ${level}`, this.tokens[this.line][this.index]);
        if (!this.checkLevel(level, forcedBlock)) return level;
        this.index++;
        //       this.currLevel.body.push({ Statement: this.parseVariable() });
        break;

      case "Block":
        console.log(`BLOCK: \t  LEVEL ${level}`);
        this.index++;
        return this.initStateMachine(level + 1, forcedBlock);

      case "NEXT":
        this.line++;
        this.index = 0;
        return this.initStateMachine(0, forcedBlock);

      case "EOF":
        return level;

      default:
        this.errorMessageHandler(`Wrong Syntax`, this.tokens[this.line][this.index]);
    }

    return this.initStateMachine(level);

    //
    // Addition Functions
    //
  }

  checkLevel(level: number, force: boolean) {
    if (this.currLevel.level - level < 0 || (force && this.currLevel.level != level))
      this.errorMessageHandler(`Wrong Syntax`, this.tokens[this.line][this.index]);

    if (this.currLevel.level - level != 0) {
      console.log(`CHANGE LEVEL FROM ${this.currLevel.level} TO ${level}`);
      // this.currLevel.level = level;
      return false;
    }

    return true;
  }

  isInclude(type: string, ...arr: string[]) {
    for (let i of arr) if (type.includes(i)) return true;
    return false;
  }

  // getDefinedToken(type, key, value, { body = [], header = [] }, alert = true) {
  //   // Get all data that already defined
  //   let defined = [...body, ...header];

  //   // A simple polymorphism, sort of ~
  //   if (Array.isArray(type)) return this.getDefinedTokenArray(type, key, value, defined);

  //   // Check if variable is defined in the body or in the header (in the prev level)
  //   let index = defined.map((obj) => obj[type] && obj[type][key]).lastIndexOf(value);

  //   // If the variables is not defined then throw an Error
  //   if (index == -1 && alert) this.errorMessageHandler(`Variable ${value} is not defined`, this.tokens[this.line][this.index - 1]);

  //   return index != -1 ? defined[index][type] : undefined;
  // }

  // getDefinedTokenArray(types, key, value, defined) {
  //   for (var type of types) {
  //     var index = defined.map((obj) => obj[type] && obj[type][key]).lastIndexOf(value);
  //     if (index != -1 && defined[index][type].type != "FUNC_CALL") break;
  //   }

  //   // If the variables is not defined then throw an Error
  //   if (index == -1) this.errorMessageHandler(`Variable ${value} is not defined`, this.tokens[this.line][this.index - 1]);

  //   return defined[index][type];
  // }

  // checkOnBasicFunc(name) {
  //   for (let func in this.basicFunc) if (name == func) return { ...this.basicFunc[func], basic: true };

  //   return;
  // }

  getTree(): AST {
    return this.syntaxTree;
  }
}

export default Parser;
