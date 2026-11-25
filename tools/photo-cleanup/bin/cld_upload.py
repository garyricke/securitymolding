import hashlib,time,json,sys,urllib.request,urllib.parse,uuid
from pathlib import Path
env=dict(l.split('=',1) for l in (Path(__file__).resolve().parents[3] / '.env').read_text().splitlines() if '=' in l and not l.startswith('#'))
u=urllib.parse.urlparse(env['CLOUDINARY_URL'].strip().strip('"'))
f,pid=sys.argv[1],sys.argv[2]
params={'public_id':pid,'timestamp':str(int(time.time())),'overwrite':'true'}
sig=hashlib.sha1(('&'.join(f'{k}={params[k]}' for k in sorted(params))+u.password).encode()).hexdigest()
b=uuid.uuid4().hex;body=b''
for k,v in {**params,'api_key':u.username,'signature':sig}.items(): body+=f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
body+=f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="x.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+Path(f).read_bytes()+f'\r\n--{b}--\r\n'.encode()
r=json.load(urllib.request.urlopen(urllib.request.Request(f'https://api.cloudinary.com/v1_1/{u.hostname}/image/upload',data=body,headers={'Content-Type':f'multipart/form-data; boundary={b}'})))
print(r['secure_url'],r['width'],r['height'])
