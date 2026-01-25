#!/bin/bash
# 一鍵部署腳本：推送 GitHub + 部署 Cloud Run
# 使用方式：./deploy.sh "commit 訊息"

set -e

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 取得 commit 訊息
COMMIT_MSG="${1:-Auto deploy}"

echo -e "${YELLOW}========== 開始部署流程 ==========${NC}"

# 1. 取得專案根目錄
ROOT_DIR=$(git rev-parse --show-toplevel)
cd "$ROOT_DIR"

# 2. 檢查是否有未提交的變更
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${GREEN}[1/5] 添加變更到暫存區...${NC}"
    git add -A

    echo -e "${GREEN}[2/5] 提交變更...${NC}"
    git commit -m "$COMMIT_MSG

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
else
    echo -e "${GREEN}[1/5] 沒有新變更需要提交${NC}"
    echo -e "${GREEN}[2/5] 跳過提交${NC}"
fi

# 3. 推送到 GitHub
echo -e "${GREEN}[3/5] 推送到 GitHub...${NC}"
git push origin master

# 4. 部署後端
echo -e "${GREEN}[4/5] 部署後端到 Cloud Run...${NC}"
cd "$ROOT_DIR/backend"
gcloud run deploy herbalism-backend \
    --source . \
    --region asia-east1 \
    --allow-unauthenticated \
    --port 8080 \
    --quiet

# 5. 部署前端
echo -e "${GREEN}[5/5] 部署前端到 Cloud Run...${NC}"
cd "$ROOT_DIR/frontend"
gcloud run deploy herbalism-frontend \
    --source . \
    --region asia-east1 \
    --allow-unauthenticated \
    --port 8080 \
    --quiet

echo -e "${YELLOW}========== 部署完成！ ==========${NC}"
echo ""
echo "前端: https://herbalism-frontend-130514813450.asia-east1.run.app"
echo "後端: https://herbalism-backend-130514813450.asia-east1.run.app"
