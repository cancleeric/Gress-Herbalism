# 工作單 0142

**日期：** 2026-01-26

**工作單標題：** 修復玩家登入後資料未同步至後端問題

**工單主旨：** Bug 修復 - 登入後呼叫 syncPlayer 同步玩家資料

**優先級：** 高

**依賴工單：** 無

---

## 一、問題描述

### 現象
用戶登入後進入 Profile 頁面，顯示「載入資料失敗」錯誤。

### 根本原因
1. 用戶透過 Google 登入後，Firebase 認證成功
2. 但 AuthContext 沒有呼叫 `syncPlayer` 將用戶資料同步到後端資料庫
3. 後端 Players 表沒有該用戶記錄
4. API `/api/players/{uid}/stats` 回傳「玩家不存在」
5. Profile 頁面顯示載入失敗

### 影響範圍
- Profile 頁面無法顯示統計數據
- Leaderboard 不會有該玩家
- 任何需要 Players 表資料的功能都會失敗

---

## 二、修復方案

### 2.1 修改 AuthContext.js

在 `onAuthChange` 回調中，當用戶登入成功時呼叫 `syncPlayer`：

```javascript
import { syncPlayer } from '../services/apiService';

useEffect(() => {
  const unsubscribe = onAuthChange(async (state) => {
    if (state.isLoggedIn && state.user) {
      // 同步玩家資料到後端
      try {
        await syncPlayer({
          firebase_uid: state.user.uid,
          display_name: state.user.displayName || '玩家',
          email: state.user.email,
          avatar_url: state.user.photoURL,
        });
      } catch (err) {
        console.error('同步玩家資料失敗:', err);
      }
    }

    setAuthState({
      isLoading: false,
      isLoggedIn: state.isLoggedIn,
      user: state.user,
    });
  });

  return () => unsubscribe();
}, []);
```

---

## 三、修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `frontend/src/firebase/AuthContext.js` | 新增 syncPlayer 呼叫 |

---

## 四、驗收標準

- [ ] 用戶登入後，後端 Players 表有對應記錄
- [ ] Profile 頁面正常顯示統計數據（即使都是 0）
- [ ] 不再顯示「載入資料失敗」錯誤
- [ ] 訪客登入也能正常同步
- [ ] 重複登入不會產生重複記錄（後端 syncPlayer 應使用 upsert）

---

## 五、測試步驟

1. 清除瀏覽器快取或使用無痕模式
2. 用 Google 登入
3. 進入 Profile 頁面
4. 確認顯示統計數據（無錯誤訊息）
5. 檢查後端資料庫 Players 表有新記錄
