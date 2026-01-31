# 工作單 0218

## 編號
0218

## 日期
2026-01-31

## 工作單標題
更新前端組件引用路徑

## 工單主旨
資料夾結構重組 - 階段二

## 內容

### 目標
更新所有前端檔案中對已遷移組件的 import 路徑，並刪除舊的組件目錄。

### 需更新的檔案

1. **App.js** - 更新所有組件 import 路徑
2. **各組件內部引用** - 更新組件間的相互引用
3. **測試檔案** - 更新測試中的 import 路徑

### 路徑對照表

#### 共用組件
```javascript
// 舊路徑
import Login from './components/Login';
import Lobby from './components/Lobby';
// ...

// 新路徑
import { Login, Lobby, ... } from './components/common';
// 或
import Login from './components/common/Login';
```

#### 本草組件
```javascript
// 舊路徑
import GameRoom from './components/GameRoom';

// 新路徑
import { GameRoom } from './components/games/herbalism';
// 或
import GameRoom from './components/games/herbalism/GameRoom';
```

### 執行步驟

1. 更新 App.js 的 import 路徑
2. 更新各組件內部的相互引用
3. 更新測試檔案的 import 路徑
4. 執行 `npm start` 確認編譯成功
5. 刪除 components/ 根目錄下的舊組件目錄

### 驗收標準

- [ ] 所有 import 路徑已更新
- [ ] `npm start` 編譯成功
- [ ] 舊組件目錄已刪除
- [ ] 應用程式正常運行

### 依賴工單
- 0216（遷移共用組件）
- 0217（遷移本草組件）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
