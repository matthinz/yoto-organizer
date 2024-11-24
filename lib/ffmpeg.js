// @ts-check

const { exec } = require("./exec");

/**
 *
 * @param  {...string} args
 * @returns {}
 */
function ffmpeg(...args) {
  return exec("ffmpeg", args);
}

/**
 * @typedef {object} FFMPEGOptions
 * @property {string} inputFile
 * @property {string} outputFile
 * @property {boolean} [mono]
 * @property {Record<string,string>} [metadata]
 */

/**
 * @param {FFMPEGOptions} options
 */
function ffmpegNice(options) {
  const args = ["-i", options.inputFile];

  if (options.mono === true) {
    args.push("-ac", "1");
  }

  Object.entries(options.metadata ?? {}).forEach(([key, value]) => {
    args.push("-metadata", `${key}=${value}`);
  });

  args.push(options.outputFile);

  return ffmpeg(...args);
}

/**
 *
 * @param  {...string} args
 */
function ffprobe(...args) {
  return exec("ffprobe", args);
}

module.exports = { ffmpeg, ffmpegNice, ffprobe };
