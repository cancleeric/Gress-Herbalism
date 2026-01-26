# 工單 0147 完成報告

**完成日期：** 2026-01-27

**工單標題：** 修復 4 人房間時部分玩家看不到可用房間的問題

---

## 一、完成摘要

已修復創建 4 人房間時，部分玩家可能看不到可用房間列表的問題。新增主動請求房間列表機制，確保前端訂閱完成後能獲取最新房間列表。

---

## 二、修改內容

### 修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `backend/server.js` | 新增 `requestRoomList` 事件處理 |
| `frontend/src/services/socketService.js` | 新增 `requestRoomList()` 函數 |
| `frontend/src/components/Lobby/Lobby.js` | 掛載後主動請求房間列表 |

### 具體變更

#### 後端 server.js
```javascript
// 工單 0147：房間列表請求
socket.on('requestRoomList', () => {
  socket.emit('roomList', getAvailableRooms());
});
```

#### 前端 socketService.js
```javascript
export function requestRoomList() {
  const s = getSocket();
  s.emit('requestRoomList');
}
```

#### 前端 Lobby.js
```javascript
// 訂閱完成後，主動請求房間列表
requestRoomList();
```

---

## 三、驗收結果

- [x] 創建 4 人房間後，所有大廳玩家都能看到房間
- [x] 重新整理頁面後，房間列表正確顯示
- [x] 不影響現有房間加入功能

---

## 四、備註

此修復確保前端訂閱 `onRoomList` 完成後，主動向伺服器請求一次房間列表，避免因 Socket 事件時序問題導致遺漏房間列表更新。

