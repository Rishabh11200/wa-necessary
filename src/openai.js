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
    allChats[`${singleChatID}`].push({ role: "user", content: query });
  } else {
    allChats[`${singleChatID}`] = [];
    allChats[`${singleChatID}`].push({ role: "user", content: query });
  }
  const completion = await openaiConfigs.createChatCompletion({
    model: "gpt-3.5-turbo",
    max_tokens: 1500,
    messages: [{ role: "system", content: SYS }, ...allChats[singleChatID]],
  });
  let response = completion.data.choices[0].message;
  allChats[`${singleChatID}`].push(completion.data.choices[0].message);
  return `${response.content} \n\n_Thanks for using *YARRS-GPT*_`;
};

module.exports = { openAIfunc };
