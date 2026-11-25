# Warp the AI edit into the original's frame (aligned on the part), then paste the original tool (caliper) back on top.
import sys, cv2, numpy as np
orig_p, edit_p, out_p = sys.argv[1:4]
O = cv2.imread(orig_p); E = cv2.imread(edit_p)
H0, W0 = O.shape[:2]
hsv = cv2.cvtColor(O, cv2.COLOR_BGR2HSV)
sat, val = hsv[...,1].astype(int), hsv[...,2].astype(int)
red = (sat > 120) & (val > 60)
# the part: bright, low saturation, upper 78% of frame
part = (~red) & (val > 170) & (sat < 60); part[int(H0*0.78):] = False
pm = cv2.dilate(part.astype(np.uint8)*255, np.ones((25,25),np.uint8))
sift = cv2.SIFT_create(8000)
g = lambda im: cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
k1, d1 = sift.detectAndCompute(g(O), pm)
k2, d2 = sift.detectAndCompute(g(E), None)
m = cv2.BFMatcher().knnMatch(d1, d2, k=2)
good = [a for a, b in m if a.distance < 0.75*b.distance]
src = np.float32([k2[a.trainIdx].pt for a in good]); dst = np.float32([k1[a.queryIdx].pt for a in good])
Hm, inl = cv2.findHomography(src, dst, cv2.RANSAC, 4.0)
print('matches', len(good), 'inliers', int(inl.sum()))
# refine with ECC on edge maps inside the part region (edit -> original)
def edges(im): 
    x=cv2.GaussianBlur(g(im),(0,0),2).astype(np.float32); gx=cv2.Sobel(x,cv2.CV_32F,1,0); gy=cv2.Sobel(x,cv2.CV_32F,0,1); return cv2.magnitude(gx,gy)
Ew0 = cv2.warpPerspective(E, Hm, (W0, H0), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
eo, ee = edges(O), edges(Ew0)
roi = cv2.dilate(part.astype(np.uint8)*255, np.ones((61,61),np.uint8))
warp = np.eye(3, dtype=np.float32)
try:
    cc, warp = cv2.findTransformECC(eo, ee, warp, cv2.MOTION_HOMOGRAPHY, (cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT, 300, 1e-6), roi, 5)
    print('ecc', round(cc,4))
    Hm = np.linalg.inv(warp.astype(np.float64)) @ Hm
except cv2.error as e: print('ecc failed', e)
Ew = cv2.warpPerspective(E, Hm, (W0, H0), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
# tool mask in the original: not red, not the white part, in the lower part of the frame; close holes (LCD)
tool = (~red) & ~((val > 200) & (sat < 40) & (np.arange(H0)[:,None] < H0*0.80))
tool[:int(H0*0.62)] = False
tm = tool.astype(np.uint8)*255
tm = cv2.morphologyEx(tm, cv2.MORPH_OPEN, np.ones((7,7),np.uint8))
tm = cv2.morphologyEx(tm, cv2.MORPH_CLOSE, np.ones((41,41),np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(tm)
keep = np.zeros_like(tm)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 20000: keep[lab == i] = 255
# fill interior holes
ff = keep.copy(); cv2.floodFill(ff, None, (0,0), 255); keep = keep | cv2.bitwise_not(ff) if ff[0,0]==255 else keep
keep = cv2.erode(keep, np.ones((3,3),np.uint8))
a = cv2.GaussianBlur(keep, (0,0), 2.0).astype(np.float32)[...,None]/255
out = (O*a + Ew*(1-a)).astype(np.uint8)
cv2.imwrite(out_p, out); cv2.imwrite(out_p.replace('.png','-mask.png'), keep)
