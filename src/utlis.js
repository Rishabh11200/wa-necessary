const fs = require("fs");
const request = require("request");

function removeStartCMD(wordArr, main) {
  let firstTemp;
  wordArr.some((word) => {
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
  return final.trim().toString();
}

function checkStartCMD(arr, string) {
  let str = string.toString().toLowerCase();
  return arr.some((word) => str.startsWith(word));
}

var download = function (uri, filename, callback) {
  request.head(uri, async function (err, res, body) {
    request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
  });
};

function checkAndUnlink(path) {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
}

function generateRandomSixDigitNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}

module.exports = {
  removeStartCMD,
  checkStartCMD,
  download,
  checkAndUnlink,
  generateRandomSixDigitNumber,
};
