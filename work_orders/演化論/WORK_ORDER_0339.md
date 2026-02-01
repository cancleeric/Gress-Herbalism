# 工單 0339：ActionLog 行動日誌組件

## 基本資訊
- **工單編號**：0339
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：無
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/board/ActionLog.jsx`（新增）
  - `frontend/src/components/games/evolution/board/ActionLog.css`（新增）

---

## 目標

建立行動日誌組件，記錄遊戲中的重要事件：
1. 顯示玩家行動
2. 自動滾動到最新
3. 可展開/收起
4. 分類顯示不同行動

---

## 詳細規格

### 組件實作

```jsx
// frontend/src/components/games/evolution/board/ActionLog.jsx

import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvolutionStore } from '../../../../store/evolution';
import './ActionLog.css';

const ACTION_ICONS = {
  createCreature: '🦎',
  addTrait: '🧬',
  feed: '🍖',
  attack: '⚔️',
  killed: '💀',
  pass: '⏭️',
  phase: '📍',
  round: '🔄',
};

const formatAction = (action) => {
  switch (action.type) {
    case 'createCreature':
      return `${action.playerName} 創建了一隻生物`;
    case 'addTrait':
      return `${action.playerName} 為生物添加了「${action.traitName}」`;
    case 'feed':
      return `${action.playerName} 的生物進食了`;
    case 'attack':
      return `${action.attackerName} 攻擊了 ${action.defenderName} 的生物`;
    case 'killed':
      return `${action.playerName} 的生物被殺死`;
    case 'pass':
      return `${action.playerName} 跳過了回合`;
    case 'phase':
      return `進入「${action.phaseName}」階段`;
    case 'round':
      return `第 ${action.round} 回合開始`;
    default:
      return action.message || '未知行動';
  }
};

export const ActionLog = ({
  maxItems = 50,
  collapsed = false,
  onToggle,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const logRef = useRef(null);

  // 從 store 獲取行動日誌
  const actionLog = useEvolutionStore((state) => state.actionLog || []);

  // 自動滾動到底部
  useEffect(() => {
    if (logRef.current && isExpanded) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [actionLog, isExpanded]);

  // 切換展開
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.(!isExpanded);
  };

  // 顯示的日誌（限制數量）
  const displayLogs = actionLog.slice(-maxItems);

  return (
    <div className={`action-log ${isExpanded ? 'action-log--expanded' : ''} ${className}`}>
      {/* 標題列 */}
      <div className="action-log__header" onClick={handleToggle}>
        <span className="action-log__title">
          📜 行動日誌
          {!isExpanded && actionLog.length > 0 && (
            <span className="action-log__count">({actionLog.length})</span>
          )}
        </span>
        <button className="action-log__toggle">
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {/* 日誌內容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="action-log__content"
            ref={logRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {displayLogs.length === 0 ? (
              <div className="action-log__empty">
                尚無行動記錄
              </div>
            ) : (
              displayLogs.map((action, index) => (
                <motion.div
                  key={action.id || index}
                  className={`action-log__item action-log__item--${action.type}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index === displayLogs.length - 1 ? 0.1 : 0 }}
                >
                  <span className="action-log__icon">
                    {ACTION_ICONS[action.type] || '•'}
                  </span>
                  <span className="action-log__text">
                    {formatAction(action)}
                  </span>
                  <span className="action-log__time">
                    {new Date(action.timestamp).toLocaleTimeString('zh-TW', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

ActionLog.propTypes = {
  maxItems: PropTypes.number,
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
  className: PropTypes.string,
};

export default ActionLog;
```

### 樣式

```css
/* frontend/src/components/games/evolution/board/ActionLog.css */

.action-log {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* === 標題列 === */
.action-log__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  user-select: none;
}

.action-log__header:hover {
  background: #f1f5f9;
}

.action-log__title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.action-log__count {
  font-weight: 400;
  color: #64748b;
  margin-left: 4px;
}

.action-log__toggle {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #64748b;
  font-size: 10px;
}

/* === 內容區 === */
.action-log__content {
  max-height: 180px;
  overflow-y: auto;
  padding: 8px;
}

.action-log__empty {
  padding: 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

/* === 日誌項目 === */
.action-log__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  transition: background 0.15s;
}

.action-log__item:hover {
  background: #f8fafc;
}

.action-log__icon {
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.action-log__text {
  flex: 1;
  color: #475569;
  line-height: 1.4;
}

.action-log__time {
  flex-shrink: 0;
  font-size: 10px;
  color: #94a3b8;
}

/* === 行動類型顏色 === */
.action-log__item--attack {
  background: #fef2f2;
}

.action-log__item--killed {
  background: #fef2f2;
}

.action-log__item--feed {
  background: #fefce8;
}

.action-log__item--phase,
.action-log__item--round {
  background: #eff6ff;
  font-weight: 500;
}

/* === 滾動條 === */
.action-log__content::-webkit-scrollbar {
  width: 4px;
}

.action-log__content::-webkit-scrollbar-track {
  background: transparent;
}

.action-log__content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
```

---

## 驗收標準

1. [ ] 正確顯示行動記錄
2. [ ] 自動滾動到最新
3. [ ] 展開/收起功能正常
4. [ ] 行動類型圖示正確
5. [ ] 時間戳正確
6. [ ] 動畫流暢
7. [ ] 樣式清晰易讀

---

## 備註

- 行動日誌幫助玩家追蹤遊戲進程
- 需與 store 的 actionLog 整合
