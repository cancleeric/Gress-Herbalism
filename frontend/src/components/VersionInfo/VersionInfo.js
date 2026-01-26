/**
 * 版本資訊組件
 * 工單 0112 - 顯示遊戲版本編號
 */

import React from 'react';
import './VersionInfo.css';

// 從 shared/version.js 導入版本資訊
// 注意：前端需要使用相對路徑或環境變數
const VERSION = process.env.REACT_APP_VERSION || '1.0.0';
const BUILD_DATE = process.env.REACT_APP_BUILD_DATE || new Date().toISOString().split('T')[0];

/**
 * 取得版本字串
 */
function getVersionString() {
  return `v${VERSION}`;
}

/**
 * 取得完整版本資訊
 */
function getFullVersionInfo() {
  return `v${VERSION} (${BUILD_DATE})`;
}

/**
 * 版本資訊組件
 * @param {Object} props
 * @param {boolean} props.showFull - 是否顯示完整資訊（含日期）
 */
function VersionInfo({ showFull = false }) {
  return (
    <div className="version-info">
      {showFull ? getFullVersionInfo() : getVersionString()}
    </div>
  );
}

export default VersionInfo;
