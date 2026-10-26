# 前端映像建置

從 repo 根目錄，以既有合法來源提供的**公開前端設定**建置：

```sh
PUBLIC_CONFIG_SHA256=$(shasum -a 256 /private/path/frontend-public.env | cut -d ' ' -f 1)
docker build -f frontend/Dockerfile \
  --secret id=frontend_env,src=/private/path/frontend-public.env \
  --build-arg PUBLIC_CONFIG_SHA256="$PUBLIC_CONFIG_SHA256" \
  -t herbalism-frontend:candidate .
```

設定檔需要六項 `REACT_APP_FIREBASE_*`（見前端 `.env.example`）、
`REACT_APP_API_URL`、`REACT_APP_SOCKET_URL`、`REACT_APP_SOCKET_PATH`。
不提供預設部署目標；socket path 必須與後端／閘道一致。
可選 LIDS 的 ENABLED／ISSUER／CLIENT_ID／REDIRECT_URI；開啟時必須齊備。
拒絕其他 key、變數插值與 E2E 假登入。缺值／hash 不符會停止建置。
建置子程序僅繼承 OS 基礎路徑，排除外部 CRA／npm／Node 開關；不讓
呼叫端 PUBLIC_URL 或額外 REACT_APP_* 改變已驗設定。

所有前端設定都會編入公開 JS，**不能放服務端密碼、service key 或 token**。
secret mount 僅避免原始 env 檔留在映像層，不會讓前端設定保密。
Docker 不以 secret 內容使快取失效，因此每次更新設定都必須重新計算 hash。
此方式依 [Docker build secrets](https://docs.docker.com/build/building/secrets/) 的暫掛入口。
hash 驗證只在該 RUN 實際執行時發生；呼叫端若故意沿用舊 hash，Docker
可能直接取舊快取而不讀新設定。上列重算步驟不可省略。

專用 ignore 排除所有 `.env*`、本機 node_modules、build 與測試。
builder 安裝含 build 工具的 lockfile 依賴、不下載 Cypress binary；runtime
僅 nginx 與 build，關閉 source maps，不包含 Node、原始碼或設定檔。

`/` 導向 `/herbalism/`；SPA 路由讀 index 且 no-store；指紋 static 資源
長快取、缺失資源 404；非指紋資源重新驗證。`/healthz` 僅驗 nginx，
不宣稱 API、登入或資料庫可用。路由依 [nginx try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)。

暫時以僅 loopback 的動態 port 啟動該映像後，可執行
`python3 scripts/check-frontend-image.py http://127.0.0.1:<port>` 檢查 redirect、
SPA深連結、index不快取、JS/CSS與缺失資源404。它不接API或外部服務。

這是獨立映像建置入口，不推送／部署／開服務，不能取代正式發布線與真登入、
多人及真庫驗收；舊 root Dockerfile、compose、deploy 腳本仍不可直接用。
