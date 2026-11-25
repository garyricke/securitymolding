# Align an AI edit on black to the original frame (by part silhouette), then force a solid black background.
import sys, cv2, numpy as np
orig_p, edit_p, out_p = sys.argv[1:4]
O=cv2.imread(orig_p); E=cv2.imread(edit_p); H0,W0=O.shape[:2]
def big(m):
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((9,9),np.uint8))
    n,lab,st,_=cv2.connectedComponentsWithStats(m); b=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); m=(lab==b).astype(np.uint8)*255
    ff=m.copy(); mm=np.zeros((m.shape[0]+2,m.shape[1]+2),np.uint8); cv2.floodFill(ff,mm,(0,0),255); return m|cv2.bitwise_not(ff)
hO=cv2.cvtColor(O,cv2.COLOR_BGR2HSV); mO=big((~((hO[...,1]>110)&(hO[...,2]>40))).astype(np.uint8)*255)
hE=cv2.cvtColor(E,cv2.COLOR_BGR2HSV); mE=big((hE[...,2]>70).astype(np.uint8)*255)
def mom(m): M=cv2.moments(m,True); return M['m10']/M['m00'],M['m01']/M['m00'],M['m00']
xo,yo,ao=mom(mO); xe,ye,ae=mom(mE); sc=(ao/ae)**0.5
A=np.float32([[sc,0,xo-sc*xe],[0,sc,yo-sc*ye]])
warp=np.eye(2,3,dtype=np.float32)
cc,warp=cv2.findTransformECC(cv2.GaussianBlur(mO,(0,0),6).astype(np.float32),cv2.GaussianBlur(cv2.warpAffine(mE,A,(W0,H0)),(0,0),6).astype(np.float32),warp,cv2.MOTION_AFFINE,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,300,1e-7),None,5)
print('mask ecc',round(cc,4))
Hm=np.linalg.inv(np.vstack([warp,[0,0,1]]).astype(np.float64))@np.vstack([A,[0,0,1]])
Ew=cv2.warpPerspective(E,Hm,(W0,H0),flags=cv2.INTER_CUBIC,borderValue=(0,0,0)).astype(np.float32)
# soft alpha from luminance: part is bright, background goes to pure black
L=cv2.cvtColor(np.clip(Ew,0,255).astype(np.uint8),cv2.COLOR_BGR2GRAY).astype(np.float32)
pm=cv2.warpPerspective(mE,Hm,(W0,H0))
a=np.clip((L-25)/45,0,1)*(cv2.GaussianBlur(cv2.dilate(pm,np.ones((7,7),np.uint8)),(0,0),2)/255)
out=Ew*a[...,None]
cv2.imwrite(out_p,np.clip(out,0,255).astype(np.uint8))
# extras: the raw aligned edit (keeps the AI's floor glow, feathered at the frame coverage edge) and the alpha
cov=cv2.warpPerspective(np.ones(E.shape[:2],np.float32),Hm,(W0,H0)); cov=cv2.GaussianBlur(cv2.erode(cov,np.ones((15,15),np.uint8)),(0,0),20)
cv2.imwrite(out_p.replace('.png','-glow.png'),np.clip(Ew*cov[...,None],0,255).astype(np.uint8))
np.save(out_p.replace('.png','-alpha.npy'),a.astype(np.float32))
