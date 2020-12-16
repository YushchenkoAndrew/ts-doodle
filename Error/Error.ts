import { isInclude } from "../lib";
import { Token } from "../Lexer/Lexing";

class ErrorHandler {
  message(message: string, tokens: Token[], index: number) {
    let errToken = tokens[index] ?? tokens.slice(-1)[0];

    throw new Error(
      [
        `Error in line ${errToken.line + 1}, col ${errToken.char + 1}`,
        tokens.map((token) => token.value).join(""),
        `${" ".repeat(errToken.char)}^`,
        `${message}:`,
      ].join("\n")
    );
  }

  // TODO: Move all errors to the message func!!!
  tempMessage(message: string) {
    throw new Error(message);
  }

  stateChecker(key: string, tokens: Token[], index: number, error: string, ...expect: string[]) {
    if (!tokens[index] || !tokens[index][key] || !isInclude(tokens[index][key], ...expect)) this.message(error, tokens, index);
  }

  checkObj(key: string, obj: Object, error: string, ...expect: string[]) {
    if (!obj || !obj[key] || !isInclude(obj[key], ...expect)) this.tempMessage(error);
  }
}

export default ErrorHandler;
