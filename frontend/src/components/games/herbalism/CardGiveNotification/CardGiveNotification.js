/**
 * 給牌通知組件 - 私密訊息給被要牌玩家
 *
 * @module CardGiveNotification
 * @description 顯示被要牌時給出的牌的詳細資訊
 */

import React from 'react';
import './CardGiveNotification.css';

/**
 * 顏色名稱對應
 */
const COLOR_NAMES = {
  red: '紅色',
  yellow: '黃色',
  green: '綠色',
  blue: '藍色'
};

/**
 * 顏色圖示對應
 */
const COLOR_ICONS = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
  blue: '🔵'
};

/**
 * 問牌方式名稱對應
 */
const ASK_TYPE_NAMES = {
  oneEach: '各一張',
  all: '全部',
  oneColorAll: '其中一種全部'
};

/**
 * 給牌通知組件
 *
 * @param {Object} props
 * @param {Object} props.notification - 通知資料
 * @param {string} props.notification.fromPlayer - 問牌玩家名稱
 * @param {string} props.notification.askType - 問牌方式
 * @param {Array} props.notification.selectedColors - 選擇的顏色
 * @param {string} props.notification.chosenColor - 選擇給出的顏色（僅 oneColorAll）
 * @param {Array} props.notification.cardsGiven - 給出的牌
 * @param {number} props.notification.totalCount - 給出的總張數
 * @param {Function} props.onConfirm - 確認按鈕回調
 * @returns {JSX.Element}
 */
function CardGiveNotification({ notification, onConfirm }) {
  if (!notification) return null;

  const {
    fromPlayer,
    askType,
    selectedColors,
    chosenColor,
    cardsGiven,
    totalCount
  } = notification;

  return (
    <div className="card-give-notification">
      <div className="notification-header">
        <span className="notification-icon">📤</span>
        <h3>給牌通知</h3>
      </div>

      <div className="notification-body">
        <p className="from-player">
          <strong>{fromPlayer}</strong> 向你問牌
        </p>

        <div className="ask-info">
          <div className="info-row">
            <span className="label">問牌方式：</span>
            <span className="value">{ASK_TYPE_NAMES[askType] || askType}</span>
          </div>
          <div className="info-row">
            <span className="label">選擇顏色：</span>
            <span className="value">
              {selectedColors.map(color => COLOR_NAMES[color] || color).join('、')}
            </span>
          </div>
          {askType === 'oneColorAll' && chosenColor && (
            <div className="info-row">
              <span className="label">你選擇給：</span>
              <span className="value">{COLOR_NAMES[chosenColor] || chosenColor}</span>
            </div>
          )}
        </div>

        <div className="cards-given">
          <p className="section-title">你給出的牌：</p>
          {cardsGiven && cardsGiven.length > 0 ? (
            <div className="cards-list">
              {cardsGiven.map((card, index) => (
                <div key={index} className={`card-item color-${card.color}`}>
                  <span className="color-icon">{COLOR_ICONS[card.color] || '🃏'}</span>
                  <span className="color-name">{COLOR_NAMES[card.color] || card.color}</span>
                  <span className="card-count">x{card.count}</span>
                </div>
              ))}
              <div className="total-count">
                共 {totalCount} 張
              </div>
            </div>
          ) : (
            <div className="no-cards">
              無牌可給
            </div>
          )}
        </div>
      </div>

      <div className="notification-footer">
        <button className="btn btn-primary" onClick={onConfirm}>
          確認
        </button>
      </div>
    </div>
  );
}

export default CardGiveNotification;
