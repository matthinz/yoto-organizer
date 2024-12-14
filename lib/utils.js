const fs = require("node:fs");

/**
 *
 * @param {string} filename
 * @returns {Pick<Map<string,string>, "get" | "set">>}
 */
function createCachedMap(filename) {
  return { get, set };

  function loadMap() {
    /**
     * @type {Map<string,string>}
     */
    const map = new Map();
    try {
      const raw = fs.readFileSync(filename, "utf-8");
      const entries = JSON.parse(raw);

      entries.forEach(([key, value]) => {
        map.set(key, value);
      });
    } catch (err) {}

    // console.error("loadMap", filename, map.entries());

    return map;
  }

  /**
   *
   * @param {Map<string,string>} map
   */
  function saveMap(map) {
    try {
      fs.writeFileSync(filename, JSON.stringify(Array.from(map.entries())));
      // console.error("saveMap", filename, map.entries());
    } catch (err) {}
  }

  /**
   * @param {string} key
   * @returns {string|undefined}
   */
  function get(key) {
    return loadMap().get(key);
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  function set(key, value) {
    const map = loadMap();
    map.set(key, value);
    saveMap(map);
  }
}

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
 *
 * @param input {string}
 * @returns {string}
 */
function sanitizeFilename(input) {
  return input
    .replace(/’/g, "'")
    .replace(/[^a-zA-Z0-9 \(\)'-]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
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
  createCachedMap,
  formatTimestamp,
  sanitizeFilename,
  zeroPad,
};
