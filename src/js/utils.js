/**
 * Add variance to a number within a range
 * @param {number} num
 * @param {number} upper
 * @param {number} lower
 * @returns {number}
 */
export function addVariance(num, lower, upper) {
  if (lower === undefined) {
    lower = 0
  }
  upper = upper ?? lower
  if (upper < 0) {
    upper = 0
  }
  if (lower < 0) {
    lower = 0
  }
  const subtract = Math.random() * lower
  const add = Math.random() * upper
  return Math.random() > 0.5 ? num - subtract : num + add
}
