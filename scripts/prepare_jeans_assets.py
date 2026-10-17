# Requires Pillow, NumPy, SciPy and OpenCV; used only for asset preparation.
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
base=Path(__file__).resolve().parent.parent/'public/products/jean-1'
cv2.setRNGSeed(0)
for name in ['right','three-quarter','front']:
 rgb=np.asarray(Image.open(base/f'{name}.png').convert('RGB'))
 low=rgb.min(axis=2); high=rgb.max(axis=2); chroma=high.astype(float)-low
 gray=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY)
 mask=np.full(gray.shape,cv2.GC_PR_BGD,np.uint8)
 mask[(gray<175)|(chroma>15)]=cv2.GC_PR_FGD
 mask[(gray<100)|((chroma>22)&(gray<215))]=cv2.GC_FGD
 mask[(low>188)&(chroma<14)]=cv2.GC_BGD
 mask[:,:20]=cv2.GC_BGD; mask[:,-20:]=cv2.GC_BGD
 cv2.grabCut(rgb,mask,None,np.zeros((1,65),np.float64),np.zeros((1,65),np.float64),6,cv2.GC_INIT_WITH_MASK)
 fg=np.isin(mask,[cv2.GC_FGD,cv2.GC_PR_FGD]).astype(np.uint8)
 count,labels,stats,centroids=cv2.connectedComponentsWithStats(fg,8)
 keep=[i for i in range(1,count) if stats[i,cv2.CC_STAT_AREA]>45]
 fg=np.isin(labels,keep).astype(np.uint8)
 # Restore bright thread and metal highlights enclosed by the subject mask.
 fg=cv2.morphologyEx(fg,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
 n,holes,hstats,_=cv2.connectedComponentsWithStats(1-fg,8)
 for i in range(1,n):
  if hstats[i,4]<250 and hstats[i,1]<350: fg[holes==i]=1
 # The silver hook's highlights resemble the checkerboard. At each row,
 # retain the original pixels bracketed by its dark metal edges. Separate
 # left/right branches keep the hook opening transparent.
 fg[:95]=0
 for y in range(95):
  xs=np.flatnonzero(gray[y,215:285]<180)+215
  if not len(xs): continue
  for group in np.split(xs,np.where(np.diff(xs)>5)[0]+1):
   fg[y,group[0]:group[-1]+1]=1
 # Preserve the real leg opening, including its narrow crotch tip.
 if name=='front':
  fg[350:,240:265][(low[350:,240:265]>188)&(chroma[350:,240:265]<14)]=0
 # Remove small matte notches along a continuous cloth silhouette.
 from scipy.ndimage import median_filter
 left=np.array([np.flatnonzero(row)[0] if row.any() else 250 for row in fg])
 right=np.array([np.flatnonzero(row)[-1] if row.any() else 250 for row in fg])
 lmed=median_filter(left,size=15); rmed=median_filter(right,size=15)
 for y in range(180,860):
  if 0<left[y]-lmed[y]<=8: fg[y,lmed[y]:left[y]]=1
  if 0<rmed[y]-right[y]<=8: fg[y,right[y]:rmed[y]+1]=1
 # Subpixel edge only; interiors retain their exact original RGB values.
 alpha=cv2.GaussianBlur(fg.astype(float),(3,3),0.35)
 alpha=(alpha*255).round().astype(np.uint8)
 rgba=np.dstack([rgb,alpha])
 rgba[alpha==0,:3]=0
 out=base/f'{name}-transparent.png'
 Image.fromarray(rgba).save(out,optimize=True)
 a=Image.fromarray(alpha)
 print(name,'components',[(int(stats[i,4]),centroids[i].round(1).tolist()) for i in keep],'bbox',a.getbbox(),'alpha',a.getextrema())

