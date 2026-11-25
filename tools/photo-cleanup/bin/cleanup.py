import os, sys, base64, json, time, urllib.request, urllib.error, uuid
from pathlib import Path
env = {}
for line in (Path(__file__).resolve().parents[3] / '.env').read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.split('=', 1); env[k.strip()] = v.strip().strip('"').strip("'")
src, outdir, which = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
stem = src.stem
import subprocess
_w,_h=map(int,subprocess.check_output(['magick','identify','-format','%w %h',str(src)]).split())
SIZE='1536x1024' if _w>_h*1.15 else ('1024x1536' if _h>_w*1.15 else '1024x1024')
EXTRA = sys.argv[4] if len(sys.argv)>4 else ''
TAG = sys.argv[5] if len(sys.argv)>5 else ''
PROMPT = """This is a product photo of a single injection-molded plastic part, shot in a white light box. Retouch it into a flawless catalog photo of the SAME part.

Keep exactly the same: part geometry, every hole and its position and size, the molded texture/grain, color, camera angle, framing, lighting direction and soft shadow. Do not add, remove, move or reshape any feature. Do not add text or logos. Keep any intentional molded features (ribs, bosses, keys/notches that are clearly part of the design).

Remove only defects:
- flash: thin excess plastic or burrs on edges, hole edges and parting lines (make edges and hole edges clean and crisp)
- splay, silver streaks, flow lines, weld/knit lines, sink marks, gloss variation and scuffs on the surface
- ejector pin marks that are raised or sunken: make them perfectly flush with the surrounding surface, but keep the pin marks faintly visible as flat circular witness marks
- dust, lint, fingerprints, dirt and specks on the part and on the background
Make the background a clean, even, seamless white-to-light-grey sweep with no dirt or seams. Photorealistic, sharp, natural."""
import os
if os.environ.get('BG'): PROMPT = PROMPT.replace('Make the background a clean, even, seamless white-to-light-grey sweep with no dirt or seams.', os.environ['BG'])
PROMPT = PROMPT + EXTRA

def openai_edit(model):
    boundary = uuid.uuid4().hex
    img = src.read_bytes()
    fields = {'model': model, 'prompt': PROMPT, 'size': SIZE, 'quality': 'high', 'n': '1', 'input_fidelity': 'high'}
    body = b''
    for k, v in fields.items():
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="{src.name}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + img + b'\r\n'
    body += f'--{boundary}--\r\n'.encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/edits', data=body, headers={
        'Authorization': 'Bearer ' + env['OPENAI_API_KEY'], 'Content-Type': f'multipart/form-data; boundary={boundary}'})
    r = json.load(urllib.request.urlopen(req, timeout=600))
    return base64.b64decode(r['data'][0]['b64_json'])

def gemini_edit(model):
    img = base64.b64encode(src.read_bytes()).decode()
    cfg = {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '3:4'}}
    if 'pro' in model or 'gemini-3' in model: cfg['imageConfig']['imageSize'] = '2K'
    payload = {'contents': [{'parts': [{'text': PROMPT}, {'inline_data': {'mime_type': 'image/jpeg', 'data': img}}]}], 'generationConfig': cfg}
    req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json', 'x-goog-api-key': env['GEMINI_API_KEY']})
    r = json.load(urllib.request.urlopen(req, timeout=600))
    for p in r['candidates'][0]['content']['parts']:
        d = p.get('inlineData') or p.get('inline_data')
        if d: return base64.b64decode(d['data'])
    raise RuntimeError('no image: ' + json.dumps(r)[:500])

models = {'openai': ['gpt-image-1.5', 'gpt-image-1'], 'gemini': ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image']}[which]
fn = openai_edit if which == 'openai' else gemini_edit
for m in models:
    t = time.time()
    try:
        data = fn(m)
        out = outdir / f'{stem}-{which}{TAG}.png'; out.write_bytes(data)
        print(f'{which}: {m} ok in {time.time()-t:.0f}s -> {out}'); break
    except urllib.error.HTTPError as e:
        print(f'{which}: {m} HTTP {e.code}: {e.read().decode()[:300]}')
    except Exception as e:
        print(f'{which}: {m} failed: {e}')
