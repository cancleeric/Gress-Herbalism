# 工作單 0280

## 編號
0280

## 日期
2026-01-31

## 標題
修復 EvolutionRoom 重複加入問題

## 主旨
BUG 修復 - 幽靈玩家問題

## 關聯計畫書
`BUG/BUG_PLAN_GHOST_PLAYER.md`

## 內容

### 問題
當房主從 `EvolutionLobbyPage` 創建房間後導航到 `EvolutionRoom`，`EvolutionRoom` 會再次呼叫 `evoJoinRoom`，但房主在 `createRoom` 時已經加入房間了。這會導致：
1. 不必要的加入請求
2. 可能在加入/響應過程中，其他玩家的狀態變化未被正確同步

### 修復方案

修改 `EvolutionRoom.js` 的加入邏輯：

1. 接收 location state 中的房間資料
2. 判斷當前用戶是否已經是房間成員
3. 如果是房主或已在房間中，直接設為已加入，不需要再次呼叫 `evoJoinRoom`

```javascript
import { useLocation } from 'react-router-dom';

// ...

const location = useLocation();
const initialRoomData = location.state?.room;
const isCreator = location.state?.isCreator;

// 初始化 room 狀態時使用 location state
const [room, setRoom] = useState(initialRoomData || null);
const [isJoined, setIsJoined] = useState(!!initialRoomData);

// 加入房間邏輯
useEffect(() => {
  if (!roomId || !user?.uid || isJoined) return;

  // 如果已經有 room 資料且當前用戶已在房間中，直接設為已加入
  if (room && room.players?.some(p => p.id === user.uid)) {
    setIsJoined(true);
    return;
  }

  evoJoinRoom(roomId, { ... });
}, [roomId, user, isJoined, room]);
```

### 修改檔案
- `frontend/src/components/games/evolution/EvolutionRoom/EvolutionRoom.js`

### 驗收標準
1. 房主創建房間後不會發送重複的加入請求
2. 房間成員列表正確顯示

### 依賴工單
- 0279

### 被依賴工單
- 0281, 0282
