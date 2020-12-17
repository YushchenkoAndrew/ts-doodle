import { isInclude } from "../lib";
import { Token } from "../Lexer/Lexing";
import Parser from "../Parser/Parser";

interface Pointer {
  line: number;
  index: number;
  tokens: Token[][];
}

interface ErrMessage {
  name: string;
  message: string;
  ptr: Pointer;
}

class ErrorHandler {
  tokens: Token[][];

  constructor(tokens: Token[][]) {
    this.tokens = tokens;
  }

  message({ name, message, ptr: { line, index, tokens } }: ErrMessage) {
    let errToken = tokens[line][index] ?? tokens[line].slice(-1)[0];
    throw new Error(
      [
        `Error in line ${errToken.line + 1}, col ${errToken.char + 1}`,
        this.tokens[line].map((token) => (token.type == "String" ? `"${token.value}"` : token.value)).join(""),
        `${" ".repeat(errToken.char)}^`,
        `${name}: ${message}`,
      ].join("\n")
    );
  }

  checkObj(key: string, obj: Object, err: ErrMessage, ...expect: string[]) {
    if (!obj?.[key] || !isInclude(obj[key], ...expect)) this.message(err);
  }
}

export default ErrorHandler;
