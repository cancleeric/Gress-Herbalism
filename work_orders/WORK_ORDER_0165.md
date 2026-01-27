# 工作單 0165

**建立日期**: 2026-01-27

**優先級**: P2 (中等)

**標題**: Friends.js 測試補充

---

## 一、工作目標

為 `Friends.js` 組件建立完整的單元測試，將測試覆蓋率從 0% 提升至 80% 以上。

---

## 二、問題描述

### 現象
根據測試報告，`Friends.js` 組件完全沒有測試覆蓋。

### 影響
- 好友功能的任何變更都無法被自動驗證
- 增加迴歸風險

---

## 三、實施計畫

### 3.1 新增檔案
- `frontend/src/components/Friends/__tests__/Friends.test.js`

### 3.2 測試範圍

根據 Friends 組件的功能，需要測試：

1. **好友列表渲染**
   - 正確顯示好友列表
   - 空好友列表顯示提示訊息
   - 載入中狀態

2. **搜尋功能**
   - 輸入搜尋關鍵字
   - 顯示搜尋結果
   - 搜尋無結果

3. **好友請求**
   - 發送好友請求
   - 接受好友請求
   - 拒絕好友請求
   - 待處理請求列表

4. **在線狀態**
   - 顯示好友在線/離線狀態
   - 狀態即時更新

5. **遊戲邀請**
   - 邀請好友加入遊戲
   - 邀請按鈕禁用條件

### 3.3 測試框架

```javascript
// frontend/src/components/Friends/__tests__/Friends.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import Friends from '../Friends';
import * as friendService from '../../../services/friendService';
import * as socketService from '../../../services/socketService';

// Mock 服務
jest.mock('../../../services/friendService');
jest.mock('../../../services/socketService');

// Mock AuthContext
jest.mock('../../../firebase/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id', displayName: 'Test User' },
    isAuthenticated: true
  })
}));

const mockStore = {
  getState: () => ({}),
  subscribe: jest.fn(),
  dispatch: jest.fn()
};

const renderFriends = () => {
  return render(
    <Provider store={mockStore}>
      <MemoryRouter>
        <Friends />
      </MemoryRouter>
    </Provider>
  );
};

describe('Friends 組件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('好友列表渲染', () => {
    test('應顯示好友列表', async () => {
      friendService.getFriends.mockResolvedValue([
        { id: 'friend-1', name: 'Friend 1', isOnline: true },
        { id: 'friend-2', name: 'Friend 2', isOnline: false }
      ]);

      renderFriends();

      await waitFor(() => {
        expect(screen.getByText('Friend 1')).toBeInTheDocument();
        expect(screen.getByText('Friend 2')).toBeInTheDocument();
      });
    });

    test('好友列表為空時應顯示提示', async () => {
      friendService.getFriends.mockResolvedValue([]);

      renderFriends();

      await waitFor(() => {
        expect(screen.getByText(/沒有好友/i)).toBeInTheDocument();
      });
    });

    test('載入中應顯示載入指示器', () => {
      friendService.getFriends.mockImplementation(() => new Promise(() => {}));

      renderFriends();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('搜尋功能', () => {
    test('輸入搜尋關鍵字應觸發搜尋', async () => {
      friendService.searchPlayers.mockResolvedValue([
        { id: 'player-1', name: 'SearchResult' }
      ]);

      renderFriends();

      const searchInput = screen.getByPlaceholderText(/搜尋/i);
      fireEvent.change(searchInput, { target: { value: 'Search' } });
      fireEvent.submit(searchInput.closest('form'));

      await waitFor(() => {
        expect(friendService.searchPlayers).toHaveBeenCalledWith('Search');
      });
    });

    test('搜尋無結果應顯示提示', async () => {
      friendService.searchPlayers.mockResolvedValue([]);

      renderFriends();

      const searchInput = screen.getByPlaceholderText(/搜尋/i);
      fireEvent.change(searchInput, { target: { value: 'NoResult' } });
      fireEvent.submit(searchInput.closest('form'));

      await waitFor(() => {
        expect(screen.getByText(/找不到/i)).toBeInTheDocument();
      });
    });
  });

  describe('好友請求', () => {
    test('點擊加好友應發送請求', async () => {
      friendService.searchPlayers.mockResolvedValue([
        { id: 'player-1', name: 'NewFriend' }
      ]);
      friendService.sendFriendRequest.mockResolvedValue({ success: true });

      renderFriends();

      // 先搜尋
      const searchInput = screen.getByPlaceholderText(/搜尋/i);
      fireEvent.change(searchInput, { target: { value: 'New' } });
      fireEvent.submit(searchInput.closest('form'));

      await waitFor(() => {
        expect(screen.getByText('NewFriend')).toBeInTheDocument();
      });

      // 點擊加好友
      const addButton = screen.getByRole('button', { name: /加好友/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(friendService.sendFriendRequest).toHaveBeenCalledWith('player-1');
      });
    });

    test('接受好友請求', async () => {
      friendService.getFriendRequests.mockResolvedValue([
        { id: 'request-1', from: { id: 'player-1', name: 'Requester' } }
      ]);
      friendService.acceptFriendRequest.mockResolvedValue({ success: true });

      renderFriends();

      // 切換到請求頁籤
      const requestsTab = screen.getByRole('tab', { name: /請求/i });
      fireEvent.click(requestsTab);

      await waitFor(() => {
        expect(screen.getByText('Requester')).toBeInTheDocument();
      });

      // 點擊接受
      const acceptButton = screen.getByRole('button', { name: /接受/i });
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(friendService.acceptFriendRequest).toHaveBeenCalledWith('request-1');
      });
    });

    test('拒絕好友請求', async () => {
      friendService.getFriendRequests.mockResolvedValue([
        { id: 'request-1', from: { id: 'player-1', name: 'Requester' } }
      ]);
      friendService.rejectFriendRequest.mockResolvedValue({ success: true });

      renderFriends();

      const requestsTab = screen.getByRole('tab', { name: /請求/i });
      fireEvent.click(requestsTab);

      await waitFor(() => {
        expect(screen.getByText('Requester')).toBeInTheDocument();
      });

      const rejectButton = screen.getByRole('button', { name: /拒絕/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(friendService.rejectFriendRequest).toHaveBeenCalledWith('request-1');
      });
    });
  });

  describe('在線狀態', () => {
    test('應顯示好友在線狀態', async () => {
      friendService.getFriends.mockResolvedValue([
        { id: 'friend-1', name: 'OnlineFriend', isOnline: true },
        { id: 'friend-2', name: 'OfflineFriend', isOnline: false }
      ]);

      renderFriends();

      await waitFor(() => {
        // 根據實際 UI 驗證在線狀態顯示
        const onlineIndicator = screen.getByTestId('online-indicator-friend-1');
        const offlineIndicator = screen.getByTestId('online-indicator-friend-2');

        expect(onlineIndicator).toHaveClass('online');
        expect(offlineIndicator).toHaveClass('offline');
      });
    });
  });

  describe('遊戲邀請', () => {
    test('點擊邀請按鈕應發送邀請', async () => {
      friendService.getFriends.mockResolvedValue([
        { id: 'friend-1', name: 'Friend 1', isOnline: true }
      ]);
      socketService.inviteToGame.mockImplementation(() => {});

      renderFriends();

      await waitFor(() => {
        expect(screen.getByText('Friend 1')).toBeInTheDocument();
      });

      const inviteButton = screen.getByRole('button', { name: /邀請/i });
      fireEvent.click(inviteButton);

      expect(socketService.inviteToGame).toHaveBeenCalledWith('friend-1');
    });

    test('離線好友的邀請按鈕應被禁用', async () => {
      friendService.getFriends.mockResolvedValue([
        { id: 'friend-1', name: 'OfflineFriend', isOnline: false }
      ]);

      renderFriends();

      await waitFor(() => {
        const inviteButton = screen.getByRole('button', { name: /邀請/i });
        expect(inviteButton).toBeDisabled();
      });
    });
  });

  describe('錯誤處理', () => {
    test('載入失敗應顯示錯誤訊息', async () => {
      friendService.getFriends.mockRejectedValue(new Error('Network error'));

      renderFriends();

      await waitFor(() => {
        expect(screen.getByText(/載入失敗/i)).toBeInTheDocument();
      });
    });
  });
});
```

---

## 四、驗收標準

1. `Friends.test.js` 已建立
2. 所有測試通過
3. `Friends.js` 覆蓋率 > 80%
4. 測試涵蓋所有主要功能

---

## 五、風險評估

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|----------|
| 組件 API 與測試不符 | 中 | 中 | 先閱讀組件程式碼 |
| Mock 複雜度高 | 中 | 低 | 簡化 Mock |

---

## 六、相關工單

- 依賴: 無
- 被依賴: 無

---

*工單建立時間: 2026-01-27*
