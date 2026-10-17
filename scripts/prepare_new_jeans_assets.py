"""Extract Jeans 2/3 from their baked checkerboard; keep source pixels/hangers.

Offline only. Requires Pillow, NumPy and OpenCV. Originals are never overwritten.
The matte parameters are specific to these supplied 500px-wide source sheets.
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
REVIEW = ROOT / 'review/jeans-hero'
REVIEW.mkdir(parents=True, exist_ok=True)
audit = []
previews = []

for jean in [2, 3]:
    for view in ['side', 'three-quarter', 'front']:
        source = ROOT / f'public/products/jean-{jean}/{view}.png'
        rgb = np.asarray(Image.open(source).convert('RGB'))
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        low = rgb.min(axis=2)
        chroma = rgb.max(axis=2).astype(float) - low
        mask = np.full(gray.shape, cv2.GC_PR_BGD, np.uint8)
        mask[(gray < 180) | (chroma > 15)] = cv2.GC_PR_FGD
        mask[(gray < 110) | ((chroma > 22) & (gray < 215))] = cv2.GC_FGD
        mask[(low > 188) & (chroma < 14)] = cv2.GC_BGD
        mask[:, :20] = cv2.GC_BGD
        mask[:, -20:] = cv2.GC_BGD
        cv2.setRNGSeed(0)
        cv2.grabCut(rgb, mask, None, np.zeros((1, 65)),
                    np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_MASK)
        fg = np.isin(mask, [cv2.GC_FGD, cv2.GC_PR_FGD]).astype(np.uint8)
        count, labels, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
        fg = np.isin(labels, [i for i in range(1, count)
                              if stats[i, cv2.CC_STAT_AREA] > 45]).astype(np.uint8)
        fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        # Restore enclosed highlights/graphics. Keep real open negative spaces
        # between the legs, beneath the hanger, and inside the upper hook.
        count, holes, stats, _ = cv2.connectedComponentsWithStats(1 - fg, 8)
        for i in range(1, count):
            x, y, w, h, area = stats[i]
            if y >= 180 and x > 0 and y + h < len(fg) and x + w < 500:
                fg[holes == i] = 1
            elif area < 100 and y < 180:
                fg[holes == i] = 1
        # Silver highlights match the checkerboard: recover original pixels
        # bracketed by metal edges, leaving the hook opening transparent.
        fg[:95] = 0
        for y in range(95):
            xs = np.flatnonzero(gray[y, 215:285] < 180) + 215
            if len(xs):
                for group in np.split(xs, np.where(np.diff(xs) > 5)[0] + 1):
                    fg[y, group[0]:group[-1] + 1] = 1
        alpha = (cv2.GaussianBlur(fg.astype(float), (3, 3), .35) * 255).round().astype(np.uint8)
        rgba = np.dstack([rgb, alpha])
        rgba[alpha == 0, :3] = 0
        output = source.with_name(f'{view}-transparent.png')
        Image.fromarray(rgba).save(output, optimize=True)
        bounds = Image.fromarray(alpha).getbbox()
        audit.append({
            'source': str(source.relative_to(ROOT)),
            'output': str(output.relative_to(ROOT)),
            'dimensions': [rgb.shape[1], rgb.shape[0]],
            'alpha_range': [int(alpha.min()), int(alpha.max())],
            'transparent_pixels': int((alpha == 0).sum()),
            'opaque_pixels': int((alpha == 255).sum()),
            'visible_bounds': bounds,
            'retained_rgb_matches_source': bool(np.array_equal(rgba[alpha > 0, :3], rgb[alpha > 0])),
        })
        preview = Image.new('RGBA', (1000, 975), '#20242b')
        preview.paste('#e4dfd5', (500, 0, 1000, 975))
        preview.alpha_composite(Image.fromarray(rgba), (0, 35))
        preview.alpha_composite(Image.fromarray(rgba), (500, 35))
        ImageDraw.Draw(preview).text((12, 10), f'Jean {jean} / {view}', fill='white')
        previews.append(preview.resize((400, 390)))

sheet = Image.new('RGB', (1200, 780))
for i, preview in enumerate(previews):
    sheet.paste(preview.convert('RGB'), ((i % 3) * 400, (i // 3) * 390))
sheet.save(REVIEW / 'new-jeans-matte-review.jpg', quality=95)
(REVIEW / 'new-jeans-alpha-audit.json').write_text(json.dumps(audit, indent=2) + '\n')
print(json.dumps(audit, indent=2))
