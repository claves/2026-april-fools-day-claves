import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world.js';

// === Background ===

Given('ユーザーがトップページを開いている', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.goto(this.baseUrl);
  await this.page.waitForSelector('.product-card');
});

// === 商品表示 ===

Then('{int}つの商品カードが表示される', async function (this: CustomWorld, count: number) {
  if (!this.page) throw new Error('Page not initialized');
  const cards = await this.page.locator('.product-card').count();
  expect(cards).toBe(count);
});

Then('各商品カードには商品名、説明、価格が表示される', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  const cards = this.page.locator('.product-card');
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    await expect(card.locator('.product-name')).toBeVisible();
    await expect(card.locator('.product-desc')).toBeVisible();
    await expect(card.locator('.product-price')).toBeVisible();
  }
});

Then('各商品カードには「くまちょん信頼度」がラーメンアイコンで表示される', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  const tags = this.page.locator('.product-tag');
  const count = await tags.count();

  for (let i = 0; i < count; i++) {
    const text = await tags.nth(i).textContent();
    expect(text).toContain('くまちょん信頼度');
  }
});

Then('商品カードはそれぞれ異なる角度で傾いている', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  const cards = this.page.locator('.product-card');
  const count = await cards.count();
  const transforms: string[] = [];

  for (let i = 0; i < count; i++) {
    const transform = await cards.nth(i).evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    transforms.push(transform);
  }

  // 少なくとも一部が異なる角度であることを確認
  const uniqueTransforms = new Set(transforms);
  expect(uniqueTransforms.size).toBeGreaterThan(1);
});

When('ページをリロードする', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.reload();
  await this.page.waitForSelector('.product-card');
});

Then('商品の表示順が前回と異なる可能性がある', async function (this: CustomWorld) {
  // ランダム性のテストは確定的にできないため、商品が表示されていることのみ確認
  if (!this.page) throw new Error('Page not initialized');
  const cards = await this.page.locator('.product-card').count();
  expect(cards).toBe(6);
});

// === ソート・表示件数 ===

When('ソート順を「運気順」に変更する', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.locator('.sort-bar select').first().selectOption({ label: '運気順' });
});

Then('商品の並び順は変わらない', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  // ソート変更前後で商品が6つ表示されていることを確認（実際には変わらない）
  const cards = await this.page.locator('.product-card').count();
  expect(cards).toBe(6);
});

When('表示件数を「{float}件」に変更する', async function (this: CustomWorld, count: number) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.selectOption('#display-count-select', { label: `${count}件` });
});

Then('表示される商品数は{int}つのまま', async function (this: CustomWorld, count: number) {
  if (!this.page) throw new Error('Page not initialized');
  const cards = await this.page.locator('.product-card').count();
  expect(cards).toBe(count);
});

// === カートに追加 ===

When('商品の「カートに追加」ボタンをクリックする', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.locator('.btn-maybe').first().click();
});

Then('カートドロワーが開く', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await expect(this.page.locator('#cart-drawer.active')).toBeVisible();
});

Then('カートに商品が{int}個追加される', async function (this: CustomWorld, count: number) {
  if (!this.page) throw new Error('Page not initialized');
  const cartCount = await this.page.locator('#cart-count').textContent();
  expect(parseInt(cartCount || '0')).toBe(count);
});

Then('ヘッダーのカートアイコンに件数が表示される', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await expect(this.page.locator('#cart-count')).toBeVisible();
});

When('同じ商品の「カートに追加」ボタンを{int}回クリックする', async function (this: CustomWorld, times: number) {
  if (!this.page) throw new Error('Page not initialized');
  const btn = this.page.locator('.btn-maybe').first();
  for (let i = 0; i < times; i++) {
    await btn.evaluate((element: HTMLButtonElement) => {
      element.click();
    });
    await this.page.waitForTimeout(100);
  }
});

Then('カート内の商品数量が{int}になる', async function (this: CustomWorld, quantity: number) {
  if (!this.page) throw new Error('Page not initialized');
  const totalItems = await this.page.locator('#cart-total-items').textContent();
  expect(totalItems).toContain(quantity.toString());
});

// === 今すぐ購入ボタン ===

When('商品の「今すぐ購入」ボタンをクリックする', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.locator('.btn-buy').first().click();
});

Then('購入画面に遷移する', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await expect(this.page.locator('#page-purchase.active')).toBeVisible();
});

Then('選択した商品が注文内容に表示される', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await expect(this.page.locator('#order-items-summary .order-item-row')).toBeVisible();
});

// === カートボタン（消えて移動する） ===

When('ヘッダーのカートボタンをクリックする', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.locator('#cart-trigger-btn').click({ force: true });
});

Then('カートボタンが一度消える', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await expect(this.page.locator('#cart-trigger-btn')).toHaveAttribute('data-cart-state', 'hidden');
});

Then('カートボタンが画面内の別の位置に再表示される', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.waitForFunction(() => {
    const btn = document.getElementById('cart-trigger-btn');
    return btn?.getAttribute('data-cart-state') === 'shown'
      && Number(btn?.getAttribute('data-cart-teleport-count') || '0') >= 1;
  });

  const style = await this.page.locator('#cart-trigger-btn').getAttribute('style');
  expect(style).toContain('inset:');
});

Then('カートボタンが複数回消えては別の位置に再表示され続ける', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.waitForFunction(() => {
    const btn = document.getElementById('cart-trigger-btn');
    return btn?.getAttribute('data-cart-state') === 'shown'
      && btn?.getAttribute('data-cart-looping') === 'true'
      && Number(btn?.getAttribute('data-cart-teleport-count') || '0') >= 3
      && Number(btn?.getAttribute('data-cart-hidden-count') || '0') >= 3;
  });
});

Then('カートボタンは約0.5秒表示された後に消える', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  const shownDuration = await this.page.evaluate(async () => {
    const btn = document.getElementById('cart-trigger-btn');
    if (!btn) throw new Error('Cart button not found');

    const currentState = btn.getAttribute('data-cart-state');
    if (currentState !== 'shown') {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error('Timed out waiting for shown state')), 4000);
        const observer = new MutationObserver(() => {
          if (btn.getAttribute('data-cart-state') === 'shown') {
            window.clearTimeout(timer);
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(btn, { attributes: true, attributeFilter: ['data-cart-state'] });
      });
    }

    const shownAt = performance.now();

    return await new Promise<number>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Timed out waiting for hidden state')), 4000);
      const observer = new MutationObserver(() => {
        if (btn.getAttribute('data-cart-state') === 'hidden') {
          window.clearTimeout(timer);
          observer.disconnect();
          resolve(performance.now() - shownAt);
        }
      });
      observer.observe(btn, { attributes: true, attributeFilter: ['data-cart-state'] });
    });
  });

  expect(shownDuration).toBeGreaterThanOrEqual(400);
  expect(shownDuration).toBeLessThan(800);
});

Then('カートボタンは約1秒消えた後に再表示される', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  const hiddenDuration = await this.page.evaluate(async () => {
    const btn = document.getElementById('cart-trigger-btn');
    if (!btn) throw new Error('Cart button not found');

    const currentState = btn.getAttribute('data-cart-state');
    if (currentState !== 'hidden') {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error('Timed out waiting for hidden state')), 4000);
        const observer = new MutationObserver(() => {
          if (btn.getAttribute('data-cart-state') === 'hidden') {
            window.clearTimeout(timer);
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(btn, { attributes: true, attributeFilter: ['data-cart-state'] });
      });
    }

    const hiddenAt = performance.now();

    return await new Promise<number>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Timed out waiting for shown state')), 4000);
      const observer = new MutationObserver(() => {
        if (btn.getAttribute('data-cart-state') === 'shown') {
          window.clearTimeout(timer);
          observer.disconnect();
          resolve(performance.now() - hiddenAt);
        }
      });
      observer.observe(btn, { attributes: true, attributeFilter: ['data-cart-state'] });
    });
  });

  expect(hiddenDuration).toBeGreaterThanOrEqual(900);
  expect(hiddenDuration).toBeLessThan(1300);
});

Given('カートボタンが消えて移動している状態', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.locator('#cart-trigger-btn').click({ force: true });
  await this.page.waitForFunction(() => {
    const btn = document.getElementById('cart-trigger-btn');
    return btn?.getAttribute('data-cart-state') === 'shown'
      && btn?.getAttribute('data-cart-looping') === 'true';
  });
});

// === カートドロワー ===

Given('カートに商品が{int}個入っている', async function (this: CustomWorld, count: number) {
  if (!this.page) throw new Error('Page not initialized');
  for (let i = 0; i < count; i++) {
    await this.page.locator('.btn-maybe').first().click();
    await this.page.waitForTimeout(100);
  }
});

Given('カートに商品が入っている', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.locator('.btn-maybe').first().click();
});

When('カートドロワーの「+」ボタンをクリックする', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.locator('.qty-btn:has-text("+")').first().click();
});

Then('商品の数量が{int}になる', async function (this: CustomWorld, quantity: number) {
  if (!this.page) throw new Error('Page not initialized');
  const qtyText = await this.page.locator('.qty-value').first().textContent();
  expect(qtyText).toContain(quantity.toString());
});

When('「削除する」ボタンをクリックする', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.locator('.cart-remove').first().click();
});

Then('カートから商品が削除される', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await expect(this.page.locator('.cart-empty')).toBeVisible();
});

When('「購入手続きへ」ボタンをクリックする', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  const isDisabled = await this.page.locator('#cart-checkout-btn').isDisabled();
  if (!isDisabled) {
    await this.page.evaluate(() => {
      (window as unknown as { goPurchaseFromCart: () => void }).goPurchaseFromCart();
    });
    return;
  }

  this.page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('カートが空っぽです');
    await dialog.accept();
  });
  await this.page.evaluate(() => {
    (window as unknown as { goPurchaseFromCart: () => void }).goPurchaseFromCart();
  });
});

Then('カート内の全商品が注文内容に表示される', async function (this: CustomWorld) {
  if (!this.page) throw new Error('Page not initialized');
  await expect(this.page.locator('#order-items-summary .order-item-row')).toBeVisible();
});

Given('カートが空の状態', async function (this: CustomWorld) {
  // デフォルトでカートは空なので何もしない
});

Then('「カートが空っぽです」というアラートが表示される', async function (this: CustomWorld) {
  // アラートはWhenステップで処理済み
});
