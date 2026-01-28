# 工作單 0211

## 編號：0211
## 日期：2026-01-28
## 標題：新增重連 UI 樣式

## 工單主旨
為重連覆蓋層新增 CSS 樣式

## 內容

### 依賴
工單 0210（需要先新增 HTML 結構）

### 具體修改

**修改檔案**：`frontend/src/components/GameRoom/GameRoom.css`

#### 新增樣式
- `.gr-reconnecting-overlay`：全屏半透明覆蓋層，z-index 高於其他 UI
- `.gr-reconnecting-content`：居中容器，包含 spinner 和文字
- `.gr-reconnecting-spinner`：旋轉動畫（與現有 spinner 風格一致）
- 文字使用 Noto Serif TC 字體，與遊戲整體風格一致
- 背景色使用 `rgba(245, 241, 230, 0.95)`（米白半透明）

### 驗收標準
- 重連覆蓋層正確顯示在所有 UI 元素上方
- spinner 動畫流暢
- 樣式與遊戲整體風格一致
- 前端測試全部通過
