/**
 * 遊戲版本資訊
 * 此檔案由 git pre-commit hook 自動更新
 */

const VERSION = '1.0.207';
const BUILD_DATE = '2026-01-31';

module.exports = {
  VERSION,
  BUILD_DATE,
  getVersionString: () => `v${VERSION} (${BUILD_DATE})`
};
