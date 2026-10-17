import base64
import json
import os
from pathlib import Path
import subprocess
import sys

prompt = '''text returned of (display dialog "Paste the full Oxygen deployment token copied from Shopify." default answer "" with title "Thread77 deployment" with hidden answer buttons {"Cancel", "Deploy preview"} default button "Deploy preview")'''
result = subprocess.run(['osascript', '-e', prompt], capture_output=True, text=True)
if result.returncode:
    print('Token entry closed. No credentials changed.')
    sys.exit(1)
token = result.stdout.strip()
try:
    decoded = json.loads(base64.b64decode(token, validate=True))
    if not isinstance(decoded, dict) or not decoded:
        raise ValueError()
except (ValueError, TypeError):
    print('This is not a complete Oxygen deployment token. Copy the full newly generated token from Shopify.')
    sys.exit(1)
root = Path(__file__).resolve().parent.parent
path = root / '.env.oxygen.local'
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
os.fchmod(fd, 0o600)
with os.fdopen(fd, 'w') as output:
    output.write('SHOPIFY_HYDROGEN_DEPLOYMENT_TOKEN=' + token + '\n')
print('Oxygen token saved privately. Starting preview deployment.', flush=True)
sys.exit(subprocess.call(['node', 'scripts/deploy_oxygen.mjs'], cwd=root))
