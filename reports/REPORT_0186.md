# 報告書 0186

## 工作單編號
0186

## 完成日期
2026-01-28

## 完成內容摘要

修復 Google 登入玩家頭像在遊戲房間中未顯示的問題。

### 修改檔案

#### `frontend/src/components/Lobby/Lobby.js`
- 4 處建立 player 物件的位置新增 `photoURL: user?.photoURL || null`
  - `handleCreateRoom`（第 272 行）
  - `handleQuickJoin`（第 305 行）
  - `handleJoinByRoomId`（第 343 行）
  - `handlePasswordSubmit`（第 366 行）

#### `frontend/src/components/GameRoom/GameRoom.js`
- 等待階段玩家列表頭像（第 1143 行）：條件從 `player.id === myPlayer?.id && authUser?.photoURL` 改為 `player.id === myPlayer?.id ? authUser?.photoURL : player.photoURL`
- 遊戲中玩家列表頭像（第 1397 行）：同上邏輯修改

## 遇到的問題與解決方案

### 問題：player 物件未攜帶 photoURL
- **原因**：Lobby.js 建立 player 物件時只包含 `id`、`name`、`firebaseUid`，未包含 `photoURL`
- **解決**：在所有 player 物件建立處加入 `photoURL` 欄位

### 問題：GameRoom 頭像邏輯只支援自己
- **原因**：`player.id === myPlayer?.id && authUser?.photoURL` 條件使得只有自己的頭像能顯示圖片，其他玩家永遠走文字分支
- **解決**：改為三元運算式，自己用 `authUser.photoURL`，其他玩家用 `player.photoURL`

## 測試結果
- 前端編譯成功（Compiled successfully）

## 下一步計劃
- 無額外工作需求
