import * as dotenv from "dotenv";
import Lexing from "./Lexing";
import Parser from "./Parser";
dotenv.config();

function main() {
  let lexing = new Lexing(process.env.FILE_IN);
  lexing.defineTokens();

  let parser = new Parser(lexing.getTokens());
  parser.start();
}

main();
