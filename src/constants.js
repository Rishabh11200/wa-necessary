const helpMsg = (userName) => {
  const msg =
    `_Hey ${userName}_,` +
    "\nThanks for reaching *YARRS-GPT*" +
    "\n\nFeatures:" +
    "\n\n_1._*!sticker* ```(reply to any media)```: To convert Video/GIF/Image to sticker" +
    "\n\n_2._*!yt <video url> or preferred format* (_after sending the url_): To download _youtube_ video as audio." +
    "\n  To use Youtube command: " +
    "\n    i: _!yt some.youtube.link_ " +
    "\n   ii: _!yt audio_" +
    "\n\n_3._*!help*: To get this message." +
    "\n\n```-> Note:``` You can use any one these character to command *_['!', '.', '_', '#']_*.";
  return msg;
};
const ytMiniHelp = "Reply to youtube link: *Audio*_?_👆🏻🤔💭"; // Add when fixed - / *Video*

module.exports = {
  help: ["!help", ".help", "_help", "#help"],
  sticker: ["!sticker", ".sticker", "_sticker", "#sticker"],
  yt: ["!yt", ".yt", "_yt", "#yt"],
  ytMiniHelp,
  helpMsg,
};
