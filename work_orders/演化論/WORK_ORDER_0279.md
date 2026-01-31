# 工作單 0279

## 編號
0279

## 日期
2026-01-31

## 標題
修復 EvolutionLobby 的 initialRoom 同步問題

## 主旨
BUG 修復 - 幽靈玩家問題

## 關聯計畫書
`BUG/BUG_PLAN_GHOST_PLAYER.md`

## 內容

### 問題
`EvolutionLobby` 組件使用 `useState(initialRoom)` 初始化 `room` 狀態，但 `useState` 的初始值只在首次渲染時使用。當父組件傳入的 `initialRoom` 變化時，子組件的 `room` 狀態不會自動更新。

### 修復方案

在 `EvolutionLobby.js` 中添加 useEffect 來同步 `initialRoom` prop 的變化：

```javascript
// 同步 initialRoom prop 變化
useEffect(() => {
  if (initialRoom) {
    setRoom(initialRoom);
  }
}, [initialRoom]);
```

### 修改檔案
- `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.js`

### 驗收標準
1. 當 `initialRoom` prop 變化時，`room` 狀態正確更新
2. 玩家列表正確顯示最新的房間成員

### 依賴工單
無

### 被依賴工單
- 0280, 0281, 0282
