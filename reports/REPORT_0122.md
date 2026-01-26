# 報告書 0122

**日期：** 2026-01-26

**工作單標題：** 分離玩家名稱與暱稱概念

**工單主旨：** BUG 修復 / 功能改進

---

## 完成項目

### 1. 概念區分

| 概念 | 用途 | 來源 | 可編輯 |
|------|------|------|--------|
| 玩家名稱 | Header 顯示登入身份 | 訪客 / Google 帳號 | 否 |
| 遊戲暱稱 | 遊戲中顯示的名字 | 玩家自訂輸入 | 是 |

### 2. 程式碼變更

#### localStorage.js
- 新增 `NICKNAME` storage key
- 新增 `saveNickname()` 函數
- 新增 `getNickname()` 函數
- 新增 `clearNickname()` 函數
- 保持向後相容（同時更新舊的 key）

#### Lobby.js
- 新增 `displayName` 狀態（固定為「訪客」）
- 將 `playerName` 改為 `nickname`
- Header 顯示 `displayName`（玩家名稱）
- 輸入框使用 `nickname`（遊戲暱稱）
- 更新相關函數名稱（validateNicknameInput）

#### Lobby.css
- 類別名稱更新：`player-name-*` → `nickname-*`

### 3. UI 變更

**Header 區域：**
- 顯示「訪客」（玩家名稱）
- 頭像顯示「訪」（取自玩家名稱首字）

**輸入區域：**
- 標籤改為「遊戲暱稱」
- Placeholder 改為「請輸入遊戲中顯示的暱稱（2-12 字元）」

## 測試結果

| 測試項目 | 結果 |
|---------|------|
| Lobby 單元測試 | ✅ 34 passed |
| 新增測試：Header 顯示訪客 | ✅ passed |

## 變更檔案

| 檔案 | 變更類型 |
|------|---------|
| `frontend/src/utils/localStorage.js` | 修改 |
| `frontend/src/components/Lobby/Lobby.js` | 修改 |
| `frontend/src/components/Lobby/Lobby.css` | 修改 |
| `frontend/src/components/Lobby/Lobby.test.js` | 修改 |

## 後續工作

- [ ] Google 登入整合後，Header 顯示 Google 帳號名稱
- [ ] 個人資料頁面顯示玩家名稱

## 版本資訊

- **Commit:** a0c6416
- **版本號：** 1.0.143
