import * as dotenv from "dotenv";
import Lexing from "./Lexer/Lexing";
import Parser from "./Parser/Parser";
import Generator from "./CodeGenerator/CodeGenerator";
import Semantic from "./Semantic/Semantic";
dotenv.config();

function main() {
  let lexing = new Lexing({ path: process.env.FILE_IN });
  lexing.defineTokens();

  let parser = new Parser(lexing.getTokens());
  parser.start();

  let semantic = new Semantic(parser.getTree());

  let generator = new Generator(semantic.getTree());
  generator.save(process.env.FILE_OUT);
}

main();
