# Retouch the real tool in place: despeckle + edge-preserving smoothing, protecting the LCD, labels and edges.
import sys, cv2, numpy as np
img_p, mask_p, out_p = sys.argv[1:4]
I = cv2.imread(img_p); M = cv2.imread(mask_p, 0)
H, W = M.shape
tool = cv2.erode((M > 127).astype(np.uint8), np.ones((5,5), np.uint8))
hsv = cv2.cvtColor(I, cv2.COLOR_BGR2HSV); L = cv2.cvtColor(I, cv2.COLOR_BGR2GRAY).astype(np.int16)
# protect the LCD window (large bright, low-sat blob in the tool)
lcd = ((L > 150) & (hsv[...,1] < 70) & (tool > 0)).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(lcd)
prot = np.zeros((H, W), np.uint8)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 30000: prot[lab == i] = 1
prot = cv2.morphologyEx(prot, cv2.MORPH_CLOSE, np.ones((61,61), np.uint8))
prot = cv2.dilate(prot, np.ones((15,15), np.uint8))
# 1) speck removal: small local outliers that are not part of a label/marking cluster
med = cv2.medianBlur(I, 7).astype(np.int16)
diff = np.abs(I.astype(np.int16) - med).max(2)
cand = ((diff > 28) & (tool > 0) & (prot == 0)).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(cand)
big = np.zeros((H, W), np.uint8); small = np.zeros((H, W), np.uint8)
for i in range(1, n):
    a = st[i, cv2.CC_STAT_AREA]
    (big if a > 40 else small)[lab == i] = 1
nearbig = cv2.dilate(big, np.ones((25,25), np.uint8))
speck = (small > 0) & (nearbig == 0)
speck = cv2.dilate(speck.astype(np.uint8), np.ones((3,3), np.uint8)) > 0
out = I.copy(); out[speck] = med[speck].astype(np.uint8)
print('specks removed px', int(speck.sum()))
# 2) edge-preserving smoothing of smudges on body/steel (not on the LCD, keep strong edges & text)
sm = out.copy()
for _ in range(2): sm = cv2.bilateralFilter(sm, 9, 22, 7)
# keep a little fine grain so steel doesn't look plastic
grain = out.astype(np.float32) - cv2.GaussianBlur(out, (0,0), 1.2).astype(np.float32)
sm = np.clip(sm.astype(np.float32) + 0.35*grain, 0, 255)
w = (tool.astype(np.float32) * (1 - prot.astype(np.float32)))
w = cv2.GaussianBlur(w, (0,0), 3)[..., None]
res = (sm*w + out.astype(np.float32)*(1-w)).astype(np.uint8)
cv2.imwrite(out_p, res)
