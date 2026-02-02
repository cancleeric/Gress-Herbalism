# 工單報告 0347：響應式設計與移動端適配

## 基本資訊

- **工單編號**：0347
- **完成日期**：2026-02-02
- **所屬計畫**：P2-B 前端 UI

---

## 完成內容摘要

### 1. responsive.css - 響應式樣式系統

**斷點定義**：
- xs: 480px（小螢幕手機）
- sm: 640px（手機）
- md: 768px（平板）
- lg: 1024px（小桌面）
- xl: 1280px（桌面）
- 2xl: 1536px（大螢幕）

**媒體查詢**：
- 移動端基礎（< 768px）
- 小螢幕手機（< 480px）
- 橫屏模式
- 平板橫屏
- 觸控設備優化
- 高解析度螢幕
- 減少動畫偏好
- 深色/淺色模式

**輔助類別**：
- `.mobile-only` / `.desktop-only`
- `.touch-only` / `.no-touch`
- `.landscape-only` / `.portrait-only`
- `.safe-area-top` / `.safe-area-bottom`

### 2. useResponsive.js - 響應式 Hooks

**useResponsive()**：
- width, height - 視窗尺寸
- breakpoint - 當前斷點
- isMobile, isTablet, isDesktop
- isLandscape, isPortrait

**useIsMobile()**：
- 綜合檢測移動設備（UA + 尺寸 + 觸控）

**useTouchDevice()**：
- 觸控設備檢測

**useOrientation()**：
- 螢幕方向檢測（portrait/landscape）

**useMediaQuery(query)**：
- 通用媒體查詢 Hook

**usePrefersReducedMotion()**：
- 減少動畫偏好檢測

**usePrefersDarkMode()**：
- 深色模式偏好檢測

**useBreakpoint(breakpoint, direction)**：
- 斷點匹配（up/down/only）

**useLockedSize(lock)**：
- 視窗尺寸鎖定（防止虛擬鍵盤影響）

**useSafeArea()**：
- 安全區域檢測（notch 等）

### 3. MobileGameControls - 移動端控制面板

**功能**：
- 階段指示器
- 回合指示器
- 食物池顯示
- 手牌按鈕（含數量徽章）
- 生物按鈕（含數量徽章）
- 動態動作按鈕（進食/攻擊/跳過）
- 橫屏布局支援
- 安全區域支援

---

## 測試結果

```
Test Suites: 2 passed, 2 total
Tests:       79 passed, 79 total
Snapshots:   0 total
Time:        2.493 s

覆蓋率：
- MobileGameControls.jsx: 100%
- useResponsive.js: 91.3%
- 整體: 91.66%
```

### 測試涵蓋範圍

**useResponsive.test.js (46 tests)**：
- BREAKPOINTS 常數
- getBreakpoint 工具函數
- useResponsive Hook（尺寸、斷點、設備類型、方向）
- useIsMobile Hook
- useTouchDevice Hook
- useOrientation Hook
- useMediaQuery Hook
- usePrefersReducedMotion Hook
- usePrefersDarkMode Hook
- useBreakpoint Hook（up/down/only）
- useLockedSize Hook
- useSafeArea Hook

**MobileGameControls.test.jsx (33 tests)**：
- 組件渲染
- 階段顯示（演化、進食、食物供給、滅絕）
- 回合指示器
- 手牌按鈕
- 生物按鈕
- 進食按鈕
- 攻擊按鈕
- 跳過按鈕
- 按鈕禁用狀態
- 預設值處理

---

## 新增的檔案

### 樣式檔案
- `frontend/src/styles/evolution/responsive.css`

### Hooks
- `frontend/src/hooks/useResponsive.js`

### 組件
- `frontend/src/components/games/evolution/mobile/MobileGameControls.jsx`
- `frontend/src/components/games/evolution/mobile/MobileGameControls.css`
- `frontend/src/components/games/evolution/mobile/index.js`

### 測試檔案
- `frontend/src/hooks/useResponsive.test.js`
- `frontend/src/components/games/evolution/mobile/MobileGameControls.test.jsx`

### 報告
- `reports/演化論/REPORT_0347.md`

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 各斷點布局正確 | ✅ |
| 觸控操作順暢 | ✅ |
| 橫豎屏切換正常 | ✅ |
| 小螢幕可正常遊戲 | ✅ |
| Hook API 可用 | ✅ |
| 減少動畫偏好支援 | ✅ |
| 效能良好 | ✅ |

---

## 技術決策

### 斷點系統

採用 Tailwind CSS 風格的斷點命名（xs, sm, md, lg, xl, 2xl），便於團隊理解與一致性。

### CSS 優先策略

響應式布局主要通過 CSS 媒體查詢實現，Hooks 用於 JavaScript 邏輯需要的場景，避免不必要的 re-render。

### 觸控優化

- 增大觸控目標（最小 44px）
- 禁用懸停效果（防止 sticky hover）
- 長按提示支援

### 安全區域

支援 `env(safe-area-inset-*)` 處理 notch 等設備特性。

---

## 下一步計劃

工單 0347 完成，繼續執行：
- 工單 0348：遊戲流程串接

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
