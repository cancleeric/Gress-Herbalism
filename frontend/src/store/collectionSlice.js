/**
 * 本草圖鑑收藏 Redux Slice
 * Issue #63 - 本草圖鑑收藏系統
 *
 * @module store/collectionSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ==================== 非同步 Thunk ====================

/**
 * 取得玩家收藏清單（含解鎖狀態）
 */
export const fetchPlayerCollection = createAsyncThunk(
  'collection/fetchPlayerCollection',
  async (firebaseUid, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${API_URL}/api/collection?firebaseUid=${encodeURIComponent(firebaseUid)}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '取得收藏失敗');
      return json.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * 取得單一圖鑑條目詳情（需已解鎖）
 */
export const fetchEncyclopediaEntry = createAsyncThunk(
  'collection/fetchEncyclopediaEntry',
  async ({ herbId, firebaseUid }, { rejectWithValue }) => {
    try {
      const params = firebaseUid
        ? `?firebaseUid=${encodeURIComponent(firebaseUid)}`
        : '';
      const res = await fetch(`${API_URL}/api/encyclopedia/${herbId}${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '取得圖鑑詳情失敗');
      return json.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ==================== 初始狀態 ====================

const initialState = {
  // 收藏條目列表
  entries: [],
  unlockedCount: 0,
  totalCount: 0,

  // 選取的圖鑑條目（詳情 Modal）
  selectedEntry: null,
  selectedHerbDetail: null,

  // 載入狀態
  loading: false,
  detailLoading: false,

  // 錯誤訊息
  error: null,
  detailError: null,
};

// ==================== Slice ====================

const collectionSlice = createSlice({
  name: 'collection',
  initialState,
  reducers: {
    selectEntry(state, action) {
      state.selectedEntry = action.payload;
      state.selectedHerbDetail = null;
      state.detailError = null;
    },
    clearSelectedEntry(state) {
      state.selectedEntry = null;
      state.selectedHerbDetail = null;
      state.detailError = null;
    },
    clearCollectionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchPlayerCollection
    builder
      .addCase(fetchPlayerCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayerCollection.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.entries || [];
        state.unlockedCount = action.payload.unlockedCount || 0;
        state.totalCount = action.payload.totalCount || 0;
      })
      .addCase(fetchPlayerCollection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '取得收藏失敗';
      });

    // fetchEncyclopediaEntry
    builder
      .addCase(fetchEncyclopediaEntry.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchEncyclopediaEntry.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedHerbDetail = action.payload;
      })
      .addCase(fetchEncyclopediaEntry.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload || '取得圖鑑詳情失敗';
      });
  },
});

export const {
  selectEntry,
  clearSelectedEntry,
  clearCollectionError,
} = collectionSlice.actions;

export default collectionSlice.reducer;
