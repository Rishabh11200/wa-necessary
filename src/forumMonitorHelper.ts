import WAWebJS, { Client, Message } from "whatsapp-web.js";
import { runIndefinitely } from "./forumMonitorIndex";

// Accepts either a WhatsApp client and chatId (legacy) or a custom sender object
type ForumMonitorSender = Client | { send: (msg: string) => void };
// Store chat IDs and numbers of users who requested forum tracking
interface ForumSubscriber {
  chatID: string;
  number: string;
}
const forumMonitorSubscribers = new Map<string, ForumSubscriber>();

/**
 * Helper to run the forum monitor and send WhatsApp message when new posts are detected.
 * @param client WhatsApp client
 * @param chatId WhatsApp chat ID to send messages to
 * @param intervalMs Interval in ms to check for new posts
 */
export const startForumMonitorAndNotify = async (
  sender: ForumMonitorSender,
  chatIdOrInterval: string | number = 60000,
  sendLatestPost: boolean,
  intervalMs?: number
) => {
  // Patch: Wrap logNewPosts to send WhatsApp messages
  const { logNewPosts, extractPosts } = await import("./forumMonitorIndex");
  const originalLogNewPosts = logNewPosts;

  let sendFn: (msg: string) => void;
  let interval: number = 7200000; // 2 hours in milliseconds

  if (
    typeof chatIdOrInterval === "string" &&
    sender &&
    "sendMessage" in sender
  ) {
    // Legacy: (client, chatId, intervalMs)
    const client = sender as Client;
    const chatId = chatIdOrInterval;
    sendFn = (msg) => client.sendMessage(chatId, msg);
    interval = intervalMs ?? 7200000;
  } else if (typeof sender === "object" && "send" in sender) {
    // New: (senderObj, intervalMs)
    sendFn = sender.send;
    interval =
      typeof chatIdOrInterval === "number" ? chatIdOrInterval : 7200000;
  } else {
    throw new Error("Invalid arguments to startForumMonitorAndNotify");
  }

  (global as any).logNewPosts = (posts: any[]) => {
    originalLogNewPosts(posts);
    posts.forEach((post, idx) => {
      const msg = `*New Forum Post Detected!*\n\n*Title:* ${post.title}\n*Author:* ${post.author}\n*Time:* ${post.timestamp}\n*Link:* ${post.link}`;
      sendFn(msg);
    });
  };

  // Send latest post if requested (for first-time subscribers)
  if (sendLatestPost) {
    try {
      const { initializeBrowser, createMonitorState } = await import(
        "./forumMonitorIndex"
      );
      const state = createMonitorState();
      const driver = await initializeBrowser(state);

      await driver.get(state.baseUrl);
      await driver.wait(
        require("selenium-webdriver").until.elementLocated(
          require("selenium-webdriver").By.className("lia-message-view-wrapper")
        ),
        10000
      );

      const posts = await extractPosts(driver);
      await driver.quit();

      if (posts.length > 0) {
        const latestPost = [posts[0]]; // Pass as array to the patched logNewPosts
        (global as any).logNewPosts(latestPost); // Call the patched version
      }
    } catch (error) {
      console.error("Error sending latest post:", error);
    }
  }

  // Start the monitor (runIndefinitely will use the patched logNewPosts)
  await runIndefinitely(interval);
};

export const trackGoogleHelper = async (
  chatID: string,
  number: string,
  msg: Message,
  client: Client
) => {
  if (forumMonitorSubscribers.has(chatID)) {
    msg.react("⚠️");
    await msg.reply("You are already subscribed to Google forum post alerts.");
    return;
  }
  const cleanNumber = number.includes("@") ? number.split("@")[0] : number;
  forumMonitorSubscribers.set(chatID, { chatID, number: cleanNumber });
  msg.react("🛰️");
  await msg.reply(
    "You are now subscribed to Google forum post alerts. You'll receive new post notifications here."
  );

  // Start the monitor only if this is the first subscriber
  if (forumMonitorSubscribers.size === 1) {
    await startForumMonitorAndNotify(client, chatID, true, 7200000);
  }
  return;
};

export const unsubscribeGoogleHelper = async (chatID: string, msg: Message) => {
  if (!forumMonitorSubscribers.has(chatID)) {
    msg.react("⚠️");
    await msg.reply(
      "You are not currently subscribed to Google forum post alerts."
    );
    return;
  }
  forumMonitorSubscribers.delete(chatID);
  msg.react("✅");
  await msg.reply("You have been unsubscribed from Google forum post alerts.");
  return;
};

export const listGoogleSubsHelper = async (msg: Message) => {
  if (msg.fromMe || msg.from === "918849048015@c.us") {
    if (forumMonitorSubscribers.size === 0) {
      await msg.reply(
        "No users are currently subscribed to Google forum post alerts."
      );
    } else {
      let list = Array.from(forumMonitorSubscribers.values())
        .map((sub, idx) => `- ${idx + 1} user - ${sub.number}`)
        .join("\n");
      await msg.reply(`*Google Forum Subscribers:*\n${list}`);
    }
  } else {
    await msg.reply("Only the bot admin can use this command.");
  }
  return;
};

export const unSubsNumHelper = async (msg: Message) => {
  const numberToRemove = msg.body.trim().split(" ")[1];
  if (msg.fromMe || msg.from === "918849048015@c.us") {
    if (!numberToRemove) {
      await msg.reply(
        "Please provide a number to unsubscribe. Usage: !unsubgooglenum <number>"
      );
      return;
    }
    if (!/^\d{10}$/.test(numberToRemove)) {
      await msg.reply(
        "Please provide a valid 10-digit number containing only digits."
      );
      return;
    }
    let found = false;
    for (const [chatId, sub] of forumMonitorSubscribers.entries()) {
      if (sub.number === `91${numberToRemove}`) {
        forumMonitorSubscribers.delete(chatId);
        found = true;
      }
    }
    if (found) {
      await msg.reply(
        `Unsubscribed ${numberToRemove} from Google forum post alerts.`
      );
    } else {
      await msg.reply(`Number ${numberToRemove} is not subscribed.`);
    }
  } else {
    await msg.reply("Only the bot admin can use this command.");
  }
  return;
};
