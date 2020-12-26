import * as dotenv from "dotenv";
import Lexing from "./Lexer/Lexing";
import Parser from "./Parser/Parser";
import Generator from "./CodeGenerator/CodeGenerator";
dotenv.config();

function main() {
  let lexing = new Lexing({ path: process.env.FILE_IN });
  lexing.defineTokens();

  let parser = new Parser(lexing.getTokens());
  parser.start();

  let generator = new Generator(parser.getTree());
  generator.save(process.env.FILE_OUT);
}

main();
