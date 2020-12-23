import { writeFileSync, readFileSync } from "fs";
import { SyntaxTree, Operation } from "../Parser/Interfaces";

class Generator {
  keys = ["Declaration", "Statement", "Expression"];

  syntaxTree: SyntaxTree;

  code = { header: [], const: [], data: [], func: [], start: [] };
  func = { header: [], body: [] };

  constructor(syntaxTree: SyntaxTree) {
    console.log("\x1b[34m", "\n~ Start Code Generator:", "\x1b[0m");

    this.syntaxTree = JSON.parse(JSON.stringify(syntaxTree)) as SyntaxTree;
    // this.forcedType = undefined;
  }

  start(fileName: string = "Test.ts") {
    if (this.syntaxTree.type != "Program") return;

    this.parseBody(this.syntaxTree.body);
    // this.generateFile(fileName);
  }

  // FIXME: Change approach here!!!
  // private generateFile(name: string) {
  //   writeFileSync(
  //     name,
  //     readFileSync("./Template", "utf-8")
  //       .replace("$HEADER", this.code.header.join("\n") || "")
  //       .replace("$CONST", this.code.const.join("\n") || "")
  //       .replace("$DATA", this.code.data.join("\n") || "")
  //       .replace("$FUNC", this.code.func.join("\n\n") || "")
  //       .replace("$START", "\t" + this.code.start.join("\n\t"))
  //   );
  // }

  private parseBody(body: Operation[], params = {}) {
    for (let i in body) {
      // for (let k of this.keys) if (body[i][k]) this.redirect(k, body[i][k], params);
    }
  }
}

export default Generator;

//   inputModule(mod) {
//     for (let key in mod) this[key] = mod[key].bind(this);
//   }

//   redirect(name, tree, params = {}) {
//     let { type } = tree;

//     switch (name) {
//       case "Declaration": {
//         console.log("\t=> Created: " + name, { type: tree.type });
//         // TODO: Maybe at some point of time create func in func declaration
//         // To do it Just check if this.func.header[0] ? if it contain something
//         // Then save it and create an empty this.func and after that just restore data

//         // Add input params if demands of
//         this.code.header.push(`${tree.name} PROTO\ ` + tree.params.map((arg) => ":DWORD").join(","));
//         this.func.header.push(`${tree.name} PROC\ ` + tree.params.map((arg) => `${arg.name}:DWORD`).join(","));

//         this.labels = { condition: 0, loop: 0 };
//         this.parseBody(tree.body, { func: tree.name });
//         this.createPROC(tree.name);
//         break;
//       }

//       case "Statement": {
//         console.log("\t=> Created: " + name, { type: tree.type });

//         switch (type) {
//           case "VAR":
//             this.redirect("Expression", tree.Expression, { value: tree.name, defined: tree.defined, ...params });

//             // We're certain that we declare new variable by another variable
//             // There for we need to check if this is our first time or not
//             if (this.isInclude(this.func.header, "PROC") && !this.isInclude(this.func.header, `LOCAL\ ${tree.name}:`, `PROC\ ${tree.name}`, `${tree.name}:`)) {
//               this.func.header.push(`LOCAL ${tree.name}:DWORD`);
//             }
//             break;

//           case "RET":
//             // Create a bool return (00H or 01H) if type is not equal to INT
//             this.forcedType = this.isInclude(tree.Expression.value, "==", "not") && tree.type != "INT" ? { type: "INT", kind: 10 } : 0;
//             this.redirect("Expression", tree.Expression, { type: tree.type, defined: tree.defined, ...params });
//             this.func.body.push("JMP @ENDP");
//             break;

//           case "FUNC_CALL":
//             // This Checks if func is called from another func or not
//             let body = this.func.header[0] ? this.func.body : this.code.start;

//             body.push(`invoke ${[tree.name, ...this.parseFuncParams(tree.params, params)].join(", ")}`);
//             this.convertType(this.forcedType || tree.defined, body);
//             // Reset force type
//             this.forcedType = 0;
//             break;

//           case "IF":
//             // this.func.body.push("");
//             this.func.body.push(`; IF Statement ${this.labels.condition}`);
//             this.redirect("Expression", tree.Expression, { value: tree.name, defined: tree.defined, ...params });
//             this.func.body.push("CMP EAX, 00H");
//             this.createIfDistribution(tree, params, this.labels.condition++);
//             break;

//           case "WHILE":
//             this.func.body.push(`; WHILE LOOP ${this.labels.loop}`);
//             this.createWhileDistribution(tree, params);
//             break;

//           case "FOR":
//             this.func.body.push(`; FOR LOOP ${this.labels.loop}`);
//             this.createForDistribution(tree, params);
//             break;

//           case "CONTINUE":
//           case "BREAK":
//             this.func.body.push("");
//             this.func.body.push(`; ${type}`);
//             this.func.body.push(`JMP @${type == "BREAK" ? "END" : "LOOP"}${this.labels.loop}`);
//             break;
//         }

//         break;
//       }

//       case "Expression": {
//         // Get the right commands for the specific type
//         this.commands = this.masmCommands[params.defined.type == "ANY" ? "INT" : params.defined.type];
//         this.createCommand = this.commands.createCommand.bind(this);
//         this.allocateFreeSpace = params.defined.length || 0; // This param needed for declaration an array in ASM

//         switch (type) {
//           case "Binary Operation":
//             this.parseExpression(tree, { func: params.func, defined: { ...params.defined } });
//             if (params.value) this.func.body.push(this.commands.setValue({ dst: params.value, src: "EAX" }));
//             // Check if params have any type such as ("RET", "SAVE") and it a FLOAT type
//             //  if so then it save current calculated value in a new created var
//             // And copied it to a reg "EAX"
//             else if (params.type && params.defined.type == "FLOAT") {
//               let name = this.masmCommands.FLOAT.createValue.call(this, {});
//               this.func.body.push(`FST ${name}`);
//               this.func.body.push(`MOV EAX, ${name}`);
//             }
//             break;

//           default:
//             params.var = params.value;
//             params.value = "EAX";
//             this.assignValue(this.func.body, { src: tree, dst: params });
//             if (params.type && params.defined.type == "FLOAT" && tree.type != "VAR") {
//               let name = this.masmCommands.FLOAT.createValue.call(this, {});
//               this.func.body.push(`FST ${name}`);
//               this.func.body.push(`MOV EAX, ${name}`);
//             }
//         }

//         break;
//       }

//       default:
//         console.log("\nFailed: " + name);
//     }
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
