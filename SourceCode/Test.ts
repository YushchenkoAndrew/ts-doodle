function fact(x: number): number {
  if (x) {
    return (fact(x - 1) * x) + 0;
  }
  return 1;
}

function sin(x: number, sign: number, i: number, n: number): number {
  i = (0 + i) + 0;
  x = (0.0 + x) + 0.0;
  n = (0 + n) + 0;
  if (i < n) {
    return ((sign * (Math.pow(x, i))) / fact(i)) + sin(x, sign * -1, i + 2, n);
  }
  return 0;
}

console.log("sin(pi / 2) =", sin(1.5707963268, 1, 1, 20));
