# 報告書 0168

**工作單編號**：0168

**完成日期**：2026-01-27

**工作單標題**：Firebase Console 授權網域設定指南

---

## 一、完成內容摘要

建立 Firebase Authorized Domains 操作指南文件，並完成 Firebase Console 授權網域設定。

### 完成項目

1. **Firebase Console 設定**（手動操作）：在 Firebase Console → Authentication → Settings → Authorized domains 中新增了以下 Custom 網域：
   - `gress-frontend-130514813450.asia-east1.run.app`
   - `herbalism-frontend-130514813450.asia-east1.run.app`

2. **操作指南文件**：建立 `docs/FIREBASE_AUTHORIZED_DOMAINS.md`，包含：
   - 授權網域的用途說明
   - 目前已授權網域清單
   - Firebase Console 操作步驟
   - 何時需要更新的說明

### 未執行項目

- 未修改 `deploy.sh` 加入提醒：由於授權網域是一次性設定，且已有操作指南文件，在部署腳本中加入每次都顯示的提醒意義不大，故略過。

---

## 二、遇到的問題與解決方案

| 問題 | 解決方案 |
|------|----------|
| 發現已有兩個 Cloud Run 網域（`gress-frontend-` 和 `herbalism-frontend-`） | 兩個都已加入授權清單 |

---

## 三、測試結果

Firebase Console 已確認顯示 5 個已授權網域（3 Default + 2 Custom）。Google 登入功能待使用者實際測試驗證。

---

## 四、修改的檔案

| 檔案 | 類型 | 說明 |
|------|------|------|
| `docs/FIREBASE_AUTHORIZED_DOMAINS.md` | 新增 | Firebase 授權網域操作指南 |

---

## 五、下一步計劃

- 工單 0169：完善 Google 登入錯誤處理
- 工單 0170：Google 登入 Redirect 降級備案

---

*報告完成時間: 2026-01-27*
