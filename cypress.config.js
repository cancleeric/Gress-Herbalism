/**
 * Cypress E2E 測試配置
 *
 * @file cypress.config.js
 * 工單 0367
 */

const { defineConfig } = require(require('path').join(__dirname, 'frontend/node_modules/cypress'));

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'tests/e2e/**/*.spec.js',
    supportFile: 'tests/e2e/support/e2e.js',
    fixturesFolder: 'tests/e2e/fixtures',
    screenshotsFolder: 'tests/e2e/screenshots',
    videosFolder: 'tests/e2e/videos',
    downloadsFolder: 'tests/e2e/downloads',

    // 視窗設定
    viewportWidth: 1280,
    viewportHeight: 720,

    // 超時設定
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 30000,

    // 重試設定
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // 影片與截圖
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,

    // 實驗性功能
    experimentalRunAllSpecs: true,

    // 環境變數
    env: {
      apiUrl: 'http://localhost:3001',
      socketUrl: 'http://localhost:3001',
    },

    setupNodeEvents(on, config) {
      // 實作 Node.js 事件監聽器

      // 測試前清理
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--no-sandbox');
        }
        return launchOptions;
      });

      // 任務處理
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },

        // 資料庫清理任務
        clearTestData() {
          // 測試環境的資料清理
          return null;
        },
      });

      return config;
    },
  },

  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'frontend/src/**/*.cy.{js,jsx,ts,tsx}',
  },
});
