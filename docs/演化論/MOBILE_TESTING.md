# 演化論遊戲 - 移動端測試文檔

**文件編號**：DOC-EVO-MOBILE-TEST
**版本**：1.0
**建立日期**：2026-02-07
**負責人**：Claude Code

---

## 一、測試設備矩陣

### 1.1 iOS 設備

| 設備 | 系統版本 | 瀏覽器 | 螢幕尺寸 | 優先級 |
|------|----------|--------|----------|--------|
| iPhone 14 Pro | iOS 17+ | Safari | 393×852 | P0 |
| iPhone 12 | iOS 15+ | Safari | 390×844 | P0 |
| iPhone SE (3rd) | iOS 15+ | Safari | 375×667 | P1 |
| iPad Pro 11" | iPadOS 16+ | Safari | 834×1194 | P0 |
| iPad (9th) | iPadOS 15+ | Safari | 768×1024 | P1 |

### 1.2 Android 設備

| 設備 | 系統版本 | 瀏覽器 | 螢幕尺寸 | 優先級 |
|------|----------|--------|----------|--------|
| Pixel 7 | Android 13+ | Chrome | 412×915 | P0 |
| Pixel 5 | Android 12+ | Chrome | 393×851 | P0 |
| Galaxy S23 | Android 13+ | Chrome/Samsung | 360×780 | P1 |
| Galaxy Tab S8 | Android 12+ | Chrome | 800×1280 | P1 |

---

## 二、測試項目

### 2.1 觸控操作

| 測試項目 | 預期行為 | 測試方法 |
|----------|----------|----------|
| 點擊卡牌 | 選中/取消選中 | 單指點擊 |
| 長按卡牌 | 顯示詳情彈窗 | 按住 500ms+ |
| 拖放卡牌 | 創建生物/添加性狀 | 長按後拖動 |
| 滑動選擇 | 框選多張卡 | 在手牌區滑動 |
| 左滑跳過 | 執行跳過動作 | 從右邊緣左滑 |
| 雙指縮放 | 縮放遊戲板 | 捏合/張開 |
| 雙擊重置 | 重置縮放 | 快速雙擊 |

### 2.2 螢幕旋轉

| 測試項目 | 預期行為 |
|----------|----------|
| 直向→橫向 | 佈局自動調整，狀態保持 |
| 橫向→直向 | 佈局自動調整，狀態保持 |
| 遊戲中旋轉 | 無遊戲狀態丟失 |
| 動畫中旋轉 | 動畫正確完成或取消 |

### 2.3 鍵盤處理

| 測試項目 | 預期行為 |
|----------|----------|
| 輸入框聚焦 | 鍵盤彈出，視窗調整 |
| 鍵盤關閉 | 佈局恢復正常 |
| 滾動輸入 | 輸入框保持可見 |

### 2.4 效能指標

| 指標 | 目標值 | 測量方法 |
|------|--------|----------|
| 首屏載入 (FCP) | < 1.5s | Lighthouse |
| 可互動時間 (TTI) | < 3s | Lighthouse |
| 累計版面偏移 (CLS) | < 0.1 | Lighthouse |
| 動畫幀率 | 60fps | Chrome DevTools |
| 記憶體使用 | < 100MB | Chrome DevTools |

---

## 三、測試腳本

### 3.1 觸控測試

```bash
# 執行觸控測試
npx cypress run --spec "tests/e2e/mobile/touch.spec.js"
```

### 3.2 方向測試

```bash
# 執行方向測試
npx cypress run --spec "tests/e2e/mobile/orientation.spec.js"
```

### 3.3 全部移動端測試

```bash
# 執行所有移動端測試
npx cypress run --spec "tests/e2e/mobile/**/*.spec.js"
```

---

## 四、測試環境設置

### 4.1 Cypress 配置

```javascript
// cypress.config.js
module.exports = {
  e2e: {
    viewportWidth: 390,
    viewportHeight: 844,
    // 行動裝置 User-Agent
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) ...',
  },
};
```

### 4.2 自訂命令

```javascript
// cypress/support/commands.js

// 模擬長按
Cypress.Commands.add('longPress', { prevSubject: true }, (subject, duration = 500) => {
  cy.wrap(subject)
    .trigger('touchstart', { touches: [{ clientX: 0, clientY: 0 }] })
    .wait(duration)
    .trigger('touchend');
});

// 模擬滑動
Cypress.Commands.add('swipe', { prevSubject: true }, (subject, direction, distance = 100) => {
  const start = { clientX: 200, clientY: 400 };
  const end = { ...start };

  switch (direction) {
    case 'left': end.clientX -= distance; break;
    case 'right': end.clientX += distance; break;
    case 'up': end.clientY -= distance; break;
    case 'down': end.clientY += distance; break;
  }

  cy.wrap(subject)
    .trigger('touchstart', { touches: [start] })
    .trigger('touchmove', { touches: [end] })
    .trigger('touchend');
});

// 模擬雙指縮放
Cypress.Commands.add('pinch', { prevSubject: true }, (subject, scale) => {
  const center = { x: 200, y: 300 };
  const initialDistance = 50;
  const finalDistance = initialDistance * scale;

  cy.wrap(subject)
    .trigger('touchstart', {
      touches: [
        { clientX: center.x - initialDistance, clientY: center.y },
        { clientX: center.x + initialDistance, clientY: center.y }
      ]
    })
    .trigger('touchmove', {
      touches: [
        { clientX: center.x - finalDistance, clientY: center.y },
        { clientX: center.x + finalDistance, clientY: center.y }
      ]
    })
    .trigger('touchend');
});
```

---

## 五、已知問題與解決方案

### 5.1 iOS Safari

| 問題 | 解決方案 |
|------|----------|
| 雙擊縮放 | 使用 `touch-action: manipulation` |
| 橡皮筋效果 | 使用 `overscroll-behavior: none` |
| 300ms 點擊延遲 | 使用 `touch-action: manipulation` |
| 虛擬鍵盤調整 | 使用 `visualViewport` API |

### 5.2 Android Chrome

| 問題 | 解決方案 |
|------|----------|
| 長按選取文字 | 使用 `-webkit-user-select: none` |
| 下拉刷新 | 使用 `overscroll-behavior-y: contain` |

---

## 六、測試報告模板

```markdown
# 移動端測試報告

## 測試資訊
- 日期：YYYY-MM-DD
- 測試人員：XXX
- 設備：iPhone 12
- 系統：iOS 16.0
- 瀏覽器：Safari

## 測試結果

### 觸控操作
- [x] 點擊卡牌：通過
- [x] 長按詳情：通過
- [x] 拖放卡牌：通過
- [ ] 滑動選擇：問題（描述）

### 螢幕旋轉
- [x] 直向顯示：通過
- [x] 橫向顯示：通過
- [x] 狀態保持：通過

### 效能
- FCP: 1.2s
- TTI: 2.5s
- CLS: 0.05

## 發現問題
1. 問題描述
   - 重現步驟
   - 預期行為
   - 實際行為
   - 截圖

## 結論
測試通過 / 需要修復
```

---

## 七、相關文件

| 文件 | 說明 |
|------|------|
| `tests/e2e/mobile/touch.spec.js` | 觸控測試 |
| `tests/e2e/mobile/orientation.spec.js` | 方向測試 |
| `frontend/src/hooks/useTouch.js` | 觸控 Hooks |
| `frontend/src/components/games/evolution/touch/` | 觸控組件 |

---

**文件結束**

*建立者：Claude Code*
*建立日期：2026-02-07*
