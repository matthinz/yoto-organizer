// @ts-check

const { exec } = require("./exec");

const MAX_TRIES = 2;

/**
 * @param {string} filename
 * @param {string[]} candidates
 * @returns {string}
 */
function disambiguateBookTitle(filename, candidates) {
  const MAX_TRIES = 2;

  const prompt = `
    I am trying to organize my digital audiobook collection.
    I have a file and I'm trying to figure out the title of the book it is for.
    The file may contain the whole book or it may be a single chapter.
    I also have some candidate titles.
    Please consider the filename and candidate titles and give me back what
    you think is the title of the book in question.

    Some considerations:

    - Some titles include an exhortation about the book's place in the
      marketplace (like "over 7 million copies sold"). Remove those exhortations.

    Do not include ANYTHING else in your response. ONLY the title of the book.

    Filename: ${filename}
    Candidates:
    ${candidates.map((c) => `  - ${c}`).join("\n")}
  `;

  const responses = [];

  for (let i = 0; i < MAX_TRIES; i++) {
    const title = exec("llm", ["--model", "gpt4", prompt]).trim();
    responses.push(title);
    const ok = !title.includes("\n");
    if (ok) {
      return title;
    }
  }

  console.error(responses);

  throw new Error("Could not disambiguate title");
}

/**
 *
 * @param {string} title
 * @returns {string}
 */
function shortenBookTitle(title) {
  const prompt = `
Shorten the following book title to a concise format under 40 characters.
Retain key elements like the main title, important descriptors, and
series/book number (if provided). Use clear wording, and feel free to simplify
or abbreviate where necessary, while keeping the meaning intact. For example,
you can use dashes or parentheses to organize elements.

Respond only with the edited title, no additional words.

The title is: '${title}'
`.trim();

  return exec("llm", ["--model", "gpt4", prompt]).trim();
}

module.exports = {
  disambiguateBookTitle,
  shortenBookTitle,
};
