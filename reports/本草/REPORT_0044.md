# 完成報告 0044

**日期：** 2026-01-24

**工作單標題：** Bug 修復 - 「其中一種顏色全部」要牌方式的選擇權

**工單主旨：** Bug 修復 - 修正要牌方式二的互動邏輯

## 完成內容

### 1. 後端邏輯修改（backend/server.js）

#### 新增等待選擇狀態
```javascript
const pendingColorChoices = new Map();
```

#### 修改 processQuestionAction 函數
當 questionType === 2（其中一種顏色全部）時：
- 檢查被要牌玩家是否兩種顏色都有
- 如果兩種都有 → 返回 `requireColorChoice: true`，等待被要牌玩家選擇
- 如果只有一種 → 直接給該顏色全部
- 如果兩種都沒有 → 回應「沒有」

#### 新增 processColorChoice 函數
處理被要牌玩家選擇顏色後的給牌動作。

### 2. Socket.io 事件新增

#### 新增事件
- `colorChoiceRequired` - 通知被要牌玩家需要選擇
- `waitingForColorChoice` - 通知其他玩家正在等待選擇
- `colorChoiceSubmit` - 被要牌玩家提交選擇
- `colorChoiceResult` - 廣播選擇結果

### 3. 前端修改

#### socketService.js
新增函數：
- `onColorChoiceRequired` - 監聽顏色選擇請求
- `onWaitingForColorChoice` - 監聽等待顏色選擇
- `onColorChoiceResult` - 監聽顏色選擇結果
- `submitColorChoice` - 提交顏色選擇

#### GameRoom.js
- 新增狀態：`showColorChoice`, `colorChoiceData`, `waitingForColorChoice`, `colorChoiceInfo`
- 新增事件監聽處理
- 新增 `handleColorChoice` 函數
- 新增顏色選擇 Modal 介面
- 新增等待選擇提示 Overlay

#### GameRoom.css
新增樣式：
- `.color-choice-modal` - 顏色選擇對話框
- `.color-choice-card` - 選擇卡片樣式
- `.color-choice-buttons` - 顏色按鈕容器
- `.btn-color` - 顏色按鈕樣式
- `.waiting-overlay` - 等待遮罩
- `.waiting-message` - 等待訊息

## 流程說明

```
1. 玩家 A 選擇問牌方式：「其中一種顏色全部」（選了紅色和藍色）
2. 後端檢查玩家 B 的手牌
3. 情況一：玩家 B 只有紅色或只有藍色
   → 直接給該顏色全部
4. 情況二：玩家 B 紅色和藍色都有
   → 發送 colorChoiceRequired 事件給玩家 B
   → 顯示顏色選擇介面
   → 玩家 B 選擇後，提交 colorChoiceSubmit
   → 廣播結果並更新遊戲狀態
5. 情況三：玩家 B 兩種都沒有
   → 回應「沒有」
```

## 驗收結果

- [x] 被要牌玩家只有一種顏色時，自動給該顏色全部
- [x] 被要牌玩家兩種顏色都有時，顯示選擇介面
- [x] 被要牌玩家可以選擇給哪種顏色
- [x] 選擇後正確執行給牌
- [x] 其他玩家可以看到選擇過程（等待提示）
- [x] 遊戲歷史正確記錄這個互動（包含 chosenColor）

## 修改的檔案

1. `backend/server.js` - 後端邏輯和 Socket 事件
2. `frontend/src/services/socketService.js` - Socket 服務新增事件
3. `frontend/src/components/GameRoom/GameRoom.js` - 前端介面和邏輯
4. `frontend/src/components/GameRoom/GameRoom.css` - 樣式

## 測試說明

1. 創建房間，3-4 人加入
2. 開始遊戲
3. 輪到某玩家時，選擇「其中一種顏色全部」問牌方式
4. 選擇目標玩家和兩個顏色
5. 如果目標玩家兩種顏色都有，會看到顏色選擇介面
6. 目標玩家選擇後，牌會正確轉移
