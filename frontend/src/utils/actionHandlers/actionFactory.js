/**
 * 動作處理器工廠
 *
 * @module actionHandlers/actionFactory
 * @description 工廠模式實作，根據動作類型返回對應的處理器
 */

import { handleQuestionAction } from './questionAction';
import { handleGuessAction } from './guessAction';
import {
  ACTION_TYPE_QUESTION,
  ACTION_TYPE_GUESS
} from '../../shared/constants';

// ==================== 類型定義 ====================

/**
 * 動作處理器介面
 * @typedef {Function} ActionHandler
 * @param {Object} gameState - 遊戲狀態
 * @param {Object} action - 動作物件
 * @returns {ActionResult} 處理結果
 */

/**
 * 動作處理結果
 * @typedef {Object} ActionResult
 * @property {boolean} success - 是否成功
 * @property {Object} gameState - 更新後的遊戲狀態
 * @property {string} message - 處理訊息
 * @property {*} [result] - 額外的結果資料
 */

// ==================== 處理器註冊表 ====================

/**
 * 動作類型與處理器的映射表
 * TODO: 可擴展點 - 新增動作類型時，在此添加處理器
 *
 * @type {Object.<string, ActionHandler>}
 */
const actionHandlers = {
  [ACTION_TYPE_QUESTION]: handleQuestionAction,
  [ACTION_TYPE_GUESS]: handleGuessAction
  // TODO: 可擴展點 - 新增動作類型
  // [ACTION_TYPE_NEW]: handleNewAction,
};

// ==================== 工廠函數 ====================

/**
 * 取得動作處理器
 *
 * @param {string} actionType - 動作類型
 * @returns {ActionHandler|null} 對應的處理器，如果不存在則返回 null
 *
 * @example
 * const handler = getActionHandler('question');
 * if (handler) {
 *   const result = handler(gameState, action);
 * }
 */
export function getActionHandler(actionType) {
  return actionHandlers[actionType] || null;
}

/**
 * 建立動作處理器
 * 工廠函數，根據動作類型返回對應的處理器
 *
 * @param {string} actionType - 動作類型
 * @returns {ActionHandler} 對應的處理器
 * @throws {Error} 當動作類型不存在時拋出錯誤
 *
 * @example
 * const handler = createActionHandler('question');
 * const result = handler(gameState, action);
 */
export function createActionHandler(actionType) {
  const handler = getActionHandler(actionType);

  if (!handler) {
    throw new Error(`未知的動作類型: ${actionType}`);
  }

  return handler;
}

/**
 * 處理遊戲動作
 * 統一的動作處理入口，根據動作類型自動選擇處理器
 *
 * @param {Object} gameState - 當前遊戲狀態
 * @param {Object} action - 動作物件
 * @param {string} action.type - 動作類型
 * @returns {ActionResult} 處理結果
 *
 * @example
 * const result = processAction(gameState, {
 *   type: 'question',
 *   playerId: 'p1',
 *   targetPlayerId: 'p2',
 *   colors: ['red', 'blue'],
 *   questionType: 1
 * });
 */
export function processAction(gameState, action) {
  // 驗證動作物件
  if (!action || !action.type) {
    return {
      success: false,
      gameState,
      message: '無效的動作物件：缺少 type 屬性'
    };
  }

  try {
    // 取得處理器
    const handler = getActionHandler(action.type);

    if (!handler) {
      return {
        success: false,
        gameState,
        message: `未知的動作類型: ${action.type}`
      };
    }

    // 執行處理器
    const result = handler(gameState, action);

    return result;
  } catch (error) {
    // 處理執行錯誤
    console.error('動作處理錯誤:', error);
    return {
      success: false,
      gameState,
      message: `動作處理錯誤: ${error.message}`
    };
  }
}

// ==================== 工廠管理函數 ====================

/**
 * 註冊新的動作處理器
 * TODO: 可擴展點 - 動態註冊處理器
 *
 * @param {string} actionType - 動作類型
 * @param {ActionHandler} handler - 處理器函數
 * @throws {Error} 當處理器不是函數時拋出錯誤
 *
 * @example
 * registerActionHandler('customAction', handleCustomAction);
 */
export function registerActionHandler(actionType, handler) {
  if (typeof handler !== 'function') {
    throw new Error('處理器必須是函數');
  }

  actionHandlers[actionType] = handler;
}

/**
 * 取消註冊動作處理器
 *
 * @param {string} actionType - 動作類型
 * @returns {boolean} 是否成功取消註冊
 */
export function unregisterActionHandler(actionType) {
  if (actionHandlers[actionType]) {
    delete actionHandlers[actionType];
    return true;
  }
  return false;
}

/**
 * 取得所有已註冊的動作類型
 *
 * @returns {string[]} 動作類型列表
 */
export function getRegisteredActionTypes() {
  return Object.keys(actionHandlers);
}

/**
 * 檢查動作類型是否已註冊
 *
 * @param {string} actionType - 動作類型
 * @returns {boolean} 是否已註冊
 */
export function isActionTypeRegistered(actionType) {
  return actionType in actionHandlers;
}

// ==================== 匯出 ====================

export { actionHandlers };

// TODO: 可擴展點 - 未來可添加：
// 1. 處理器中介軟體（middleware）支援
// 2. 處理器執行前後的鉤子（hooks）
// 3. 處理器執行時間追蹤
// 4. 處理器執行日誌
