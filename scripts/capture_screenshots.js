import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '..', 'assets', 'screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function capture() {
  console.log('Launching browser via puppeteer-core...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = fs.existsSync(edgePath) ? edgePath : chromePath;

  console.log(`Using browser executable: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Step 1: Guard Registry Tab
  console.log('Capturing Guard Registry view...');
  await page.screenshot({ path: path.join(outputDir, '1_guard_registry.png'), fullPage: true });

  // Step 2: Book Escort Tab
  console.log('Navigating to Book Escort tab...');
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes('Book Protection Escort')) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outputDir, '2_booking_wizard.png'), fullPage: true });

  // Step 3: Live Tracking Tab
  console.log('Navigating to Live Tracking tab...');
  const buttonsTrack = await page.$$('button');
  for (const btn of buttonsTrack) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Live Telemetry')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outputDir, '3_live_tracking.png'), fullPage: true });

  // Step 4: Control Room / Developer Tab
  console.log('Navigating to PCR Command Center tab...');
  const buttonsPCR = await page.$$('button');
  for (const btn of buttonsPCR) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('PCR Control')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outputDir, '4_pcr_command_center.png'), fullPage: true });

  // Step 5: User Profile Tab
  console.log('Navigating to User Profile tab...');
  const buttonsProfile = await page.$$('button');
  for (const btn of buttonsProfile) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Profile')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outputDir, '5_user_profile.png'), fullPage: true });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
