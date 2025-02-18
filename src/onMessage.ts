import { Message, Client } from "whatsapp-web.js";
import { checkStartCMD } from "@/utils";
import { help, helpMsg, sticker, ytMiniHelp } from "@/constants";
import ytdl from "@distube/ytdl-core";
import { onAudio } from "@/yt";

declare global {
  var ytReplied: Message | null;
}
globalThis.ytReplied = null;

const onMessage = async (msg: Message, client: Client) => {
  let userName: string = (msg.rawData as any)?.notifyName ?? "Whatsapp user";
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
    await client
      .sendMessage(chatID.id._serialized, ytMiniHelp)
      .then((sentMsg) => {
        sentMsg.react("⏳");
        globalThis.ytReplied = sentMsg;
      });
  }

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
    }
  }
};

export default onMessage;
