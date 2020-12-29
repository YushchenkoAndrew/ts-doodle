import { SyntaxTree, Operation } from "../Parser/Interfaces";
import { Assign } from "../Parser/Statement/Interfaces";

class Semantic {
  syntaxTree: SyntaxTree;
  simplifyTree = {} as SyntaxTree;

  constructor(syntaxTree: SyntaxTree) {
    console.log("\x1b[34m", "\n~ Start Semantic Analysis:", "\x1b[0m");

    this.syntaxTree = syntaxTree;

    this.postAnalysis(this.syntaxTree);
  }

  parseBody() {}

  postAnalysis(syntaxTree: SyntaxTree) {
    for (let operation of syntaxTree.body) {
      console.log(operation.Statement);
      console.log(this.findOperations((operation.Statement as Assign).name, syntaxTree.body));
    }
  }

  findOperations(name: string, body = [] as Operation[]) {
    return body.filter((item) => (item.Statement as Assign).name == name && !(item.Statement as Assign).init);
  }
}

export default Semantic;
