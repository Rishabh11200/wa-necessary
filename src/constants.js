const helpMsg = (userName) => {
  const msg =
    `_Hey ${userName}_,` +
    "\nThanks for reaching *YARRS-GPT*" +
    "\n\nFeatures:" +
    "\n\n_1._*!chat (* _System message_ *) <your query>*: To chat with GPT-3" +
    "\n\n_2._*!img <prompt for image>*: To generate random image from prompt" +
    "\n\n_3._*!sticker* ```(reply to any media)```: To convert Video/GIF/Image to sticker" +
    "\n\n_4._*!yt <video url> or preferred format* (_after sending the url_): To download _youtube_ video as audio." +
    "\n  To use Youtube command: " +
    "\n    i: _!yt some.youtube.link_ " +
    "\n   ii: _!yt audio_" +
    "\n\n_5._*!suggest <Word>*: To get the prompt suggestion for chat gpt." +
    "\n\n_6._*!allprompts*: to get all possible prompts generation and send the name with _!suggest_ command." +
    "\n\n_7._*!help*: To get this message." +
    "\n\n```-> Note:``` You can use any one these character to command *_['!', '.', '_', '#']_*.";
  return msg;
};
const ytMiniHelp = "Reply to youtube link: *Audio*_?_👆🏻🤔💭";// Add when fixed - / *Video*

module.exports = {
  chat: ["!chat", ".chat", "_chat", "#chat"],
  help: ["!help", ".help", "_help", "#help"],
  image: [
    "!img",
    ".img",
    "_img",
    "#img",
    "!image",
    "#image",
    ".image",
    "_image",
  ],
  sticker: ["!sticker", ".sticker", "_sticker", "#sticker"],
  yt: ["!yt", ".yt", "_yt", "#yt"],
  suggest: ["!suggest", ".suggest", "_suggest", "#suggest"],
  allprompts: ["!allprompts", ".allprompts", "_allprompts", "#allprompts"],
  ytMiniHelp,
  helpMsg,
};
