
module.exports = exports = function merge(a, b) {
  var k;
  a = a || {};
  b = b || {};
  for (k in b) a[k] = b[k];
  return a;
}
