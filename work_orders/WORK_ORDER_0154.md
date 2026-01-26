# 工作單 0154

**日期**：2026-01-27

**工作單標題**：單元測試 - 前端輔助組件與服務

**工單主旨**：測試 - 登入、大廳、好友、排行榜等輔助功能的單元測試

**優先級**：中

**依賴工單**：0152

**計畫書**：`docs/TEST_PLAN.md`

---

## 一、測試範圍

### 1.1 測試目標

| 模組 | 檔案 | 測試案例數 |
|------|------|-----------|
| Login 組件 | `Login/Login.test.js` | 6 |
| Lobby 組件 | `Lobby/Lobby.test.js` | 10 |
| GameStatus 組件 | `GameStatus/GameStatus.test.js` | 5 |
| Profile 組件 | `Profile/Profile.test.js` | 4 |
| Friends 組件 | `Friends/Friends.test.js` | 6 |
| Leaderboard 組件 | `Leaderboard/Leaderboard.test.js` | 4 |
| ConnectionStatus 組件 | `ConnectionStatus/ConnectionStatus.test.js` | 3 |
| socketService | `services/socketService.test.js` | 7 |
| authService | `firebase/authService.test.js` | 4 |
| gameService | `services/gameService.test.js` | 6 |
| **小計** | | **55** |

### 1.2 覆蓋率目標
- 目標覆蓋率：75%

---

## 二、測試案例清單

### 2.1 Login 組件測試 (UT-FE-01)
**檔案**：`frontend/src/components/Login/Login.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-01-01 | 渲染登入頁面 | 顯示品牌 Logo 和登入按鈕 |
| UT-FE-01-02 | Google 登入按鈕 | 點擊觸發 signInWithGoogle |
| UT-FE-01-03 | 匿名登入按鈕 | 點擊觸發 signInAnonymously |
| UT-FE-01-04 | 登入中狀態 | 顯示載入指示器，按鈕禁用 |
| UT-FE-01-05 | 登入錯誤處理 | 顯示錯誤訊息 |
| UT-FE-01-06 | 已登入重導向 | 導向大廳頁面 |

### 2.2 Lobby 組件測試 (UT-FE-02)
**檔案**：`frontend/src/components/Lobby/Lobby.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-02-01 | 渲染大廳頁面 | 顯示房間列表區域和創建按鈕 |
| UT-FE-02-02 | 顯示房間列表 | 正確顯示現有房間資訊 |
| UT-FE-02-03 | 房間顯示玩家數 | 顯示 2/4 等格式 |
| UT-FE-02-04 | 創建房間按鈕 | 點擊開啟創建對話框 |
| UT-FE-02-05 | 輸入玩家名稱 | 正確記錄名稱輸入 |
| UT-FE-02-06 | 選擇最大玩家數 | 可選擇 3 或 4 人 |
| UT-FE-02-07 | 加入房間 | 點擊房間可加入 |
| UT-FE-02-08 | 密碼房間處理 | 顯示鎖頭圖示，點擊後提示輸入密碼 |
| UT-FE-02-09 | 房間已滿處理 | 顯示已滿提示，按鈕禁用 |
| UT-FE-02-10 | 單人模式入口 | 可進入單人+AI模式 |

### 2.3 GameStatus 組件測試 (UT-FE-10)
**檔案**：`frontend/src/components/GameStatus/GameStatus.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-10-01 | 顯示玩家分數 | 正確顯示各玩家分數 |
| UT-FE-10-02 | 顯示遊戲階段 | 正確顯示當前階段文字 |
| UT-FE-10-03 | 顯示遊戲紀錄 | 顯示歷史操作列表 |
| UT-FE-10-04 | 標示當前玩家 | 用特殊樣式標示輪到誰 |
| UT-FE-10-05 | 標示已退出玩家 | 用特殊樣式標示已退出狀態 |

### 2.4 Profile 組件測試 (UT-FE-13)
**檔案**：`frontend/src/components/Profile/Profile.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-13-01 | 顯示玩家資訊 | 顯示名稱、頭像 |
| UT-FE-13-02 | 顯示遊戲統計 | 顯示勝場、勝率等 |
| UT-FE-13-03 | 顯示遊戲歷史 | 顯示最近遊戲記錄 |
| UT-FE-13-04 | 登出功能 | 點擊登出按鈕可登出 |

### 2.5 Friends 組件測試 (UT-FE-14)
**檔案**：`frontend/src/components/Friends/Friends.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-14-01 | 顯示好友列表 | 正確顯示好友清單 |
| UT-FE-14-02 | 搜尋玩家 | 輸入名稱可搜尋 |
| UT-FE-14-03 | 發送好友請求 | 點擊可發送請求 |
| UT-FE-14-04 | 顯示待處理請求 | 顯示收到的好友請求 |
| UT-FE-14-05 | 接受/拒絕請求 | 可接受或拒絕請求 |
| UT-FE-14-06 | 刪除好友 | 可刪除已有好友 |

### 2.6 Leaderboard 組件測試 (UT-FE-15)
**檔案**：`frontend/src/components/Leaderboard/Leaderboard.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-15-01 | 顯示排行榜 | 正確顯示排名列表 |
| UT-FE-15-02 | 顯示排名資訊 | 顯示名次、名稱、分數 |
| UT-FE-15-03 | 載入中狀態 | 顯示載入指示器 |
| UT-FE-15-04 | 載入失敗處理 | 顯示錯誤訊息 |

### 2.7 ConnectionStatus 組件測試 (UT-FE-16)
**檔案**：`frontend/src/components/ConnectionStatus/ConnectionStatus.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-16-01 | 已連線狀態 | 顯示綠色已連線指示 |
| UT-FE-16-02 | 斷線狀態 | 顯示紅色斷線指示 |
| UT-FE-16-03 | 重連中狀態 | 顯示黃色重連中指示 |

### 2.8 socketService 測試 (UT-FE-SVC-01)
**檔案**：`frontend/src/services/socketService.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-SVC-01-01 | initSocket | 成功初始化連線 |
| UT-FE-SVC-01-02 | createRoom | 發送 createRoom 事件 |
| UT-FE-SVC-01-03 | joinRoom | 發送 joinRoom 事件 |
| UT-FE-SVC-01-04 | leaveRoom | 發送 leaveRoom 事件並清除本地儲存 |
| UT-FE-SVC-01-05 | sendGameAction | 發送 gameAction 事件 |
| UT-FE-SVC-01-06 | 自動重連 | 斷線後自動嘗試重連 |
| UT-FE-SVC-01-07 | 心跳保活 | 定期發送 ping 事件 |

### 2.9 authService 測試 (UT-FE-SVC-02)
**檔案**：`frontend/src/firebase/authService.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-SVC-02-01 | signInWithGoogle | 調用 Firebase Google 登入 |
| UT-FE-SVC-02-02 | signInAnonymously | 調用 Firebase 匿名登入 |
| UT-FE-SVC-02-03 | signOut | 調用 Firebase 登出 |
| UT-FE-SVC-02-04 | onAuthStateChanged | 正確監聽登入狀態變化 |

### 2.10 gameService 測試 (UT-FE-SVC-03)
**檔案**：`frontend/src/services/gameService.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-FE-SVC-03-01 | 問牌動作處理 | 正確構建問牌動作物件 |
| UT-FE-SVC-03-02 | 猜牌動作處理 | 正確構建猜牌動作物件 |
| UT-FE-SVC-03-03 | 錯誤處理 | 正確返回錯誤物件 |
| UT-FE-SVC-03-04 | 遊戲狀態查詢 | 正確返回遊戲狀態 |
| UT-FE-SVC-03-05 | 玩家狀態查詢 | 正確返回玩家資訊 |
| UT-FE-SVC-03-06 | 驗證函數 | 正確驗證輸入參數 |

---

## 三、驗收標準

- [ ] 所有 55 個測試案例通過
- [ ] 覆蓋率達到 75%
- [ ] 無 console 錯誤或警告
- [ ] 所有服務正確 mock

---

## 四、執行命令

```bash
# 執行輔助組件測試
cd frontend && npm test -- --testPathPattern="components/(Login|Lobby|GameStatus|Profile|Friends|Leaderboard|ConnectionStatus)"

# 執行服務測試
cd frontend && npm test -- --testPathPattern="services/"

# 執行認證測試
cd frontend && npm test -- --testPathPattern="firebase/"

# 查看覆蓋率
cd frontend && npm test -- --coverage
```

---

## 五、測試檔案清單

| 檔案路徑 | 狀態 |
|---------|------|
| `frontend/src/components/Login/Login.test.js` | 已存在 |
| `frontend/src/components/Lobby/Lobby.test.js` | 已存在 |
| `frontend/src/components/GameStatus/GameStatus.test.js` | 已存在 |
| `frontend/src/components/Profile/Profile.test.js` | 已存在 |
| `frontend/src/components/Friends/Friends.test.js` | 已存在 |
| `frontend/src/components/Leaderboard/Leaderboard.test.js` | 已存在 |
| `frontend/src/components/ConnectionStatus/ConnectionStatus.test.js` | 已存在 |
| `frontend/src/services/socketService.test.js` | 已存在 |
| `frontend/src/firebase/authService.test.js` | 已存在 |
| `frontend/src/services/gameService.test.js` | 已存在 |
