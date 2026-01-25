@echo off
REM 一鍵部署腳本：推送 GitHub + 部署 Cloud Run
REM 使用方式：deploy.bat "commit 訊息"

setlocal enabledelayedexpansion

set COMMIT_MSG=%~1
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Auto deploy

echo ========== 開始部署流程 ==========

REM 取得專案根目錄
cd /d %~dp0

REM 1. 添加變更
echo [1/5] 添加變更到暫存區...
git add -A

REM 2. 提交變更
echo [2/5] 提交變更...
git commit -m "%COMMIT_MSG%" -m "Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

REM 3. 推送到 GitHub
echo [3/5] 推送到 GitHub...
git push origin master

REM 4. 部署後端
echo [4/5] 部署後端到 Cloud Run...
cd backend
call gcloud run deploy herbalism-backend --source . --region asia-east1 --allow-unauthenticated --port 8080 --quiet
cd ..

REM 5. 部署前端
echo [5/5] 部署前端到 Cloud Run...
cd frontend
call gcloud run deploy herbalism-frontend --source . --region asia-east1 --allow-unauthenticated --port 8080 --quiet
cd ..

echo.
echo ========== 部署完成！ ==========
echo.
echo 前端: https://herbalism-frontend-130514813450.asia-east1.run.app
echo 後端: https://herbalism-backend-130514813450.asia-east1.run.app

endlocal
