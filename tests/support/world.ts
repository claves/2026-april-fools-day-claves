import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';

export interface CustomWorld extends World {
  browser: Browser | null;
  context: BrowserContext | null;
  page: Page | null;
  baseUrl: string;
  init(): Promise<void>;
  cleanup(): Promise<void>;
}

class KumaWorld extends World implements CustomWorld {
  browser: Browser | null = null;
  context: BrowserContext | null = null;
  page: Page | null = null;
  baseUrl: string = 'http://localhost:3000';

  constructor(options: IWorldOptions) {
    super(options);
  }

  async init() {
    this.browser = await chromium.launch({
      channel: 'chromium',
      headless: true,
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async cleanup() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}

setWorldConstructor(KumaWorld);
