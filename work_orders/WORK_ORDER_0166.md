# 工作單 0166

**建立日期**: 2026-01-27

**優先級**: P2 (中等)

**標題**: Lobby.js 測試補充

---

## 一、工作目標

補充 `Lobby.js` 組件的測試，將覆蓋率從 66.44% 提升至 80% 以上。

---

## 二、問題描述

### 現象
根據測試報告，`Lobby.js` 組件有 34% 的分支未被測試覆蓋。

### 影響
- 部分大廳功能變更無法被自動驗證
- 特別是密碼房間和邊界情況

---

## 三、實施計畫

### 3.1 修改檔案
- `frontend/src/components/Lobby/__tests__/Lobby.test.js`

### 3.2 需補充的測試場景

根據現有覆蓋率缺口，需要補充：

1. **密碼房間功能**
   - 創建密碼房間
   - 加入密碼房間（密碼正確）
   - 加入密碼房間（密碼錯誤）
   - 密碼輸入對話框

2. **房間列表更新**
   - 即時更新房間列表
   - 房間滿員狀態
   - 房間遊戲中狀態

3. **邊界情況**
   - 房間已滿時加入
   - 房間不存在時加入
   - 網路錯誤處理

4. **篩選和排序**
   - 篩選可加入的房間
   - 房間排序

### 3.3 測試實施

```javascript
// 補充到 frontend/src/components/Lobby/__tests__/Lobby.test.js

describe('密碼房間功能', () => {
  test('創建密碼房間應設定密碼', async () => {
    renderLobby();

    // 點擊創建房間
    fireEvent.click(screen.getByRole('button', { name: /創建房間/i }));

    // 輸入房間名稱
    const roomNameInput = screen.getByLabelText(/房間名稱/i);
    fireEvent.change(roomNameInput, { target: { value: 'TestRoom' } });

    // 勾選密碼保護
    const passwordCheckbox = screen.getByLabelText(/密碼保護/i);
    fireEvent.click(passwordCheckbox);

    // 輸入密碼
    const passwordInput = screen.getByLabelText(/密碼/i);
    fireEvent.change(passwordInput, { target: { value: '1234' } });

    // 確認創建
    fireEvent.click(screen.getByRole('button', { name: /確認/i }));

    await waitFor(() => {
      expect(socketService.createRoom).toHaveBeenCalledWith(
        expect.objectContaining({
          roomName: 'TestRoom',
          password: '1234'
        })
      );
    });
  });

  test('加入密碼房間應顯示密碼輸入框', async () => {
    socketService.onRoomList.mockImplementation((callback) => {
      callback([{
        id: 'room-1',
        name: 'PrivateRoom',
        hasPassword: true,
        playerCount: 2,
        maxPlayers: 4
      }]);
      return jest.fn();
    });

    renderLobby();

    await waitFor(() => {
      expect(screen.getByText('PrivateRoom')).toBeInTheDocument();
    });

    // 點擊加入
    fireEvent.click(screen.getByRole('button', { name: /加入/i }));

    // 應顯示密碼輸入對話框
    expect(screen.getByLabelText(/請輸入密碼/i)).toBeInTheDocument();
  });

  test('密碼錯誤應顯示錯誤訊息', async () => {
    socketService.onError.mockImplementation((callback) => {
      callback({ message: '密碼錯誤' });
      return jest.fn();
    });

    socketService.onRoomList.mockImplementation((callback) => {
      callback([{
        id: 'room-1',
        name: 'PrivateRoom',
        hasPassword: true,
        playerCount: 2,
        maxPlayers: 4
      }]);
      return jest.fn();
    });

    renderLobby();

    await waitFor(() => {
      expect(screen.getByText('PrivateRoom')).toBeInTheDocument();
    });

    // 點擊加入
    fireEvent.click(screen.getByRole('button', { name: /加入/i }));

    // 輸入錯誤密碼
    const passwordInput = screen.getByLabelText(/請輸入密碼/i);
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /確認/i }));

    await waitFor(() => {
      expect(screen.getByText(/密碼錯誤/i)).toBeInTheDocument();
    });
  });
});

describe('房間列表更新', () => {
  test('房間列表應即時更新', async () => {
    let updateCallback;
    socketService.onRoomList.mockImplementation((callback) => {
      updateCallback = callback;
      callback([{ id: 'room-1', name: 'Room1', playerCount: 1, maxPlayers: 4 }]);
      return jest.fn();
    });

    renderLobby();

    await waitFor(() => {
      expect(screen.getByText('Room1')).toBeInTheDocument();
    });

    // 模擬房間列表更新
    act(() => {
      updateCallback([
        { id: 'room-1', name: 'Room1', playerCount: 1, maxPlayers: 4 },
        { id: 'room-2', name: 'Room2', playerCount: 2, maxPlayers: 4 }
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText('Room2')).toBeInTheDocument();
    });
  });

  test('房間滿員應顯示滿員狀態', async () => {
    socketService.onRoomList.mockImplementation((callback) => {
      callback([{
        id: 'room-1',
        name: 'FullRoom',
        playerCount: 4,
        maxPlayers: 4
      }]);
      return jest.fn();
    });

    renderLobby();

    await waitFor(() => {
      expect(screen.getByText('FullRoom')).toBeInTheDocument();
      expect(screen.getByText(/滿員/i)).toBeInTheDocument();
    });

    // 加入按鈕應被禁用
    const joinButton = screen.getByRole('button', { name: /加入/i });
    expect(joinButton).toBeDisabled();
  });

  test('房間遊戲中應顯示遊戲中狀態', async () => {
    socketService.onRoomList.mockImplementation((callback) => {
      callback([{
        id: 'room-1',
        name: 'PlayingRoom',
        playerCount: 3,
        maxPlayers: 4,
        status: 'playing'
      }]);
      return jest.fn();
    });

    renderLobby();

    await waitFor(() => {
      expect(screen.getByText('PlayingRoom')).toBeInTheDocument();
      expect(screen.getByText(/遊戲中/i)).toBeInTheDocument();
    });
  });
});

describe('邊界情況', () => {
  test('房間已滿時加入應顯示錯誤', async () => {
    socketService.onError.mockImplementation((callback) => {
      callback({ message: '房間已滿' });
      return jest.fn();
    });

    renderLobby();

    await waitFor(() => {
      expect(screen.getByText(/房間已滿/i)).toBeInTheDocument();
    });
  });

  test('房間不存在時加入應顯示錯誤', async () => {
    socketService.onError.mockImplementation((callback) => {
      callback({ message: '房間不存在' });
      return jest.fn();
    });

    renderLobby();

    await waitFor(() => {
      expect(screen.getByText(/房間不存在/i)).toBeInTheDocument();
    });
  });

  test('網路錯誤應顯示重試按鈕', async () => {
    socketService.onRoomList.mockImplementation(() => {
      throw new Error('Network error');
    });

    renderLobby();

    await waitFor(() => {
      expect(screen.getByText(/連線失敗/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /重試/i })).toBeInTheDocument();
    });
  });
});

describe('篩選功能', () => {
  test('應能篩選可加入的房間', async () => {
    socketService.onRoomList.mockImplementation((callback) => {
      callback([
        { id: 'room-1', name: 'Available', playerCount: 2, maxPlayers: 4 },
        { id: 'room-2', name: 'Full', playerCount: 4, maxPlayers: 4 }
      ]);
      return jest.fn();
    });

    renderLobby();

    await waitFor(() => {
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Full')).toBeInTheDocument();
    });

    // 勾選只顯示可加入
    const filterCheckbox = screen.getByLabelText(/只顯示可加入/i);
    fireEvent.click(filterCheckbox);

    await waitFor(() => {
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.queryByText('Full')).not.toBeInTheDocument();
    });
  });
});
```

---

## 四、驗收標準

1. 補充的測試全部通過
2. `Lobby.js` 覆蓋率 > 80%
3. 密碼房間相關邏輯有測試覆蓋
4. 邊界情況有測試覆蓋

---

## 五、風險評估

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|----------|
| 現有測試可能需要調整 | 中 | 低 | 確保不破壞現有測試 |
| Mock 複雜度 | 中 | 低 | 重用現有 Mock |

---

## 六、相關工單

- 依賴: 無
- 被依賴: 無

---

*工單建立時間: 2026-01-27*
