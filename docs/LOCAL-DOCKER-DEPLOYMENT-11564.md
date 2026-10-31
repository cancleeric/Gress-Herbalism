# 本草 #3 / 11564 — local Docker 部署整合候選

## 實際交付界線

沿用 runtime-deps-11367，不另建工程線；deploy.sh 僅新增 local 分流，原 production runner 不變。`bash deploy.sh --local-docker --check` 唯讀正式 catalog/registry，缺件 exit 2。其他 local 參數一律在呼叫 gate 前拒絕。沒有 CLI 執行 adapter；即使未來有人新增同名 action，仍不會自動解鎖。

`scripts/deploy-local-docker.cjs` 的 sequence 是候選順序控制器；validateEvidence 是候選收據契約檢查，不具 DB 權限，也不是實際健康驗證器。六項 node:test 使用明標 offline doubles，只證明拒絕／中止／排序；不代表真部署。沒有新增 Compose、SQL、migration、role、secret 或啟動容器。既有 Compose 舊模板尚不能用；不能宣稱整體自動化。

## 正式來源核對（2026-10-31）

根目錄 `/Users/yinghaowang/HurricaneSoft/hurricane-authorization-hub`：

- `bin/hauth-gate.js catalog`：沒有 `herbalism.local-docker.deploy`。
- `config/agent-actions.json`：沒有本草 local action/runner。
- `config/project-registry.v1.json`：herbalism 是 prod，僅 herbalism-prod / 127.0.0.1:15436 / cloud-sql-proxy / herbalism_db，不能借用。
- `bin/primitive-db-batch.js`：核准 batch capability、固定 SQL materials 與步驟；不提供 Docker bootstrap、create DB 或 framework migration history/no-op。
- `bin/primitive-db-step.js`：backup 是 custom dump；prod 分支檢查大小與 archive list，這不是真還原。restore-verify 分支為既有 shape SQL 比對，不等於本次隔離還原資料庫初始化。

未執行受拒 inventory；未改 installed hook、guard、catalog、registry 或 runner。

## 待正式審查的具名補件（不是已註冊 API）

- action：`herbalism.local-docker.deploy`，agent Samantha；單次完整 scope。
- runner source：`/Users/yinghaowang/HurricaneSoft/hurricane-authorization-hub/bin/herbalism-local-docker.js`（尚不存在／未安裝，不在本輪自行建立）。
- catalog source：同根 `config/agent-actions.json`；local profile 解析須由 hAuth owner 設計為與 prod 並存，不能覆寫現役 prod profile。本候選 registration checker 僅接受明示 local profile，現役必拒。
- params（禁止額外欄位）：projectId=`herbalism`、environment=`local`、target=`herbalism-local-issue3`、issue=`3`、purpose=`local-docker-init-upgrade-11564`、sourceDigest、materialDigest、composeDigest（均64hex），backendImage/frontendImage/postgresImage（固定審過的 sha256 image），mode=`bootstrap|upgrade`。
- 待定稿 source：本工作樹專用 `compose.local-herbalism.yml` 與 `frontend/nginx.local-herbalism.conf`；必須綁 Compose bytes、image identities、network/volume、無 DB host port、既有合法 credential reference。不得使用舊 nicholas Compose 或任意 env command。這些尚未生成，不虛構 digest。
- 精確資源候選：Compose project/network `herbalism-local-issue3` / `herbalism-local-issue3-net`；PG15 volume `herbalism-local-issue3-pgdata`；主 DB `herbalism_db`、schema `herbalism`；隔離 restore target `herbalism-local-issue3-restore`。實際容器 ID、映像 digest、backup root、工具 hashes、app/owner role 來源與 port 占用／Wiki 登記仍待合法定稿，名稱不是執行授權。

## runner 必須實作的固定 effects／七階段

1. target-approval：gate-only binding＋當次精確核准；固定 source/material/Compose/image hashes、local 資源 ownership、單靶 lock；任一不同／既有不明資源停止。不執行 shell 參數，禁止承接 prod DB/env/capability。
2. pg-ready：核准後才啟動固定 PG15 service；驗容器身份、network、volume、DB 與 readiness；無 host PG port、不建任意角色／不供新 secret。
3. backup-restore：bootstrap 與 upgrade 都先 custom 壓縮備份（空庫亦不可套 prod >100KB 規則），在明列隔離 restore target 真還原並驗內容，保留收據；只列 archive 不通過。
4. migration：一次性 deployment job 呼叫另經審核 framework runner；固定 migration/material hashes；history 記錄決定 pending，只套尚未套用項目；禁止 app startup DDL、禁止重套完整 schema、禁止自動 down。
5. history-noop-app-permissions：真 history／constraints 檢核，第二次 runner applied=0；app role 最小權限及 owner 隔離／schema route 驗證。現有離線 candidate export 不當作現成可執行 runner。
6. backend-frontend：前五步全部成功後才起精確映像；nginx 單一來源 API/WebSocket，真 Firebase；不允許 REALTIME_ONLY/in-memory 冒充保存。
7. health-persistent-readback：容器來源／health、真寫入、正常重啟後同身分歷史與 replay 真讀回；3/4身分完整玩法另依 DOCKER-ACCEPTANCE-11564，不能將本契約當該矩陣 PASS。

每階段 evidenceDigest 綁當次 request/source/material/Compose；任何 timeout、空收據、錯靶、缺證或失敗即停止，不繼續 app、不回傳 succeeded、不刪資料、不自動破壞性 rollback。重跑須新核准、重新驗靶／備份；history no-op 不代表可跳備份與權限檢核。

## 最後 DB/gate 待審 scope

正式 local catalog/runner/profile 缺失；可執行 migration runner/history、最終 Compose/nginx 及精確材料 hashes 尚缺。需另審 PG 初始化/主庫與還原庫、壓縮備份真還原、migration/history DDL、權限檢核涉及的既有 role、真交易與重啟讀回之單次精確 scope。若需創 role/新 secret，必須另列，不能默默擴入。上述未定稿前不索取授權碼、不建立 scope token。

## 本輪驗證

- `node --test scripts/deploy-local-docker.test.cjs`：6/6 PASS，純離線，不是真 gate/deploy。
- `bash -n deploy.sh`、`node --check scripts/deploy-local-docker.cjs`：PASS。
- 真 `bash deploy.sh --local-docker --check`：exit 2，五項阻礙：LOCAL_ACTION_NOT_REGISTERED、LOCAL_RUNNER_NOT_REGISTERED、LOCAL_TARGET_NOT_REGISTERED、REVIEWED_LOCAL_EXECUTION_ADAPTER_PENDING、EXACT_DB_SCOPE_PENDING。
- Eye 原 release 2 references；新 sequence 7 references（1 AST/high、6 heuristic/medium）；不是完整對抗審查放行。首次多餘 --dir 被 CLI 拒絕，移除後正常分析。
- OLM help connection refused，主模型 fallback。未 commit/push/merge；其他人的既有 dirty source 不覆寫。production 腳本 bytes 未改。
