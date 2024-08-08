const { Message, Client } = require("whatsapp-web.js");
const {
  checkStartCMD,
} = require("./utlis");
const {
  help,
  helpMsg,
  sticker,
  ytMiniHelp,
} = require("./constants");
const ytdl = require("@distube/ytdl-core");
const { onAudio } = require("./yt");
/**
 * @type {Message}
 */
globalThis.ytReplied = null;
/**
 * @param {Message} msg
 * @param {Client} client
 */
const onMessage = async (msg, client) => {
  let userName = msg.rawData.notifyName ?? "Whatsapp user";
  let chatID = await msg.getChat();
  if (checkStartCMD(help, msg.body)) {
    msg.react("🧐");
    msg.reply(helpMsg(userName));
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
        globalThis.ytReplied.delete(true);
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
