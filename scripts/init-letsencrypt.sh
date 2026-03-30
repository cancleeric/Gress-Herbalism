#!/bin/bash
# init-letsencrypt.sh
# 初始化 Let's Encrypt SSL 憑證
# 執行前請確認：
#   1. 已設定 .env 檔案（DOMAIN、CERTBOT_EMAIL）
#   2. 網域 DNS 已指向此伺服器
#   3. 防火牆已開放 80 和 443 端口
#
# 使用方式：
#   chmod +x scripts/init-letsencrypt.sh
#   sudo ./scripts/init-letsencrypt.sh

set -e

# ===== 載入環境變數 =====
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$ROOT_DIR/.env" ]]; then
    source "$ROOT_DIR/.env"
else
    echo "錯誤：找不到 .env 檔案，請先複製 .env.example 並填入設定"
    exit 1
fi

# 檢查必要變數
if [[ -z "$DOMAIN" ]] || [[ "$DOMAIN" == "your-domain.com" ]]; then
    echo "錯誤：請在 .env 中設定 DOMAIN 變數"
    exit 1
fi

if [[ -z "$CERTBOT_EMAIL" ]] || [[ "$CERTBOT_EMAIL" == "your-email@example.com" ]]; then
    echo "錯誤：請在 .env 中設定 CERTBOT_EMAIL 變數"
    exit 1
fi

echo "========== 初始化 Let's Encrypt SSL 憑證 =========="
echo "網域：$DOMAIN"
echo "郵件：$CERTBOT_EMAIL"
echo ""

# ===== 建立目錄結構 =====
mkdir -p "$ROOT_DIR/certbot/conf"
mkdir -p "$ROOT_DIR/certbot/www"

# ===== 下載建議的 TLS 參數（如尚未存在）=====
if [[ ! -f "$ROOT_DIR/certbot/conf/options-ssl-nginx.conf" ]]; then
    echo "[1/4] 下載 TLS 安全參數..."
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
        -o "$ROOT_DIR/certbot/conf/options-ssl-nginx.conf"
fi

if [[ ! -f "$ROOT_DIR/certbot/conf/ssl-dhparams.pem" ]]; then
    echo "[2/4] 生成 DH 參數（這可能需要幾分鐘）..."
    openssl dhparam -out "$ROOT_DIR/certbot/conf/ssl-dhparams.pem" 4096
fi

# ===== 建立暫時的自簽憑證（讓 Nginx 能啟動）=====
echo "[3/4] 建立暫時自簽憑證..."
TEMP_CERT_DIR="$ROOT_DIR/certbot/conf/live/$DOMAIN"
mkdir -p "$TEMP_CERT_DIR"

openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout "$TEMP_CERT_DIR/privkey.pem" \
    -out "$TEMP_CERT_DIR/fullchain.pem" \
    -subj "/CN=localhost" 2>/dev/null

# ===== 啟動 Nginx（僅用於 HTTP 驗證）=====
echo "[4/4] 啟動服務並申請正式憑證..."
cd "$ROOT_DIR"

docker compose -f docker-compose.prod.yml up --force-recreate -d nginx

echo "等待 Nginx 啟動..."
sleep 5

# ===== 刪除暫時憑證並申請正式憑證 =====
rm -rf "$TEMP_CERT_DIR"

docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# ===== 重新載入 Nginx =====
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo ""
echo "========== SSL 憑證申請完成！=========="
echo "啟動所有服務："
echo "  docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "憑證將每 12 小時自動更新（由 certbot 服務管理）"
