# 工作單 0116

**日期：** 2026-01-25

**工作單標題：** 延長 LocalStorage 過期時間

**工單主旨：** BUG 修復 - 解決長時間遊戲後無法重連的問題

**計畫書：** [斷線重連問題修復計畫書](../docs/RECONNECT_FIX_PLAN.md)

**優先級：** 高

**依賴工單：** 無

---

## 一、問題描述

目前 LocalStorage 中儲存的房間資訊**只有 5 分鐘過期時間**，導致：

1. 一場遊戲超過 5 分鐘後，重整頁面無法重連
2. localStorage 資料被判定過期後自動清除
3. 玩家被迫回到大廳

**問題位置：** `frontend/src/utils/localStorage.js:111`

```javascript
const EXPIRY_TIME = 5 * 60 * 1000;  // 只有 5 分鐘
```

---

## 二、解決方案

將過期時間延長至 **2 小時**，足夠覆蓋絕大多數遊戲時長。

### 2.1 修改程式碼

**修改前：**
```javascript
// 檢查是否過期（5 分鐘）
const EXPIRY_TIME = 5 * 60 * 1000;
```

**修改後：**
```javascript
// 檢查是否過期（2 小時）
const EXPIRY_TIME = 2 * 60 * 60 * 1000;
```

### 2.2 新增常數說明

```javascript
/**
 * 房間資訊過期時間
 * 設為 2 小時，原因：
 * 1. 一場完整遊戲可能持續 30-60 分鐘
 * 2. 玩家可能中途休息後繼續
 * 3. 過期後自動清除，不會佔用空間
 */
const ROOM_INFO_EXPIRY_TIME = 2 * 60 * 60 * 1000; // 2 小時
```

---

## 三、修改清單

| 檔案 | 修改內容 |
|------|---------|
| `frontend/src/utils/localStorage.js` | 修改 `EXPIRY_TIME` 常數為 2 小時 |

---

## 四、完整修改後的 getCurrentRoom 函數

```javascript
/**
 * 取得儲存的房間資訊
 * @returns {object|null} 房間資訊，如果沒有或已過期則返回 null
 */
export function getCurrentRoom() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM);
    if (!data) return null;

    const roomInfo = JSON.parse(data);

    // 檢查是否過期（2 小時）
    const EXPIRY_TIME = 2 * 60 * 60 * 1000;
    if (Date.now() - roomInfo.timestamp > EXPIRY_TIME) {
      clearCurrentRoom();
      return null;
    }

    return roomInfo;
  } catch (e) {
    console.warn('無法從 localStorage 讀取房間資訊:', e);
    return null;
  }
}
```

---

## 五、測試案例

### 案例 1：5 分鐘後重連

**步驟：**
1. 玩家加入房間
2. 等待 5 分鐘
3. 按 F5 重整頁面

**預期結果：**
- localStorage 資料**未過期**
- 自動嘗試重連

### 案例 2：1 小時後重連

**步驟：**
1. 玩家加入房間
2. 等待 1 小時
3. 按 F5 重整頁面

**預期結果：**
- localStorage 資料**未過期**
- 自動嘗試重連

### 案例 3：超過 2 小時

**步驟：**
1. 玩家加入房間
2. 等待超過 2 小時
3. 按 F5 重整頁面

**預期結果：**
- localStorage 資料**已過期**
- 資料被清除
- 玩家回到大廳

---

## 六、驗收標準

- [ ] `EXPIRY_TIME` 修改為 2 小時（7200000 毫秒）
- [ ] 5 分鐘後重整仍能取得房間資訊
- [ ] 1 小時後重整仍能取得房間資訊
- [ ] 超過 2 小時後資料正確過期並清除
- [ ] 所有測試案例通過

---

## 七、注意事項

1. **選擇 2 小時的理由：**
   - 一場遊戲通常 30-60 分鐘
   - 預留緩衝時間給中途休息的情況
   - 2 小時足夠長，又不會無限期佔用 localStorage

2. **localStorage 空間考量：**
   - 房間資訊很小（約 100 bytes）
   - 不會造成 localStorage 空間問題
   - 過期後會自動清除

3. **與後端配合：**
   - 這個修改需要配合工單 0115（等待階段寬限期）
   - 即使 localStorage 資料存在，後端房間可能已不存在
   - 前端需要處理「重連失敗」的情況
