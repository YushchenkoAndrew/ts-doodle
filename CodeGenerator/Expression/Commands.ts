export default {
  "**": (left: string, right: string) => `Math.pow(${left}, ${right})`,

  or: (left: string, right: string) => `${left} || ${right}`,
  and: (left: string, right: string) => `${left} && ${right}`,

  not: (exp: string) => `!${exp}`,
};
