function fact(x: any): any {
  if (x) {
    return fact(x - 1) * x;
  }
  return 1;
}

function sin(x: any, sign: any, i: any, n: any): any {
  if (i < n) {
    return ((sign * (Math.pow(x, i))) / fact(i)) + sin(x, sign * -1, i + 2, n);
  }
  return 0;
}

console.log("sin(pi / 2) =", sin(1.5707963268, 1, 1, 20));
