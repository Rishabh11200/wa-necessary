const { Message, Client } = require("whatsapp-web.js");
const {
  checkStartCMD,
  removeStartCMD,
  toGetSysMsgIfThere,
} = require("./utlis");
const { chat, help, helpMsg, sticker } = require("./constants");
const { openAIfunc } = require("./openai");

let repliedArr = {};
/**
 * @param {Message} msg
 * @param {Client} client
 */
const onMessage = async (msg, client) => {
  let userName = msg.rawData.notifyName ?? "Whatsapp user";
  let chatID = await msg.getChat();
  if (checkStartCMD(help, msg.body)) {
    msg.react("📒");
    msg.reply(helpMsg(userName));
  }
  if (checkStartCMD(chat, msg.body)) {
    let query = removeStartCMD(chat, msg.body.toString().toLowerCase());
    msg.react("🤔");
    if (query.length > 0) {
      setTimeout(() => {
        msg.react("⏳");
      }, 500);
      let chatGptUserID;
      if (msg.id.participant) {
        chatGptUserID = `${msg.id.remote}${msg.id.participant}`;
      } else {
        chatGptUserID = `${msg.id.remote}`;
      }
      let response = await openAIfunc(query, chatGptUserID);
      await client.sendMessage(chatID.id._serialized, response);
      setTimeout(() => {
        msg.react("✅");
      }, 200);
    } else {
      msg.reply("Please add prompt to think...");
      setTimeout(() => {
        msg.react("❌");
      }, 200);
    }
  }
  if (msg.hasQuotedMsg && checkStartCMD(sticker, msg.body)) {
    let quotedMedia = await msg.getQuotedMessage();
    quotedMedia.react("⏳");
    if (quotedMedia.hasMedia) {
      let media = await quotedMedia.downloadMedia();
      await client.sendMessage(chatID.id._serialized, media, {
        sendMediaAsSticker: true,
      });
      msg.react("✅");
    } else {
      setTimeout(() => {
        msg.react("❌");
        msg.reply("Please reply to any media(Image/Video/Audio)");
      }, 200);
    }
  }
  if (!msg.hasQuotedMsg && checkStartCMD(sticker, msg.body)) {
    msg.react("❌");
    msg.reply("Please reply to any media(Image/Video/Audio)");
  }
};

module.exports = {
  onMessage,
};
