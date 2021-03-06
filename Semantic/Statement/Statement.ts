import * as dotenv from "dotenv";
import { OperationTypes, Operation } from "../../Parser/Interfaces";
import { findOperations } from "../../lib/";
import { Assign, Condition, Return } from "../../Parser/Statement/Interfaces";
import { Types } from "../../Parser/Expression/Interfaces";
import Semantic from "../Semantic";
dotenv.config();

class Statement {
  parse(ptr: Semantic, curr: OperationTypes, body: Operation[]) {
    let { type } = curr;

    switch (type) {
      case "VAR":
        return this.parseAssign(curr as Assign, body);

      case "IF":
        return this.parseCondition(ptr, curr as Condition, body);

      case "RET":
        return this.parseReturn(body);
    }
  }

  private parseAssign({ name, init, defined }: Assign, body: Operation[]) {
    // Check if new Variable is init assign and it have different types then
    // add them to the init assign
    if (init.init) {
      // Find Statement in the multi layer of bodies
      let types = (this.findStatement("name", name, body.slice(1)).map((item) => item.Statement) as Assign[]).map((item) => item.defined[0]);

      // Check if this variable has some new assignments
      if (types.length) defined.push(...types.filter(({ type }) => type != defined[0].type));
      else init.type = "CONST";

      if (process.env.DEBUG) console.log(`DEFINE TO ${init.type} "${name}" TYPES [${defined.map((item) => item.type)}]`);
    }
  }

  private parseCondition(ptr: Semantic, curr: Condition, body: Operation[]) {
    // Firstly parse the body
    ptr.parseBody(curr.body);
    ptr.parseBody(curr.else ?? []);

    // Check if both "then" and "else" contain a return Statement, if so then
    // cut the rest if the unreached body
    let checkReturn = this.findStatement("type", "RET", [...curr.body, ...(curr.else ?? [])]).map((item) => item.Statement) as Return[];

    // FIXME: Bug with defining body, for example => if a: return 0; else: if a: return 0
    // This thing shouldn't work!!! Somehow make it to give false result
    // First idea: Add a variable that will block depth search
    // Second idea: Found all Conditional Operations and then just calculate
    //              min-max range of returns (somehow need to know where there located)
    if (checkReturn.length >= 2) this.parseReturn(body);

    // Then find the size of it, which is based on size of known Operations
    let bodySize = curr.body.filter((opr) => opr.Declaration || opr.Statement || opr.Expression).length;
    let elseSize = (curr.else ?? []).filter((opr) => opr.Declaration || opr.Statement || opr.Expression).length;

    if (bodySize * elseSize != 1 || curr.body[0].Statement?.type != curr.else?.[0]?.Statement.type) return;
    let { type } = curr.body[0].Statement;

    switch (type) {
      case "VAR": {
        // Save "then" and "else" body values
        let ternary = { then: curr.body[0].Statement as Assign, else: curr.else[0].Statement as Assign };
        if (ternary.then.name != ternary.else.name) break;

        let uniqueTypes = Object.values(
          [...ternary.then.defined, ...ternary.else.defined].reduce((acc, curr) => ({ ...acc, ...(acc[curr.type] ? {} : { [curr.type]: curr }) }), {})
        );

        // Copy to the Statement Assign Operation from then body
        body[0].Statement = { ...ternary.then, defined: uniqueTypes } as Assign;

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
        let uniqueTypes = Object.values(
          [...ternary.then.defined, ...ternary.else.defined].reduce((acc, curr) => ({ ...acc, ...(acc[curr.type] ? {} : { [curr.type]: curr }) }), {})
        );

        // Copy to the Statement Assign Operation from then body
        body[0].Statement = { ...ternary.then, defined: uniqueTypes } as Return;

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

        // this.parse(ptr, body[0].Statement, body);
        break;
      }
    }
  }

  parseReturn(body: Operation[]) {
    // Get unreached code and check if its contain any operation there
    let unreached = body.slice(1);
    if (!unreached.length) return;

    if (process.env.DEBUG) {
      console.log("ERASED UNREACHED CODE:");
      console.dir(unreached, { depth: 3 });
    }

    for (let operation of unreached) {
      // Erase each Operation
      delete operation.Declaration;
      delete operation.Statement;
      delete operation.Expression;
    }
  }

  findStatement(key: string, value: string, body: Operation[]): Operation[] {
    // Check if demand Statement located in the another layer of the body
    return body
      .reduce(
        (acc, curr) =>
          curr.Statement && "body" in curr.Statement
            ? [...acc, ...this.findStatement(key, value, [...curr.Statement.body, ...((curr.Statement as Condition).else ?? [])])]
            : [...acc, curr],
        [] as Operation[]
      )
      .filter((obj) => obj.Statement?.[key] == value);
  }
}

export default Statement;
