# 工作單 0065

**日期：** 2026-01-24

**工作單標題：** 前端組件測試補強

**工單主旨：** 提升測試覆蓋率 - 補齊缺失的前端組件測試

**分類：** 測試

---

## 目標

補齊目前缺失的前端組件測試，提升整體測試覆蓋率。

## 背景

經過分析，以下模組缺少測試覆蓋：
- `Friends` 組件
- `authService.js`
- `firebase/config.js`（配置驗證）

## 測試範圍

### 1. Friends 組件測試

**測試檔案：** `frontend/src/components/Friends/Friends.test.js`

**測試案例：**

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Friends from './Friends';

// Mock friendService
jest.mock('../../services/friendService');

describe('Friends 組件', () => {
  describe('好友清單顯示', () => {
    test('顯示好友清單', async () => {});
    test('空清單顯示提示訊息', () => {});
    test('顯示好友線上狀態', () => {});
    test('顯示好友頭像', () => {});
  });

  describe('好友請求', () => {
    test('發送好友請求', async () => {});
    test('接受好友請求', async () => {});
    test('拒絕好友請求', async () => {});
    test('顯示待處理請求數量', () => {});
  });

  describe('好友互動', () => {
    test('邀請好友加入遊戲', async () => {});
    test('移除好友', async () => {});
    test('查看好友資料', () => {});
  });

  describe('搜尋功能', () => {
    test('搜尋用戶', async () => {});
    test('搜尋無結果顯示提示', () => {});
    test('防抖搜尋', async () => {});
  });

  describe('錯誤處理', () => {
    test('網路錯誤顯示提示', async () => {});
    test('重試機制', async () => {});
  });
});
```

### 2. authService 測試

**測試檔案：** `frontend/src/firebase/authService.test.js`

**測試案例：**

```javascript
import * as authService from './authService';
import { auth } from './config';

// Mock Firebase Auth
jest.mock('firebase/auth');
jest.mock('./config');

describe('authService', () => {
  describe('signInWithGoogle', () => {
    test('成功登入返回用戶資料', async () => {});
    test('用戶取消登入拋出錯誤', async () => {});
    test('popup 被阻擋拋出錯誤', async () => {});
  });

  describe('signInWithEmail', () => {
    test('正確帳密登入成功', async () => {});
    test('錯誤密碼拋出錯誤', async () => {});
    test('帳號不存在拋出錯誤', async () => {});
    test('帳號被停用拋出錯誤', async () => {});
  });

  describe('registerWithEmail', () => {
    test('註冊成功返回用戶資料', async () => {});
    test('Email 已存在拋出錯誤', async () => {});
    test('密碼太弱拋出錯誤', async () => {});
    test('設定 displayName 成功', async () => {});
  });

  describe('signInAsGuest', () => {
    test('匿名登入成功', async () => {});
    test('匿名登入被停用拋出錯誤', async () => {});
  });

  describe('logout', () => {
    test('登出成功', async () => {});
  });

  describe('resetPassword', () => {
    test('發送重設郵件成功', async () => {});
    test('Email 不存在拋出錯誤', async () => {});
  });

  describe('upgradeAnonymousAccount', () => {
    test('升級匿名帳號成功', async () => {});
    test('非匿名帳號拋出錯誤', async () => {});
  });

  describe('onAuthStateChange', () => {
    test('監聽登入狀態變化', () => {});
    test('返回取消監聽函數', () => {});
  });

  describe('handleAuthError', () => {
    test('轉換 Firebase 錯誤為中文訊息', () => {});
    test('未知錯誤顯示原始訊息', () => {});
  });
});
```

### 3. Firebase 配置驗證測試

**測試檔案：** `frontend/src/firebase/config.test.js`

**測試案例：**

```javascript
describe('Firebase 配置', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('所有必要環境變數存在時初始化成功', () => {
    process.env.REACT_APP_FIREBASE_API_KEY = 'test-key';
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project';
    // ...

    const { auth } = require('./config');
    expect(auth).toBeDefined();
  });

  test('缺少環境變數時拋出有意義的錯誤', () => {
    delete process.env.REACT_APP_FIREBASE_API_KEY;

    expect(() => require('./config')).toThrow();
  });
});
```

### 4. 現有測試強化

檢查並強化現有測試的邊界條件：

- [ ] GameRoom.test.js - 新增斷線重連測試
- [ ] Lobby.test.js - 新增房間密碼測試
- [ ] socketService.test.js - 新增重連機制測試

## 驗收標準

- [ ] Friends 組件測試覆蓋率 > 85%
- [ ] authService 測試覆蓋率 > 90%
- [ ] 所有新增測試通過
- [ ] 現有測試無回歸
- [ ] `npm test` 執行無錯誤
