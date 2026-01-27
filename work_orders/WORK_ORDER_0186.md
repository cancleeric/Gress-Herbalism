# 工作單 0186

## 編號
0186

## 日期
2026-01-28

## 工作單標題
Bug 修復 — Google 登入玩家頭像未顯示於遊戲房間

## 工單主旨
修復 Google 登入玩家在遊戲房間中只顯示文字佔位符、未顯示 Google 帳號頭像的問題。

## 內容

### 問題描述
Google 登入的玩家在遊戲房間的玩家列表中，只有自己能看到自己的 Google 頭像，其他玩家看到的是文字首字母佔位符。原因是：
1. Lobby.js 建立 player 物件時未包含 `photoURL`
2. GameRoom.js 頭像顯示邏輯只對「自己」使用 `authUser.photoURL`，其他玩家沒有 photoURL 資料

### 修改檔案

#### `frontend/src/components/Lobby/Lobby.js`
- 4 處建立 player 物件的位置（createRoom、quickJoin、joinByRoomId、passwordSubmit）加入 `photoURL: user?.photoURL || null`

#### `frontend/src/components/GameRoom/GameRoom.js`
- 等待階段玩家列表（約第 1143 行）：改為自己用 `authUser.photoURL`、其他玩家用 `player.photoURL`
- 遊戲中玩家列表（約第 1397 行）：同上邏輯

### 驗收標準
1. Google 登入玩家的頭像在遊戲房間中對所有人可見
2. 訪客玩家仍顯示文字首字母佔位符
3. 不影響現有遊戲功能
