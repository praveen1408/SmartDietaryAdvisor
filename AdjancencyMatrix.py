import numpy as np
import json
N = 10
r = 10

b = np.random.random_integers(0,r,size=(N,N))
b_symm = np.array(np.matrix.round((b + b.T)/2),dtype=np.int32)

with open('matrix.txt','w') as f:
    f.write(json.dumps(b_symm.tolist()))

fstring = ''
n = 0
for i in range(1,N):
    for j in range(1,i):
        fstring += str(n)+','+str(i)+','+str(j)+','+str(b_symm[i,j])+'\r\n'
        n += 1

with open('list.txt','w') as f:
    f.write(fstring)


