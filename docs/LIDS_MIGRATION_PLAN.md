# LIDS SSO 遷移計劃 — 本草 / 演化論（Gress-Herbalism）

版本：v1.0  
日期：2026-06-14  
作者：gray（hDigital CPO）  
狀態：待 CEO 親審

---

## 背景

本草 / 演化論目前使用 Firebase Google 登入（及匿名登入）。生產環境（.199）因 `gress-6270d.firebaseapp.com` 並非已授權網域，導致 Google 登入在 .199 上直接失敗（`auth/unauthorized-domain`）。

集團方向：所有遊戲走統一 LIDS 帳號平台。十二獸首（antique-master-web）已完成 LIDS 整合，本計劃對齊其實作模式，將本草 / 演化論從 Firebase Google 遷移至 LIDS SSO。

---

## 1. 現況 Gap 分析

### 1.1 前端 Auth 結構

| 層次 | 現有檔案 | 內容 |
|------|---------|------|
| Firebase 設定 | `frontend/src/firebase/config.js` | Firebase app 初始化；**Firebase API Key 明文 hardcode 在程式碼中**（詳見 §6.1 安全警示） |
| Auth Service | `frontend/src/firebase/authService.js` | `signInWithGoogle`, `signInAnonymously`, `linkWithPopup`, `onAuthStateChanged` 等 Firebase SDK 呼叫 |
| Auth Context | `frontend/src/firebase/AuthContext.js` | `RealAuthProvider`：監聽 Firebase 狀態，登入後呼叫後端 `syncPlayer`、socket `setPresence` |
| Login UI | `frontend/src/components/common/Login/Login.js` | Google 按鈕 + 訪客按鈕；`isEvolution` 品牌切換（本草 vs 演化論）共用同一元件 |

### 1.2 後端 Auth 結構（關鍵發現）

後端**沒有 Firebase token 驗證 middleware**。所有 API 路由（`/api/players/sync`, `/api/friends/...` 等）以 HTTP body 或 query string 傳入的 `firebaseUid` 字串直接信任，不做 token 驗簽。

這是已存在的安全缺口，與本次遷移主線不同，計劃中一併處理。

| 後端依賴點 | 現況 |
|-----------|------|
| Supabase `players` 表欄位 | `firebase_uid`（VARCHAR）— 儲存 Firebase UID |
| `getOrCreatePlayer(displayName, firebaseUid)` | 以 `firebase_uid` 查找或建立玩家 |
| `getPlayerIdByFirebaseUid(firebaseUid)` | 所有好友/邀請/線上狀態 API 的入口函式 |
| Socket `setPresence` | 收到 `{ firebaseUid }` 查找 DB player_id |

### 1.3 部署現況

| 項目 | 值 |
|------|---|
| 前端容器 | `hd199-herbalism`（.199 單一閘道 8090，路徑 `/herbalism/`） |
| 前端 build 工具 | CRA（create-react-app / react-scripts 5.0.1），**非 Vite** |
| env 前綴 | `REACT_APP_*`（非 `VITE_*`） |
| LIDS Nautilus | `.199:8073`（squid-lids-dev 網段內可達） |
| 後端 | 獨立 Node.js Socket.io 服務（Supabase 作 DB） |

### 1.4 與 hd-portal（LIDS 參考實作）的差異

| 維度 | hd-portal（lids-adapter） | 本草（目前） | 本次目標 |
|------|--------------------------|-------------|---------|
| 框架 | Vite + React | CRA + React | CRA + React（維持） |
| OIDC 函式庫 | `oidc-client-ts` | Firebase SDK | `oidc-client-ts` |
| env 前綴 | `VITE_LIDS_*` | N/A | `REACT_APP_LIDS_*` |
| Client 類型 | Public（無 secret） | N/A | Public（無 secret） |
| Token 儲存 | sessionStorage | Firebase session | sessionStorage |
| Google 登入 | 無 | Firebase signInWithGoogle | 移除（改用 LIDS） |
| 訪客登入 | 無 | Firebase signInAnonymously | 保留（Firebase 匿名 OR 本機 stub） |
| Callback route | `/callback` | 無 | `/herbalism/callback` |

---

## 2. 遷移策略

### 採用方案：LIDS 取代 Google SSO，保留訪客登入

理由：
- 訪客登入（`signInAnonymously`）不依賴 Firebase 授權網域，是目前 .199 上唯一可用的登入途徑，不應在遷移期間拿掉。
- LIDS 取代「使用 Google 帳號登入」這個按鈕——使用者點擊後走 LIDS OIDC Auth Code + PKCE 流程，LIDS 內部可串接 Google 或其他 IdP。
- 訪客登入短期保留 Firebase `signInAnonymously`，或改為本機 UUID 訪客（不依賴 Firebase）；後者技術更乾淨，但工期較長，列為 Phase 2 選項。

### 帳號識別符遷移

後端 Supabase 目前以 `firebase_uid` 識別玩家。LIDS 登入後，使用者識別符改為 LIDS OIDC `sub`（UUID 格式）。

遷移策略：**欄位重命名 + 雙寫過渡**（見 §4 後端整合）。

---

## 3. 前端整合

### 3.1 新增依賴

```bash
cd frontend
npm install oidc-client-ts
```

注意：`oidc-client-ts` 是 ESM/CJS 混合套件，CRA 5（webpack 5）可直接安裝使用，無需額外設定。

### 3.2 新建 LIDS Auth Service

新增 `frontend/src/lids/lidsService.js`，對照 `hd-portal/src/auth/adapters/lids-adapter.ts`，但：
- 使用 `REACT_APP_LIDS_*` env 前綴（CRA 要求 `REACT_APP_` 前綴才會 build-time 注入）
- 讀取方式改為 `process.env.REACT_APP_LIDS_ISSUER`（非 `import.meta.env`）

核心設定：

```javascript
// frontend/src/lids/lidsService.js（骨架）
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const LIDS_ISSUER = process.env.REACT_APP_LIDS_ISSUER;
const LIDS_CLIENT_ID = process.env.REACT_APP_LIDS_CLIENT_ID;
const LIDS_REDIRECT_URI = process.env.REACT_APP_LIDS_REDIRECT_URI;
// ⛔ 無 client_secret（public client）

let _userManager = null;

export function getLidsUserManager() {
  if (_userManager) return _userManager;
  _userManager = new UserManager({
    authority: LIDS_ISSUER ?? 'http://localhost:8073',
    client_id: LIDS_CLIENT_ID ?? 'herbalism-dev',          // placeholder
    redirect_uri: LIDS_REDIRECT_URI ?? 'http://localhost:3000/herbalism/callback',
    scope: 'openid profile email',
    response_type: 'code',
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
    automaticSilentRenew: true,
    loadUserInfo: true,
  });
  return _userManager;
}
```

### 3.3 新增 OIDC Callback Route

CRA SPA 路由加一條 `/herbalism/callback`，對應 nginx `try_files` 已涵蓋此路徑（現有 nginx.conf 的 `/herbalism/` location 已有 SPA fallback，無需改 nginx）。

新增 `frontend/src/components/common/LidsCallback/LidsCallback.js`：
- `componentDidMount` / `useEffect` 呼叫 `userManager.signinRedirectCallback()`
- 成功後取得 OIDC User，呼叫後端 `syncPlayer`（改傳 `lidsUid: user.profile.sub`）
- 失敗顯示錯誤頁

在 `App.js` 的 router 加路由：

```jsx
<Route path="/herbalism/callback" element={<LidsCallback />} />
```

### 3.4 改寫 AuthContext

`RealAuthProvider` 改用 LIDS：
- 移除 `onAuthChange`（Firebase `onAuthStateChanged`）
- 改用 `userManager.events.addUserLoaded` / `addUserUnloaded`
- `loginWithGoogle` 改為 `loginWithLids`（呼叫 `userManager.signinRedirect()`）
- `upgradeToGoogle` 移除（LIDS 無此概念）
- `loginAsGuest` 短期維持 Firebase 匿名（或改本機 UUID，Phase 2 決定）
- context value 的 `user` 物件：`uid` 改從 `profile.sub` 取

### 3.5 改寫 Login UI

`Login.js` 調整：
- 按鈕文字：「使用 Google 帳號登入」→「使用颶風帳號登入（LIDS）」
- onClick：改呼叫 `loginWithLids()`
- 品牌切換邏輯（`isEvolution`）維持不變
- 移除 Firebase 錯誤碼對應（改為 OIDC 錯誤碼，或統一顯示「登入失敗」）

### 3.6 env 設定

新增至 `frontend/.env.example`（不含真值）：

```
REACT_APP_LIDS_ISSUER=
REACT_APP_LIDS_CLIENT_ID=
REACT_APP_LIDS_REDIRECT_URI=
```

生產 `.env.production`（.199 部署值）：

```
REACT_APP_LIDS_ISSUER=http://100.64.0.3:8073
REACT_APP_LIDS_CLIENT_ID=herbalism-prod            # 待 Kay 提供
REACT_APP_LIDS_REDIRECT_URI=http://100.64.0.3:8090/herbalism/callback
```

注意：LIDS issuer URL 用 Headscale tailnet IP（`100.64.0.3`），與 antique-master-web 部署慣例一致（LAN .199 IP 不可靠）。

---

## 4. 後端整合

### 4.1 現況問題

後端**完全沒有 token 驗證**。所有 API 以 HTTP body 傳入的 `firebaseUid` 字串直接信任，這不是 Firebase 的問題，而是設計缺口。

遷移後策略：**加入 LIDS OIDC token 驗證 middleware**，對齊十二獸首 `lidsAuth.ts` 的做法（使用 `jose` 函式庫 + JWKS 遠端驗簽）。

### 4.2 新增 LIDS JWT 驗證 middleware

新增 `backend/middleware/lidsAuth.js`：

```javascript
// backend/middleware/lidsAuth.js（骨架）
const { createRemoteJWKSet, jwtVerify } = require('jose');

const LIDS_ISSUER = process.env.LIDS_ISSUER ?? 'http://localhost:8073';
const jwksUrl = new URL(`${LIDS_ISSUER}/.well-known/jwks.json`);
const JWKS = createRemoteJWKSet(jwksUrl);

async function lidsAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未授權' });
  }
  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: LIDS_ISSUER });
    req.lidsUser = { sub: payload.sub, name: payload.name, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'token 無效' });
  }
}

module.exports = { lidsAuthMiddleware };
```

### 4.3 帳號識別符遷移（Supabase `players` 表）

現有欄位 `firebase_uid` 改用途為儲存「通用玩家 UID」（初期為 LIDS `sub`，舊資料為 Firebase UID）。

遷移步驟：

1. **欄位重命名**：`firebase_uid` → `player_uid`（需 DB migration，**須 Eric 親建 token** 授權，不在本計劃執行範圍）
2. **過渡期雙寫**：若無法立即重命名，可在後端 code 中將 `lidsUser.sub` 傳入現有 `getOrCreatePlayer(displayName, firebaseUid)` 函式，邏輯不變，只是 UID 來源改變
3. **舊 Firebase 帳號資料**：舊 `firebase_uid` 值與新 LIDS `sub` 不同，無法自動合併——舊測試資料可忽略；若有真實用戶資料，需要帳號遷移方案（本草目前為開發 / 小範圍測試用，可接受重置）

### 4.4 API 路由改寫

需改的路由（以 lidsUser.sub 取代 req.body.firebaseUid）：

| 路由 | 改法 |
|------|------|
| `POST /api/players/sync` | 移除 body 的 `firebaseUid`，改從 `req.lidsUser.sub` 取；套 `lidsAuthMiddleware` |
| `GET /api/players/:uid/stats` | `:uid` 改從 JWT sub 取或 param 驗證 |
| `GET /api/players/:uid/history` | 同上 |
| 所有好友 API（query `firebaseUid`） | 改從 JWT sub 取；套 middleware |
| Socket `setPresence` | handshake.auth.token 驗證（參考十二獸首 lidsAuth.ts）|

### 4.5 Socket.io 驗證

新增 `backend/middleware/lidsSocketAuth.js`（對照十二獸首 `lidsAuth.ts`），在 `server.js` 的 `io.use()` 中掛載。前端連線時在 handshake 帶入 access_token：

```javascript
// 前端 socketService.js 改寫
import { getLidsUserManager } from '../lids/lidsService';

async function getAccessToken() {
  const manager = getLidsUserManager();
  const user = await manager.getUser();
  return user?.access_token ?? null;
}

// socket 連線時帶 token
socket = io(SOCKET_URL, {
  auth: { token: await getAccessToken() }
});
```

---

## 5. LIDS Client 註冊依賴（跨公司）

LIDS 由 HurricaneTech（Kay）維護（Nautilus 服務，.199:8073）。

本次遷移需要 Kay 為本草 / 演化論新建一個 **public OIDC client**，設定如下：

| 參數 | 值 |
|------|---|
| Client ID | `herbalism-prod`（或 `herbalism-dev` + `herbalism-prod` 各一） |
| Client Type | Public（無 client_secret） |
| Grant Type | `authorization_code` |
| PKCE | 必須啟用（S256） |
| Redirect URIs（whitelist） | `http://100.64.0.3:8090/herbalism/callback`（生產）、`http://localhost:3000/herbalism/callback`（本機開發） |
| Post-logout Redirect URI | `http://100.64.0.3:8090/herbalism/` |
| Scopes | `openid profile email` |
| Token lifetime | 建議 access_token 1h，refresh_token 24h |

**跨公司聯絡限制：依集團鐵律，不可直接聯絡 Kay。需 Eric 出面協調 HurricaneTech 完成 client 建立。**

建議 Eric 以 email 傳送上表參數給 Kay，確認後取得 `client_id` 正式值才能完成 Phase 2 部署。

---

## 6. 安全注意事項

### 6.1 Firebase 明文 secrets — 立即標記

`frontend/src/firebase/config.js` 第 10-15 行，Firebase `apiKey`, `appId`, `messagingSenderId` 等值明文 hardcode 在程式碼中（非 env 變數）。

`frontend/.env.production` 同樣含明文 Firebase API Key。

Firebase Web API Key 本身是公開設計（前端 bundle 中一定存在），但 Auth Domain 被 `.199` 阻斷的問題說明這些 key 的授權設定有誤。

**行動項目**：
- 遷移完成後，將 Firebase SDK 依賴從前端完整移除（`frontend/package.json` 中的 `firebase ^12.8.0`）
- 移除後 `config.js`、`authService.js` 整個目錄可刪除
- Firebase console 停用 Web App 的 Google 登入 provider（若本草後端不再用 Firebase）
- Supabase anon key 也明文在 `backend/db/supabase.js`——此為 Supabase 設計（anon key 有 RLS 保護），但建議移至 env 變數，不留在 repo

### 6.2 Public Client 安全原則

- 無 `client_secret`（public client 不可有 secret）
- PKCE S256（`oidc-client-ts` 預設啟用）
- Token 存 `sessionStorage`（不存 `localStorage`）
- `redirect_uri` 必須完全比對 LIDS 白名單，不可用萬用字元
- OIDC state 參數由 `oidc-client-ts` 自動處理（防 CSRF）

### 6.3 後端不再信任 Client 傳來的 UID 字串

遷移後所有需要識別用戶的 API 一律以 Bearer JWT 驗簽後的 `sub` 為準，不接受 body/query 中的 uid 字串。這比現有 Firebase 方案更安全。

---

## 7. 部署與驗收

### 7.1 前端 Build 指令

CRA build 時注入 env（build-time bake）：

```bash
cd /Users/yinghaowang/HurricaneDigital/Gress-Herbalism/frontend
REACT_APP_LIDS_ISSUER=http://100.64.0.3:8073 \
REACT_APP_LIDS_CLIENT_ID=herbalism-prod \
REACT_APP_LIDS_REDIRECT_URI=http://100.64.0.3:8090/herbalism/callback \
npm run build
```

### 7.2 Docker 重建（.199 部署）

```bash
docker build -t hd199-herbalism-frontend ./frontend
# 停舊容器、啟新容器（Estella 執行，或依 hDigital 單一閘道流程）
```

### 7.3 CEO 親測驗收清單

1. 瀏覽器開 `http://100.64.0.3:8090/herbalism/`
2. 點「使用颶風帳號登入」按鈕
3. 確認跳轉至 LIDS 登入頁（`100.64.0.3:8073`）
4. 以集團帳號完成登入
5. 確認 callback 回到 `http://100.64.0.3:8090/herbalism/callback` 後自動跳轉至大廳
6. sessionStorage 中應有 LIDS User 物件（DevTools > Application > Session Storage）
7. 訪客登入仍可正常進入遊戲
8. 登出後 sessionStorage 清空
9. 演化論路徑（`/herbalism/#/evolution`）品牌顯示正確

---

## 8. 分階段執行

### Phase 1 — 可先行（不卡 LIDS client 建立）

目標：前端骨架搭好、本機開發可 import `oidc-client-ts`、placeholder env 值讓 build 通過。

| 任務 | 說明 | 擋路依賴 |
|------|------|---------|
| 1-A | 安裝 `oidc-client-ts` 依賴 | 無 |
| 1-B | 新建 `frontend/src/lids/lidsService.js`（placeholder env） | 無 |
| 1-C | 新增 `/herbalism/callback` 路由 + `LidsCallback.js` 骨架（可先回傳 「callback received」） | 無 |
| 1-D | 新增 `backend/middleware/lidsAuth.js`（jose + JWKS 驗簽） | 無（dev 環境無 LIDS 連線時 middleware bypass 掉即可） |
| 1-E | `backend/package.json` 加 `jose` 依賴 | 無 |
| 1-F | `.env.example` 加 LIDS env 項目 | 無 |

Phase 1 產出：前端 build 通過，`/herbalism/callback` 路由存在但不完整；LIDS 登入按鈕出現但點了走不通（LIDS client 尚未建立）。

### Phase 2 — 卡 LIDS client 建立（需 Eric/Kay）

前置條件：Kay 完成 `herbalism-prod` / `herbalism-dev` client 建立，回傳正式 `client_id`。

| 任務 | 說明 |
|------|------|
| 2-A | 填入 `.env` 與 `.env.production` 真值（LIDS_ISSUER, CLIENT_ID, REDIRECT_URI） |
| 2-B | `LidsCallback.js` 完整實作（`signinRedirectCallback` + `syncPlayer`） |
| 2-C | `AuthContext.js` 完整切換（移除 Firebase Google 登入，LIDS 取代） |
| 2-D | `Login.js` 按鈕文字改寫 |
| 2-E | `apiService.js` + `server.js` API 路由：`lidsAuthMiddleware` 套入，UID 來源改 JWT sub |
| 2-F | Socket 連線帶 access_token |
| 2-G | build + 重建 Docker + .199 部署 |
| 2-H | CEO 親測驗收（§7.3 清單） |

### Phase 3 — 選配（遷移完成後）

| 任務 | 說明 |
|------|------|
| 3-A | 移除 Firebase SDK 依賴（`firebase` 套件從 `package.json` 刪除） |
| 3-B | 刪除 `frontend/src/firebase/` 目錄 |
| 3-C | 訪客登入改本機 UUID（不依賴 Firebase `signInAnonymously`） |
| 3-D | Supabase `firebase_uid` 欄位重命名為 `player_uid`（**需 Eric 授權 DB migration token**） |

---

## 9. 風險與注意事項

### 最大風險：LIDS client 建立時間不確定

整個 Phase 2 卡在 HurricaneTech Kay 完成 client 建立。建議 Eric 儘早協調，提供 §5 的完整 client 參數。

### 次要風險：CRA 與 oidc-client-ts 相容性

`oidc-client-ts` 支援 CRA 5（webpack 5），但如果遇到 `TextEncoder` / crypto polyfill 問題（Node.js API 在 browser bundle），可能需要在 `config-overrides.js`（react-app-rewired）或 craco 中補 polyfill。Phase 1 裝完後立即跑 `npm run build` 確認。

### 訪客登入維持 Firebase 依賴

Phase 2 完成時，登入按鈕已切換至 LIDS，但訪客登入仍走 Firebase `signInAnonymously`。Firebase SDK 仍在 bundle 中。Phase 3-A~C 才完整去除 Firebase。這是刻意的分段設計，降低一次性變更風險。

### Supabase 帳號遷移

現有 Supabase 玩家資料以 Firebase UID 存入。Phase 2 切換後，LIDS 登入的用戶 `sub` 與舊 Firebase UID 不同，會被 `getOrCreatePlayer` 視為新玩家建檔。本草 / 演化論目前為小範圍測試階段，此影響可接受。若不可接受，需在 Phase 2 前協調 DBA 處理資料遷移（屬 DB migration，需 Eric 授權）。

---

## 附錄：需 Eric 出面的事項

| 項目 | 說明 |
|------|------|
| 協調 Kay 建立 LIDS public client | email Eric，轉達 §5 的 client 參數；不可直聯 Kay |
| 授權 Supabase 欄位重命名（Phase 3-D） | DB migration 需 Eric 親建 `/tmp/eric-auth-YYYYMMDD-herbalism-rename-player-uid.token` |
| 確認 .199 部署排程 | 找 HurricaneSoft Estella 安排容器重建時間窗口 |
