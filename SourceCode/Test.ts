function main(a: any) {
  function test() {
    return 1;
  }

  while (1) {
    let b = test();
    break;
  }
  return a + -2 * 2 - 3 * 2 / test();
}

let c = 1;
console.log(main(1));
if (c) {
  let n = 1;
}
let b = 3;
let a = [5, 4, 3, 2, 1];
console.log(a);
for (let i of a) {
  console.log(i);
}