import fs from "fs";
import request from "request";

function removeStartCMD(wordArr: string[], main: string): string {
  let firstTemp: string | undefined;
  wordArr.some((word) => {
    let re = new RegExp(word, "gi");
    if (re.test(main)) {
      firstTemp = main.replace(re, "");
      return true;
    }
    return false;
  });

  if (!firstTemp) return main;

  let final = firstTemp
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  return final;
}

function checkStartCMD(arr: string[], string: string): boolean {
  let str = string.toLowerCase();
  return arr.some((word) => str.startsWith(word));
}

const download = (
  uri: string,
  filename: string,
  callback: () => void
): void => {
  request.head(uri, async function (err, res, body) {
    if (err) throw err;
    request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
  });
};

function checkAndUnlink(path: string): void {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
}

function generateRandomSixDigitNumber(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

export {
  removeStartCMD,
  checkStartCMD,
  download,
  checkAndUnlink,
  generateRandomSixDigitNumber,
};
