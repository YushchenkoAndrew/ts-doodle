export default {
  chr: (arg: string[]) => `String.fromCharCode(${arg[0]})`,

  float: (arg: string[]) => `Number(${arg[0]})`,

  int: (args: string[]) => `parseInt(${args[0]} + ""${args[1] ? ", " + args[1] : ""})`,

  len: (args: string[]) => `${args[0]}.length`,

  print: (args: string[]) => `console.log(${args.join(", ")})`,

  range: (args: string[]) => `Array(Math.trunc((${args[1]} - ${args[0]}) / ${args[2]})).fill(${args[0]}).map((x, y) => x + y * ${args[2]})`,

  str: (args: string[]) => "`${" + args[0] + "}`",

  sum: (args: string[]) => `${args[0]}.reduce((acc, curr) => acc + curr, ${args[1] ?? 0})`,
};
