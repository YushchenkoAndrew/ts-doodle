const fact: Function = (a: number): string => a ? "5" : fact(a + 1) + 1;
const a: number = (5 + 5) * 3;
console.log(fact(a));
fact(5) || fact(0);
if (a != 5) {
  console.log(a);
} else {
  const b: number = 1;
}
console.log(a);
const c: (number | string | number[])[] = [1, "str", 5.0, [5], [5.0]];
