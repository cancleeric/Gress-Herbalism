@echo off
REM 啟動本地開發服務腳本
REM 使用方式：雙擊執行或在命令行執行 start-local.bat

echo ========================================
echo    本草推理桌遊 - 啟動本地開發服務
echo ========================================
echo.

REM 取得專案根目錄
cd /d %~dp0

REM 啟動後端服務 (port 3001)
echo [1/2] 啟動後端服務 (http://localhost:3001)...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm run dev"

REM 等待後端啟動
timeout /t 3 /nobreak > nul

REM 啟動前端服務 (port 3000)
echo [2/2] 啟動前端服務 (http://localhost:3000)...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo    服務啟動中...
echo ========================================
echo.
echo    前端: http://localhost:3000
echo    後端: http://localhost:3001
echo.
echo    (已在新視窗中啟動，請稍候瀏覽器自動開啟)
echo.
