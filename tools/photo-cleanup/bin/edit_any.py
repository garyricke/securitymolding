# Generic OpenAI image edit: edit_any.py <src> <out.png> <prompt.txt> [size]
import sys, base64, json, time, urllib.request, uuid
from pathlib import Path
env = {}
for line in (Path(__file__).resolve().parents[3] / '.env').read_text().splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.split('=', 1); env[k.strip()] = v.strip().strip('"').strip("'")
src, out, prompt = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]).read_text()
size = sys.argv[4] if len(sys.argv) > 4 else '1536x1024'
b = uuid.uuid4().hex; body = b''
for k, v in {'model': 'gpt-image-1.5', 'prompt': prompt, 'size': size, 'quality': 'high', 'n': '1', 'input_fidelity': 'high'}.items():
    body += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
body += f'--{b}\r\nContent-Disposition: form-data; name="image[]"; filename="{src.name}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + src.read_bytes() + b'\r\n' + f'--{b}--\r\n'.encode()
req = urllib.request.Request('https://api.openai.com/v1/images/edits', data=body, headers={'Authorization': 'Bearer ' + env['OPENAI_API_KEY'], 'Content-Type': f'multipart/form-data; boundary={b}'})
t = time.time(); r = json.load(urllib.request.urlopen(req, timeout=600))
out.write_bytes(base64.b64decode(r['data'][0]['b64_json'])); print('ok', round(time.time()-t), 's ->', out)
