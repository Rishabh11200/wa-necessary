require("dotenv").config();
const fs = require("fs");
const qrcode = require("qrcode-terminal");
const onMessage = require("./src/onMessage");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "client-one",
  }),
  puppeteer: {
    headless: false,
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
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

client.on("message_create", async (msg) => {
  onMessage.onMessage(msg, client);
});

client.on("disconnected", (reason) => {
  console.log("Disconnected", reason);
  fs.rm("./.wwebjs_auth/", { recursive: true, force: true });
});
