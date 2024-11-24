/**
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTimestamp(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds -= hours * 3600;

  const minutes = Math.floor(totalSeconds / 60);
  totalSeconds -= minutes * 60;

  return [hours, minutes, totalSeconds].join(":");
}

/**
 * @param {number|string} num
 * @param {number} desiredLength
 * @returns {string}
 */
function zeroPad(num, desiredLength) {
  num = String(num);
  while (num.length < desiredLength) {
    num = `0${num}`;
  }
  return num;
}

module.exports = {
  formatTimestamp,
  zeroPad,
};
