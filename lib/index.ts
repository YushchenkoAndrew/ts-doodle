export function isInclude(type: string, ...arr: string[]) {
  for (let i of arr) if (type.includes(i)) return true;
  return false;
}
