"""Collect app credentials through local macOS dialogs; never print secrets."""
import os
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent

def prompt(message, hidden=False):
    script = 'text returned of (display dialog ' + repr(message).replace("'", '"') + ' default answer "" with title "Connect Thread77 to Shopify" buttons {"Cancel", "Save"} default button "Save"' + (' with hidden answer' if hidden else '') + ')'
    result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
    if result.returncode:
        raise SystemExit('Connection cancelled. No credentials changed.')
    value = result.stdout.strip()
    if not value or not re.fullmatch(r'[A-Za-z0-9_-]+', value):
        raise SystemExit('The credential was empty or contained unexpected characters. No credentials changed.')
    return value

client_id = prompt('Paste your Shopify app Client ID.')
client_secret = prompt('Paste your Shopify app Client secret. It will be hidden.', True)
target = root / '.env.admin.local'
shop = 'ja1kvi-ri'
if target.exists():
    for line in target.read_text().splitlines():
        if line.startswith('SHOPIFY_SHOP='):
            candidate = line.split('=', 1)[1].strip()
            if re.fullmatch(r'[a-zA-Z0-9-]+', candidate):
                shop = candidate
fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
os.fchmod(fd, 0o600)
with os.fdopen(fd, 'w') as stream:
    stream.write(f'SHOPIFY_SHOP={shop}\nSHOPIFY_CLIENT_ID={client_id}\nSHOPIFY_CLIENT_SECRET={client_secret}\n')
print('Credentials saved locally. Checking Shopify Admin access…', flush=True)
result = subprocess.run(['node', 'scripts/check_shopify_admin.mjs'], cwd=root)
raise SystemExit(result.returncode)
