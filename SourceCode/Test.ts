function test(): any {
  return 1;
}

let a: string = "5";
let b: Function = test;
let c: Function = b;
console.log(b());
console.log(c());
c = (a: number): number => a + 10;
console.log(c(5));
