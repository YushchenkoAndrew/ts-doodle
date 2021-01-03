import { OperationTypes, Operation } from "../../Parser/Interfaces";
import { findOperations } from "../../lib/";
import { Assign, Condition } from "../../Parser/Statement/Interfaces";

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
      console.log(`VAR INIT "${name}"`);

      let types = (findOperations("Statement", "name", name, body.slice(1)) as Assign[]).map((item) => item.defined[0]);

      // Check if this variable has some new assignments
      if (types.length) defined.push(...types.filter(({ type }) => type != defined[0].type));
      else init.type = "CONST";
    }
  }

  private parseCondition(curr: Condition, body: Operation[]) {
    let bodySize = curr.body.length;
    let elseSize = curr.else?.length ?? 0;

    if (bodySize * elseSize == 1) {
      // console.log();
      console.log(curr.body[0].Statement);
      console.log(body);

      body[0].Statement = curr.body[0].Statement;
    }
  }
}

export default Statement;
