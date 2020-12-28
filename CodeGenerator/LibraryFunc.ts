export default {
  int: (args: string[]) => `parseInt(${args[0]}${args[1] ? `, ${args[1]}` : ""})`,

  print: (args: string[]) => `console.log(${args.join(", ")})`,

  range: (args: string[]) => `Array(Math.trunc((${args[1]} - ${args[0]}) / ${args[2]})).fill(${args[0]}).map((x, y) => x + y * ${args[2]})`,

  str: (args: string[]) => "`${" + args[0] + "}`",
};
