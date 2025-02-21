export const helpMsg = (userName: string): string => {
  const msg =
    `_Hey ${userName}_,` +
    "\nThanks for reaching *YARRS-BOT*" +
    "\n\nFeatures:" +
    "\n\n_1._*!sticker* ```(reply to any media)```: To convert Video/GIF/Image to sticker" +
    "\n\n_2._*!yt <video url> or preferred format* (_after sending the url_): To download _youtube_ video as audio." +
    "\n  To use Youtube command: " +
    "\n    i: _!yt some.youtube.link_ " +
    "\n   ii: _!yt audio_" +
    "\n\n_3._*!help*: To get this message." +
    "\n\n_4._*!count*: To get the number of chats in own whatsapp!" +
    "\n\n_5._*!sync*: To get the stats of sync the particular chat." +
    "\n\n```-> Note:``` You can use any one these character to command *['!', '.', '_', '#']*.";
  return msg;
};

export const ytMiniHelp: string = "Reply to youtube link: *Audio*_?_👆🏻🤔💭"; // Add when fixed - / *Video*

export const help = ["!help", ".help", "_help", "#help"];
export const sticker = ["!sticker", ".sticker", "_sticker", "#sticker"];
export const count = ["!count", ".count", "_count", "#count"];
export const sync = ["!sync", ".sync", "_sync", "#sync"];
