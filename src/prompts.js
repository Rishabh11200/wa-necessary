const parser = require("csv");
const fs = require("fs");
const Fuse = require("fuse.js");

const readResult = (searchText, isAll = false) =>
  new Promise((resolve, reject) => {
    let headerRow = null,
      resultString,
      actsArray = [];
    const combinedRows = [],
      simplifiedRows = [];
    const options = {
      ignoreLocation: true,
      keys: ["act"],
      threshold: 0.2,
      shouldSort: true,
    };
    fs.createReadStream("./bard_prompts_english.csv")
      .pipe(parser.parse({ delimiter: ",", skip_empty_lines: true }))
      .on("data", function (row) {
        if (!headerRow) {
          headerRow = row;
        } else {
          const combinedRow = headerRow.map((value, index) => [
            value,
            row[index],
          ]);
          combinedRows.push(combinedRow);
        }
      })
      .on("end", function () {
        for (const row of combinedRows) {
          const simplifiedRow = {};
          for (const [key, value] of row) {
            simplifiedRow[key] = value;
          }
          simplifiedRows.push(simplifiedRow);
        }
        if (isAll) {
          actsArray = simplifiedRows.map((item) => item.act);
          let allActs = actsArray
            .map((singleResult, index) => `${index + 1}. ${singleResult}`)
            .join(",\n");
          resolve(
            `${allActs}. \n\nYou can use this with *!suggest <Word>* from above words.`
          );
        } else {
          const fuse = new Fuse(simplifiedRows, options);
          const searchAct = searchText.toString();
          const result = fuse.search(searchAct);
          let output = result.map(
            (singleResult, index) =>
              `\n${index + 1}. *${singleResult.item.act}*: ${
                singleResult.item.prompt
              }`
          );
          resultString = output.join(",\n");
          if (result.length > 0) {
            resolve(
              `${resultString} \n\nYou can use this for sending the prompt by *!chat* _Thanks for using..._`
            );
          } else {
            resolve(`❌ Try checking all the acts by using *!allprompts*...`);
          }
        }
      });
  });

const callPrompts = async (searchText) => {
  let all = await readResult(searchText);
  return all;
};

const allActs = async () => {
  let allString = await readResult("", isAll = true);
  return allString;
};

module.exports = { callPrompts, allActs };
