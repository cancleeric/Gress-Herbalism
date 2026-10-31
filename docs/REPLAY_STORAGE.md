# 本草重放儲存介面：記憶體先行、DBA 後接

Eric11595：先用記憶體完成多人歷史/重放功能，DB/profile/migration 保持暫停。啟動 `node scripts/start-local-multiplayer.cjs`，backend 明確 REALTIME_ONLY=1、MEMORY_REPLAY=1、PERSISTENT_REPLAY=0；不載入 DB client、不建立 SQLite 檔或 schema。記憶體模式拒 production，也拒和 PERSISTENT_REPLAY 同時開啟；不因 DB 故障偷偷降級。

## 固定介面

- `append(frame)`：沿用 replayRecorder 產生的獨立 matchId、eventId、seq、起始固定 seats、事件 payload、已依各席位遮罩的 views、scores、winner、complete。seq 必須連續；相同 event retry 不重複寫入，gap/conflict/座位身分變動拒絕。記憶體操作不 yield 到一半，先檢查再更新。
- `history(firebaseUid)`：只回本人參賽的最新50筆，資料欄位維持現有 PostgreSQL store 的 matchId/status/startedAt/winner/rounds/participants，不送 UID。
- `replay(firebaseUid,matchId,after)`：非參賽者回 null，由API統一404；每頁最多100步，只回本人 seat 視角，不送其他人的手牌。DTO 與原 store 相同。
- 記憶體 store 額外提供 `storage={mode:'memory',persistent:false,...}` metadata；API/頁面明示暫存。PostgreSQL store 的 DTO 無須因本輪改動。

## 記憶體邊界

預設最多100場、單場5000步、事件總預算128MiB；只淘汰最舊已完成/中斷對局，不靜默丟棄進行中場次。達限制拒絕後續錄製並通知該房間，現有片段可讀但不是完整保存。讀寫皆複製資料，讀取者不能修改內部快照。重啟清空所有紀錄。

## DBA 接手

請保留上述介面及 per-viewer/參賽身分驗證、事件順序和冪等性。PostgreSQL 真正啟用前仍須完成既有 migration、角色/RLS、交易一致性、備份還原、二次 no-op 與重啟讀回；這輪沒有代執行任何一項。原 migration/source 授權不復活、不新增 profile、不輪替密碼。

### Eric11600：補齊 AI 練習記錄與統一歷史回放

AI 練習在 frontend/services/practiceReplayStore.js 的本分頁記憶體錄製，使用 createPracticeReplayRecorder / practiceHistory / practiceReplay。控制器的 onStateChange / onEvent 都接 recorder，不改遊戲規則；每場獨立 ai-UUID，uid分區、離開後標中斷、完成保留勝者分數。只存本人手牌與其他人的牌背；AI互相轉牌不留牌面，答案只在 guessResult 事件保留。DTO 沿用歷史摘要與frames格式；列表合併server多人與本分頁AI，明確標示模式。AI結果不會上傳充作server權威多人戰績。

AI 練習最多20場/3000步每場與32MiB序列化預算；容量達限中止錄製並通知，不靜默刪進行中的場次。重新整理或關閉分頁即消失，與多人server重啟清空是不同生命週期；頁面分別提示。缺少backend時仍可讀本分頁AI紀錄。帳號切換後只讀當前uid資料，非本人ai-id不回資料。

### Eric11603：完整動作，不只記轉牌結果

新增 questionAsked（playerId/targetPlayerId/questionType與當時可見的colors/giveColor/getColor）、guessMade（playerId/guessedColors）、followDecision（playerId/isFollowing）；本人的turnEnded另保留prediction。多人詢問顏色只放入詢問者/被詢問者的view.state.replayAction，不放共享event.payload，也不新廣播到live socket。既有JSON快照欄位即可承載，沒有migration。回放文字將當步replayAction與公開payload合併；不具可見權的視角明示顏色當時不可見。

AI控制器在轉牌/猜牌處理前送出意圖事件，既有CARD_TRANSFER仍代表結果；多人另外錄questionResolved或沿既有colorChoiceResult表示交牌。事件順序為動作→結果→回合結束。舊紀錄未錄到的意圖不得猜補，需要新局驗證。

UI名稱統一為「對局記錄／歷史回放」，保留播放/暫停/速度/逐步/跳局與事件跳轉，原始JSON偵錯內容改為可讀事件。好友/排行榜/玩家統計的永久資料 API 仍明確503，不假造資料成功。DBA接手時須分別處理權威多人資料與未驗證的本機AI練習，不直接拿client AI資料當競技積分。
