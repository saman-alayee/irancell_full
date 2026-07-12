#!/usr/bin/env python3
"""Patch production .env for SMS template + Irancell shop."""
import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST, PORT, USER, PASSWORD = '85.208.253.193', 3031, 'root', '3Z3w0c8)6Ok0iQe5'
ENV = '/var/www/irancell/backend/.env'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)

patch = r'''
ENV=/var/www/irancell/backend/.env
set_kv() {
  key="$1"; val="$2"
  if grep -q "^${key}=" "$ENV" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV"
  else
    echo "${key}=${val}" >> "$ENV"
  fi
}
set_kv SMS_IR_PAYMENT_TEMPLATE_ID 352975
set_kv SMS_IR_PAYMENT_ORDER_PARAM ORDER_NUMBER
set_kv SMS_IR_TEMPLATE_ID 553188
set_kv SMS_IR_CODE_PARAM VERIFICATIONCODE
set_kv IRANCELL_SHOP_API_BASE https://apishop.irancell.ir
set_kv IRANCELL_SHOP_CHANNEL eShop
set_kv IRANCELL_SHOP_DEV_MODE false
set_kv IRANCELL_SHOP_TIMEOUT_MS 12000
set_kv IRANCELL_LOOKUP_DELAY_MS 250
set_kv IRANCELL_LOOKUP_CONCURRENCY 4
set_kv ZARINPAL_MERCHANT_ID 4d025349-150c-4fca-81ad-6fe936e107e9
set_kv ZARINPAL_SANDBOX false
set_kv ZARINPAL_CALLBACK_URL http://irancell-31038.ir/api/payment/verify
grep -E '^(SMS_IR_TEMPLATE|SMS_IR_CODE|IRANCELL_|ZARINPAL_)' "$ENV"
test -f /var/www/irancell/backend/src/services/IrancellShopService.js && echo IRANCELL_SERVICE=ok || echo IRANCELL_SERVICE=missing
'''

_, o, e = client.exec_command(f"bash -lc {repr(patch)}", timeout=60)
print((o.read() + e.read()).decode('utf-8', errors='replace'))
client.close()
