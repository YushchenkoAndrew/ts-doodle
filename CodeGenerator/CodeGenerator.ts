import { writeFileSync, readFileSync } from "fs";
import { SyntaxTree, Operation, OperationTypes, Declaration } from "../Parser/Interfaces";
import { Types } from "../Parser/Expression/Interfaces";
import Statement from "./Statement/Statement";
import Expression from "./Expression/Expression";

class Generator {
  keys = ["Declaration", "Statement", "Expression"];
  type = { INT: "number", FLOAT: "number", STR: "string", ANY: "any" };

  syntaxTree: SyntaxTree;

  statement: Statement;
  exp: Expression;

  level = -1;

  constructor(syntaxTree: SyntaxTree) {
    console.log("\x1b[34m", "\n~ Start Code Generator:", "\x1b[0m");

    this.syntaxTree = JSON.parse(JSON.stringify(syntaxTree)) as SyntaxTree;

    this.exp = new Expression();
    this.statement = new Statement(this.exp);
  }

  start(fileName: string = "Test.ts") {
    if (this.syntaxTree.type != "Program") return;

    writeFileSync(fileName, this.parseBody(this.syntaxTree.body));
  }

  parseBody(body: Operation[]): string {
    this.level++;
    let code: string[] = [];

    for (let i in body) {
      for (let k of this.keys) if (body[i][k]) code.push(this.parse(k, body[i][k]));
    }

    let shift = " ".repeat(this.level-- * 4);
    return code.map((line) => shift + line).join("\n");
  }

  parse(name: string, tree: OperationTypes | Types): string {
    let { type } = tree;

    switch (name) {
      case "Declaration": {
        console.log("\t=> Created: " + name, { type: tree.type });
        // TODO: Maybe at some point of time create func in func declaration
        // To do it Just check if this.func.header[0] ? if it contain something
        // Then save it and create an empty this.func and after that just restore data

        // Add input params if demands of
        return (
          `function ${(tree as Declaration).name}(${(tree as Declaration).params.map((arg) => `${arg.name}: ${this.type[arg.defined.type]}`).join(", ")}) {\n` +
          this.parseBody((tree as Declaration).body) +
          `\n${" ".repeat(this.level * 4)}}\n`
        );
        break;
      }

      case "Statement": {
        console.log("\t=> Created: " + name, { type: tree.type });
        // this.code.push(" ".repeat(this.level * 4) + this.statement.parse(this, tree));
        return this.statement.parse(this, tree);
      }

      default:
        console.log("\nFailed: " + name);
    }

    return "";
  }
}

export default Generator;

//   inputModule(mod) {
//     for (let key in mod) this[key] = mod[key].bind(this);
//   }

//   createGlobal() {
//     let name = `LOCAL${this.globalCount++}`;
//     this.code.data.push(`${name} dd ?`);
//     return name;
//   }

//   createPROC(name) {
//     this.code.func.push(this.func.header.join("\n\t") + "\n\t" + this.func.body.join("\n\t") + "\n@ENDP:" + "\n\tRET" + `\n${name} ENDP`);
//     this.func = { header: [], body: [] };
//   }

//   createIfDistribution(tree, params, label) {
//     this.func.body.push(`JE @ELSE${label}`);

//     // Parse then statements
//     this.parseBody(tree.body, params);
//     if (!tree.else) {
//       this.func.body.push(`\r@ELSE${label}:`);
//       return;
//     }

//     this.func.body.push(`JMP @ENDIF${label}`);
//     this.func.body.push(`\r@ELSE${label}:`);

//     // Parse Else Statements
//     this.parseBody(tree.else, params);
//     this.func.body.push(`\r@ENDIF${label}:`);
//   }

//   createWhileDistribution(tree, params) {
//     // Create a condition
//     this.func.body.push(`\r@LOOP${this.labels.loop}:`);
//     this.redirect("Expression", tree.Expression, { value: tree.name, defined: tree.defined, ...params });
//     this.func.body.push("CMP EAX, 00H");

//     // If condition equal to false then it'll exit the loop
//     this.func.body.push(`JE @END${this.labels.loop}`);

//     // Body of the while loop
//     this.parseBody(tree.body, params);

//     this.func.body.push(`JMP @LOOP${this.labels.loop}`);
//     this.func.body.push(`\r@END${this.labels.loop++}:`);
//   }

//   createForDistribution(tree, params) {
//     // We're certain that we declare new variable by another variable
//     // There for we need to check if this is our first time or not
//     if (this.isInclude(this.func.header, "PROC") && !this.isInclude(this.func.header, `LOCAL\ ${tree.iter}:`, `PROC\ ${tree.iter}`, `${tree.iter}:`))
//       this.func.header.push(`LOCAL\ ${tree.iter}:DWORD`);

//     this.redirect("Statement", tree.range, params);

//     // FIXME: list and size created only by taking in count
//     // the range func, need to improve this !!!

//     let list = this.createGlobal();
//     let size = this.createGlobal();

//     this.func.body.push(`MOV\ ${list}, EAX`);
//     this.func.body.push(`MOV\ ${size}, ECX`);

//     // The basic state in for loop => "for (int i = 0; ...)"
//     this.func.body.push(`PUSH 00H`);
//     let reg = this.regs.available[0];

//     // Header of the FOR LOOP
//     this.func.body.push(`\r@LOOP${this.labels.loop}:`);
//     this.func.body.push(`POP ECX`);
//     this.func.body.push(`MOV EAX,\ ${list}`);
//     this.func.body.push(`MOV\ ${reg},\ [EAX + 4 * ECX]`);
//     this.func.body.push(`MOV\ ${tree.iter},\ ${reg}`);
//     this.func.body.push(`INC ECX`);
//     this.func.body.push(`CMP ECX, ${size}`);
//     this.func.body.push(`JG @END${this.labels.loop}`);
//     this.func.body.push(`PUSH ECX`);
//     this.func.body.push("");

//     // Body of the FOR LOOP
//     this.parseBody(tree.body, params);

//     this.func.body.push(`JMP @LOOP${this.labels.loop}`);
//     this.func.body.push(`\r@END${this.labels.loop++}:`);
//   }

//   parseFuncParams(args, params) {
//     let data = [];

//     for (let arg of args) {
//       let { type, value } = arg.Expression;

//       if (!this.isInclude(type, "INT", "VAR")) {
//         this.redirect("Expression", arg.Expression, { type: "SAVE", defined: arg.defined, ...params });
//         value = getGlobal.call(this, arg.defined);
//       }

//       data.push(value);
//     }
//     return data;

//     // Additional functions
//     function getGlobal({ type }) {
//       if (type == "FLOAT") return `LOCAL${this.globalCount - 1}`;

//       let name = `LOCAL${this.globalCount++}`;
//       this.code.data.push(`${name}\ dd\ ?`);
//       this.func.body.push(`MOV ${name}, EAX`);
//       return name;
//     }
//   }

//   convertType({ type, kind = 0 }, body) {
//     switch (type) {
//       case "INT":
//         body.push(`MOV VALUE, ${kind}`);
//         body.push(`invoke NumToStr, EAX, ADDR Output`);
//         break;

//       case "FLOAT":
//         body.push("; Clean FPU Stack");
//         body.push("FINIT");
//         body.push(`invoke FloatToStr_, EAX, ADDR OutFloat`);
//         break;
//     }
//     body.push("invoke MessageBoxA, 0, EAX, ADDR Caption, 0");
//   }

//   isInclude(value, ...arr) {
//     if (Array.isArray(value)) return this.isIncludeArr(value, arr);
//     for (let i in arr) if (value?.includes(arr[i])) return Number(i) + 1;
//     return false;
//   }

//   isIncludeArr(arr, value) {
//     for (let i in arr) for (let v of value) if (arr[i].includes(v)) return Number(i) + 1;
//     return false;
//   }

//   isEqual(value, ...arr) {
//     for (let i in arr) if (value === arr[i]) return Number(i) + 1;
//     return false;
//   }
// }
// module.exports = Generator;
