# 功能測試計畫書：玩家資料與好友系統

**建立日期**：2026-01-27

**測試範圍**：玩家資料（Profile）功能、好友（Friends）功能

---

## 一、現狀分析

### 玩家資料功能

經程式碼審查，發現以下關鍵問題：

| 嚴重度 | 問題 | 位置 | 說明 |
|--------|------|------|------|
| P0 | `updatePlayerGameStats` 未被呼叫 | `server.js:1779-1809` | `saveGameToDatabase` 只存遊戲記錄和參與者，但**未更新玩家統計**（games_played、games_won 等），導致 Profile 頁面統計數據永遠不更新 |
| P0 | `game_participants.player_id` 全為 NULL | `supabase.js:143-162` | `saveGameParticipants` 沒有傳入 `player_id`，導致無法追蹤哪個 Google 玩家參與了哪場遊戲，玩家歷史記錄查詢永遠為空 |
| P0 | 臨時玩家 ID 與 Firebase UID 未關聯 | `server.js` | 遊戲中的 `player.id` 是臨時 ID，遊戲結束時無法對應到 Supabase 的 `players` 表 |
| P1 | `game_history.winner_id` 未保存 | `supabase.js:112-136` | `saveGameRecord` 沒有傳入 `winner_id`，無法正確統計勝利次數 |
| P1 | 匿名玩家可進入 Profile | `Profile.js:22-25` | 只檢查 `user?.uid`，未檢查 `user?.isAnonymous`，訪客能看到空白的 Profile 頁面 |

### 好友功能

| 嚴重度 | 問題 | 位置 | 說明 |
|--------|------|------|------|
| P0 | 線上狀態從未更新 | `server.js` | Socket.io 連線/斷線時未呼叫 `presenceService`，好友的線上狀態永遠不會變化 |
| P1 | 缺少即時通知 | `server.js` | 好友請求和遊戲邀請沒有 Socket.io 推送，只靠手動重新整理才看得到 |
| P1 | 大廳無好友請求徽章 | `Lobby.js` | 好友按鈕不顯示待處理請求數量，玩家不知道有人加好友 |
| P2 | 多步驟操作無事務保護 | `friendService.js:96-131` | 接受好友請求執行多個資料庫操作，中途失敗可能造成資料不一致 |
| P2 | presenceService 無測試 | — | 線上狀態服務完全沒有單元測試 |

---

## 二、測試項目

### A. 玩家資料功能測試

#### A1. 玩家同步測試
| 編號 | 測試項目 | 預期結果 |
|------|---------|---------|
| A1-1 | Google 登入後同步玩家資料 | Supabase `players` 表建立記錄，含 `firebase_uid`、`display_name`、`email` |
| A1-2 | 重複登入不重複建立 | 同一 Firebase UID 只對應一筆 `players` 記錄 |
| A1-3 | 匿名登入是否同步 | 匿名玩家也會同步，但 Profile 應阻止訪客存取 |

#### A2. 遊戲記錄儲存測試
| 編號 | 測試項目 | 預期結果 |
|------|---------|---------|
| A2-1 | 遊戲結束存入 `game_history` | 正確記錄 game_id、winner_name、player_count、rounds_played |
| A2-2 | 參與者存入 `game_participants` | 每位玩家一筆記錄，含 `player_id`（非 NULL）、final_score、is_winner |
| A2-3 | 玩家統計更新 | 遊戲結束後 `players` 表的 games_played +1，勝者 games_won +1 |
| A2-4 | 勝利者 winner_id 記錄 | `game_history.winner_id` 正確關聯到 `players` 表 |

#### A3. Profile 頁面顯示測試
| 編號 | 測試項目 | 預期結果 |
|------|---------|---------|
| A3-1 | Google 登入玩家查看統計 | 顯示正確的 games_played、games_won、win_rate、total_score |
| A3-2 | Google 登入玩家查看歷史 | 顯示每場遊戲的勝負、得分、人數、局數、日期 |
| A3-3 | 新玩家（無遊戲紀錄） | 統計全為 0，歷史顯示「還沒有遊戲記錄」 |
| A3-4 | 匿名玩家進入 Profile | 應阻止進入或顯示提示訊息 |
| A3-5 | API 載入失敗 | 顯示錯誤訊息，不顯示空白數據 |

### B. 好友功能測試

#### B1. 搜尋與加好友測試
| 編號 | 測試項目 | 預期結果 |
|------|---------|---------|
| B1-1 | 用 Google 帳號名稱搜尋 | 找到對應玩家，支援部分匹配 |
| B1-2 | 搜尋結果排除自己 | 不會搜到自己 |
| B1-3 | 搜尋結果排除已加好友 | 已是好友的不顯示 |
| B1-4 | 發送好友請求 | 建立 pending 狀態的 friend_request |
| B1-5 | 重複發送請求 | 提示「已經發送過好友請求了」 |
| B1-6 | 雙向互加（自動接受） | A 加 B 且 B 也加 A 時，自動建立好友關係 |

#### B2. 好友請求管理測試
| 編號 | 測試項目 | 預期結果 |
|------|---------|---------|
| B2-1 | 查看待處理請求 | 顯示請求者名稱和發送時間 |
| B2-2 | 接受好友請求 | 建立雙向好友關係，請求狀態更新為 accepted |
| B2-3 | 拒絕好友請求 | 請求狀態更新為 rejected |
| B2-4 | 刪除好友 | 移除雙向好友關係 |

#### B3. 線上狀態測試
| 編號 | 測試項目 | 預期結果 |
|------|---------|---------|
| B3-1 | 好友上線 | 狀態從離線變為線上（綠點） |
| B3-2 | 好友進入遊戲 | 狀態變為遊戲中（金點） |
| B3-3 | 好友斷線 | 狀態變為離線（灰點） |

#### B4. 遊戲邀請測試
| 編號 | 測試項目 | 預期結果 |
|------|---------|---------|
| B4-1 | 向好友發送遊戲邀請 | 建立邀請記錄，含 room_id |
| B4-2 | 接受遊戲邀請 | 返回 room_id，可加入房間 |
| B4-3 | 拒絕遊戲邀請 | 邀請狀態更新為 rejected |
| B4-4 | 邀請過期 | 超過過期時間後不顯示 |

---

## 三、實施計畫

修復順序依據依賴關係和嚴重度排列：

### 工單 0174：後端 — 遊戲結束時正確保存玩家資料

修復核心資料流問題（P0），使遊戲結果能正確關聯到 Google 登入玩家：

1. 在玩家加入房間時保存 `firebaseUid` 到 `gameState`
2. 修改 `saveGameToDatabase` 傳入 `player_id` 和 `winner_id`
3. 修改 `saveGameParticipants` 寫入 `player_id`
4. 修改 `saveGameRecord` 寫入 `winner_id`
5. 呼叫 `updatePlayerGameStats` 更新每位玩家的統計數據

### 工單 0175：前端 — Profile 頁面修正

修復 Profile 頁面的顯示問題（P1）：

1. 阻止匿名玩家進入 Profile 頁面
2. 改善錯誤處理（區分 API 失敗和空資料）

### 工單 0176：後端 — 好友線上狀態自動更新

修復線上狀態從未更新的問題（P0）：

1. Socket.io 連線時呼叫 `presenceService.setOnline`
2. Socket.io 斷線時呼叫 `presenceService.setOffline`
3. 加入遊戲房間時呼叫 `presenceService.setInGame`
4. 離開遊戲房間時恢復為 online

### 工單 0177：功能驗證測試

對修復後的功能進行完整驗證：

1. 執行所有 A 類測試項目
2. 執行所有 B 類測試項目
3. 確認既有測試通過

---

## 四、工單依賴關係

```
0174 (後端資料保存修復)
  ↓
0175 (前端 Profile 修正) ← 依賴 0174 提供正確資料
  ↓
0176 (好友線上狀態) ← 獨立，可與 0175 並行
  ↓
0177 (功能驗證) ← 依賴前三張工單
```

---

*計畫書建立時間: 2026-01-27*
