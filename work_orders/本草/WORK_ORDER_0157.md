# 工作單 0157

**日期**：2026-01-27

**工作單標題**：E2E 測試 - 輔助功能與跨裝置測試

**工單主旨**：測試 - 認證、好友、錯誤處理、響應式設計的端對端測試

**優先級**：中

**依賴工單**：0156

**計畫書**：`docs/TEST_PLAN.md`

---

## 一、測試範圍

### 1.1 測試目標

| 測試模組 | 測試案例數 |
|---------|-----------|
| 認證功能 | 3 |
| 好友功能 | 4 |
| 錯誤處理 | 3 |
| 響應式設計 | 4 |
| **小計** | **14** |

### 1.2 覆蓋率目標
- 輔助功能完整測試
- Desktop/iPad/Mobile 三種裝置

---

## 二、測試案例清單

### 2.1 認證功能 E2E 測試 (E2E-06)
**檔案**：`e2e/auth.spec.js`

| 編號 | 測試案例 | 步驟概述 |
|------|---------|---------|
| E2E-06-01 | Google 登入 | 點擊 Google 登入 → 完成認證 → 進入大廳 |
| E2E-06-02 | 匿名登入 | 點擊匿名登入 → 進入大廳 → 顯示匿名名稱 |
| E2E-06-03 | 登出 | 點擊登出 → 返回登入頁 → 驗證狀態清除 |

### 2.2 好友功能 E2E 測試 (E2E-07)
**檔案**：`e2e/friends.spec.js`

| 編號 | 測試案例 | 步驟概述 |
|------|---------|---------|
| E2E-07-01 | 搜尋好友 | 開啟好友頁 → 輸入名稱 → 搜尋 → 顯示結果 |
| E2E-07-02 | 發送好友請求 | 搜尋玩家 → 點擊發送請求 → 驗證發送成功 |
| E2E-07-03 | 接受好友請求 | 收到請求 → 點擊接受 → 驗證成為好友 |
| E2E-07-04 | 拒絕好友請求 | 收到請求 → 點擊拒絕 → 驗證請求消失 |

### 2.3 錯誤處理 E2E 測試 (E2E-08)
**檔案**：`e2e/errorHandling.spec.js`

| 編號 | 測試案例 | 步驟概述 |
|------|---------|---------|
| E2E-08-01 | 「遊戲不存在」處理 | 遊戲中 → 模擬後端重啟 → 顯示提示 → 自動返回大廳 |
| E2E-08-02 | 網路斷線處理 | 遊戲中 → 斷開網路 → 顯示斷線提示 → 重連 |
| E2E-08-03 | 操作失敗處理 | 問牌操作失敗 → Modal 關閉 → 顯示錯誤訊息 |

### 2.4 響應式設計 E2E 測試 (E2E-09)
**檔案**：`e2e/responsive.spec.js`

| 編號 | 測試案例 | 裝置/尺寸 |
|------|---------|---------|
| E2E-09-01 | Desktop 顯示 | 1920×1080 |
| E2E-09-02 | iPad 顯示 | 768×1024 |
| E2E-09-03 | Mobile 顯示 | 375×667 (iPhone SE) |
| E2E-09-04 | 橫向/直向切換 | iPad/Mobile 旋轉 |

---

## 三、測試程式碼範例

### 3.1 認證功能測試

```javascript
// e2e/auth.spec.js
import { test, expect } from '@playwright/test';

test.describe('認證功能 E2E 測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('E2E-06-02: 匿名登入', async ({ page }) => {
    // 點擊匿名登入按鈕
    await page.click('button:has-text("匿名登入")');

    // 等待進入大廳
    await page.waitForURL('**/lobby');

    // 驗證進入大廳
    await expect(page).toHaveURL(/\/lobby/);

    // 驗證顯示使用者資訊（匿名用戶）
    await expect(page.locator('.user-info')).toBeVisible();
  });

  test('E2E-06-03: 登出', async ({ page }) => {
    // 先登入
    await page.click('button:has-text("匿名登入")');
    await page.waitForURL('**/lobby');

    // 點擊使用者選單
    await page.click('.user-menu-trigger');

    // 點擊登出
    await page.click('button:has-text("登出")');

    // 等待返回登入頁
    await page.waitForURL('/');

    // 驗證返回登入頁
    await expect(page).toHaveURL('/');
    await expect(page.locator('button:has-text("Google 登入")')).toBeVisible();
  });
});
```

### 3.2 好友功能測試

```javascript
// e2e/friends.spec.js
import { test, expect } from '@playwright/test';

test.describe('好友功能 E2E 測試', () => {
  let browserA, browserB;
  let pageA, pageB;

  test.beforeAll(async ({ browser }) => {
    browserA = await browser.newContext();
    browserB = await browser.newContext();
    pageA = await browserA.newPage();
    pageB = await browserB.newPage();

    // 兩個用戶都登入
    await pageA.goto('/');
    await pageA.click('button:has-text("匿名登入")');
    await pageA.waitForURL('**/lobby');

    await pageB.goto('/');
    await pageB.click('button:has-text("匿名登入")');
    await pageB.waitForURL('**/lobby');
  });

  test.afterAll(async () => {
    await browserA.close();
    await browserB.close();
  });

  test('E2E-07-01: 搜尋好友', async () => {
    // 開啟好友頁面
    await pageA.click('a:has-text("好友")');
    await pageA.waitForSelector('.friends-page');

    // 輸入搜尋名稱
    await pageA.fill('input[placeholder*="搜尋"]', '測試');

    // 點擊搜尋
    await pageA.click('button:has-text("搜尋")');

    // 等待搜尋結果
    await pageA.waitForSelector('.search-results');

    // 驗證有搜尋結果
    const results = pageA.locator('.search-result-item');
    await expect(results).toHaveCount({ greaterThan: 0 });
  });

  test('E2E-07-02: 發送好友請求', async () => {
    await pageA.click('a:has-text("好友")');
    await pageA.fill('input[placeholder*="搜尋"]', '玩家B');
    await pageA.click('button:has-text("搜尋")');
    await pageA.waitForSelector('.search-results');

    // 點擊發送好友請求
    await pageA.click('.search-result-item:first-child button:has-text("加好友")');

    // 驗證發送成功提示
    await expect(pageA.locator('.toast')).toContainText('已發送');
  });

  test('E2E-07-03: 接受好友請求', async () => {
    // 假設上一個測試發送了請求
    await pageB.click('a:has-text("好友")');

    // 切換到請求頁籤
    await pageB.click('[data-tab="requests"]');

    // 驗證有待處理請求
    await pageB.waitForSelector('.friend-request-item');

    // 點擊接受
    await pageB.click('.friend-request-item:first-child button:has-text("接受")');

    // 驗證成功
    await expect(pageB.locator('.toast')).toContainText('已接受');

    // 切換到好友列表驗證
    await pageB.click('[data-tab="friends"]');
    await expect(pageB.locator('.friend-item')).toHaveCount({ greaterThan: 0 });
  });
});
```

### 3.3 錯誤處理測試

```javascript
// e2e/errorHandling.spec.js
import { test, expect } from '@playwright/test';

test.describe('錯誤處理 E2E 測試', () => {
  test('E2E-08-01: 「遊戲不存在」處理', async ({ page, context }) => {
    // 設置遊戲
    await setupGame(page);

    // 模擬 Socket 返回「遊戲不存在」錯誤
    await page.evaluate(() => {
      // 觸發 error 事件
      window.__socketMock__.emit('error', { message: '遊戲不存在' });
    });

    // 驗證顯示全螢幕錯誤提示
    await expect(page.locator('.game-not-exist-overlay')).toBeVisible();
    await expect(page.locator('.game-not-exist-card h2')).toContainText('遊戲連線中斷');

    // 驗證3秒後自動返回大廳
    await page.waitForTimeout(3500);
    await expect(page).toHaveURL(/\/lobby/);
  });

  test('E2E-08-02: 網路斷線處理', async ({ page, context }) => {
    await setupGame(page);

    // 模擬斷線
    await context.setOffline(true);

    // 驗證顯示斷線提示
    await expect(page.locator('.connection-status')).toContainText('斷線');
    await expect(page.locator('.connection-status')).toHaveClass(/disconnected/);

    // 恢復連線
    await context.setOffline(false);

    // 等待重連
    await page.waitForSelector('.connection-status.connected', { timeout: 10000 });

    // 驗證重連成功
    await expect(page.locator('.connection-status')).toContainText('已連線');
  });

  test('E2E-08-03: 操作失敗處理', async ({ page }) => {
    await setupGame(page);

    // 開啟問牌面板
    await page.click('.color-card:not(.disabled):first-child');
    await page.waitForSelector('.question-flow');

    // 模擬操作失敗
    await page.evaluate(() => {
      window.__socketMock__.emit('error', { message: '操作失敗' });
    });

    // 驗證 Modal 關閉
    await expect(page.locator('.question-flow')).not.toBeVisible();

    // 驗證錯誤訊息顯示
    await expect(page.locator('.error-message')).toContainText('操作失敗');
  });
});
```

### 3.4 響應式設計測試

```javascript
// e2e/responsive.spec.js
import { test, expect, devices } from '@playwright/test';

test.describe('響應式設計 E2E 測試', () => {
  test('E2E-09-01: Desktop 顯示', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.click('button:has-text("匿名登入")');
    await page.waitForURL('**/lobby');

    // 驗證桌面版佈局
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();

    // 驗證不顯示漢堡選單
    await expect(page.locator('.hamburger-menu')).not.toBeVisible();
  });

  test('E2E-09-02: iPad 顯示', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.click('button:has-text("匿名登入")');
    await page.waitForURL('**/lobby');

    // 驗證平板佈局
    // 可能有側邊欄或收合的選單
    await expect(page.locator('.main-content')).toBeVisible();
  });

  test('E2E-09-03: Mobile 顯示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.click('button:has-text("匿名登入")');
    await page.waitForURL('**/lobby');

    // 驗證手機版佈局
    await expect(page.locator('.hamburger-menu')).toBeVisible();

    // 側邊欄應該隱藏
    await expect(page.locator('.sidebar')).not.toBeVisible();

    // 點擊漢堡選單後顯示導航
    await page.click('.hamburger-menu');
    await expect(page.locator('.mobile-nav')).toBeVisible();
  });

  test('E2E-09-04: 橫向/直向切換', async ({ page }) => {
    // 直向 iPad
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.click('button:has-text("匿名登入")');
    await page.waitForURL('**/lobby');

    // 截圖直向
    await page.screenshot({ path: 'screenshots/ipad-portrait.png' });

    // 切換到橫向
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500); // 等待佈局調整

    // 截圖橫向
    await page.screenshot({ path: 'screenshots/ipad-landscape.png' });

    // 驗證佈局正常（沒有溢出等問題）
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox.width).toBeLessThanOrEqual(1024);
  });
});

// 使用不同裝置預設的測試
test.describe('跨裝置測試', () => {
  const deviceList = [
    'Desktop Chrome',
    'iPad (gen 7)',
    'iPhone 12'
  ];

  for (const deviceName of deviceList) {
    test.describe(`在 ${deviceName} 上`, () => {
      test.use({ ...devices[deviceName] });

      test('基本流程可用', async ({ page }) => {
        await page.goto('/');
        await page.click('button:has-text("匿名登入")');
        await expect(page).toHaveURL(/\/lobby/);
      });
    });
  }
});
```

---

## 四、驗收標準

- [ ] 所有 14 個 E2E 測試案例通過
- [ ] 認證流程正常
- [ ] 好友功能正常
- [ ] 錯誤處理友善
- [ ] 三種裝置尺寸顯示正常
- [ ] 橫直向切換無問題

---

## 五、執行命令

```bash
# 執行輔助功能測試
npx playwright test e2e/auth.spec.js
npx playwright test e2e/friends.spec.js
npx playwright test e2e/errorHandling.spec.js

# 執行響應式測試
npx playwright test e2e/responsive.spec.js

# 執行跨裝置測試
npx playwright test --project="Desktop Chrome"
npx playwright test --project="iPad"
npx playwright test --project="iPhone"

# 產生截圖報告
npx playwright test --reporter=html
```

---

## 六、測試檔案清單

| 檔案路徑 | 狀態 |
|---------|------|
| `e2e/auth.spec.js` | 需新建 |
| `e2e/friends.spec.js` | 需新建 |
| `e2e/errorHandling.spec.js` | 需新建 |
| `e2e/responsive.spec.js` | 需新建 |

---

## 七、Playwright 裝置配置

```javascript
// playwright.config.js 新增
projects: [
  {
    name: 'Desktop Chrome',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'iPad',
    use: { ...devices['iPad (gen 7)'] },
  },
  {
    name: 'iPhone',
    use: { ...devices['iPhone 12'] },
  },
],
```
