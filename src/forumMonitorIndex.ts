import { Builder, By, WebDriver, until, WebElement } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

interface PostData {
  title: string;
  author: string;
  timestamp: string;
  link: string;
}

interface MonitorState {
  driver: WebDriver | null;
  knownPosts: Set<string>;
  isRunning: boolean;
  checkInterval: number;
  baseUrl: string;
}

// Create initial state
const createMonitorState = (checkIntervalMs: number = 60000): MonitorState => ({
  driver: null,
  knownPosts: new Set<string>(),
  isRunning: false,
  checkInterval: checkIntervalMs,
  baseUrl:
    "https://www.googlecloudcommunity.com/gc/user/viewprofilepage/user-id/279786",
});

// Initialize browser driver
const initializeBrowser = async (state: MonitorState): Promise<WebDriver> => {
  // console.log("🚀 Initializing Forum Post Monitor with Browser...");

  const options: chrome.Options = new chrome.Options();
  // Set browser binary path
  options.setChromeBinaryPath(globalThis.clientExecutablePath);

  options.addArguments("--headless"); // Run in headless mode
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--disable-gpu");
  options.addArguments("--window-size=1920,1080");
  options.addArguments("--disable-blink-features=AutomationControlled");
  options.addArguments("--disable-extensions");
  options.addArguments(
    "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  const driver: WebDriver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  state.driver = driver;
  // console.log("✅ Browser initialized successfully");
  return driver;
};

// Make URL absolute
const makeAbsoluteUrl = (url: string): string => {
  if (url.startsWith("http")) {
    return url;
  }
  return `https://www.cloudskillsboost.google${url}`;
};

// Generate unique post ID
const generatePostId = (post: PostData): string => {
  return `${post.title}_${post.author}_${post.timestamp}`;
};

// Format timestamp to 'dd-mm-yyyy hh:mm AM/PM Day'
const formatTimestamp = (raw: string): string => {
  raw = raw.replace(/^(\d{2}-\d{2}-\d{4} \d{2}:\d{2} [AP]M) \1$/, "$1");
  // Convert to "2025-09-07T05:59:00" for Date parsing
  const match = raw.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}) (AM|PM)/);
  let date: Date;
  if (match) {
    const [, day, month, year, hour, minute, ampm] = match;
    let h = parseInt(hour, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    // JS months are 0-based
    date = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      h,
      parseInt(minute, 10)
    );
  } else {
    date = new Date(raw);
  }
  if (isNaN(date.getTime())) return raw; // fallback if invalid

  const pad = (n: number) => n.toString().padStart(2, "0");
  const dayStr = pad(date.getDate());
  const monthStr = pad(date.getMonth() + 1);
  const yearStr = date.getFullYear();

  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const hourStr = pad(hours);

  const weekday = date.toLocaleString("en-US", { weekday: "long" });

  return `${dayStr}-${monthStr}-${yearStr} ${hourStr}:${minutes} ${ampm} ${weekday}`;
};

// Extract post data from element
const extractPostData = async (
  postElement: WebElement,
  driver: WebDriver
): Promise<PostData | null> => {
  try {
    // Extract title and link
    const titleElement: WebElement = await postElement.findElement(
      By.css(".message-subject a")
    );
    const title: string = await titleElement.getText();
    const link: string = await titleElement.getAttribute("href");

    // Extract author
    const authorElement: WebElement[] = await postElement.findElements(
      By.css("footer strong a")
    );
    const author: string = await driver.executeScript(
      "return arguments[0].textContent.trim();",
      authorElement[0]
    );

    // Extract timestamp
    const timestampElement: WebElement = await postElement.findElement(
      By.css(".local-friendly-date")
    );
    const timestampTitle: string | null = await timestampElement.getAttribute(
      "title"
    );
    const timestampText: string = await timestampElement.getText();
    const timestamp: string =
      timestampTitle && timestampTitle.trim() !== ""
        ? formatTimestamp(timestampTitle)
        : formatTimestamp(timestampText);

    return {
      title: title.trim(),
      author: author.trim(),
      timestamp: timestamp.trim(),
      link: makeAbsoluteUrl(link),
    };
  } catch (error) {
    console.error("⚠️ Error extracting post data:", error);
    return null;
  }
};

// Extract all posts from current page
export const extractPosts = async (driver: WebDriver): Promise<PostData[]> => {
  const posts: PostData[] = [];

  try {
    // Wait for posts to load
    await driver.wait(
      until.elementsLocated(By.className("lia-message-view-wrapper")),
      10000
    );

    const postElements: WebElement[] = await driver.findElements(
      By.className("lia-message-view-wrapper")
    );

    for (const postElement of postElements) {
      try {
        const postData: PostData | null = await extractPostData(
          postElement,
          driver
        );
        if (postData) {
          posts.push(postData);
        }
      } catch (error) {
        console.error("⚠️ Error extracting individual post:", error);
      }
    }
  } catch (error) {
    console.error("❌ Error extracting posts:", error);
  }

  return posts;
};

// Log new posts to console
export const logNewPosts = (posts: PostData[]): void => {};

// Check for new posts
const checkForNewPosts = async (state: MonitorState): Promise<void> => {
  // console.log("🔍 Checking for new posts...");

  if (!state.driver) {
    console.error("❌ Driver not initialized");
    return;
  }

  try {
    await state.driver.navigate().refresh();
    await state.driver.wait(
      until.elementLocated(By.className("lia-message-view-wrapper")),
      10000
    );

    const currentPosts: PostData[] = await extractPosts(state.driver);
    const newPosts: PostData[] = [];

    for (const post of currentPosts) {
      const postId: string = generatePostId(post);
      if (!state.knownPosts.has(postId)) {
        newPosts.push(post);
        state.knownPosts.add(postId);
      }
    }
  } catch (error) {
    console.error("❌ Error checking for new posts:", error);
  }
};

// Start monitoring
const startMonitoring = async (
  state: MonitorState
): Promise<NodeJS.Timeout | null> => {
  if (state.isRunning) {
    console.log("⚠️ Monitor is already running");
    return null;
  }

  state.isRunning = true;
  console.log(
    `🎯 Starting forum monitoring (checking every ${state.checkInterval} seconds)...`
  );

  // Start monitoring loop
  const monitorLoop: NodeJS.Timeout = setInterval(async () => {
    if (!state.isRunning) {
      clearInterval(monitorLoop);
      return;
    }

    await checkForNewPosts(state);
  }, state.checkInterval);

  console.log("✅ Forum monitoring started successfully!");
  return monitorLoop;
};

// Stop monitoring
const stopMonitoring = (
  state: MonitorState,
  monitorLoop: NodeJS.Timeout | null
): void => {
  state.isRunning = false;
  if (monitorLoop) {
    clearInterval(monitorLoop);
  }
  console.log("🛑 Stopping forum monitoring...");
};

// Cleanup resources
const cleanup = async (state: MonitorState): Promise<void> => {
  console.log("🧹 Cleaning up resources...");

  if (state.driver) {
    await state.driver.quit();
    state.driver = null;
  }

  console.log("✅ Cleanup completed");
};

// Run monitoring for a specific duration
const runForDuration = async (
  durationMinutes: number,
  checkIntervalMs: number = 60000
): Promise<void> => {
  console.log(`⏱️ Running monitor for ${durationMinutes} minutes...`);

  const state: MonitorState = createMonitorState(checkIntervalMs);

  try {
    await initializeBrowser(state);
    const monitorLoop: NodeJS.Timeout | null = await startMonitoring(state);

    const timeout: NodeJS.Timeout = setTimeout(async () => {
      stopMonitoring(state, monitorLoop);
      await cleanup(state);
      console.log("✅ Monitoring session completed");
      process.exit(0);
    }, durationMinutes * 60 * 1000);

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Received interrupt signal, shutting down...");
      clearTimeout(timeout);
      stopMonitoring(state, monitorLoop);
      await cleanup(state);
      process.exit(0);
    });
  } catch (error) {
    console.error("💥 Fatal error:", error);
    await cleanup(state);
    process.exit(1);
  }
};

// Run monitoring indefinitely
const runIndefinitely = async (
  checkIntervalMs: number = 60000
): Promise<void> => {
  // console.log("🚀 Running monitor indefinitely...");
  const state: MonitorState = createMonitorState(checkIntervalMs);

  try {
    await initializeBrowser(state);
    const monitorLoop: NodeJS.Timeout | null = await startMonitoring(state);

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Received interrupt signal, shutting down...");
      stopMonitoring(state, monitorLoop);
      await cleanup(state);
      process.exit(0);
    });

    // Keep process alive
    process.on("exit", async () => {
      await cleanup(state);
    });
  } catch (error) {
    console.error("💥 Fatal error:", error);
    await cleanup(state);
    process.exit(1);
  }
};

// Export functions for use in other modules
export {
  createMonitorState,
  initializeBrowser,
  checkForNewPosts,
  startMonitoring,
  stopMonitoring,
  cleanup,
  runForDuration,
  runIndefinitely,
  type PostData,
  type MonitorState,
};
