#!/usr/bin/env python3
"""Generate English credentials PDF for Irancell production."""
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'reportlab', '-q'])
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

OUT_PATH = Path('/workspace/irancell-credentials-and-info.pdf')

CREDENTIALS = {
    'site_url': 'https://irancell-31038.ir',
    'admin_panel': 'https://irancell-31038.ir/admin/login',
    'server_ip': '85.208.253.193',
    'ssh_port': '3031',
    'admin_email': 'admin@example.com',
    'admin_password': '6Up7uKc805bJ7T4H',
    'mongo_db': 'irancell_shop',
    'mongo_user': 'irancell_app',
    'mongo_password': 'Tad$YKXNS$a0*n*h26W2Tbf%',
    'mongo_uri': 'mongodb://irancell_app:Tad%24YKXNS%24a0%2An%2Ah26W2Tbf%25@127.0.0.1:27017/irancell_shop?authSource=irancell_shop',
    'jwt_secret': 'b0e2a64785b4ba3ea30af33eca7cd16430c3f033d243ec4c5794f93491e640e2',
    'zarinpal_id': '4d025349-150c-4fca-81ad-6fe936e107e9',
    'zarinpal_callback': 'https://irancell-31038.ir/api/payment/verify',
    'zibal_id': '6a4cfcb2f60cc5e13aa1ff14',
    'zibal_callback': 'https://irancell-31038.ir/api/payment/verify/zibal',
    'backup_dir': '/var/backups/irancell-mongodb/',
    'backup_script': '/var/www/irancell/deploy/mongodb-backup.sh',
    'backup_schedule': 'Daily at 03:00 UTC',
    'project_path': '/var/www/irancell/',
}


def esc(text):
    return str(text).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def section_table(rows, col_widths=(5.5 * cm, 10.5 * cm)):
    table = Table(rows, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return table


def build_pdf():
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUT_PATH),
        pagesize=A4,
        rightMargin=1.8 * cm,
        leftMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
        title='Irancell Production Credentials',
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, leading=20, alignment=1, spaceAfter=8)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=10, leading=14, alignment=1, textColor=colors.grey)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=12, leading=16, spaceBefore=10, spaceAfter=6)
    warn_style = ParagraphStyle('Warn', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.red, alignment=1, spaceAfter=12)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9, leading=13)
    mono_style = ParagraphStyle('Mono', parent=styles['Code'], fontSize=8, leading=11, fontName='Courier')

    c = CREDENTIALS
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    story = []

    story.append(Paragraph('Irancell Shop — Production Credentials &amp; Security Report', title_style))
    story.append(Paragraph(f'Generated: {now}', subtitle_style))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph('CONFIDENTIAL — Store this file securely and delete from public locations after download.', warn_style))

    sections = [
        ('Site Information', [
            ['Website URL', c['site_url']],
            ['Admin Panel', c['admin_panel']],
            ['Server IP', c['server_ip']],
            ['SSH Port', c['ssh_port']],
            ['Stack', 'Nuxt 3 + Express + MongoDB + Nginx + PM2'],
        ]),
        ('Admin Login', [
            ['Email', c['admin_email']],
            ['Password', c['admin_password']],
        ]),
        ('MongoDB Database', [
            ['Database Name', c['mongo_db']],
            ['Username', c['mongo_user']],
            ['Password', c['mongo_password']],
        ]),
        ('Payment Gateways', [
            ['ZarinPal Merchant ID', c['zarinpal_id']],
            ['ZarinPal Callback URL', c['zarinpal_callback']],
            ['ZarinPal Default', 'Yes'],
            ['Zibal Merchant ID', c['zibal_id']],
            ['Zibal Callback URL', c['zibal_callback']],
        ]),
        ('Database Backup', [
            ['Backup Directory', c['backup_dir']],
            ['Backup Script', c['backup_script']],
            ['Schedule', c['backup_schedule']],
            ['Pre-cleanup Backup', 'irancell_20260713_174217.tar.gz'],
        ]),
        ('Server Paths', [
            ['Project Root', c['project_path']],
            ['Backend .env', c['project_path'] + 'backend/.env'],
            ['Server Credentials File', '/root/irancell-production-credentials.txt'],
        ]),
        ('Current Database Status', [
            ['admins', '1 (kept)'],
            ['users', '0 (cleared)'],
            ['orders', '0 (cleared)'],
            ['products', '0 (cleared — re-add from admin panel)'],
            ['numbers', '0 (cleared — re-add from admin panel)'],
            ['payments', '0 (cleared)'],
        ]),
    ]

    for heading, rows in sections:
        story.append(Paragraph(esc(heading), heading_style))
        story.append(section_table([[esc(a), esc(b)] for a, b in rows]))
        story.append(Spacer(1, 0.25 * cm))

    story.append(Paragraph('MongoDB Connection URI', heading_style))
    story.append(Paragraph(esc(c['mongo_uri']), mono_style))
    story.append(Spacer(1, 0.2 * cm))

    story.append(Paragraph('JWT Secret', heading_style))
    story.append(Paragraph(esc(c['jwt_secret']), mono_style))
    story.append(Spacer(1, 0.35 * cm))

    story.append(Paragraph('Security Hardening Applied (Server + Application)', heading_style))
    security_items = [
        'MongoDB authentication enabled with dedicated app user (irancell_app)',
        'Strong random JWT secret configured (64-char hex)',
        'Admin password rotated to a strong password',
        'Database cleaned — only admin account kept, all test/user/order data removed',
        'Pre-cleanup full MongoDB backup created and stored',
        'Daily automatic MongoDB backup scheduled via cron (03:00 UTC)',
        'API server bound to 127.0.0.1 only (not directly exposed to internet)',
        'UFW firewall enabled — only ports 80, 443, and 3031 (SSH) open',
        'HTTPS enabled on irancell-31038.ir with SSL certificate',
        'Order creation requires authenticated user login',
        'Payment initiation requires order ownership verification',
        'Rate limiting on orders, order tracking, and auth endpoints',
        'Checkout cart validation hardened (item type, quantity, amount checks)',
        'Health endpoint minimized (no internal flags exposed)',
        'Security headers enabled (X-Frame-Options, X-Content-Type-Options, etc.)',
        'Seed script no longer overwrites existing admin password',
        'CORS locked to production frontend URL only',
        'Body size limit reduced to 2MB',
        'Trust proxy enabled for correct client IP behind Nginx',
    ]
    for item in security_items:
        story.append(Paragraph(f'• {esc(item)}', body_style))

    story.append(Spacer(1, 0.35 * cm))
    story.append(Paragraph('Remaining Recommended Actions', heading_style))
    for item in [
        'Change SSH server root password immediately',
        'Update admin email from admin@example.com to your real email',
        'Activate ZarinPal terminal in ZarinPal dashboard (currently returns "Terminal not active")',
        'Re-add products and phone numbers from the admin panel',
        'Remove this PDF from GitHub immediately after download',
        'Rotate all credentials if this file was ever exposed publicly',
    ]:
        story.append(Paragraph(f'• {esc(item)}', body_style))

    doc.build(story)
    print(f'PDF saved: {OUT_PATH}')


if __name__ == '__main__':
    build_pdf()
