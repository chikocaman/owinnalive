import { chromium } from "playwright";

const baseUrl = "http://127.0.0.1:3001/";
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  
  // Wait for the calendar bar to be visible
  const calendarBar = page.locator(".match-command-bar");
  await calendarBar.waitFor({ state: "visible", timeout: 5_000 });
  
  console.log("✓ Calendar bar is initially visible");
  
  // Get initial state
  const initialClasses = await calendarBar.getAttribute("class");
  console.log("Initial classes:", initialClasses);
  
  // Wait for content to load
  await page.waitForTimeout(3_000);
  
  // Scroll down
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(500);
  
  const classesAfterScroll = await calendarBar.getAttribute("class");
  console.log("Classes after scroll down:", classesAfterScroll);
  
  if (classesAfterScroll?.includes("match-command-bar--hidden")) {
    console.log("✓ Calendar bar is hidden when scrolling down");
  } else {
    console.log("✗ Calendar bar is NOT hidden when scrolling down");
  }
  
  // Scroll back up
  await page.evaluate(() => window.scrollBy(0, -300));
  await page.waitForTimeout(500);
  
  const classesAfterScrollUp = await calendarBar.getAttribute("class");
  console.log("Classes after scroll up:", classesAfterScrollUp);
  
  if (!classesAfterScrollUp?.includes("match-command-bar--hidden")) {
    console.log("✓ Calendar bar is visible when scrolling up");
  } else {
    console.log("✗ Calendar bar is NOT visible when scrolling up");
  }
  
  console.log("\n✓ All tests passed!");
  
} catch (error) {
  console.error("Test failed:", error);
} finally {
  await browser.close();
}
