import { Operation, OperationTypes } from "../Parser/Interfaces";
export function isInclude(type: string, ...arr: string[]) {
  for (let i of arr) if (type.includes(i)) return true;
  return false;
}

export function isEqual(type: string, ...arr: string[]) {
  for (let i of arr) if (type === i) return true;
  return false;
}

export function getDefinedToken(
  type: string | string[],
  key: string,
  value: string,
  { body = [] as Operation[], header = [] as Operation[] },
  errFunc?: Function
): OperationTypes | null {
  // Get all data that already defined
  let defined = [...body, ...header];

  // A simple polymorphism, sort of ~
  if (Array.isArray(type)) return getDefinedTokenArray(type, key, value, defined, errFunc);

  // Check if variable is defined in the body or in the header (in the prev level)
  let index = defined.map((obj) => obj?.[type]?.[key]).lastIndexOf(value);

  // If the variables is not defined then throw an Error
  if (index == -1 && errFunc) errFunc();
  // errorMessageHandler(`Variable ${value} is not defined`, this.tokens[this.line][this.index - 1]);

  return index != -1 ? defined[index][type] : null;
}

export function getDefinedTokenArray(types: string[], key: string, value: string, defined: Operation[], errFunc?: Function): OperationTypes | null {
  let index: number = -1;
  let prevType: string = "";

  for (let type of types) {
    prevType = type;
    index = defined.map((obj) => obj?.[type]?.[key]).lastIndexOf(value);
    if (index != -1 && defined[index][type].type != "FUNC_CALL") break;
  }

  // If the variables is not defined then throw an Error
  if (index == -1 && errFunc) errFunc();

  return index != -1 ? defined[index][prevType] : null;
}
