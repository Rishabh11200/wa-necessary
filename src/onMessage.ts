import { Message, Client } from "whatsapp-web.js";
import ytdl from "@distube/ytdl-core";
import { checkStartCMD } from "./utils";
import {
  count,
  help,
  helpMsg,
  sticker,
  sync,
  track,
  ytMiniHelp,
} from "./constants";
import { onAudio } from "./yt";
import { BlueDartTracker } from "./bluedart";

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

  if (checkStartCMD(count, msg.body)) {
    const chats = await client.getChats();
    client.sendMessage(
      msg.from,
      `Your account has ${chats.length} chats open.`
    );
  }

  if (checkStartCMD(sync, msg.body)) {
    const isSynced = await client.syncHistory(msg.from);
    // Or through the Chat object:
    // const chat = await client.getChatById(msg.from);
    // const isSynced = await chat.syncHistory();
    await msg.reply(
      isSynced ? "Historical chat is syncing..." : "Done syncronised."
    );
  }

  if (checkStartCMD(track, msg.body)) {
    const parts = msg.body.split(' ');
    const number = parts[1];
    const trackingNumbers = number;
    const captchaSolverApiUrl = "http://captcha.rishabhshah.tech/solve-captcha";
    const tracker = new BlueDartTracker(
      captchaSolverApiUrl,
      client,
      chatID.id._serialized
    );
    try {
      await tracker.trackPackage(trackingNumbers);
    } catch (error) {
      console.error("Error in track function:", error);
    }
  }
};

export default onMessage;
