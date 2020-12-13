import { Token } from "../Lexer/Lexing";

class ErrorHandler {
  message(message: string, tokens: Token[], index: number) {
    throw new Error(
      [
        `Error in line ${tokens[index].line + 1}, col ${tokens[index].char + 1}`,
        tokens.map((token) => token.value).join(""),
        `${" ".repeat(tokens[index].char)}^`,
        `${message}:`,
      ].join("\n")
    );
  }

  stateChecker(key: string, token: any, error: string, ...expect: string[]) {
    if (!token || !token[key] || !this.isInclude(token[key], ...expect)) this.message(error, token || { line: this.line, char: 0 });
  }
}

export default ErrorHandler;
