const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPEN_API_KEY,
});
const openaiConfigs = new OpenAIApi(configuration);

let allChats = {};
const openAIfunc = async (query, singleChatID, sysMsg = null) => {
  let SYS =
    sysMsg ?? "You are ChatGPT, a large language model trained by OpenAI";
  if (allChats[`${singleChatID}`]) {
    if (sysMsg !== null) {
      allChats[`${singleChatID}`].push(
        { role: "system", content: SYS },
        { role: "user", content: query }
      );
    } else {
      allChats[`${singleChatID}`].push({ role: "user", content: query });
    }
  } else {
    allChats[`${singleChatID}`] = [];
    allChats[`${singleChatID}`].push(
      { role: "system", content: SYS },
      { role: "user", content: query },
      { timestamp: new Date().getTime() }
    );
  }
  let toPassInOpenAI = {};

  for (const [key, arr] of Object.entries(allChats)) {
    const filteredArr = arr.filter((item) => !item.hasOwnProperty("timestamp"));
    toPassInOpenAI[key] = filteredArr;
  }

  const completion = await openaiConfigs.createChatCompletion({
    model: "gpt-3.5-turbo",
    max_tokens: 1500,
    messages: [...toPassInOpenAI[`${singleChatID}`]],
  });
  let response = completion.data.choices[0].message;
  allChats[`${singleChatID}`].push(completion.data.choices[0].message);
  return `${response.content} \n\n_Thanks for using *YARRS-GPT*_`;
};

function deleteExpiredObjects() {
  let now = new Date().getTime();
  for (let key in allChats) {
    if (allChats.hasOwnProperty(key)) {
      let arr = allChats[key];
      let shouldDeleteKey = arr.some((elem) => {
        if (elem.timestamp && now - elem.timestamp > 3600000) {
          // 1 hour
          return true;
        }
        return false;
      });
      if (shouldDeleteKey) {
        delete allChats[key];
      }
    }
  }
  return allChats;
}

module.exports = { openAIfunc, deleteExpiredObjects };
