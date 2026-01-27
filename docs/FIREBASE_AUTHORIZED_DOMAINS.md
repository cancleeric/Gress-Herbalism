# Firebase Authorized Domains 設定指南

## 為什麼需要設定

Firebase Authentication 的 Google 登入（`signInWithPopup`）會驗證請求來源網域是否在授權清單中。未授權的網域會收到 `auth/unauthorized-domain` 錯誤，導致 Google 登入失敗。

每次新增部署網域時，都需要到 Firebase Console 加入授權。

## 目前已授權的網域

| 網域 | 類型 | 用途 |
|------|------|------|
| `localhost` | Default | 本地開發 |
| `gress-6270d.firebaseapp.com` | Default | Firebase 預設 |
| `gress-6270d.web.app` | Default | Firebase Hosting |
| `gress-frontend-130514813450.asia-east1.run.app` | Custom | Cloud Run 前端（舊服務名） |
| `herbalism-frontend-130514813450.asia-east1.run.app` | Custom | Cloud Run 前端（生產環境） |

## 設定步驟

1. 前往 https://console.firebase.google.com
2. 選擇專案 **Gress**（`gress-6270d`）
3. 左側選單 → **Authentication**
4. 上方分頁切到 **設定**
5. 左側選擇 **授權網域**
6. 點擊 **新增網域**
7. 輸入要授權的網域，儲存

## 何時需要更新

- 新增 Cloud Run 服務（新網域）
- 綁定自訂網域（如 `game.example.com`）
- 新增其他部署環境（如 staging）

一般重新部署不需要更新，網域不會改變。
