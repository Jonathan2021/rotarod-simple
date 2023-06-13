import { chromium, Browser, Page } from 'playwright';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser.close();
});

beforeEach(async () => {
  page = await browser.newPage();
  // Replace with your actual login page URL
  await page.goto('http://localhost:8080/login.html');
});

afterEach(async () => {
  await page.close();
});

describe('Login', () => {
  it('should display login failure message for invalid credentials', async () => {
    await page.fill('#Corporate_Account', 'InvalidUser');
    await page.fill('#Password', 'InvalidPassword');
    await page.click('#login-button');

    // Wait for alert dialog
    const dialog = await page.waitForEvent('dialog');
    
    // Check if the dialog's message is the expected error message
    expect(dialog.message()).toBe('Login failed. Please try again.');
    
    await dialog.dismiss();
  });

  it('should redirect to main page for valid credentials', async () => {
    await page.fill('#Corporate_Account', 'ValidUser');
    await page.fill('#Password', 'ValidPassword');
    await page.click('#login-button');

    // Replace with your actual main page URL
    await page.waitForNavigation({ url: 'http://localhost:8080/main.html' });
  });
});
