# 本機 Docker 自動 migration（離線候選，尚未實跑）

固定順序：驗證 Compose → build → 停止本專案前後端 → DB 健康 → 每次重新執行 migration 單次容器 → backend 健康 → frontend 健康。任一步非零即停止，不會自動刪容器、volume 或回滾資料。

正式入口候選為 `node scripts/deploy-local-docker.cjs`。本次授權只允許寫入及離線驗證，**不允許現在執行此部署命令、docker compose up/run 或 migration CLI**。正式本機 DB capability/精確 live scope 尚未齊備，不能以本腳本或設定環境變數替代正式 gate。

## 先決條件（不能自動假造）

- Compose v2 支援 service_completed_successfully、build secrets 與 up --wait；容器/網路/volume、18322 port 須完成公司登記及占用核對。固定 project `herbalism-local-issue3`，不碰其他專案。
- PG15 專用 volume，DB 不發布主機 port。已存在而來源不明的同名 volume 必須停止查核，不可接管。初建 owner/密碼及 app 身分仍須另案精確授權及受控供應，本腳本不建立 app role/grant/policy。
- `HERBALISM_DB_PASSWORD_FILE`：外部本機私人檔，僅 DB secret 使用；`HERBALISM_OWNER_ENV`：外部 owner env，含 DATABASE_URL，嚴格 db:5432/herbalism_db、herbalism_owner。
- `HERBALISM_APP_ENV`：外部 app env，固定 herbalism_app 的獨立 DATABASE_URL、真 FIREBASE_PROJECT_ID。CLI 在任何 Docker 呼叫前核對 owner/app 都是 db/herbalism_db，拒絕 owner 代用 app，核對 owner 與 bootstrap 密碼相符及公開 build config hash；不輸出 credential。app 權限/RLS 審核與驗證未完成前不得部署。
- `HERBALISM_PUBLIC_ENV` 與 `PUBLIC_CONFIG_SHA256`：僅既有公開 Firebase/前端設定；API URL 為此次 LAN origin 的 `/herbalism-api`，socket URL 為同 origin、path `/herbalism/socket.io`。既有 build validator 要求完整 http(s) URL，因此須固定本輪 LAN origin；不假稱可攜式相對 URL 已支援。禁止 E2E 假登入。
- 預設 frontend 只綁127.0.0.1:18322；多人 LAN 測玩須在已核准 scope 內顯式設定 HERBALISM_BIND_IP。外網/生產不在本方案。
- 實際 migration 前必須完成同一專用 DB 壓縮備份及真還原驗證，包含新空庫；本次未實作/執行 backup，不可把本部署腳本當成已具備完整 live 放行。

## migration 行為

獨立 owner 單次服務使用 Knex 最新版本入口，public.herbalism_local_migrations 持久記錄及框架鎖，僅載入 db/local-migrations 的 .cjs，不誤執行舊 offline candidate。001 將已核准的 base 三表與 replay candidate 合為一次初始化，五表 RLS default-deny；不建立角色/授權。Knex transaction 管理 DDL 與 history；禁止嵌套 BEGIN/COMMIT。schema 已存在但 history 未記錄時拒絕，不自動收編舊庫。

每次部署以 compose run 重新啟動 migration，既有 exit0 容器不替代新檢查。已套用版本由 Knex history 跳過；兩個同時 runner 依 Knex 鎖拒絕/序列化，不自行強制解鎖。新版本須新增 migration 並經精確授權，不修改已套用檔。down 拒絕破壞性回退，失敗保留資料並修正後重新部署。

離線驗證：`node --test scripts/deploy-local-docker.test.cjs backend/db/__tests__/localMigration.test.cjs`。全部用 mock，禁止連 DB；結果不能當真 PG、Compose、nginx 或多人驗收。仍需正式 live gate、備份還原、角色/RLS、真庫二次 no-op、3/4身分完整對局、斷線重連及容器重啟後戰績/重放讀回。
