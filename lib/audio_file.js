// @ts-check

const fs = require("node:fs");
const path = require("node:path");
const { ffmpeg, ffprobe, ffmpegNice } = require("./ffmpeg");
const { formatTimestamp, zeroPad } = require("./utils");

/**
 *
 * @param {string} filename
 * @param {string} coverArtFilename
 * @returns {void}
 */
function addCoverArt(filename, coverArtFilename) {
  const dir = path.dirname(filename);
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);

  const workingFile = path.join(dir, `${base}.add_cover_art${ext}`);

  ffmpeg(
    "-i",
    filename,
    "-i",
    coverArtFilename,
    "-map",
    "0:a",
    "-map",
    "1",
    "-c:a",
    "copy",
    "-c:v",
    "mjpeg",
    "-disposition:v:0",
    "attached_pic",
    workingFile,
  );

  fs.renameSync(workingFile, filename);
}

/**
 * @param {string} filename
 * @returns {string}
 */
function extractAudioStream(filename) {
  const dir = path.dirname(filename);
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);

  const baseAudioFilename = path.join(dir, base);

  const intermediateFile = baseAudioFilename + ".aac";

  const outputFile = baseAudioFilename + ".m4a";

  // Create an intermediate .aac file
  ffmpegNice({
    inputFile: filename,
    outputFile: intermediateFile,
    mono: true,
  });

  // Then package that up however we want it
  ffmpegNice({
    inputFile: intermediateFile,
    outputFile,
    metadata: {
      title: base,
      album: base,
    },
  });

  fs.unlinkSync(intermediateFile);

  return outputFile;
}

/**
 * @typedef {object} ExtractChaptersOptions
 * @property {string} filename
 * @property {string} bookTitle
 * @property {{start: number, end: number, title: string}[]} chapters
 * @property {string} outputDirectory
 */

/**
 *
 * @param {ExtractChaptersOptions} options
 * @returns {string[]} The filenames
 */
function extractChapters(options) {
  const { filename, bookTitle, chapters, outputDirectory } = options;
  const coverArtFilename = path.join(path.dirname(filename), ".cover.png");
  const shouldAddCoverArt = extractCoverArt(filename, coverArtFilename);

  const filenames = chapters.map(({ start, end, title }, index) => {
    const startSeconds = start / 1000.0;
    const endSeconds = end / 1000.0;
    const durationSeconds = endSeconds - startSeconds;

    const niceChapterNumber = zeroPad(
      index + 1,
      String(chapters.length).length,
    );

    let ext = path.extname(filename);
    if (ext === ".m4b") {
      // It's not really a book anymore, it's just a chapter
      ext = ".m4a";
    }

    const chapterFile = path.join(
      outputDirectory,
      `${bookTitle} - Chapter ${niceChapterNumber}${ext}`,
    );

    fs.mkdirSync(path.dirname(chapterFile), { recursive: true });

    // First, extract audio
    ffmpeg(
      "-i",
      filename,
      "-ss",
      formatTimestamp(startSeconds),
      "-t",
      formatTimestamp(durationSeconds),
      "-c",
      "copy",
      "-metadata",
      `title=${title}`,
      "-metadata",
      `album=${bookTitle}`,
      chapterFile,
    );

    // Then, add cover art
    if (shouldAddCoverArt) {
      addCoverArt(chapterFile, coverArtFilename);
    }

    return chapterFile;
  });

  if (shouldAddCoverArt) {
    fs.unlinkSync(coverArtFilename);
  }

  return filenames;
}

/**
 *
 * @param {string} filename
 * @param {string} coverArtFilename
 * @returns {boolean}
 */
function extractCoverArt(filename, coverArtFilename) {
  try {
    ffmpeg("-i", filename, "-map", "0:v", "-c", "copy", coverArtFilename);
    return true;
  } catch {
    return false;
  }
}

/**
 *
 * @param {string} filename
 * @returns {{start: number, end: number, title: string}[]}
 */
function findAudioFileChapters(filename) {
  const stdout = ffprobe("-print_format", "json", "-show_chapters", filename);
  const json = JSON.parse(stdout);

  const chapters = json.chapters
    .map(({ start, end, tags, ...rest }) => {
      if (rest.time_base !== "1/1000") {
        return;
      }

      return {
        start,
        end,
        title: tags.title,
      };
    })
    .filter(Boolean);

  if (chapters.length > 0) {
    return chapters;
  }

  // pretend there's 1 long chapter
  const { duration, title } = getAudioFileMetadata(filename);
  return [
    {
      start: 0,
      end: duration,
      title,
    },
  ];
}

/**
 *
 * @param {string} filename
 * @returns {{title: string, album: string, artist: string, duration: number}}
 */
function getAudioFileMetadata(filename) {
  const json = JSON.parse(
    ffprobe(filename, "-v", "quiet", "-print_format", "json", "-show_format"),
  );

  return {
    title: String(json.format.tags.title),
    album: String(json.format.tags.album),
    artist: String(json.format.tags.artist),
    duration: Math.floor(parseFloat(json.format.duration) * 1000),
  };
}

/**
 * @param {string} filename
 * @param {string} activationBytes
 * @returns {string} Filename of
 */
function stripAudibleDRM(filename, activationBytes) {
  const noDrmFile = path.join(
    path.dirname(filename),
    path.basename(filename, ".aax") + ".m4a",
  );

  ffmpeg(
    "-activation_bytes",
    activationBytes,
    "-i",
    filename,
    "-c",
    "copy",
    noDrmFile,
  );

  return noDrmFile;
}

module.exports = {
  addCoverArt,
  extractAudioStream,
  extractChapters,
  extractCoverArt,
  findAudioFileChapters,
  getAudioFileMetadata,
  stripAudibleDRM,
};
