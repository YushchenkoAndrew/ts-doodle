import { Int, Types, Str, Var, Float } from "../../Parser/Expression/Interfaces";
class Expression {
  parse(tree: Types): string {
    let { type } = tree;
    // // Get the right commands for the specific type
    // this.commands = this.masmCommands[params.defined.type == "ANY" ? "INT" : params.defined.type];
    // this.createCommand = this.commands.createCommand.bind(this);
    // this.allocateFreeSpace = params.defined.length || 0; // This param needed for declaration an array in ASM

    switch (type) {
      case "Binary Operation":
        //     this.parseExpression(tree, { func: params.func, defined: { ...params.defined } });
        //     if (params.value) this.func.body.push(this.commands.setValue({ dst: params.value, src: "EAX" }));
        //     // Check if params have any type such as ("RET", "SAVE") and it a FLOAT type
        //     //  if so then it save current calculated value in a new created var
        //     // And copied it to a reg "EAX"
        //     else if (params.type && params.defined.type == "FLOAT") {
        //       let name = this.masmCommands.FLOAT.createValue.call(this, {});
        //       this.func.body.push(`FST ${name}`);
        //       this.func.body.push(`MOV EAX, ${name}`);
        //     }
        break;

      case "VAR":
      case "STR":
      case "INT":
      case "FLOAT":
        return (tree as Int | Float | Str | Var).value;

      default:
      // params.var = params.value;
      // params.value = "EAX";
      // this.assignValue(this.func.body, { src: tree, dst: params });
      // if (params.type && params.defined.type == "FLOAT" && tree.type != "VAR") {
      //   let name = this.masmCommands.FLOAT.createValue.call(this, {});
      //   this.func.body.push(`FST ${name}`);
      //   this.func.body.push(`MOV EAX, ${name}`);
      // }
      // }
    }

    return "";
  }
}

export default Expression;
