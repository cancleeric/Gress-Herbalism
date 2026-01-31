# 工作單 0073

**日期：** 2026-01-25

**工作單標題：** 桌面顏色牌介面設計

**工單主旨：** 功能開發 - 新增六張顏色組合牌於桌面中央

---

## 功能概述

在遊戲桌面中央新增六張「顏色組合牌」，取代原本問牌時手動選擇兩種顏色的方式。

## 六張顏色組合牌

從四種顏色（紅、黃、綠、藍）中選兩種的所有組合，共 6 種：

| 編號 | 顏色組合 | 卡牌圖示 |
|------|---------|---------|
| 1 | 🔴 紅 + 🟢 綠 | 紅棗 + 綠葉 |
| 2 | 🟢 綠 + 🔵 藍 | 綠茶 + 藍色圖騰 |
| 3 | 🟢 綠 + 🟡 黃 | 草藥研缽 + 黃色粉末 |
| 4 | 🔴 紅 + 🔵 藍 | 枸杞湯 + 藍色圖騰 |
| 5 | 🟡 黃 + 🔴 紅 | 柿子 + 辣椒 |
| 6 | 🟡 黃 + 🔵 藍 | 薏仁 + 藍色圖騰 |

## 介面設計

### 桌面配置

```
┌─────────────────────────────────────────────────────────┐
│                      遊戲桌面                            │
│                                                         │
│     玩家2                              玩家3            │
│     [手牌]                             [手牌]           │
│                                                         │
│              ┌─────────────────────┐                    │
│              │    六張顏色組合牌    │                    │
│              │                     │                    │
│              │  [紅綠] [綠藍] [綠黃] │                    │
│              │  [紅藍] [黃紅] [黃藍] │                    │
│              │                     │                    │
│              │     [蓋牌區域]       │                    │
│              └─────────────────────┘                    │
│                                                         │
│     玩家1（自己）                      玩家4            │
│     [手牌]                             [手牌]           │
└─────────────────────────────────────────────────────────┘
```

### 卡牌樣式

每張卡牌顯示：
- 卡牌圖案（中華風格插圖）
- 左上角與右下角的顏色圖示（標示代表的兩種顏色）

```
┌─────────────┐
│ 🔴          │
│ ···         │
│             │
│   [圖案]    │
│             │
│         ··· │
│          🟢 │
└─────────────┘
```

## 卡牌素材

使用提供的六張卡牌圖片：
- `紅綠.jpg` - 紅棗與綠葉
- `綠藍.jpg` - 綠茶與藍色圖騰
- `綠黃.jpg` - 草藥研缽
- `紅藍.jpg` - 枸杞湯
- `黃紅.jpg` - 柿子與辣椒
- `黃藍.jpg` - 薏仁

## 技術實作

### 1. 常數定義

```javascript
// shared/constants.js
const COLOR_COMBINATION_CARDS = [
  { id: 'red-green', colors: ['red', 'green'], image: 'red-green.jpg' },
  { id: 'green-blue', colors: ['green', 'blue'], image: 'green-blue.jpg' },
  { id: 'green-yellow', colors: ['green', 'yellow'], image: 'green-yellow.jpg' },
  { id: 'red-blue', colors: ['red', 'blue'], image: 'red-blue.jpg' },
  { id: 'yellow-red', colors: ['yellow', 'red'], image: 'yellow-red.jpg' },
  { id: 'yellow-blue', colors: ['yellow', 'blue'], image: 'yellow-blue.jpg' },
];
```

### 2. 前端組件

```
frontend/src/components/
├── ColorCombinationCards/
│   ├── index.js
│   ├── ColorCombinationCards.js    // 六張牌的容器
│   ├── ColorCombinationCards.css
│   └── ColorCard.js                // 單張顏色組合牌
```

### 3. 圖片資源

```
frontend/public/images/color-cards/
├── red-green.jpg
├── green-blue.jpg
├── green-yellow.jpg
├── red-blue.jpg
├── yellow-red.jpg
└── yellow-blue.jpg
```

## 受影響檔案

### 新增檔案
- `frontend/src/components/ColorCombinationCards/ColorCombinationCards.js`
- `frontend/src/components/ColorCombinationCards/ColorCard.js`
- `frontend/src/components/ColorCombinationCards/ColorCombinationCards.css`
- `frontend/public/images/color-cards/*.jpg`

### 修改檔案
- `shared/constants.js` - 新增顏色組合牌常數
- `frontend/src/components/GameBoard/GameBoard.js` - 整合顏色組合牌

## 驗收標準

- [ ] 桌面中央顯示六張顏色組合牌
- [ ] 每張牌顯示正確的圖案
- [ ] 每張牌的角落顯示對應的兩種顏色圖示
- [ ] 卡牌排列整齊美觀
- [ ] 響應式設計，手機版也能正常顯示
