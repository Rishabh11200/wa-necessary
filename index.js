require("dotenv").config();
const fs = require("fs");
const qrcode = require("qrcode-terminal");
const { onMessage } = require("./src/onMessage");
const { Client, LocalAuth, Message } = require("whatsapp-web.js");

process.on("uncaughtException", async (reason) => console.log(reason));
process.on("unhandledRejection", async (reason) => console.log(reason));

let clientExecutablePath;

if (process.platform === "win32") {
  clientExecutablePath =
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
} else if (process.platform === "darwin") {
  clientExecutablePath =
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
} else {
  clientExecutablePath = "/usr/bin/google-chrome-stable";
}
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "client-one",
  }),
  puppeteer: {
    headless: false,
    executablePath: clientExecutablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.initialize();

if (!fs.existsSync("./.wwebjs_auth/")) {
  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
  });
}

client.on("authenticated", (session) => {
  console.log("AUTHENTICATED", session);
});

client.on("ready", () => {
  console.log("Ready");
});
/**
 * @param {Message} msg
 */
client.on("message_create", async (msg) => {
  onMessage(msg, client);
});

client.on("disconnected", async (reason) => {
  console.log("Disconnected", reason);
  await fs.rm("./.wwebjs_auth/", { recursive: true, force: true });
});
