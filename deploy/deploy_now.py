#!/usr/bin/env python3
"""Deploy latest code to production without full system setup."""
import os
import sys
import tarfile
import tempfile
import paramiko

HOST, PORT, USER, PASSWORD = '85.208.253.193', 3031, 'root', '3Z3w0c8)6Ok0iQe5'
REMOTE = '/var/www/irancell'
PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {'node_modules', '.git', '.nuxt', '.output', 'dist', '__pycache__'}
SKIP_FILES = {'.env'}


def p(s):
    try:
        print(s)
    except UnicodeEncodeError:
        print(s.encode('ascii', errors='replace').decode('ascii'))


def should_skip(path):
    parts = path.replace('\\', '/').split('/')
    if any(x in SKIP_DIRS for x in parts):
        return True
    if os.path.basename(path) in SKIP_FILES:
        return True
    return False


def run(client, cmd, timeout=900):
    p(f'\n>>> {cmd[:100]}...' if len(cmd) > 100 else f'\n>>> {cmd}')
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    if out.strip():
        p(out[-6000:] if len(out) > 6000 else out)
    if err.strip() and code != 0:
        p('ERR: ' + err[-2000:])
    return code


def main():
    tar_fd, tar_path = tempfile.mkstemp(suffix='.tar.gz')
    os.close(tar_fd)
    try:
        p('Creating archive...')
        with tarfile.open(tar_path, 'w:gz') as tar:
            for root, dirs, files in os.walk(PROJECT):
                dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
                rel_root = os.path.relpath(root, PROJECT)
                if rel_root == '.':
                    rel_root = ''
                for name in files:
                    full = os.path.join(root, name)
                    rel = os.path.join(rel_root, name).replace('\\', '/')
                    if should_skip(full) or rel.startswith('deploy/deploy_now.py'):
                        continue
                    tar.add(full, arcname=rel if rel else name)
        p(f'Archive: {os.path.getsize(tar_path) / 1024 / 1024:.1f} MB')

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)

        sftp = client.open_sftp()
        sftp.put(tar_path, '/tmp/irancell-deploy.tar.gz')
        sftp.close()

        steps = [
            f'tar -xzf /tmp/irancell-deploy.tar.gz -C {REMOTE}',
            f"sed -i 's/\\r$//' {REMOTE}/deploy/*.sh {REMOTE}/deploy/*.cjs 2>/dev/null || true",
            f"grep -q '^IRANCELL_SHOP_API_BASE=' {REMOTE}/backend/.env 2>/dev/null || "
            f"printf '\\nIRANCELL_SHOP_API_BASE=https://apishop.irancell.ir\\nIRANCELL_SHOP_CHANNEL=eShop\\n"
            f"IRANCELL_SHOP_DEV_MODE=false\\nIRANCELL_SHOP_TIMEOUT_MS=12000\\nIRANCELL_LOOKUP_DELAY_MS=250\\n"
            f"IRANCELL_LOOKUP_CONCURRENCY=4\\n' "
            f">> {REMOTE}/backend/.env",
            f"sed -i 's/^IRANCELL_SHOP_DEV_MODE=.*/IRANCELL_SHOP_DEV_MODE=false/' {REMOTE}/backend/.env 2>/dev/null || true",
            f"grep -q '^SMS_IR_TEMPLATE_ID=' {REMOTE}/backend/.env 2>/dev/null && "
            f"sed -i 's/^SMS_IR_TEMPLATE_ID=.*/SMS_IR_TEMPLATE_ID=553188/' {REMOTE}/backend/.env || "
            f"echo 'SMS_IR_TEMPLATE_ID=553188' >> {REMOTE}/backend/.env",
            f"grep -q '^SMS_IR_CODE_PARAM=' {REMOTE}/backend/.env 2>/dev/null || "
            f"echo 'SMS_IR_CODE_PARAM=VERIFICATIONCODE' >> {REMOTE}/backend/.env",
            f"grep -q '^SMS_IR_PAYMENT_TEMPLATE_ID=' {REMOTE}/backend/.env 2>/dev/null && "
            f"sed -i 's/^SMS_IR_PAYMENT_TEMPLATE_ID=.*/SMS_IR_PAYMENT_TEMPLATE_ID=352975/' {REMOTE}/backend/.env || "
            f"echo 'SMS_IR_PAYMENT_TEMPLATE_ID=352975' >> {REMOTE}/backend/.env",
            f"grep -q '^SMS_IR_PAYMENT_ORDER_PARAM=' {REMOTE}/backend/.env 2>/dev/null && "
            f"sed -i 's/^SMS_IR_PAYMENT_ORDER_PARAM=.*/SMS_IR_PAYMENT_ORDER_PARAM=ORDER_NUMBER/' {REMOTE}/backend/.env || "
            f"echo 'SMS_IR_PAYMENT_ORDER_PARAM=ORDER_NUMBER' >> {REMOTE}/backend/.env",
            f"grep -q '^ZARINPAL_MERCHANT_ID=' {REMOTE}/backend/.env 2>/dev/null && "
            f"sed -i 's/^ZARINPAL_MERCHANT_ID=.*/ZARINPAL_MERCHANT_ID=4d025349-150c-4fca-81ad-6fe936e107e9/' {REMOTE}/backend/.env || "
            f"echo 'ZARINPAL_MERCHANT_ID=4d025349-150c-4fca-81ad-6fe936e107e9' >> {REMOTE}/backend/.env",
            f"grep -q '^ZARINPAL_SANDBOX=' {REMOTE}/backend/.env 2>/dev/null && "
            f"sed -i 's/^ZARINPAL_SANDBOX=.*/ZARINPAL_SANDBOX=false/' {REMOTE}/backend/.env || "
            f"echo 'ZARINPAL_SANDBOX=false' >> {REMOTE}/backend/.env",
            f"grep -q '^ZARINPAL_CALLBACK_URL=' {REMOTE}/backend/.env 2>/dev/null && "
            f"sed -i 's|^ZARINPAL_CALLBACK_URL=.*|ZARINPAL_CALLBACK_URL=http://irancell-31038.ir/api/payment/verify|' {REMOTE}/backend/.env || "
            f"echo 'ZARINPAL_CALLBACK_URL=http://irancell-31038.ir/api/payment/verify' >> {REMOTE}/backend/.env",
            f'cd {REMOTE}/backend && npm install --omit=dev --ignore-scripts',
            f'cd {REMOTE}/frontend && npm install --ignore-scripts',
            f'cd {REMOTE}/frontend && npm run build',
            'export LANG=C; pm2 restart all --update-env',
            'sleep 4',
            'curl -s -o /dev/null -w "home:%{http_code} " http://127.0.0.1:3000/',
            'curl -s -o /dev/null -w "api:%{http_code} " http://127.0.0.1:3001/api/health',
            'curl -s -o /dev/null -w "terms:%{http_code}\\n" http://127.0.0.1:3000/terms',
            'export LANG=C; pm2 list',
        ]
        for cmd in steps:
            code = run(client, cmd)
            if code != 0 and 'npm run build' in cmd:
                client.close()
                sys.exit(code)

        client.close()
        p(f'\n=== Deployed: http://{HOST} ===')
    finally:
        if os.path.exists(tar_path):
            os.remove(tar_path)


if __name__ == '__main__':
    main()
