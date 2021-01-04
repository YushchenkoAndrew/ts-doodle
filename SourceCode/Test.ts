const fact: Function = (a: number): any => a ? fact(a - 1) * a : 1;
const a: number = (5 + 5) * 3;
console.log(fact(a));
fact(5) || fact(0);
if (a != 5) {
  console.log(a);
} else {
  const b: number = 1;
}
console.log(a);
