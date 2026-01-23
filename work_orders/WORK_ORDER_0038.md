# 工作單 0038

**日期：** 2026-01-23

**工作單標題：** 安裝與設定 ngrok

**工單主旨：** 環境設定 - 安裝 ngrok 工具以建立公開連結

**內容：**

## 背景說明

為了讓不同地點的玩家（例如同學在家裡）能夠連線到本機開發的遊戲，需要使用 ngrok 建立臨時的公開連結。

## 工作內容

1. **安裝 ngrok**
   - 方式一：使用 npm 全域安裝
     ```bash
     npm install -g ngrok
     ```
   - 方式二：從官網下載
     - 前往 https://ngrok.com/download
     - 下載 Windows 版本
     - 解壓縮並加入系統 PATH

2. **註冊 ngrok 帳號**（免費方案）
   - 前往 https://ngrok.com/signup
   - 註冊帳號
   - 取得 authtoken

3. **設定 authtoken**
   ```bash
   ngrok config add-authtoken <your-token>
   ```

4. **驗證安裝**
   ```bash
   ngrok version
   ```

## 驗收標準

- [ ] ngrok 已成功安裝
- [ ] ngrok 帳號已註冊
- [ ] authtoken 已設定
- [ ] `ngrok version` 指令可正常執行
