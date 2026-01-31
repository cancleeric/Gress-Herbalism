# 報告書 0279

## 工作單編號
0279

## 完成日期
2026-01-31

## 完成內容摘要

修復 EvolutionLobby 的 initialRoom 同步問題。

### 已完成項目

在 `EvolutionLobby.js` 中添加 useEffect 來同步 `initialRoom` prop 的變化：

```javascript
// 工單 0279：同步 initialRoom prop 變化
useEffect(() => {
  if (initialRoom) {
    console.log('[EvolutionLobby] initialRoom 更新:', initialRoom.players?.map(p => p.name));
    setRoom(initialRoom);
  }
}, [initialRoom]);
```

### 修改檔案
- `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.js`

## 驗收結果
- [x] 當 `initialRoom` prop 變化時，`room` 狀態正確更新

## 下一步
- 工單 0280：修復 EvolutionRoom 重複加入問題
