import os, base64, io
from PIL import Image
import numpy as np

src_path = r'C:\Users\prabh\.gemini\antigravity\brain\7f493783-edac-4a73-ad5a-f7dbecdd5dc5\user_uploaded_favicon.png'
src = Image.open(src_path)
w, h = src.size

size = 512
bg_color = (7, 6, 4, 255)
master = Image.new('RGBA', (size, size), bg_color)

target_w = 480
scale = target_w / w
target_h = int(h * scale)
scaled = src.resize((target_w, target_h), Image.Resampling.LANCZOS)

arr = np.array(scaled, dtype=np.float32)
fade_w = 20
fade = np.ones(target_w, dtype=np.float32)
fade[:fade_w] = np.linspace(0, 1, fade_w)
fade[-fade_w:] = np.linspace(1, 0, fade_w)

for y in range(target_h):
    for ch in range(3):
        arr[y, :, ch] = arr[y, :, ch] * fade + bg_color[ch] * (1 - fade)

soft_scaled = Image.fromarray(arr.astype(np.uint8))

pos_x = (size - target_w) // 2
pos_y = (size - target_h) // 2
master.paste(soft_scaled, (pos_x, pos_y))

buffered = io.BytesIO()
master.save(buffered, format='PNG')
img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')

svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#070604" rx="96" />
  <image href="data:image/png;base64,{img_str}" width="512" height="512" />
</svg>"""

public_dirs = [
    'public',
    os.path.join('apps', 'customer-web', 'public'),
    os.path.join('apps', 'partner-web', 'public'),
    os.path.join('apps', 'admin-web', 'public')
]

for p_dir in public_dirs:
    os.makedirs(p_dir, exist_ok=True)
    master.save(os.path.join(p_dir, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    master.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(p_dir, 'favicon.png'))
    master.resize((16, 16), Image.Resampling.LANCZOS).save(os.path.join(p_dir, 'favicon-16x16.png'))
    master.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(p_dir, 'favicon-32x32.png'))
    master.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(p_dir, 'apple-touch-icon.png'))
    master.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(p_dir, 'favicon-192x192.png'))
    master.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(p_dir, 'favicon-512x512.png'))
    with open(os.path.join(p_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print(f'Successfully generated favicon suite in {p_dir}')
