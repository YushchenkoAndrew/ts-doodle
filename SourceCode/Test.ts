function test(): number {
  return 1;
}

let a: number = 1 + test();
let b: Function = test;
console.log(b());
