#!/usr/bin/env python3
"""Generate PDF report for Irancell production site."""
import sys
from datetime import datetime
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

CREDS_PATH = Path('/tmp/irancell-credentials.txt')
OUT_PATH = Path('/opt/cursor/artifacts/irancell-production-report.pdf')


def load_credentials():
    if CREDS_PATH.exists():
        return CREDS_PATH.read_text(encoding='utf-8')
    return 'Credentials file not found. Run production_harden.py first.'


def build_pdf():
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    creds = load_credentials()
    doc = SimpleDocTemplate(str(OUT_PATH), pagesize=A4, rightMargin=2 * cm, leftMargin=2 * cm, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, spaceAfter=12)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14)
    mono_style = ParagraphStyle('Mono', parent=styles['Code'], fontSize=8, leading=11, fontName='Courier')

    story = []
    story.append(Paragraph('Irancell Shop — Production Security Report', title_style))
    story.append(Paragraph(f'Generated: {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}', body_style))
    story.append(Spacer(1, 0.5 * cm))

    sections = [
        ('Site Information', [
            ['Site URL', 'https://irancell-31038.ir'],
            ['Admin Panel', 'https://irancell-31038.ir/admin/login'],
            ['Server IP', '85.208.253.193'],
            ['Stack', 'Nuxt 3 + Express + MongoDB + Nginx + PM2'],
        ]),
        ('Payment Gateways', [
            ['ZarinPal Merchant', '4d025349-150c-4fca-81ad-6fe936e107e9'],
            ['ZarinPal Callback', 'https://irancell-31038.ir/api/payment/verify'],
            ['Zibal Merchant', '6a4cfcb2f60cc5e13aa1ff14'],
            ['Zibal Callback', 'https://irancell-31038.ir/api/payment/verify/zibal'],
            ['Default Gateway', 'ZarinPal'],
        ]),
        ('Security Measures Applied', [
            ['MongoDB Auth', 'Enabled with dedicated app user'],
            ['Database Cleanup', 'All test data removed — admins only kept'],
            ['JWT Secret', 'Strong random secret configured'],
            ['Admin Password', 'Rotated to strong password'],
            ['API Binding', '127.0.0.1 only (not public)'],
            ['Firewall (UFW)', 'Enabled — ports 80, 443, SSH only'],
            ['Order API', 'Requires user authentication'],
            ['Health Endpoint', 'Minimal response (no internal flags)'],
            ['Backup', 'Daily at 03:00 — /var/backups/irancell-mongodb'],
        ]),
    ]

    for heading, rows in sections:
        story.append(Paragraph(heading, styles['Heading2']))
        table = Table(rows, colWidths=[5 * cm, 11 * cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph('Credentials (CONFIDENTIAL)', styles['Heading2']))
    for line in creds.splitlines():
        safe = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        story.append(Paragraph(safe, mono_style))

    doc.build(story)
    print(f'PDF saved: {OUT_PATH}')


if __name__ == '__main__':
    build_pdf()
