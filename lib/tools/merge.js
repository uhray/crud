
module.exports = exports = function merge(a, b) {
  for (var k in b) a[k] = b[k];
  return a;
}

