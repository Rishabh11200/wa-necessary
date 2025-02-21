import fs from "fs";
import qrcode from "qrcode-terminal";
import { Client, LocalAuth, Message } from "whatsapp-web.js";
import dotenv from "dotenv";
import os from 'os';
import onMessage from "./onMessage";

dotenv.config();

process.on("uncaughtException", async (reason) => console.log(reason));
process.on("unhandledRejection", async (reason) => console.log(reason));

let clientExecutablePath: string;

switch (process.platform) {
  case "win32":
    clientExecutablePath =
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    break;
  case "darwin":
    clientExecutablePath =
      "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
    break;
  default:
    clientExecutablePath = os.release().includes("kali")
      ? "/usr/bin/google-chrome-stable"
      : "/usr/bin/chromium-browser";
}

const client = new Client({
  authStrategy: new LocalAuth({ clientId: "client-one" }),
  puppeteer: {
    headless: true,
    executablePath: clientExecutablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.initialize();

if (!fs.existsSync("./.wwebjs_cache")) {
  client.on("qr", (qr: string) => {
    qrcode.generate(qr, { small: true });
  });
}

client.on("authenticated", (session) => {
  console.log("AUTHENTICATED", session);
});

client.on("ready", () => {
  console.log("Ready");
});

client.on("message_create", async (msg: Message) => {
  await onMessage(msg, client);
});

client.on("call", async (call) => {
  setTimeout(async () => {
    try {
      await call.reject();
      const contact = await client.getContactById(call.from as string);
      const contactName = contact.pushname || "Whatsapp user";
      await client.sendMessage(
        call.from as string,
        `[${
          call.fromMe ? " _Outgoing_ " : " _Incoming_ "
        }] Phone call from *${contactName}*, type ${
          call.isGroup ? "group" : ""
        } ${
          call.isVideo ? "video" : "audio"
        } call. ${"Let me get back to you as soon as possible. \n\n Send your message directly here if you can."}`
      );
    } catch (error) {
      console.error("Error fetching contact details:", error);
    }
  }, 10000);
});

client.on("disconnected", (reason) => {
  console.log("Disconnected", reason);
  fs.rmSync("./.wwebjs_cache/", { recursive: true, force: true });
});
