const chat = ["!chat", ".chat", "_chat"];
const help = ["!help", ".help", "_help"];
const sticker = ["!sticker", ".sticker", "_sticker"];
const yt = ["!yt", ".yt", "_yt"];

function convertRegex(name, main) {
  let firstTemp;
  name.some((word) => {
    let re = new RegExp(word, "gi");
    if (re.test(main)) {
      firstTemp = main.replace(re, "");
    }
  });

  let final = firstTemp
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
  return final.trim();
}

function startCmd(arr, string) {
  let str = string.toString().toLowerCase();
  return arr.some((word) => str.startsWith(word));
}

module.exports = {
  chat: chat,
  help: help,
  sticker: sticker,
  yt: yt,
  convertRegex: convertRegex,
  startCmd: startCmd,
};
