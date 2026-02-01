# 工單 0365：前端效能優化

## 基本資訊
- **工單編號**：0365
- **所屬計畫**：P2-D 品質保證
- **前置工單**：0348
- **預計影響檔案**：
  - 各組件虛擬化和 memo 處理
  - `frontend/src/utils/performance.js`

## 目標
優化前端渲染效能

## 詳細規格
- React.memo 關鍵組件
- useMemo/useCallback 優化
- 虛擬滾動（大量生物時）
- 圖片懶載入
- Bundle 分割
- 動畫 GPU 加速

## 效能目標
- FCP < 1.5s
- TTI < 3s
- CLS < 0.1

## 驗收標準
1. [ ] Lighthouse 分數 > 90
2. [ ] 無不必要的重渲染
3. [ ] 動畫流暢 60fps
