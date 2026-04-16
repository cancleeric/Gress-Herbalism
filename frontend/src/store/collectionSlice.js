/**
 * 本草百科收藏 Redux Slice
 * Issue #63 - 本草百科集收藏系統
 *
 * @module store/collectionSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ==================== 非同步 Thunk ====================

/**
 * 取得完整本草百科列表
 */
export const fetchEncyclopedia = createAsyncThunk(
  'collection/fetchEncyclopedia',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/api/encyclopedia`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '取得百科失敗');
      return json.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * 取得特定草藥詳情
 */
export const fetchHerbDetail = createAsyncThunk(
  'collection/fetchHerbDetail',
  async (herbId, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/api/encyclopedia/${encodeURIComponent(herbId)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '取得草藥詳情失敗');
      return json.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * 取得玩家收藏狀態
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

// ==================== 初始狀態 ====================

const initialState = {
  // 百科列表（所有草藥）
  encyclopedia: [],

  // 玩家收藏（已解鎖的草藥 ID 列表與詳情）
  collection: [],

  // 收藏進度
  progress: {
    unlocked: 0,
    total: 4,
    percentage: 0,
  },

  // 當前查看的草藥詳情
  selectedHerb: null,

  // 載入狀態
  encyclopediaLoading: false,
  collectionLoading: false,
  herbDetailLoading: false,

  // 錯誤
  error: null,
};

// ==================== Slice ====================

const collectionSlice = createSlice({
  name: 'collection',
  initialState,
  reducers: {
    selectHerb(state, action) {
      state.selectedHerb = action.payload;
    },
    clearSelectedHerb(state) {
      state.selectedHerb = null;
    },
    clearCollectionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchEncyclopedia
    builder
      .addCase(fetchEncyclopedia.pending, (state) => {
        state.encyclopediaLoading = true;
        state.error = null;
      })
      .addCase(fetchEncyclopedia.fulfilled, (state, action) => {
        state.encyclopediaLoading = false;
        state.encyclopedia = action.payload;
      })
      .addCase(fetchEncyclopedia.rejected, (state, action) => {
        state.encyclopediaLoading = false;
        state.error = action.payload || '取得百科失敗';
      });

    // fetchHerbDetail
    builder
      .addCase(fetchHerbDetail.pending, (state) => {
        state.herbDetailLoading = true;
        state.error = null;
      })
      .addCase(fetchHerbDetail.fulfilled, (state, action) => {
        state.herbDetailLoading = false;
        state.selectedHerb = action.payload;
      })
      .addCase(fetchHerbDetail.rejected, (state, action) => {
        state.herbDetailLoading = false;
        state.error = action.payload || '取得草藥詳情失敗';
      });

    // fetchPlayerCollection
    builder
      .addCase(fetchPlayerCollection.pending, (state) => {
        state.collectionLoading = true;
        state.error = null;
      })
      .addCase(fetchPlayerCollection.fulfilled, (state, action) => {
        state.collectionLoading = false;
        state.collection = action.payload.collection || [];
        state.progress = action.payload.progress || initialState.progress;
      })
      .addCase(fetchPlayerCollection.rejected, (state, action) => {
        state.collectionLoading = false;
        state.error = action.payload || '取得收藏失敗';
      });
  },
});

export const {
  selectHerb,
  clearSelectedHerb,
  clearCollectionError,
} = collectionSlice.actions;

export default collectionSlice.reducer;
