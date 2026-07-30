import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

export class BasePage {
  protected driver: WebDriver;
  protected baseUrl: string;

  constructor(driver: WebDriver) {
    this.driver = driver;
    this.baseUrl = process.env.BASE_URL || 'https://jaganreddyogirala.github.io/pdd/';
  }

  async navigateTo(path: string = ''): Promise<void> {
    const targetUrl = `${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    await this.driver.get(targetUrl);
  }

  async findElement(locator: By, timeoutMs: number = 10000) {
    await this.driver.wait(until.elementLocated(locator), timeoutMs);
    const element = await this.driver.findElement(locator);
    await this.driver.wait(until.elementIsVisible(element), timeoutMs);
    return element;
  }

  async click(locator: By): Promise<void> {
    const el = await this.findElement(locator);
    await el.click();
  }

  async type(locator: By, text: string): Promise<void> {
    const el = await this.findElement(locator);
    await el.clear();
    await el.sendKeys(text);
  }
}

export async function createDriver(): Promise<WebDriver> {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1920,1080');

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
}
