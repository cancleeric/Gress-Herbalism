/**
 * 每日任務 Redux Slice
 * Issue #61 - 每日任務系統
 *
 * @module store/questSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ==================== 非同步 Thunk ====================

/**
 * 取得今日任務與簽到資訊
 */
export const fetchDailyQuests = createAsyncThunk(
  'quest/fetchDailyQuests',
  async (firebaseUid, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/api/quests/daily?firebaseUid=${encodeURIComponent(firebaseUid)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '取得任務失敗');
      return json.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * 每日簽到
 */
export const performCheckin = createAsyncThunk(
  'quest/performCheckin',
  async (firebaseUid, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/api/quests/daily/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '簽到失敗');
      return json.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * 領取任務獎勵
 */
export const claimQuestReward = createAsyncThunk(
  'quest/claimQuestReward',
  async ({ questId, firebaseUid }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/api/quests/${questId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '領取失敗');
      return { questId, ...json.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ==================== 初始狀態 ====================

const initialState = {
  // 任務列表
  quests: [],

  // 簽到資訊
  checkin: {
    streakCount: 0,
    todayCheckedIn: false,
    thisMonthDates: [],
  },

  // 載入狀態
  loading: false,
  checkinLoading: false,
  claimingQuestId: null,

  // 錯誤與訊息
  error: null,
  lastRewardCoins: null,
  lastCheckinCoins: null,

  // UI 狀態
  isPanelOpen: false,
};

// ==================== Slice ====================

const questSlice = createSlice({
  name: 'quest',
  initialState,
  reducers: {
    toggleQuestPanel(state) {
      state.isPanelOpen = !state.isPanelOpen;
    },
    openQuestPanel(state) {
      state.isPanelOpen = true;
    },
    closeQuestPanel(state) {
      state.isPanelOpen = false;
    },
    clearQuestError(state) {
      state.error = null;
    },
    clearLastReward(state) {
      state.lastRewardCoins = null;
      state.lastCheckinCoins = null;
    },
  },
  extraReducers: (builder) => {
    // fetchDailyQuests
    builder
      .addCase(fetchDailyQuests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyQuests.fulfilled, (state, action) => {
        state.loading = false;
        state.quests = action.payload.quests || [];
        state.checkin = action.payload.checkin || initialState.checkin;
      })
      .addCase(fetchDailyQuests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '取得任務失敗';
      });

    // performCheckin
    builder
      .addCase(performCheckin.pending, (state) => {
        state.checkinLoading = true;
        state.error = null;
      })
      .addCase(performCheckin.fulfilled, (state, action) => {
        state.checkinLoading = false;
        const { streakCount, coins, alreadyCheckedIn } = action.payload;
        state.checkin.streakCount = streakCount;
        state.checkin.todayCheckedIn = true;
        if (!alreadyCheckedIn) {
          state.lastCheckinCoins = coins;
        }
      })
      .addCase(performCheckin.rejected, (state, action) => {
        state.checkinLoading = false;
        state.error = action.payload || '簽到失敗';
      });

    // claimQuestReward
    builder
      .addCase(claimQuestReward.pending, (state, action) => {
        state.claimingQuestId = action.meta.arg.questId;
        state.error = null;
      })
      .addCase(claimQuestReward.fulfilled, (state, action) => {
        state.claimingQuestId = null;
        const { questId, coins } = action.payload;
        // 標記任務獎勵已領取
        const quest = state.quests.find(q => q.id === questId);
        if (quest) {
          quest.reward_claimed = true;
        }
        state.lastRewardCoins = coins;
      })
      .addCase(claimQuestReward.rejected, (state, action) => {
        state.claimingQuestId = null;
        state.error = action.payload || '領取失敗';
      });
  },
});

export const {
  toggleQuestPanel,
  openQuestPanel,
  closeQuestPanel,
  clearQuestError,
  clearLastReward,
} = questSlice.actions;

export default questSlice.reducer;
