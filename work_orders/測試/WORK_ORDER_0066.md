# 工作單 0066

**日期：** 2026-01-24

**工作單標題：** E2E 端對端測試建置

**工單主旨：** 提升測試覆蓋率 - 建立 Playwright 端對端測試

**分類：** 測試

---

## 目標

使用 Playwright 建立端對端測試，模擬真實用戶操作流程，確保前後端整合正確。

## 背景

單元測試和整合測試無法完全驗證用戶實際操作流程，E2E 測試可以：
- 模擬真實瀏覽器環境
- 驗證前後端整合
- 測試跨瀏覽器相容性
- 捕捉 UI 回歸問題

## 測試環境設置

### 1. 安裝 Playwright

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

### 2. 配置檔案

**playwright.config.js：**
```javascript
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 多人遊戲測試需要順序執行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: [
    {
      command: 'npm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      cwd: '../frontend'
    },
    {
      command: 'npm start',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      cwd: '../backend'
    }
  ],
});
```

## 測試範圍

### 1. 登入流程測試

**測試檔案：** `frontend/e2e/auth.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('登入流程', () => {
  test('訪客模式登入', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("訪客模式")');
    await expect(page).toHaveURL(/lobby/);
  });

  test('Google 登入按鈕可點擊', async ({ page }) => {
    await page.goto('/');
    const googleBtn = page.locator('button:has-text("Google")');
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeEnabled();
  });

  test('登入後顯示用戶暱稱', async ({ page }) => {
    // 使用訪客模式測試
    await page.goto('/');
    await page.click('button:has-text("訪客模式")');
    await expect(page.locator('[data-testid="user-nickname"]')).toBeVisible();
  });
});
```

### 2. 大廳功能測試

**測試檔案：** `frontend/e2e/lobby.spec.js`

```javascript
test.describe('遊戲大廳', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("訪客模式")');
  });

  test('建立房間', async ({ page }) => {
    await page.click('button:has-text("建立房間")');
    await expect(page.locator('[data-testid="room-code"]')).toBeVisible();
  });

  test('設定房間密碼', async ({ page }) => {
    await page.click('button:has-text("建立房間")');
    await page.fill('[data-testid="room-password"]', '1234');
    await page.click('button:has-text("確認")');
    // 驗證密碼房間標示
    await expect(page.locator('[data-testid="password-icon"]')).toBeVisible();
  });

  test('加入房間', async ({ page }) => {
    // 需要先有一個房間存在
    await page.fill('[data-testid="room-code-input"]', 'ABC123');
    await page.click('button:has-text("加入")');
  });

  test('查看排行榜', async ({ page }) => {
    await page.click('button:has-text("排行榜")');
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();
  });
});
```

### 3. 多人遊戲流程測試

**測試檔案：** `frontend/e2e/multiplayer.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('多人遊戲', () => {
  test('3人遊戲完整流程', async ({ browser }) => {
    // 建立3個瀏覽器 context 模擬3個玩家
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(
      contexts.map(ctx => ctx.newPage())
    );

    // 玩家1: 建立房間
    await pages[0].goto('/');
    await pages[0].click('button:has-text("訪客模式")');
    await pages[0].click('button:has-text("建立房間")');

    const roomCode = await pages[0]
      .locator('[data-testid="room-code"]')
      .textContent();

    // 玩家2, 3: 加入房間
    for (let i = 1; i < 3; i++) {
      await pages[i].goto('/');
      await pages[i].click('button:has-text("訪客模式")');
      await pages[i].fill('[data-testid="room-code-input"]', roomCode);
      await pages[i].click('button:has-text("加入")');
    }

    // 驗證所有玩家都在房間內
    for (const page of pages) {
      await expect(page.locator('[data-testid="player-count"]'))
        .toHaveText('3 / 4');
    }

    // 玩家1: 開始遊戲
    await pages[0].click('button:has-text("開始遊戲")');

    // 驗證所有玩家看到遊戲畫面
    for (const page of pages) {
      await expect(page.locator('[data-testid="game-board"]'))
        .toBeVisible();
    }

    // 清理
    await Promise.all(contexts.map(ctx => ctx.close()));
  });
});
```

### 4. 遊戲操作測試

**測試檔案：** `frontend/e2e/gameplay.spec.js`

```javascript
test.describe('遊戲操作', () => {
  test('問牌流程', async ({ page }) => {
    // 假設已在遊戲中且輪到該玩家
    await page.click('[data-testid="ask-card-btn"]');

    // 選擇顏色
    await page.click('[data-testid="color-red"]');
    await page.click('[data-testid="color-blue"]');

    // 選擇目標玩家
    await page.click('[data-testid="player-2"]');

    // 選擇要牌方式
    await page.click('[data-testid="ask-type-one-each"]');

    // 確認
    await page.click('button:has-text("確認")');

    // 驗證卡牌轉移
    await expect(page.locator('[data-testid="hand-cards"]'))
      .not.toHaveCount(0);
  });

  test('猜牌流程', async ({ page }) => {
    await page.click('[data-testid="guess-card-btn"]');

    // 查看蓋牌（僅猜牌者可見）
    await expect(page.locator('[data-testid="hidden-cards"]'))
      .toBeVisible();

    // 選擇猜測顏色
    await page.click('[data-testid="guess-color-1"]');
    await page.click('[data-testid="guess-color-2"]');

    // 確認猜測
    await page.click('button:has-text("確認猜測")');
  });

  test('跟猜流程', async ({ page }) => {
    // 當其他玩家猜牌時，顯示跟猜選項
    await expect(page.locator('[data-testid="follow-guess-prompt"]'))
      .toBeVisible();

    await page.click('button:has-text("跟")');

    // 選擇跟猜的顏色
    await page.click('[data-testid="follow-color-1"]');
    await page.click('[data-testid="follow-color-2"]');

    await page.click('button:has-text("確認")');
  });
});
```

### 5. 響應式設計測試

**測試檔案：** `frontend/e2e/responsive.spec.js`

```javascript
test.describe('響應式設計', () => {
  test('手機版面配置', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 驗證手機版 UI 元素
    await expect(page.locator('[data-testid="mobile-menu"]'))
      .toBeVisible();
  });

  test('平板版面配置', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // 驗證平板版 UI 元素
  });
});
```

## package.json 新增指令

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

## 驗收標準

- [ ] 所有 E2E 測試案例通過
- [ ] Chrome、Firefox 瀏覽器測試通過
- [ ] 手機版 UI 測試通過
- [ ] 測試報告可正常生成
- [ ] CI 整合（GitHub Actions）
- [ ] 測試失敗時自動截圖和錄影
