function test(a: number): any {
  return a + 1;
}

const a: number = 5;
console.log(test(a));
if (a) {
  a = 8;
}
console.log(a);
