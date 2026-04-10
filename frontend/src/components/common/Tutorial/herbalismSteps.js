/**
 * 本草遊戲教學步驟定義
 *
 * @module herbalismSteps
 * @description 定義互動式新手教學的所有步驟內容
 * 工單 0055 - 互動式新手教學系統
 */

/**
 * 本草遊戲教學步驟
 * 每個步驟包含：
 *   - id: 唯一識別碼
 *   - title: 步驟標題
 *   - content: 步驟說明內容
 *   - emoji: 視覺圖示
 *   - target: 要高亮的 DOM 元素選擇器（null 表示置中顯示）
 *   - placement: tooltip 位置 ('center' | 'top' | 'bottom' | 'left' | 'right')
 *
 * @type {Array<Object>}
 */
const herbalismSteps = [
  {
    id: 'welcome',
    title: '歡迎來到本草！',
    content:
      '本草是一款 3-4 人推理桌遊。' +
      '你將透過提問和推理來猜測桌面上的兩張蓋牌顏色。' +
      '讓我們用幾個步驟帶你了解基本玩法！',
    emoji: '🌿',
    target: null,
    placement: 'center',
  },
  {
    id: 'card-colors',
    title: '四種顏色牌',
    content:
      '遊戲共有 14 張牌：\n' +
      '🔴 紅色 × 2　🟡 黃色 × 3　🟢 綠色 × 4　🔵 藍色 × 5\n\n' +
      '2 張牌被蓋在桌面中央（蓋牌），剩下的牌分給所有玩家手持。' +
      '你的目標是猜出蓋牌的顏色！',
    emoji: '🃏',
    target: null,
    placement: 'center',
  },
  {
    id: 'asking-questions',
    title: '提問階段',
    content:
      '輪到你時，你可以向任意一名玩家提問：\n' +
      '「你有幾張紅色牌？」\n\n' +
      '被問到的玩家必須誠實回答。' +
      '善用提問來縮小範圍、推理出蓋牌的顏色！',
    emoji: '❓',
    target: null,
    placement: 'center',
  },
  {
    id: 'making-guess',
    title: '猜牌',
    content:
      '當你覺得有把握時，可以宣布猜牌！\n\n' +
      '猜中兩張蓋牌顏色可得 +3 分。\n' +
      '其他玩家也可以選擇「跟猜」：\n' +
      '跟猜正確 +1 分，跟猜錯誤 -1 分（最低 0 分）。',
    emoji: '🎯',
    target: null,
    placement: 'center',
  },
  {
    id: 'scoring',
    title: '計分與勝利',
    content:
      '率先達到 7 分的玩家獲勝！\n\n' +
      '策略提示：\n' +
      '• 仔細聆聽其他玩家的回答\n' +
      '• 不要過早猜牌，收集更多資訊\n' +
      '• 跟猜也是得分的好機會',
    emoji: '🏆',
    target: null,
    placement: 'center',
  },
  {
    id: 'lobby',
    title: '開始遊戲！',
    content:
      '點擊「本草」進入遊戲大廳！\n\n' +
      '你可以創建新房間或加入現有房間。' +
      '設定暱稱後就可以開始遊戲了。' +
      '祝你好運，玩得開心！',
    emoji: '🚀',
    target: '.gs-game-card.herbalism',
    placement: 'bottom',
  },
];

export default herbalismSteps;
