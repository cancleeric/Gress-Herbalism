# 報告書 0280

## 工作單編號
0280

## 完成日期
2026-01-31

## 完成內容摘要

修復 EvolutionRoom 重複加入問題。

### 已完成項目

1. **添加 useLocation import**
```javascript
import { useParams, useNavigate, useLocation } from 'react-router-dom';
```

2. **從 location state 取得房間資料**
```javascript
const location = useLocation();
const initialRoomData = location.state?.room;
const isCreator = location.state?.isCreator;

// 使用 location state 中的房間資料初始化
const [room, setRoom] = useState(initialRoomData || null);
const [isJoined, setIsJoined] = useState(!!initialRoomData);
```

3. **修改加入房間邏輯**
```javascript
useEffect(() => {
  if (!roomId || !user?.uid || isJoined) return;

  // 如果是創建者或已經在房間中，直接設為已加入
  if (isCreator || (room && room.players?.some(p => p.id === user.uid))) {
    console.log('[EvolutionRoom] 已是房間成員，跳過加入請求');
    setIsJoined(true);
    return;
  }

  evoJoinRoom(roomId, { ... });
}, [roomId, user, isJoined, isCreator, room]);
```

### 修改檔案
- `frontend/src/components/games/evolution/EvolutionRoom/EvolutionRoom.js`

## 驗收結果
- [x] 房主創建房間後不會發送重複的加入請求

## 下一步
- 工單 0281：優化房間資料傳遞流程
