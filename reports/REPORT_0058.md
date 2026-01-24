# 工作單 0058 完成報告

**日期：** 2026-01-24

**工作單標題：** 房間密碼功能

**工單主旨：** 帳號系統 - 讓房主可以設定密碼保護房間

## 完成內容

### 1. 後端修改

**檔案：** `backend/server.js`

修改內容：
- `createRoom` 事件新增 `password` 參數，支援設定房間密碼
- 房間狀態新增 `password` 和 `isPrivate` 欄位
- `joinRoom` 事件新增密碼驗證邏輯
- 新增 `passwordRequired` 事件，當嘗試加入私人房間但未提供密碼時觸發
- `getAvailableRooms` 和 `broadcastRoomList` 新增 `isPrivate` 欄位（不回傳密碼本身）

### 2. 前端 Socket 服務修改

**檔案：** `frontend/src/services/socketService.js`

修改內容：
- `createRoom` 函數新增 `password` 參數
- `joinRoom` 函數新增 `password` 參數
- 新增 `onPasswordRequired` 監聽函數

### 3. 前端 Lobby 組件修改

**檔案：** `frontend/src/components/Lobby/Lobby.js`

新增功能：
- 私人房間開關（checkbox）
- 房間密碼輸入欄位（4-16 字元）
- 密碼輸入 Modal（加入私人房間時）
- 房間列表顯示鎖頭圖示 🔒
- 密碼驗證邏輯

新增狀態：
- `isPrivate` - 是否設為私人房間
- `roomPassword` - 房間密碼
- `showPasswordModal` - 是否顯示密碼輸入框
- `pendingRoomId` - 等待加入的房間 ID
- `pendingRoomName` - 等待加入的房間名稱
- `inputPassword` - 輸入的密碼
- `passwordError` - 密碼錯誤訊息

### 4. 樣式更新

**檔案：** `frontend/src/components/Lobby/Lobby.css`

新增樣式：
- `.checkbox-group` - checkbox 群組樣式
- `.checkbox-label` - checkbox 標籤樣式
- `.input-hint` - 輸入提示文字
- `.lock-icon` - 鎖頭圖示
- `.room-item.private` - 私人房間邊框
- `.modal-overlay` - Modal 遮罩層
- `.modal` - Modal 容器
- `.password-modal` - 密碼輸入 Modal
- `.modal-error` - Modal 錯誤訊息
- `.modal-actions` - Modal 動作按鈕

## 測試結果

### 單元測試

```
Test Suites: 1 passed, 1 total
Tests:       32 passed, 32 total
```

更新了 Lobby.test.js：
- 添加 `onPasswordRequired` mock
- 修正錯誤訊息文字（使用新的驗證函數）
- 添加 `localStorage.clear()` 清理

### 功能測試

| 測試案例 | 結果 |
|----------|------|
| 建立公開房間 | PASS |
| 建立私人房間（設定密碼） | PASS |
| 私人房間顯示鎖頭圖示 | PASS |
| 點擊私人房間顯示密碼輸入框 | PASS |
| 輸入正確密碼成功加入 | PASS |
| 輸入錯誤密碼顯示錯誤 | PASS |
| 密碼長度驗證（4-16 字元） | PASS |
| 取消密碼輸入 | PASS |

## 新增/修改檔案

### 修改檔案
- `backend/server.js` - 後端房間密碼邏輯
- `frontend/src/services/socketService.js` - Socket 服務
- `frontend/src/components/Lobby/Lobby.js` - 大廳組件
- `frontend/src/components/Lobby/Lobby.css` - 樣式
- `frontend/src/components/Lobby/Lobby.test.js` - 測試

## 驗收標準完成狀態

- [x] 後端：`createRoom` 支援 password 參數
- [x] 後端：`joinRoom` 驗證密碼
- [x] 後端：房間列表包含 `isPrivate` 欄位
- [x] 前端：建立房間可設定密碼
- [x] 前端：房間列表顯示鎖頭圖示
- [x] 前端：加入私人房間時顯示密碼輸入框
- [x] 前端：密碼錯誤時顯示錯誤訊息
- [x] 通過所有測試案例

## UI 預覽

### 創建房間（私人房間）
```
┌─────────────────────────────────────┐
│  創建房間                            │
├─────────────────────────────────────┤
│  玩家數量                            │
│  ┌─────────────────────────────┐   │
│  │ 4 人                      ▼ │   │
│  └─────────────────────────────┘   │
│                                     │
│  [✓] 設為私人房間                    │
│                                     │
│  房間密碼                            │
│  ┌─────────────────────────────┐   │
│  │ ●●●●●●                      │   │
│  └─────────────────────────────┘   │
│  密碼長度：4-16 個字元               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │          建立房間            │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 房間列表
```
┌─────────────────────────────────────┐
│  可用房間                            │
├─────────────────────────────────────┤
│  小明的房間              2/4  [加入] │
│  🔒 小華的房間           1/4  [加入] │
│  小王的房間              3/4  [加入] │
└─────────────────────────────────────┘
```
