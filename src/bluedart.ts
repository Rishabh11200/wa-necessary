import { Builder, By, until, WebDriver } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome.js";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import FormData from "form-data";
import { Client, Message } from "whatsapp-web.js";

// Set up Chrome options
const browserOptions = new Options().setChromeBinaryPath(globalThis.clientExecutablePath);
browserOptions.addArguments("--headless");

let msg: Message;

/**
 * BlueDart Tracking Script
 * This script automates tracking of parcels on the BlueDart website
 */
class BlueDartTracker {
  private driver!: WebDriver;
  private captchaSolverApiUrl: string;
  private client: Client;
  private toChat: string;

  /**
   * Initialize the BlueDart tracker
   * @param captchaSolverApiUrl URL for the captcha solving API
   */
  constructor(captchaSolverApiUrl: string, client: Client, toChat: string) {
    this.captchaSolverApiUrl = captchaSolverApiUrl;
    this.client = client;
    this.toChat = toChat;
  }

  async sendMsg(message: string): Promise<void> {
    try {
      msg = await this.client.sendMessage(this.toChat, message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  /**
   * Initialize the WebDriver
   */
  async initDriver(): Promise<void> {
    // Create the WebDriver instance
    this.driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(browserOptions)
      .build();
  }

  /**
   * Navigate to the BlueDart tracking page
   */
  async navigateToTrackingPage(): Promise<void> {
    await this.driver.get("https://www.bluedart.com");
    // Wait for the page to load completely
    await this.driver.wait(
      until.elementLocated(By.id("trackingNoTrackDart")),
      10000
    );
  }

  /**
   * Enter tracking number(s) in the tracking field
   * @param trackingNumbers Tracking number or comma-separated list of tracking numbers
   */
  async enterTrackingNumbers(trackingNumbers: string): Promise<void> {
    const trackingField = await this.driver.findElement(
      By.id("trackingNoTrackDart")
    );
    await trackingField.clear();
    await trackingField.sendKeys(trackingNumbers);
  }

  /**
   * Select tracking type (Waybill or Reference Number)
   * @param useReferenceNumber true to use reference number, false to use waybill (default)
   */
  async selectTrackingType(useReferenceNumber: boolean = false): Promise<void> {
    const selector = useReferenceNumber
      ? "input[name='radioBtnTrackDart'][value='1']"
      : "input[name='radioBtnTrackDart'][value='0']";

    const radioButton = await this.driver.findElement(By.css(selector));
    await radioButton.click();
  }

  /**
   * Get the captcha image and solve it using the API
   * @returns The solved captcha text
   */
  async solveCaptcha(): Promise<string> {
    // Find the captcha image
    const captchaImg = await this.driver.findElement(
      By.id("user_regCaptchaImg")
    );

    // Take screenshot of the element (returns base64)
    const captchaBase64 = await captchaImg.takeScreenshot();

    // You can save it as a file if needed
    // Create temporary file path
    const fileName = `captcha-${Date.now()}.png`;
    fs.writeFileSync(`./${fileName}`, captchaBase64, "base64");
    const tempFilePath = path.join("./", fileName);
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append("file", fs.createReadStream(tempFilePath));

      // Call the API to solve the captcha with the image file
      const response = await axios.post(this.captchaSolverApiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      if (response.data && response.data.captcha_text) {
        await msg.edit("Now Solved the captcha, sending the result...⌛️");
        return response.data.captcha_text;
      } else {
        throw new Error("Failed to solve captcha: Invalid response format");
      }
    } catch (error) {
      console.error("Error solving captcha:", error);
      throw new Error("Failed to solve captcha");
    } finally {
      // Clean up: Delete the temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  /**
   * Enter the solved captcha into the input field
   * @param captchaText The solved captcha text
   */
  async enterCaptcha(captchaText: string): Promise<void> {
    const captchaInput = await this.driver.findElement(
      By.id("UserCaptchaCode")
    );
    await captchaInput.clear();
    await captchaInput.sendKeys(captchaText);
  }

  /**
   * Verify if captcha was correct
   * @returns Boolean indicating if captcha error message is displayed
   */
  private async isCaptchaError(): Promise<boolean> {
    try {
      const errorElement = await this.driver.findElement(
        By.id("WrongCaptchaError")
      );
      const errorStyle = await errorElement.getAttribute("style");
      const errorText = await errorElement.getText();

      // Check if error message is displayed and contains error text
      return (
        errorStyle.includes("display: inline") &&
        errorText.includes("Invalid Captcha")
      );
    } catch (error) {
      // If element is not found or other error, assume no captcha error
      return false;
    }
  }

  /**
   * Click the refresh captcha button
   */
  private async refreshCaptcha(): Promise<void> {
    const refreshButton = await this.driver.findElement(
      By.id("refreshCaptcha")
    );
    await refreshButton.click();

    // Wait a bit for the new captcha to load
    await this.driver.sleep(10000);
  }

  /**
   * Submit the tracking form
   */
  async submitForm(): Promise<void> {
    // Maximum number of retries
    const maxRetries = 10;
    let retryCount = 0;
    let captchaSuccess = false;

    while (!captchaSuccess && retryCount < maxRetries) {
      const submitButton = await this.driver.findElement(
        By.id("goBtnTrackDart")
      );
      await submitButton.click();

      // Wait a bit for any potential error message to appear
      await this.driver.sleep(1500);

      // Check if there was a captcha error
      if (await this.isCaptchaError()) {
        await msg.edit(`${retryCount + 1} Retrying...⌛️`);

        // Refresh the captcha
        await this.refreshCaptcha();

        // Get new captcha solution
        const newCaptchaSolution = await this.solveCaptcha();

        // Enter the new captcha
        await this.enterCaptcha(newCaptchaSolution);

        retryCount++;
      } else {
        // No error message, assume success
        captchaSuccess = true;
      }
    }

    if (!captchaSuccess) {
      throw new Error(
        `Failed to submit form after ${maxRetries} captcha attempts`
      );
    }

    // Wait for the results to load if captcha was successful
    await this.driver.wait(until.elementLocated(By.css("body")), 10000);
  }

  /**
   * Click on the "Status and Scan" tab and extract tracking information
   * @returns Formatted tracking information
   */

  async extractTrackingDetails(): Promise<string> {
    try {
      // Wait for the tracking results to load and be visible
      await this.driver.wait(
        until.elementLocated(By.css("a[href*='#SCAN'][data-toggle='tab']")),
        15000
      );

      // Click on the "Status and Scan" tab
      const statusScanTab = await this.driver.findElement(
        By.css("a[href*='#SCAN'][data-toggle='tab']")
      );
      await statusScanTab.click();

      // Wait for the table to be visible
      await this.driver.wait(
        until.elementLocated(By.css("div[id*='SCAN'] table tbody tr")),
        10000
      );

      // Wait a moment to ensure the tab content is fully loaded
      await this.driver.sleep(1000);
      // Extract shipment details from the other tab for a more comprehensive message
      // First click on the Shipment Details tab
      const shipmentDetailsTab = await this.driver.findElement(
        By.css("a[href*='#SHIP'][data-toggle='tab']")
      );

      await shipmentDetailsTab.click();

      // Wait for the shipment details to load
      await this.driver.wait(
        until.elementLocated(By.css("div[id*='SHIP'] table tbody tr")),
        10000
      );

      // Extract shipment details

      const waybillNo = await this.driver
        .findElement(By.css("div[id*='SHIP'] table tbody tr:nth-child(1) td"))
        .getText();

      const pickupDate = await this.driver
        .findElement(By.css("div[id*='SHIP'] table tbody tr:nth-child(2) td"))
        .getText();

      const fromLocation = await this.driver
        .findElement(By.css("div[id*='SHIP'] table tbody tr:nth-child(3) td"))
        .getText();

      const toLocation = await this.driver
        .findElement(By.css("div[id*='SHIP'] table tbody tr:nth-child(4) td"))
        .getText();

      const status = await this.driver
        .findElement(By.css("div[id*='SHIP'] table tbody tr:nth-child(5) td"))
        .getText();

      const expectedDelivery = await this.driver
        .findElement(By.css("div[id*='SHIP'] table tbody tr:nth-child(6) td"))
        .getText();

      // Now go back to Status and Scan tab to get the latest update
      await statusScanTab.click();

      await this.driver.wait(
        until.elementLocated(By.css("div[id*='SCAN'] table tbody tr")),
        10000
      );

      // Extract the first row from the Status and Scan table
      const firstRowCells = await this.driver.findElements(
        By.css("div[id*='SCAN'] table tbody tr:first-child td")
      );

      const latestLocation = await firstRowCells[0].getText();
      const latestDetails = await firstRowCells[1].getText();
      const latestDate = await firstRowCells[2].getText();
      const latestTime = await firstRowCells[3].getText();

      const message = `*📦 SHIPMENT TRACKED*

    *Waybill No:* ${waybillNo}
    *Route:* ${fromLocation} ➡️ ${toLocation}
    *Pickup Date:* ${pickupDate}
    *Expected Delivery:* ${expectedDelivery}
    *Current Status:* ${status}

    *🕒 LATEST UPDATE*
    *Location:* ${latestLocation}
    *Details:* ${latestDetails}
    *Date:* ${latestDate}
    *Time:* ${latestTime}
    `;

      return message;
    } catch (error) {
      console.error("Error extracting tracking details:", error);
      return "Failed to extract tracking details. Error: " + error;
    }
  }

  /**
  
     * Helper function to pad a string to the right
     * @param str String to pad
     * @param length Total length after padding
     * @returns Padded string
     */

  private padRight(str: string, length: number): string {
    return str.padEnd(length);
  }

  /**
   * Close the WebDriver
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
    }
  }

  /**
   * Track a package or multiple packages
   * @param trackingNumbers Tracking number or comma-separated list of tracking numbers
   * @param useReferenceNumber Whether to use reference number instead of waybill
   */
  async trackPackage(
    trackingNumbers: string,
    useReferenceNumber: boolean = false
  ): Promise<void> {
    try {
      await this.sendMsg("Tracking started...⏳");
      await this.initDriver();
      await this.navigateToTrackingPage();
      await this.selectTrackingType(useReferenceNumber);
      await this.enterTrackingNumbers(trackingNumbers);

      // Solve the captcha
      const captchaSolution = await this.solveCaptcha();
      await this.enterCaptcha(captchaSolution);

      // Submit the form
      await this.submitForm();

      // Extract and display tracking information
      const trackingDetails = await this.extractTrackingDetails();
      await msg.edit(trackingDetails);
      await msg.react("✅");

      // Keep the browser open for now - you can decide what to do next
      await this.close();
    } catch (error) {
      console.error("Error during tracking process:", error);
      await this.close();
      throw error;
    }
  }
}

/**
 * Main function to run the tracking script
 */
// async function main() {
//   // Replace with your tracking number(s)
//   const trackingNumbers = "90068267240";

//   // Replace with your captcha solver API URL
//   const captchaSolverApiUrl = "http://captcha.rishabhshah.tech/solve-captcha";

//   const tracker = new BlueDartTracker(captchaSolverApiUrl);

//   try {
//     await tracker.trackPackage(trackingNumbers);

//     // The browser remains open after tracking. You can add further instructions here
//     // For example, extracting tracking details from the results page

//     // Uncomment the line below when you want to close the browser automatically
//     // await tracker.close();
//   } catch (error) {
//     console.error("Error in main function:", error);
//   }
// }

// Export the BlueDartTracker class for use in other scripts
export { BlueDartTracker };
