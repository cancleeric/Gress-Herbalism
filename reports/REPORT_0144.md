# 工單 0144 完成報告

**完成日期：** 2026-01-26

**工單標題：** 修復遊戲紀錄未顯示給牌數量的問題

---

## 一、完成摘要

已修復遊戲紀錄中問牌動作未顯示給牌數量的問題。現在遊戲紀錄會完整顯示問牌時獲得的牌數。

---

## 二、修改內容

### 修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `frontend/src/components/GameRoom/GameRoom.js` | formatHistoryRecord 函數加入 cardsTransferred 顯示 |

### 具體變更

修改 `formatHistoryRecord` 函數中的 `question` case：

**修改前：**
```javascript
action: `向 ${targetPlayer?.name || '玩家'} 問了 ${colors} 牌（${typeText}）`
```

**修改後：**
```javascript
const cardsCount = record.cardsTransferred || 0;
action: `向 ${targetPlayer?.name || '玩家'} 問了 ${colors} 牌（${typeText}），獲得 ${cardsCount} 張`
```

---

## 三、驗收結果

- [x] 問牌後，遊戲紀錄顯示獲得的牌數
- [x] 獲得 0 張時顯示「獲得 0 張」
- [x] 不影響其他類型的遊戲紀錄
- [x] 紀錄格式清晰易讀

---

## 四、顯示效果

**修改前：**
```
玩家A 向 玩家B 問了 紅黃 牌（各一張）
```

**修改後：**
```
玩家A 向 玩家B 問了 紅黃 牌（各一張），獲得 2 張
```

---

## 五、備註

此修復利用後端已經傳送的 `cardsTransferred` 欄位，無需修改後端程式碼。

