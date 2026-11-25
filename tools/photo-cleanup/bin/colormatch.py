# Match the part's colour in an AI edit to the original photo; background left alone.
import sys, numpy as np
from PIL import Image, ImageFilter
orig, edit, out = sys.argv[1:4]
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.float32)/255
def to_lab(rgb):
    c=np.where(rgb>0.04045,((rgb+0.055)/1.055)**2.4,rgb/12.92)
    M=np.array([[0.4124,0.3576,0.1805],[0.2126,0.7152,0.0722],[0.0193,0.1192,0.9505]])
    xyz=c@M.T/np.array([0.9505,1,1.089])
    f=np.where(xyz>0.008856,np.cbrt(xyz),7.787*xyz+16/116)
    return np.stack([116*f[...,1]-16,500*(f[...,0]-f[...,1]),200*(f[...,1]-f[...,2])],-1)
def from_lab(lab):
    fy=(lab[...,0]+16)/116; fx=fy+lab[...,1]/500; fz=fy-lab[...,2]/200
    f=np.stack([fx,fy,fz],-1); xyz=np.where(f>0.2069,f**3,(f-16/116)/7.787)*np.array([0.9505,1,1.089])
    Mi=np.linalg.inv(np.array([[0.4124,0.3576,0.1805],[0.2126,0.7152,0.0722],[0.0193,0.1192,0.9505]]))
    c=xyz@Mi.T; rgb=np.where(c>0.0031308,1.055*np.clip(c,0,None)**(1/2.4)-0.055,12.92*c)
    return np.clip(rgb,0,1)
def part_mask(lab):
    # part = coloured (chroma) or clearly darker than the background sweep
    chroma=np.hypot(lab[...,1],lab[...,2]); L=lab[...,0]
    bgL=np.percentile(L,90)
    return (chroma>7)|(L<bgL-30)
o=to_lab(load(orig)); e=to_lab(load(edit))
mo,me=part_mask(o),part_mask(e)
res=e.copy()
for ch in range(3):
    so,se=o[...,ch][mo],e[...,ch][me]
    # smooth linear shift: match mean, contrast ratio clamped so texture/noise isn't amplified
    k=float(np.clip(so.std()/max(se.std(),1e-3),0.85,1.1))
    res[...,ch]=(e[...,ch]-se.mean())*k+so.mean()
m=Image.fromarray((me*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(3))
a=(np.asarray(m).astype(np.float32)/255)[...,None]
rgb=from_lab(res)*a+load(edit)*(1-a)
Image.fromarray((rgb*255+0.5).astype(np.uint8)).save(out)
print('part px orig %.1f%% edit %.1f%%'%(mo.mean()*100,me.mean()*100))
print('L/a/b orig', o[mo].mean(0).round(1), 'edit', e[me].mean(0).round(1), 'result', to_lab(rgb)[me].mean(0).round(1))
