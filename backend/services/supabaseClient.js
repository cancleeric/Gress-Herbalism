/**
 * 服務層資料客戶端（舊匯出名稱保留相容，亦支援 PostgreSQL）
 */

const { createDataClient } = require('../db/provider');
const supabase = createDataClient({ serviceRole: true, optional: true });
if (!supabase) {
  console.warn('[Supabase] 環境變數未設定，資料庫功能將被停用');
}

/**
 * 檢查目前所選 provider 是否已配置（不是 live DB 健康檢查）
 * @returns {boolean}
 */
function isSupabaseEnabled() {
  return supabase !== null;
}

/**
 * 取得目前所選資料客戶端；舊函式名稱保留相容。
 * @returns {object|null}
 */
function getSupabase() {
  return supabase;
}

module.exports = {
  supabase,
  getSupabase,
  isSupabaseEnabled,
};
