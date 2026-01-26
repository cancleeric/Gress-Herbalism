#!/bin/bash
# 啟動本地開發服務腳本
# 使用方式：./start-local.sh

echo "========================================"
echo "   本草推理桌遊 - 啟動本地開發服務"
echo "========================================"
echo ""

# 取得腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 啟動後端服務 (port 3001)
echo "[1/2] 啟動後端服務 (http://localhost:3001)..."
cd "$SCRIPT_DIR/backend"
npm run dev &
BACKEND_PID=$!

# 等待後端啟動
sleep 3

# 啟動前端服務 (port 3000)
echo "[2/2] 啟動前端服務 (http://localhost:3000)..."
cd "$SCRIPT_DIR/frontend"
npm start &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "   服務已啟動"
echo "========================================"
echo ""
echo "   前端: http://localhost:3000"
echo "   後端: http://localhost:3001"
echo ""
echo "   後端 PID: $BACKEND_PID"
echo "   前端 PID: $FRONTEND_PID"
echo ""
echo "   按 Ctrl+C 停止所有服務"
echo ""

# 等待子程序
wait
