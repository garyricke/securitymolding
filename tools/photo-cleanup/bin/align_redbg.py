# Align AI edit to original frame on the part; background = smoothed original red (masked normalized blur);
# through-holes (red inside the part's outline in the original) are taken from the original.
import sys, cv2, numpy as np
orig_p, edit_p, out_p = sys.argv[1:4]
O = cv2.imread(orig_p); E = cv2.imread(edit_p); H0, W0 = O.shape[:2]
def redmask(im):
    h = cv2.cvtColor(im, cv2.COLOR_BGR2HSV); return (h[...,1] > 110) & (h[...,2] > 40)
rO = redmask(O); part = ~rO
part = cv2.morphologyEx(part.astype(np.uint8)*255, cv2.MORPH_OPEN, np.ones((9,9),np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(part); big = 1+np.argmax(st[1:,cv2.CC_STAT_AREA]); part = (lab==big).astype(np.uint8)*255
g = lambda im: cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
def bigmask(im):
    m=(~redmask(im)).astype(np.uint8)*255; m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((9,9),np.uint8))
    n,lab,st,_=cv2.connectedComponentsWithStats(m); b=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); m=(lab==b).astype(np.uint8)*255
    ff=m.copy(); mm=np.zeros((m.shape[0]+2,m.shape[1]+2),np.uint8); cv2.floodFill(ff,mm,(0,0),255); return m|cv2.bitwise_not(ff)
mO, mE = bigmask(O), bigmask(E)
def mom(m):
    M=cv2.moments(m,True); return M['m10']/M['m00'], M['m01']/M['m00'], M['m00']
xo,yo,ao = mom(mO); xe,ye,ae = mom(mE); sc=(ao/ae)**0.5
A=np.float32([[sc,0,xo-sc*xe],[0,sc,yo-sc*ye]])
mEw=cv2.warpAffine(mE,A,(W0,H0))
warp=np.eye(2,3,dtype=np.float32)
cc,warp=cv2.findTransformECC(cv2.GaussianBlur(mO,(0,0),6).astype(np.float32),cv2.GaussianBlur(mEw,(0,0),6).astype(np.float32),warp,cv2.MOTION_AFFINE,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,300,1e-7),None,5)
print('mask ecc',round(cc,4))
A3=np.vstack([A,[0,0,1]]); W3=np.vstack([warp,[0,0,1]])
Hm=np.linalg.inv(W3.astype(np.float64))@A3
def edges(im):
    x=cv2.GaussianBlur(g(im),(0,0),2).astype(np.float32); return cv2.magnitude(cv2.Sobel(x,cv2.CV_32F,1,0), cv2.Sobel(x,cv2.CV_32F,0,1))
Ew0 = cv2.warpPerspective(E, Hm, (W0,H0), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
roi = cv2.dilate(part, np.ones((61,61),np.uint8)); warp = np.eye(3,dtype=np.float32)
try:
    cc, warp = cv2.findTransformECC(edges(O), edges(Ew0), warp, cv2.MOTION_HOMOGRAPHY, (cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,300,1e-6), roi, 5)
    print('ecc', round(cc,4)); Hm = np.linalg.inv(warp.astype(np.float64)) @ Hm
except cv2.error as e: print('ecc failed', e)
Ew = cv2.warpPerspective(E, Hm, (W0,H0), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
# part alpha from the aligned edit (not red), largest blob, holes filled
pe = (~redmask(Ew)).astype(np.uint8)*255
pe = cv2.morphologyEx(pe, cv2.MORPH_OPEN, np.ones((5,5),np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(pe); big = 1+np.argmax(st[1:,cv2.CC_STAT_AREA]); pe = (lab==big).astype(np.uint8)*255
ff = pe.copy(); m = np.zeros((H0+2,W0+2),np.uint8); cv2.floodFill(ff, m, (0,0), 255); pe = pe | cv2.bitwise_not(ff)
# through-holes: red in original inside the original part's filled outline
fo = part.copy(); m = np.zeros((H0+2,W0+2),np.uint8); cv2.floodFill(fo, m, (0,0), 255); filled = part | cv2.bitwise_not(fo)
holes = cv2.bitwise_and(filled, (rO*255).astype(np.uint8)); holes = cv2.dilate(holes, np.ones((5,5),np.uint8))
# background: original, smoothed (masked normalized blur) so shadows stay but texture/specks go
Of = O.astype(np.float32); Ef = Ew.astype(np.float32)
# smooth original backdrop (texture-free), for colour target and for areas the AI frame doesn't cover
near = cv2.dilate(mO|pe, cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(81,81)))
bg = (near==0).astype(np.float32); s = 30
B = cv2.GaussianBlur(Of*bg[...,None],(0,0),s)/np.maximum(cv2.GaussianBlur(bg,(0,0),s)[...,None],1e-3)
# match AI red to original: per-channel gain field estimated on backdrop away from the part
rE = (redmask(Ew) & (near==0)).astype(np.float32)
cov = cv2.warpPerspective(np.ones(E.shape[:2],np.float32), Hm, (W0,H0)); cov = cv2.erode(cov, np.ones((9,9),np.uint8))
w = rE*cov; S = 60
gainnum = cv2.GaussianBlur(B*w[...,None],(0,0),S); gainden = cv2.GaussianBlur(Ef*w[...,None],(0,0),S)
gain = gainnum/np.maximum(gainden,1e-3)
gain = np.where(cv2.GaussianBlur(w,(0,0),S)[...,None]>1e-4, gain, 1.0)
red_soft = cv2.GaussianBlur((redmask(Ew)&(pe==0)).astype(np.float32),(0,0),1.5)[...,None]
out = Ef*(1-red_soft) + np.clip(Ef*gain,0,255)*red_soft
# outside AI coverage: smoothed original backdrop
cf = cv2.GaussianBlur(cov,(0,0),6)[...,None]
out = out*cf + B*(1-cf)
h = cv2.GaussianBlur(holes,(0,0),1.0).astype(np.float32)[...,None]/255
out = out*(1-h) + Of*h
print('coverage', round(float(cov.mean()),3))
cv2.imwrite(out_p, np.clip(out,0,255).astype(np.uint8)); cv2.imwrite(out_p.replace('.png','-holes.png'), holes)
