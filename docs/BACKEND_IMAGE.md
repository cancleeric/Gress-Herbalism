# 後端映像建置

後端會載入 `../shared/`。請從 repo 根目錄建置，不能用 `backend/` 當作 context：

```sh
docker build -f backend/Dockerfile -t herbalism-backend:candidate .
```

映像保留 `/app/backend`、`/app/shared` 相對目錄，以 Node 22 與非 root
`node` 使用者執行，只安裝 lockfile 的正式依賴。Dockerfile 專用 ignore 排除
本機 node_modules、所有 `.env`／`.env.*`、測試、建置產物及 repo 其他目錄。
設定必須在執行時由既有合法來源注入，不從開發機設定檔打包。

此命令只建置映像，不推送、不部署、不建立資料庫，也不選定正式環境。
`scripts/check-backend-image.cjs` 可在映像內以隔離網路執行啟動冒煙檢查：

```sh
docker run --network none -i --entrypoint node herbalism-backend:candidate \
  < scripts/check-backend-image.cjs
```

此檢查使用假設定、禁止 DB 連線，驗證 production 依賴、共享模組與 HTTP
健康端點，並確認非 root 與無開發設定檔。它不構成真庫／驗簽／多人可玩驗收。
容器不會自動刪除；完成後的精確資源回收依現行授權規則處理。

## 尚未修復／不可用作發布入口

- 根目錄 `Dockerfile`／`docker-compose.yml` 是舊整合樣板：前者引用不存在的
  根 `package.json`，且前端 build 缺少開發依賴；後者含非本案資料服務。
- 舊 `deploy.sh`／`deploy.bat` 使用子目錄 context／source deployment，未走
  develop → main → release，不可直接執行。
- 本次部署主機／網址、正式 PostgreSQL 設定來源、備份還原與發布線仍待確認。
