const { Message, Client } = require("whatsapp-web.js");
const { checkStartCMD, removeStartCMD, checkSysMsg } = require("./utlis");
const { chat, help, helpMsg, sticker, ytMiniHelp, yt } = require("./constants");
const { openAIfunc } = require("./openai");
const ytdl = require("ytdl-core");
const { onAudio, onVideo } = require("./yt");

globalThis.ytReplied = null;
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
    let finalQuery = checkSysMsg(query.toString());
    msg.react("🤔");
    if (query.length > 0) {
      let chatGptUserID, response;
      if (msg.id.participant) {
        chatGptUserID = `${msg.id.remote}${msg.id.participant}`;
      } else {
        chatGptUserID = `${msg.id.remote}`;
      }
      if (finalQuery.systemMsg) {
        if (!finalQuery.query) {
          msg.reply("Please add query with system message to think...");
          setTimeout(() => {
            msg.react("❌");
          }, 200);
        } else {
          setTimeout(() => {
            msg.react("⏳");
          }, 2000);
          response = await openAIfunc(
            finalQuery.query,
            chatGptUserID,
            finalQuery.systemMsg
          );
        }
      } else {
        setTimeout(() => {
          msg.react("⏳");
        }, 2000);
        response = await openAIfunc(finalQuery.query, chatGptUserID);
      }
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
      setTimeout(() => {
        quotedMedia.react("✅");
      }, 200);
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
  if (ytdl.validateURL(msg.body.toString())) {
    msg.react("🔮");
    await client.sendMessage(chatID.id._serialized, ytMiniHelp).then((msg) => {
      msg.react("⏳");
      globalThis.ytReplied = msg;
    });
  }
  // after fix L.no(97) -> || msg.body.toString().toLowerCase().startsWith("video")
  if (
    msg.hasQuotedMsg &&
    msg.body.toString().toLowerCase().startsWith("audio")
  ) {
    const quotedLink = await msg.getQuotedMessage();
    const msgLow = msg.body.toString().toLowerCase();
    if (ytdl.validateURL(quotedLink.body.toString())) {
      msg.react("⏬");
      if (globalThis.ytReplied) {
        globalThis.ytReplied.react("⏬");
      }
      if (msgLow === "audio") {
        await onAudio(
          quotedLink.body.toString(),
          client,
          chatID.id._serialized,
          msg
        );
      }
      // if (msgLow === "video") {
      //   await onVideo(
      //     quotedLink.body.toString(),
      //     client,
      //     chatID.id._serialized,
      //     msg
      //   );
      // }
    }
  }
};

module.exports = {
  onMessage,
};
