import * as dotenv from "dotenv";
import { OperationTypes, Operation } from "../../Parser/Interfaces";
import { findOperations } from "../../lib/";
import { Assign, Condition, Return } from "../../Parser/Statement/Interfaces";
import { Types } from "../../Parser/Expression/Interfaces";
dotenv.config();

class Statement {
  parse(curr: OperationTypes, body: Operation[]) {
    let { type } = curr;

    switch (type) {
      case "VAR":
        return this.parseAssign(curr as Assign, body);

      case "IF":
        return this.parseCondition(curr as Condition, body);
    }
  }

  private parseAssign({ name, init, defined }: Assign, body: Operation[]) {
    // Check if new Variable is init assign and it have different types then
    // add them to the init assign
    if (init.init) {
      // TODO: Create a depth finder for example => a = 5; if a: a = 1
      // value 'a' shouldn't be 'const' as it's now defined
      let types = (findOperations("Statement", "name", name, body.slice(1)) as Assign[]).map((item) => item.defined[0]);

      // Check if this variable has some new assignments
      if (types.length) defined.push(...types.filter(({ type }) => type != defined[0].type));
      else init.type = "CONST";

      if (process.env.DEBUG) console.log(`DEFINE TO VAR "${name}" TYPES [${defined.map((item) => item.type)}]`);
    }
  }

  private parseCondition(curr: Condition, body: Operation[]) {
    let bodySize = curr.body.length;
    let elseSize = curr.else?.length ?? 0;

    if (bodySize * elseSize != 1 || curr.body[0].Statement?.type != curr.else?.[0]?.Statement.type) return;
    let { type } = curr.body[0].Statement;

    switch (type) {
      case "VAR": {
        // Save "then" and "else" body values
        let ternary = { then: curr.body[0].Statement as Assign, else: curr.else[0].Statement as Assign };
        if (ternary.then.name != ternary.else.name) break;

        // Copy to the Statement Assign Operation from then body
        body[0].Statement = ternary.then;

        // Set "then" and "else" body to the appropriate Expression
        (body[0].Statement as Assign).Expression = {
          ...curr,
          body: [{ Expression: ternary.then.Expression as Types }],
          else: [{ Expression: ternary.else.Expression as Types }],
        };

        if (process.env.DEBUG) {
          console.log("CHANGED CONDITION TO:");
          console.dir(body[0], { depth: 3 });
        }
        break;
      }

      case "RET": {
        // Save "then" and "else" body values
        let ternary = { then: curr.body[0].Statement as Return, else: curr.else[0].Statement as Return };

        // Copy to the Statement Assign Operation from then body
        body[0].Statement = ternary.then;

        // Set "then" and "else" body to the appropriate Expression
        (body[0].Statement as Assign).Expression = {
          ...curr,
          body: [{ Expression: ternary.then.Expression as Types }],
          else: [{ Expression: ternary.else.Expression as Types }],
        };

        if (process.env.DEBUG) {
          console.log("CHANGED RETURN TO:");
          console.dir(body[0], { depth: 3 });
        }
        break;
      }
    }
  }
}

export default Statement;
