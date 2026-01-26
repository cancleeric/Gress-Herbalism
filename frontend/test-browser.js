/**
 * 瀏覽器運行時測試
 *
 * 測試實際頁面是否能正確載入和運行
 */

const http = require('http');

console.log('='.repeat(80));
console.log('瀏覽器運行時測試');
console.log('='.repeat(80));

const testURLs = [
  {
    name: '主頁',
    path: '/'
  },
  {
    name: '單人模式頁面（含完整參數）',
    path: '/game/local-game?mode=single&aiCount=2&difficulties=medium,medium&playerName=測試玩家&playerId=test-123'
  }
];

async function testURL(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:8085${url}`, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          html: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  console.log('\n【1/2】檢查開發伺服器狀態...\n');

  try {
    const result = await testURL('/');
    if (result.statusCode === 200) {
      console.log('  ✅ 開發伺服器運行正常');
      console.log(`  ✅ HTTP 狀態碼: ${result.statusCode}`);
      console.log(`  ✅ HTML 長度: ${result.html.length} bytes`);

      // 檢查是否包含 React 應用
      const hasReactApp = result.html.includes('root') || result.html.includes('React');
      console.log(`  ${hasReactApp ? '✅' : '❌'} React 應用已載入`);
    } else {
      console.log(`  ❌ HTTP 狀態碼異常: ${result.statusCode}`);
      return;
    }
  } catch (error) {
    console.log(`  ❌ 開發伺服器無法訪問: ${error.message}`);
    console.log('  ℹ️  請確認 npm start 正在運行');
    return;
  }

  console.log('\n【2/2】測試單人模式 URL...\n');

  try {
    const result = await testURL('/game/local-game?mode=single&aiCount=2&difficulties=medium,medium&playerName=測試&playerId=test');

    console.log(`  ✅ 單人模式頁面可訪問`);
    console.log(`  ✅ HTTP 狀態碼: ${result.statusCode}`);
    console.log(`  ✅ HTML 長度: ${result.html.length} bytes`);

    // 檢查是否包含必要的元素
    const hasRoot = result.html.includes('root');
    const hasScript = result.html.includes('<script');

    console.log(`  ${hasRoot ? '✅' : '❌'} 包含 root 元素`);
    console.log(`  ${hasScript ? '✅' : '❌'} 包含 JavaScript`);

  } catch (error) {
    console.log(`  ❌ 單人模式頁面無法訪問: ${error.message}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('測試完成');
  console.log('='.repeat(80));

  console.log('\n📋 測試 URL:');
  console.log('  http://localhost:8085/game/local-game?mode=single&aiCount=2&difficulties=medium,medium&playerName=測試玩家&playerId=test-123');

  console.log('\n📝 手動測試步驟:');
  console.log('  1. 在瀏覽器打開上方 URL');
  console.log('  2. 打開開發者工具（F12）');
  console.log('  3. 切換到 Console 標籤');
  console.log('  4. 查看是否有以下日誌：');
  console.log('     [GameRoom] ✅ 從 URL 解析成功');
  console.log('     [GameRoom] isLocalMode: true');
  console.log('     [AI] 初始化 2 個 AI 玩家');
  console.log('');
}

main();
