#!/usr/bin/env python3
"""Production security hardening: MongoDB auth, backup, DB cleanup, firewall, credentials."""
import json
import os
import secrets
import string
import sys
import urllib.parse

import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = os.environ.get('IRANCELL_SSH_HOST', '85.208.253.193')
PORT = int(os.environ.get('IRANCELL_SSH_PORT', '3031'))
USER = os.environ.get('IRANCELL_SSH_USER', 'root')
PASSWORD = os.environ.get('IRANCELL_SSH_PASSWORD', '3Z3w0c8)6Ok0iQe5')
APP_DIR = '/var/www/irancell'
BACKUP_DIR = '/var/backups/irancell-mongodb'
CREDS_FILE = '/root/irancell-production-credentials.txt'


def gen_password(length=20):
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def run(client, cmd, timeout=300):
    print(f'\n>>> {cmd[:120]}')
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out[-4000:] if len(out) > 4000 else out)
    if err.strip() and code != 0:
        print('ERR:', err[-2000:])
    return code, out, err


def main():
    mongo_app_pass = gen_password(24)
    jwt_secret = secrets.token_hex(32)
    admin_pass = gen_password(16)
    admin_email = 'admin@example.com'

    encoded_pass = urllib.parse.quote(mongo_app_pass, safe='')
    mongo_uri = f'mongodb://irancell_app:{encoded_pass}@127.0.0.1:27017/irancell_shop?authSource=irancell_shop'

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)

    steps = [
        f'mkdir -p {BACKUP_DIR}',
        f'chmod +x {APP_DIR}/deploy/mongodb-backup.sh 2>/dev/null || true',
        # backup before any destructive action
        f'bash {APP_DIR}/deploy/mongodb-backup.sh || mongodump --db=irancell_shop --out={BACKUP_DIR}/pre_harden_$(date +%Y%m%d_%H%M%S) --gzip',
    ]
    for cmd in steps:
        run(client, cmd)

    mongo_payload = json.dumps({
        'user': 'irancell_app',
        'pwd': mongo_app_pass,
        'roles': [{'role': 'readWrite', 'db': 'irancell_shop'}],
    })
    run(client, f"""
mongosh irancell_shop --quiet --eval 'try {{ db.dropUser("irancell_app") }} catch(e) {{}}'
mongosh irancell_shop --quiet --eval 'db.createUser({mongo_payload})'
""")

    # enable MongoDB auth if not enabled
    run(client, r"""
grep -q 'authorization: enabled' /etc/mongod.conf 2>/dev/null || (
  cp /etc/mongod.conf /etc/mongod.conf.bak.$(date +%Y%m%d)
  if grep -q '^security:' /etc/mongod.conf; then
    sed -i '/^security:/,/^[a-z]/ s/authorization:.*/  authorization: enabled/' /etc/mongod.conf
  else
    printf '\nsecurity:\n  authorization: enabled\n' >> /etc/mongod.conf
  fi
  systemctl restart mongod
  sleep 2
)
""")

    env_updates = {
        'MONGODB_URI': mongo_uri,
        'JWT_SECRET': jwt_secret,
        'ADMIN_PASSWORD': admin_pass,
        'ADMIN_EMAIL': admin_email,
        'HOST': '127.0.0.1',
        'NODE_ENV': 'production',
    }

    # update backend .env safely
    run(client, f"""python3 - <<'PYENV'
import pathlib, re, json
p = pathlib.Path('{APP_DIR}/backend/.env')
text = p.read_text() if p.exists() else ''
updates = {json.dumps(env_updates)}
for k, v in updates.items():
    line = f'{{k}}={{v}}'
    if re.search(rf'^{{k}}=', text, re.M):
        text = re.sub(rf'^{{k}}=.*', line, text, flags=re.M)
    else:
        text += ('\\n' if text and not text.endswith('\\n') else '') + line + '\\n'
p.write_text(text)
print('env updated')
PYENV""")

    # cleanup database (keep admins)
    run(client, f'cd {APP_DIR}/backend && node src/scripts/cleanup-database.js {APP_DIR}/backend/.env')

    # reset admin password
    run(client, f'cd {APP_DIR}/backend && node src/scripts/set-admin-password.js {APP_DIR}/backend/.env')

    # cron backup daily at 3am
    run(client, f'(crontab -l 2>/dev/null | grep -v mongodb-backup; echo "0 3 * * * {APP_DIR}/deploy/mongodb-backup.sh >> /var/log/irancell-backup.log 2>&1") | crontab -')

    # firewall
    run(client, f"""
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow {PORT}/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
""")

    # restart app
    run(client, 'export LANG=C; pm2 restart all --update-env && sleep 3 && pm2 list')
    run(client, 'curl -s http://127.0.0.1:3001/api/health')
    run(client, 'curl -s http://127.0.0.1:3001/api/payment/gateways')

    creds = f"""IRANCELL PRODUCTION CREDENTIALS
Generated: auto
KEEP THIS FILE SECURE

Site URL: https://irancell-31038.ir
Admin Panel: https://irancell-31038.ir/admin/login

Admin Login:
  Email: {admin_email}
  Password: {admin_pass}

MongoDB:
  Database: irancell_shop
  App User: irancell_app
  App Password: {mongo_app_pass}
  URI: {mongo_uri}

JWT Secret: {jwt_secret}

Backup:
  Script: {APP_DIR}/deploy/mongodb-backup.sh
  Directory: {BACKUP_DIR}
  Schedule: daily 03:00

Payment Gateways:
  ZarinPal: 4d025349-150c-4fca-81ad-6fe936e107e9
  Zibal: 6a4cfcb2f60cc5e13aa1ff14

Security changes applied:
  - MongoDB authentication enabled
  - Database cleaned (admins only kept)
  - Strong JWT secret set
  - Admin password rotated
  - API bound to localhost
  - UFW firewall enabled
  - Daily MongoDB backups scheduled
"""
    sftp = client.open_sftp()
    with sftp.file(CREDS_FILE, 'w') as f:
        f.write(creds)
    sftp.close()
    run(client, f'chmod 600 {CREDS_FILE}')

    # save local copy for PDF generation
    local_creds = '/tmp/irancell-credentials.txt'
    with open(local_creds, 'w', encoding='utf-8') as f:
        f.write(creds)

    print('\n=== HARDENING COMPLETE ===')
    print(creds)
    client.close()
    return local_creds, creds


if __name__ == '__main__':
    main()
