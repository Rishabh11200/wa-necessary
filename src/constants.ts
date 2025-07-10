export const helpMsg = (userName: string): string => {
  const msg =
    `_Hey ${userName}_,` +
    "\nThanks for reaching *YARRS-BOT*" +
    "\n\nFeatures:" +
    "\n\n_1._ *!sticker* ```(reply to any media)```: To convert Video/GIF/Image to sticker" +
    "\n\n_2._ *!yt <video url> or preferred format* (_after sending the url_): To download _youtube_ video as audio." +
    "\n  To use Youtube command: " +
    "\n    i: _!yt some.youtube.link_ " +
    "\n   ii: _!yt audio_" +
    "\n\n_3._ *!help*: To get this message." +
    "\n\n_4._ *!count*: To get the number of chats in own whatsapp!" +
    "\n\n_5._ *!sync*: To get the stats of sync the particular chat." +
    "\n\n_6._ *!track <number>*: To get the status of bluedart tracking." +
    "\n\n_7._ *!subgoogle*: To track a Google Posts updated by Yugali." +
    "\n\n_8._ *!unsubgoogle*: To unsubscribe from the updates." +
    "\n\n_9._ *!listgsubs*: To list all subscribed people (‼️Admin only)." +
    "\n\n_10._ *!unsubg <number>*: To unsubscribe the people from a Google updates (‼️Admin only)." +
    "\n\n```-> Note:``` You can use any one these character to command *['!', '.', '_', '#']*.";
  return msg;
};

export const ytMiniHelp: string = "Reply to youtube link: *Audio*_?_👆🏻🤔💭"; // Add when fixed - / *Video*

export const help = ["!help", ".help", "_help", "#help"];
export const sticker = ["!sticker", ".sticker", "_sticker", "#sticker"];
export const count = ["!count", ".count", "_count", "#count"];
export const sync = ["!sync", ".sync", "_sync", "#sync"];
export const track = ["!track", ".track", "_track", "#track"];
export const subgoogle = [
  "!subgoogle",
  ".subgoogle",
  "_subgoogle",
  "#subgoogle",
];
export const unsubgoogle = [
  "!unsubgoogle",
  ".unsubgoogle",
  "_unsubgoogle",
  "#unsubgoogle",
];
export const listgsubs = [
  "!listgsubs",
  ".listgsubs",
  "_listgsubs",
  "#listgsubs",
];
export const unsubg = ["!unsubg", ".unsubg", "_unsubg", "#unsubg"];
