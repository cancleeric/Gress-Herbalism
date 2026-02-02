/**
 * Supabase 客戶端
 *
 * 使用服務角色金鑰連接 Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// 檢查環境變數
let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  console.warn('[Supabase] 環境變數未設定，資料庫功能將被停用');
}

/**
 * 檢查 Supabase 是否可用
 * @returns {boolean}
 */
function isSupabaseEnabled() {
  return supabase !== null;
}

/**
 * 取得 Supabase 客戶端
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
function getSupabase() {
  return supabase;
}

module.exports = {
  supabase,
  getSupabase,
  isSupabaseEnabled,
};
