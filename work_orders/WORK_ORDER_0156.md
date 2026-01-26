# 工作單 0156

**日期**：2026-01-27

**工作單標題**：E2E 測試 - 核心遊戲流程端對端測試

**工單主旨**：測試 - 使用 Playwright/Cypress 進行完整遊戲流程的端對端測試

**優先級**：高

**依賴工單**：0155

**計畫書**：`docs/TEST_PLAN.md`

---

## 一、測試範圍

### 1.1 測試目標

| 測試模組 | 測試案例數 |
|---------|-----------|
| 完整遊戲流程 | 4 |
| 問牌功能 | 4 |
| 猜牌功能 | 4 |
| 跟猜功能 | 4 |
| 預測功能 | 3 |
| **小計** | **19** |

### 1.2 測試工具
- **Playwright** 或 **Cypress**
- 支援多瀏覽器實例同時運行

### 1.3 測試環境需求
- 前端服務運行中 (localhost:3000)
- 後端服務運行中 (localhost:3001)
- 穩定的網路環境

---

## 二、測試案例清單

### 2.1 完整遊戲流程 E2E 測試 (E2E-01)
**檔案**：`e2e/gameFlow.spec.js`

| 編號 | 測試案例 | 步驟概述 |
|------|---------|---------|
| E2E-01-01 | 3人完整遊戲 | 登入×3 → 創建房間 → 加入 → 開始 → 問牌數回合 → 猜牌 → 結束 |
| E2E-01-02 | 4人完整遊戲 | 同上，4人版本 |
| E2E-01-03 | 多局遊戲 | 完成多局直到有人達到7分獲勝 |
| E2E-01-04 | 猜錯後繼續 | 猜錯 → 玩家退出 → 其他人繼續 → 最終猜對 |

### 2.2 問牌功能 E2E 測試 (E2E-02)
**檔案**：`e2e/question.spec.js`

| 編號 | 測試案例 | 步驟概述 |
|------|---------|---------|
| E2E-02-01 | 問牌類型1（各一張） | 選顏色牌 → 選玩家 → 選類型1 → 確認 → 驗證牌轉移 |
| E2E-02-02 | 問牌類型2（其中一種全部） | 選顏色牌 → 選玩家 → 選類型2 → 對方選顏色 → 驗證結果 |
| E2E-02-03 | 問牌類型3（給一張要全部） | 選顏色牌 → 選玩家 → 選類型3 → 選給出顏色 → 驗證交換 |
| E2E-02-04 | 顏色牌使用後禁用 | 使用某顏色牌 → 下回合驗證該牌禁用 |

### 2.3 猜牌功能 E2E 測試 (E2E-03)
**檔案**：`e2e/guess.spec.js`

| 編號 | 測試案例 | 步驟概述 |
|------|---------|---------|
| E2E-03-01 | 猜牌成功 | 點擊猜牌 → 選顏色 → 確認 → 跟猜階段 → 驗證+3分 |
| E2E-03-02 | 猜牌失敗 | 點擊猜牌 → 選錯顏色 → 確認 → 驗證退出遊戲 |
| E2E-03-03 | 查看蓋牌答案 | 點擊猜牌 → 點擊查看答案 → 驗證顯示正確顏色 |
| E2E-03-04 | 強制猜牌 | 其他人都退出 → 只剩一人 → 驗證只能猜牌 |

### 2.4 跟猜功能 E2E 測試 (E2E-04)
**檔案**：`e2e/followGuess.spec.js`

| 編號 | 測試案例 | 步驟概述 |
|------|---------|---------|
| E2E-04-01 | 跟猜成功 | 他人猜牌 → 選擇跟猜 → 猜對 → 驗證+1分 |
| E2E-04-02 | 跟猜失敗 | 他人猜牌 → 選擇跟猜 → 猜錯 → 驗證-1分且退出 |
| E2E-04-03 | 不跟猜 | 他人猜牌 → 選擇不跟 → 驗證分數不變 |
| E2E-04-04 | 按順序決定 | 3人遊戲 → 驗證按順序詢問跟猜 |

### 2.5 預測功能 E2E 測試 (E2E-05)
**檔案**：`e2e/prediction.spec.js`

| 編號 | 測試案例 | 步驟概述 |
|------|---------|---------|
| E2E-05-01 | 預測正確 | 問牌後 → 選預測顏色 → 結束回合 → 猜對時驗證+1分 |
| E2E-05-02 | 預測錯誤 | 問牌後 → 選預測顏色 → 結束回合 → 猜對時驗證-1分 |
| E2E-05-03 | 跳過預測 | 問牌後 → 直接結束回合 → 驗證無影響 |

---

## 三、測試程式碼範例 (Playwright)

### 3.1 完整遊戲流程測試

```javascript
// e2e/gameFlow.spec.js
import { test, expect } from '@playwright/test';

test.describe('完整遊戲流程 E2E 測試', () => {
  test.describe.configure({ mode: 'serial' });

  let browserA, browserB, browserC;
  let pageA, pageB, pageC;
  let gameId;

  test.beforeAll(async ({ browser }) => {
    // 創建三個獨立的瀏覽器上下文
    browserA = await browser.newContext();
    browserB = await browser.newContext();
    browserC = await browser.newContext();

    pageA = await browserA.newPage();
    pageB = await browserB.newPage();
    pageC = await browserC.newPage();
  });

  test.afterAll(async () => {
    await browserA.close();
    await browserB.close();
    await browserC.close();
  });

  test('E2E-01-01: 3人完整遊戲', async () => {
    // Step 1: 玩家A登入並創建房間
    await pageA.goto('http://localhost:3000');
    await pageA.click('button:has-text("匿名登入")');
    await pageA.waitForURL('**/lobby');

    await pageA.fill('input[name="playerName"]', '玩家A');
    await pageA.click('button:has-text("創建房間")');
    await pageA.waitForURL('**/game/**');

    // 取得房間 ID
    const url = pageA.url();
    gameId = url.split('/').pop();
    console.log('Game ID:', gameId);

    // Step 2: 玩家B登入並加入房間
    await pageB.goto('http://localhost:3000');
    await pageB.click('button:has-text("匿名登入")');
    await pageB.waitForURL('**/lobby');

    await pageB.fill('input[name="playerName"]', '玩家B');
    await pageB.click(`[data-room-id="${gameId}"]`);
    await pageB.waitForURL(`**/game/${gameId}`);

    // Step 3: 玩家C登入並加入房間
    await pageC.goto('http://localhost:3000');
    await pageC.click('button:has-text("匿名登入")');
    await pageC.waitForURL('**/lobby');

    await pageC.fill('input[name="playerName"]', '玩家C');
    await pageC.click(`[data-room-id="${gameId}"]`);
    await pageC.waitForURL(`**/game/${gameId}`);

    // Step 4: 驗證三人都在房間內
    await expect(pageA.locator('.player-list .player')).toHaveCount(3);
    await expect(pageB.locator('.player-list .player')).toHaveCount(3);
    await expect(pageC.locator('.player-list .player')).toHaveCount(3);

    // Step 5: 房主開始遊戲
    await pageA.click('button:has-text("開始遊戲")');

    // Step 6: 等待遊戲開始
    await expect(pageA.locator('.game-phase')).toContainText('遊戲進行中');
    await expect(pageB.locator('.game-phase')).toContainText('遊戲進行中');
    await expect(pageC.locator('.game-phase')).toContainText('遊戲進行中');

    // Step 7: 驗證發牌正確
    await expect(pageA.locator('.hand-count')).toContainText('4');
    await expect(pageB.locator('.hand-count')).toContainText('4');
    await expect(pageC.locator('.hand-count')).toContainText('4');

    // Step 8: 進行問牌（假設玩家A先行動）
    const currentPlayer = await getCurrentPlayer(pageA);
    const currentPage = currentPlayer === '玩家A' ? pageA :
                        currentPlayer === '玩家B' ? pageB : pageC;

    // 點擊顏色組合牌
    await currentPage.click('.color-card:not(.disabled):first-child');

    // 選擇目標玩家
    await currentPage.click('.player-option:first-child');

    // 選擇問牌類型
    await currentPage.click('[data-question-type="1"]');

    // 確認問牌
    await currentPage.click('button:has-text("確認問牌")');

    // 等待問牌完成
    await currentPage.waitForSelector('.prediction-panel');

    // 結束回合
    await currentPage.click('button:has-text("結束回合")');

    // 驗證輪到下一位玩家
    // ...

    // 後續可繼續完成完整遊戲流程
  });
});

// 輔助函數
async function getCurrentPlayer(page) {
  const currentPlayerElement = await page.locator('.current-player-name');
  return await currentPlayerElement.textContent();
}
```

### 3.2 問牌功能測試

```javascript
// e2e/question.spec.js
import { test, expect } from '@playwright/test';

test.describe('問牌功能 E2E 測試', () => {
  let pages;
  let gameId;

  test.beforeEach(async ({ browser }) => {
    // 設置3人遊戲
    pages = await setupThreePlayerGame(browser);
    gameId = pages.gameId;
  });

  test.afterEach(async () => {
    await cleanupPages(pages);
  });

  test('E2E-02-01: 問牌類型1（各一張）', async () => {
    const { pageA, pageB, pageC } = pages;

    // 假設玩家A的回合
    const currentPage = await getCurrentPlayerPage(pages);

    // 記錄問牌前的手牌數
    const handCountBefore = await getHandCount(currentPage);

    // 點擊紅綠顏色組合牌
    await currentPage.click('.color-card[data-colors="red-green"]');

    // 等待問牌流程面板
    await currentPage.waitForSelector('.question-flow');

    // 選擇目標玩家
    await currentPage.click('.target-player:first-child');

    // 選擇類型1（各一張）
    await currentPage.click('[data-question-type="1"]');

    // 確認問牌
    await currentPage.click('button:has-text("確認問牌")');

    // 等待問牌完成
    await currentPage.waitForSelector('.prediction-panel', { timeout: 10000 });

    // 驗證手牌數變化（可能增加0-2張）
    const handCountAfter = await getHandCount(currentPage);
    expect(handCountAfter).toBeGreaterThanOrEqual(handCountBefore);
    expect(handCountAfter).toBeLessThanOrEqual(handCountBefore + 2);

    // 結束回合
    await currentPage.click('button:has-text("結束回合")');
  });

  test('E2E-02-02: 問牌類型2需要對方選擇顏色', async () => {
    const { pageA, pageB, pageC } = pages;

    // 找到當前玩家和目標玩家
    const currentPage = await getCurrentPlayerPage(pages);
    const targetPage = await getNextPlayerPage(pages);

    // 點擊顏色組合牌
    await currentPage.click('.color-card:not(.disabled):first-child');

    // 選擇目標玩家
    await currentPage.click('.target-player:first-child');

    // 選擇類型2（其中一種全部）
    await currentPage.click('[data-question-type="2"]');

    // 確認問牌
    await currentPage.click('button:has-text("確認問牌")');

    // 目標玩家應該看到顏色選擇面板
    await targetPage.waitForSelector('.color-choice-panel', { timeout: 5000 });

    // 目標玩家選擇顏色
    await targetPage.click('.color-choice-option:first-child');

    // 驗證問牌完成
    await currentPage.waitForSelector('.prediction-panel', { timeout: 10000 });
  });

  test('E2E-02-04: 顏色牌使用後禁用', async () => {
    const currentPage = await getCurrentPlayerPage(pages);

    // 點擊第一張顏色組合牌
    const firstCard = currentPage.locator('.color-card:not(.disabled):first-child');
    const cardId = await firstCard.getAttribute('data-card-id');
    await firstCard.click();

    // 完成問牌流程
    await currentPage.click('.target-player:first-child');
    await currentPage.click('[data-question-type="1"]');
    await currentPage.click('button:has-text("確認問牌")');
    await currentPage.waitForSelector('.prediction-panel');
    await currentPage.click('button:has-text("結束回合")');

    // 等待輪回到此玩家
    // ...

    // 驗證該顏色牌被禁用
    const disabledCard = currentPage.locator(`.color-card[data-card-id="${cardId}"]`);
    await expect(disabledCard).toHaveClass(/disabled/);
  });
});

// 輔助函數
async function setupThreePlayerGame(browser) {
  // ... 設置遊戲邏輯
}

async function getHandCount(page) {
  const text = await page.locator('.hand-count').textContent();
  return parseInt(text.match(/\d+/)[0]);
}

async function getCurrentPlayerPage(pages) {
  // 根據當前回合玩家返回對應的頁面
}
```

### 3.3 跟猜功能測試

```javascript
// e2e/followGuess.spec.js
import { test, expect } from '@playwright/test';

test.describe('跟猜功能 E2E 測試', () => {
  test('E2E-04-01: 跟猜成功獲得+1分', async ({ browser }) => {
    const pages = await setupThreePlayerGame(browser);
    const { pageA, pageB, pageC } = pages;

    // 記錄玩家B的初始分數
    const scoreBefore = await getPlayerScore(pageB, '玩家B');

    // 玩家A猜牌（假設猜對）
    await pageA.click('button:has-text("猜牌")');
    await pageA.waitForSelector('.guess-panel');

    // 選擇正確的顏色（需要先查看答案）
    await pageA.click('button:has-text("查看答案")');
    // ... 選擇正確顏色

    await pageA.click('button:has-text("確認猜牌")');

    // 玩家B看到跟猜面板
    await pageB.waitForSelector('.follow-guess-panel', { timeout: 5000 });

    // 玩家B選擇跟猜
    await pageB.click('button:has-text("跟猜")');

    // 玩家C選擇不跟
    await pageC.waitForSelector('.follow-guess-panel', { timeout: 5000 });
    await pageC.click('button:has-text("不跟")');

    // 等待結果
    await pageB.waitForSelector('.guess-result', { timeout: 10000 });

    // 驗證玩家B獲得+1分
    const scoreAfter = await getPlayerScore(pageB, '玩家B');
    expect(scoreAfter).toBe(scoreBefore + 1);
  });

  test('E2E-04-04: 按順序決定跟猜', async ({ browser }) => {
    const pages = await setupThreePlayerGame(browser);
    const { pageA, pageB, pageC } = pages;

    // 玩家A猜牌
    await pageA.click('button:has-text("猜牌")');
    // ... 選擇顏色並確認

    // 驗證玩家B先收到跟猜面板
    const panelB = pageB.waitForSelector('.follow-guess-panel');
    const panelC = pageC.waitForSelector('.follow-guess-panel');

    // 玩家B的面板應該顯示「輪到您決定」
    await panelB;
    await expect(pageB.locator('.follow-guess-panel')).toContainText('輪到您');

    // 玩家C的面板應該顯示「等待其他玩家」
    await panelC;
    await expect(pageC.locator('.follow-guess-panel')).toContainText('等待');

    // 玩家B決定後
    await pageB.click('button:has-text("跟猜")');

    // 現在輪到玩家C
    await expect(pageC.locator('.follow-guess-panel')).toContainText('輪到您');
  });
});
```

---

## 四、驗收標準

- [ ] 所有 19 個 E2E 測試案例通過
- [ ] 多瀏覽器實例協調正確
- [ ] 測試環境穩定
- [ ] 無超時或競態問題
- [ ] 測試可重複執行

---

## 五、執行命令

```bash
# 安裝 Playwright
npm init playwright@latest

# 執行所有 E2E 測試
npx playwright test

# 執行特定測試檔案
npx playwright test e2e/gameFlow.spec.js

# 以 UI 模式執行（方便除錯）
npx playwright test --ui

# 執行並產生報告
npx playwright test --reporter=html
npx playwright show-report
```

---

## 六、測試檔案清單

| 檔案路徑 | 狀態 |
|---------|------|
| `e2e/gameFlow.spec.js` | 需新建 |
| `e2e/question.spec.js` | 需新建 |
| `e2e/guess.spec.js` | 需新建 |
| `e2e/followGuess.spec.js` | 需新建 |
| `e2e/prediction.spec.js` | 需新建 |
| `playwright.config.js` | 需新建 |

---

## 七、Playwright 配置

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // E2E 測試需要順序執行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 單一 worker 避免競態
  reporter: 'html',
  timeout: 60000, // 60 秒超時

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'cd frontend && npm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd backend && npm run dev',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

---

## 八、注意事項

1. **多實例協調**：E2E 測試需要多個瀏覽器實例模擬多人遊戲
2. **等待策略**：使用明確的等待（waitForSelector）而非固定延遲
3. **測試隔離**：每個測試應該從乾淨狀態開始
4. **錯誤截圖**：失敗時自動截圖方便除錯
5. **超時設定**：Socket 通訊可能需要較長超時
