#!/usr/bin/env python3
"""Generate Persian/English credentials PDF for Irancell production."""
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'reportlab', '-q'])
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

OUT_PATH = Path('/opt/cursor/artifacts/irancell-credentials-and-info.pdf')
FONT_PATH = Path('/tmp/Vazirmatn-Regular.ttf')
FONT_BOLD_PATH = Path('/tmp/Vazirmatn-Bold.ttf')

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
    'backup_schedule': 'Daily at 03:00',
    'project_path': '/var/www/irancell/',
}


def ensure_fonts():
    if not FONT_PATH.exists():
        urllib.request.urlretrieve(
            'https://github.com/rastikerdar/vazirmatn/raw/master/fonts/ttf/Vazirmatn-Regular.ttf',
            FONT_PATH,
        )
    if not FONT_BOLD_PATH.exists():
        urllib.request.urlretrieve(
            'https://github.com/rastikerdar/vazirmatn/raw/master/fonts/ttf/Vazirmatn-Bold.ttf',
            FONT_BOLD_PATH,
        )
    pdfmetrics.registerFont(TTFont('Vazir', str(FONT_PATH)))
    pdfmetrics.registerFont(TTFont('VazirBold', str(FONT_BOLD_PATH)))


def esc(text):
    return str(text).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def section_table(rows, col_widths=(5.5 * cm, 10.5 * cm)):
    table = Table(rows, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#fff8dc')),
        ('FONTNAME', (0, 0), (0, -1), 'VazirBold'),
        ('FONTNAME', (1, 0), (1, -1), 'Vazir'),
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
    ensure_fonts()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(OUT_PATH),
        pagesize=A4,
        rightMargin=1.8 * cm,
        leftMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
        title='Irancell Credentials',
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', fontName='VazirBold', fontSize=16, leading=22, alignment=1, spaceAfter=10)
    subtitle_style = ParagraphStyle('Subtitle', fontName='Vazir', fontSize=10, leading=14, alignment=1, textColor=colors.grey)
    heading_style = ParagraphStyle('Heading', fontName='VazirBold', fontSize=12, leading=16, spaceBefore=8, spaceAfter=6, textColor=colors.HexColor('#1a1a1a'))
    warn_style = ParagraphStyle('Warn', fontName='VazirBold', fontSize=10, leading=14, textColor=colors.red, alignment=1, spaceAfter=12)
    body_style = ParagraphStyle('Body', fontName='Vazir', fontSize=9, leading=13)
    mono_style = ParagraphStyle('Mono', fontName='Courier', fontSize=8, leading=11)

    c = CREDENTIALS
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    story = []

    story.append(Paragraph('فروشگاه ایرانسل — اطلاعات ورود و تنظیمات', title_style))
    story.append(Paragraph('Irancell Shop — Production Credentials &amp; Configuration', subtitle_style))
    story.append(Paragraph(f'تاریخ / Date: {now}', subtitle_style))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph('⚠️ محرمانه — CONFIDENTIAL — در جای امن نگه دارید', warn_style))

    sections = [
        ('اطلاعات سایت / Site', [
            ['آدرس سایت', c['site_url']],
            ['پنل ادمین', c['admin_panel']],
            ['IP سرور', c['server_ip']],
            ['پورت SSH', c['ssh_port']],
        ]),
        ('ورود پنل ادمین / Admin Login', [
            ['ایمیل', c['admin_email']],
            ['رمز عبور', c['admin_password']],
        ]),
        ('MongoDB / دیتابیس', [
            ['نام دیتابیس', c['mongo_db']],
            ['کاربر', c['mongo_user']],
            ['رمز عبور', c['mongo_password']],
        ]),
        ('درگاه‌های پرداخت / Payment Gateways', [
            ['زرین‌پال Merchant', c['zarinpal_id']],
            ['زرین‌پال Callback', c['zarinpal_callback']],
            ['زیبال Merchant', c['zibal_id']],
            ['زیبال Callback', c['zibal_callback']],
            ['درگاه پیش‌فرض', 'ZarinPal / زرین‌پال'],
        ]),
        ('بکاپ / Backup', [
            ['مسیر', c['backup_dir']],
            ['اسکریپت', c['backup_script']],
            ['زمان‌بندی', c['backup_schedule']],
        ]),
        ('مسیرهای سرور / Server Paths', [
            ['پروژه', c['project_path']],
            ['Backend .env', c['project_path'] + 'backend/.env'],
            ['Credentials file', '/root/irancell-production-credentials.txt'],
        ]),
        ('وضعیت دیتابیس / DB Status', [
            ['admins', '1'],
            ['users, orders, products, numbers', '0 (پاک شده — از پنل ادمین اضافه کنید)'],
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
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph('امنیت اعمال‌شده / Security Applied', heading_style))
    for item in [
        'MongoDB authentication enabled',
        'Strong JWT secret configured',
        'API bound to localhost only',
        'UFW firewall enabled (ports 80, 443, 3031)',
        'Orders require user login',
        'Daily automatic database backup',
        'Test data removed — admins only kept',
    ]:
        story.append(Paragraph(f'• {esc(item)}', body_style))

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph('کارهای باقی‌مانده / Remaining Tasks', heading_style))
    for item in [
        'Change SSH server password',
        'Update admin email to your real email',
        'Activate ZarinPal terminal in dashboard',
        'Add products and numbers from admin panel',
    ]:
        story.append(Paragraph(f'• {esc(item)}', body_style))

    doc.build(story)
    print(f'PDF saved: {OUT_PATH}')


if __name__ == '__main__':
    build_pdf()
