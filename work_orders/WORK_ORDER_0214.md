# 工作單 0214

## 編號
0214

## 日期
2026-01-31

## 工作單標題
建立圖片資源目錄並放置卡片圖片

## 工單主旨
UI 資源管理 - 顏色組合牌圖片資源

## 內容

### 任務描述
建立前端圖片資源目錄結構，並將用戶提供的六張雙色卡片圖片放置到正確位置。

### 具體工作項目

1. **建立目錄結構**
   - 在 `frontend/public/` 下建立 `images/cards/` 目錄

2. **複製並重命名圖片**
   將用戶提供的圖片從 `C:\Users\yuxia\Downloads\` 複製到 `frontend/public/images/cards/`，並重命名：

   | 原始檔名 | 目標檔名 |
   |---------|---------|
   | 紅綠.jpg | red-green.jpg |
   | 綠藍.jpg | green-blue.jpg |
   | 黃綠.jpg | green-yellow.jpg |
   | 紅藍.jpg | red-blue.jpg |
   | 紅黃.jpg | yellow-red.jpg |
   | 黃藍.jpg | yellow-blue.jpg |

### 驗收標準

- [ ] `frontend/public/images/cards/` 目錄存在
- [ ] 六張圖片都已正確放置並命名
- [ ] 圖片可透過 `/images/cards/{id}.jpg` 路徑存取

### 相關文件
- 計畫書：`docs/PLAN_COLOR_CARD_IMAGES.md`
