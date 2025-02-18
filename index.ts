import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import qrcode from "qrcode-terminal";
import onMessage from './src/onMessage';
import { Client, LocalAuth, Message } from "whatsapp-web.js";

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
    clientExecutablePath = "/usr/bin/google-chrome-stable";
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

client.on("disconnected", (reason) => {
  console.log("Disconnected", reason);
  fs.rmSync("./.wwebjs_cache/", { recursive: true, force: true });
});
