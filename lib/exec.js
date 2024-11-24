// @ts-check
const { spawnSync } = require("node:child_process");

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {string}
 */
function exec(command, args) {
  const { stdout, stderr, status } = spawnSync(command, args);

  if (status) {
    throw new Error(stderr.toString("utf-8"));
  }

  return stdout.toString("utf-8");
}

module.exports = { exec };
