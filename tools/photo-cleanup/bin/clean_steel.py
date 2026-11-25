import sys, cv2, numpy as np
img_p, mask_p, out_p = sys.argv[1:4]
I = cv2.imread(img_p).astype(np.float32); M = cv2.imread(mask_p,0)
H,W = M.shape
hsv = cv2.cvtColor(I.astype(np.uint8), cv2.COLOR_BGR2HSV); L = cv2.cvtColor(I.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
tool = cv2.erode((M>127).astype(np.uint8), np.ones((7,7),np.uint8))
# steel = grey, mid-bright, low saturation, in the tool, upper-left area (beam + jaw), not the black body/LCD
steel = (tool>0) & (hsv[...,1]<55) & (L>85) & (L<215)
yy,xx = np.mgrid[0:H,0:W]
steel &= (xx < W*0.45) & (yy < H*0.86)
steel = cv2.morphologyEx(steel.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5,5),np.uint8))
n,lab,st,_ = cv2.connectedComponentsWithStats(steel)
keep = np.zeros_like(steel)
for i in range(1,n):
    if st[i,cv2.CC_STAT_AREA] > 3000: keep[lab==i]=1
steel = keep.astype(np.float32)
# normalized-convolution low pass (only steel pixels contribute)
def nblur(x, s):
    num = cv2.GaussianBlur(x*steel[...,None], (0,0), s); den = cv2.GaussianBlur(steel, (0,0), s)[...,None]
    return num/np.maximum(den,1e-3)
low_big = nblur(I, 30)      # smooth tone
low_mid = nblur(I, 3)       # what we keep from detail = I - low_mid
new = low_big + (I - low_mid)
# protect strong edges (facet lines, outlines): keep original there
g = cv2.GaussianBlur(L,(0,0),2); gm = cv2.magnitude(cv2.Sobel(g,cv2.CV_32F,1,0), cv2.Sobel(g,cv2.CV_32F,0,1))
edge = np.clip((gm-25)/40,0,1)
w = steel*(1-edge); w = cv2.GaussianBlur(w,(0,0),2)[...,None]*0.9
out = np.clip(new*w + I*(1-w),0,255).astype(np.uint8)
cv2.imwrite(out_p, out); cv2.imwrite(out_p.replace('.png','-steelmask.png'), (steel*255).astype(np.uint8))
