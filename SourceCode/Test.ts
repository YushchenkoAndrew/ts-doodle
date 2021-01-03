const fact: Function = (a: number): any => a ? fact(a - 1) * a : 1;
let a: number | string = 5;
console.log(fact(a));
a = "str";
console.log(a);
