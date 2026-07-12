#!/bin/bash
set -e

APP_DIR="/var/www/irancell"
SERVER_IP="85.208.253.193"

install_packages() {
  if command -v apt-get &>/dev/null; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq 2>/dev/null || apt-get update -qq -o Dir::Etc::sourcelist=/etc/apt/sources.list -o Dir::Etc::sourceparts="-" -o APT::Get::List-Cleanup="0" || true
    apt-get install -y -qq curl gnupg nginx ca-certificates openssl
  elif command -v dnf &>/dev/null; then
    dnf install -y curl gnupg nginx ca-certificates openssl
  elif command -v yum &>/dev/null; then
    yum install -y curl gnupg nginx ca-certificates openssl
  else
    echo "Unsupported package manager"
    exit 1
  fi
}

install_node() {
  if command -v node &>/dev/null && [ "$(node -v | cut -d. -f1 | tr -d v)" -ge 18 ]; then
    return
  fi
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  if command -v apt-get &>/dev/null; then
    apt-get install -y -qq nodejs
  elif command -v dnf &>/dev/null; then
    dnf install -y nodejs
  elif command -v yum &>/dev/null; then
    yum install -y nodejs
  fi
}

install_mongo() {
  if command -v mongod &>/dev/null; then
    return
  fi
  if command -v apt-get &>/dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list || true
    apt-get update -qq
    apt-get install -y -qq mongodb-org || apt-get install -y -qq mongodb || true
  fi
  systemctl enable mongod 2>/dev/null || true
  systemctl start mongod 2>/dev/null || true
}

setup_nginx() {
  if [ -d /etc/nginx/sites-available ]; then
    cp "$APP_DIR/deploy/nginx-irancell.conf" /etc/nginx/sites-available/irancell
    ln -sf /etc/nginx/sites-available/irancell /etc/nginx/sites-enabled/irancell
    rm -f /etc/nginx/sites-enabled/default
  else
    cp "$APP_DIR/deploy/nginx-irancell.conf" /etc/nginx/conf.d/irancell.conf
  fi
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
}

echo "==> System packages..."
install_packages

echo "==> Node.js..."
install_node

if ! command -v pm2 &>/dev/null; then
  echo "==> PM2..."
  npm install -g pm2
fi

echo "==> MongoDB..."
install_mongo

mkdir -p "$APP_DIR/backend/uploads"

echo "==> Backend env..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
cat > "$APP_DIR/backend/.env" << ENVEOF
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/irancell_shop
JWT_SECRET=irancell-prod-$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

ZARINPAL_MERCHANT_ID=4d025349-150c-4fca-81ad-6fe936e107e9
ZARINPAL_SANDBOX=false
ZARINPAL_CALLBACK_URL=http://${SERVER_IP}/api/payment/verify

FRONTEND_URL=http://${SERVER_IP}
API_PUBLIC_URL=http://${SERVER_IP}

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456

SMS_IR_API_KEY=your-sms-ir-api-key
SMS_IR_TEMPLATE_ID=553188
SMS_IR_CODE_PARAM=VERIFICATIONCODE
SMS_IR_DEV_MODE=false
ENVEOF
else
  echo "Updating backend .env URLs for production..."
  sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=http://${SERVER_IP}|" "$APP_DIR/backend/.env"
  sed -i "s|^ZARINPAL_CALLBACK_URL=.*|ZARINPAL_CALLBACK_URL=http://${SERVER_IP}/api/payment/verify|" "$APP_DIR/backend/.env"
  sed -i "s|^ZARINPAL_MERCHANT_ID=.*|ZARINPAL_MERCHANT_ID=4d025349-150c-4fca-81ad-6fe936e107e9|" "$APP_DIR/backend/.env"
  sed -i "s|^ZARINPAL_SANDBOX=.*|ZARINPAL_SANDBOX=false|" "$APP_DIR/backend/.env"
  sed -i "s|^API_PUBLIC_URL=.*|API_PUBLIC_URL=http://${SERVER_IP}|" "$APP_DIR/backend/.env"
  grep -q '^FRONTEND_URL=' "$APP_DIR/backend/.env" || echo "FRONTEND_URL=http://${SERVER_IP}" >> "$APP_DIR/backend/.env"
  grep -q '^API_PUBLIC_URL=' "$APP_DIR/backend/.env" || echo "API_PUBLIC_URL=http://${SERVER_IP}" >> "$APP_DIR/backend/.env"
  sed -i 's/\r$//' "$APP_DIR/backend/.env"
fi

echo "==> Frontend env..."
cat > "$APP_DIR/frontend/.env" << ENVEOF
NUXT_PUBLIC_API_BASE=http://${SERVER_IP}/api
API_BASE_INTERNAL=http://127.0.0.1:3001/api
ENVEOF

echo "==> Backend npm install..."
cd "$APP_DIR/backend"
npm install --omit=dev --ignore-scripts
node src/scripts/seed.js || true

echo "==> Frontend build..."
cd "$APP_DIR/frontend"
rm -rf node_modules .output .nuxt
npm install --ignore-scripts
npm run build
rm -rf .nuxt

echo "==> Nginx..."
setup_nginx

echo "==> PM2..."
cd "$APP_DIR"
pm2 delete all 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "==> Done! http://${SERVER_IP}"
