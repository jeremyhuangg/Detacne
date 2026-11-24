"""Bangun data/jenis_v3 (pilihan C): train utuh, kembaran dibuang dari val dan ujian. jenis_v2 hanya dibaca."""
import glob
import hashlib
import json
import os
import shutil
import sys

import pandas as pd
from PIL import Image, ImageDraw

V3, KERJA = sys.argv[1:3]
D2, D3 = f'{V3}/data/jenis_v2', f'{V3}/data/jenis_v3'
assert not os.path.exists(D3), 'jenis_v3 sudah ada'
KELAS = ['Blackheads', 'Cyst', 'Papules', 'Pustules', 'Whiteheads']
BAGIAN = ['train', 'val', 'test_potongan', 'test']
W_MAX, M_MIN, M_PASTI = 5, 0.97, 0.995

df = pd.read_csv(f'{KERJA}/calon_kembar.csv')
df['kembar'] = ((df.m32 >= M_MIN) & (df.selisih_warna <= W_MAX)) | (df.m32 >= M_PASTI)
k = df[df.kembar].sort_values(['m32'], ascending=False).copy()
# yang dibuang selalu si penanya (val atau ujian); val lawan ujian membuang val
catat = k.drop_duplicates('tanya').copy()
catat['jumlah_pasangan'] = catat.tanya.map(k.groupby('tanya').size())
catat['bagian'] = catat.tanya.str.split('/').str[-3]
catat['file'] = catat.tanya.str.split('/').str[-1]
catat['pasangan_bagian'] = catat.acuan.str.split('/').str[-3]
catat['pasangan_file'] = catat.acuan.str.split('/').str[-1]
assert set(catat.bagian) <= {'val', 'test_potongan', 'test'}
buang = set(catat.tanya)

tulis = []
for b in BAGIAN:
    for j in KELAS:
        os.makedirs(f'{D3}/{b}/{j}')
        for p in sorted(glob.glob(f'{D2}/{b}/{j}/*')):
            p = p.replace('\\', '/')
            if p not in buang:
                shutil.copy2(p, f'{D3}/{b}/{j}/{os.path.basename(p)}')
            tulis.append(dict(bagian=b, jenis=j, ada_v3=p not in buang))
shutil.copy2(f'{D2}/manifest_potongan.csv', f'{D3}/manifest_potongan_v2.csv')
kol = ['bagian', 'jenis_tanya', 'file', 'pasangan_bagian', 'jenis_acuan', 'pasangan_file', 'm32', 'selisih_warna', 'label_sama', 'jumlah_pasangan']
catat[kol].rename(columns={'jenis_tanya': 'jenis', 'jenis_acuan': 'pasangan_jenis', 'm32': 'kemiripan'}).sort_values(['bagian', 'jenis', 'file']).to_csv(f'{D3}/dibuang_v3.csv', index=False)

t = pd.DataFrame(tulis)
ring = {b: {j: {'v2': int(((t.bagian == b) & (t.jenis == j)).sum()), 'v3': int(((t.bagian == b) & (t.jenis == j) & t.ada_v3).sum())} for j in KELAS} for b in BAGIAN}
json.dump({'asal': 'jenis_v2', 'aturan': f'kemiripan 32x32 >= {M_MIN} dan selisih warna rata-rata <= {W_MAX}, atau kemiripan >= {M_PASTI}', 'jumlah': ring},
          open(f'{D3}/ringkasan.json', 'w'), indent=1)
for b in BAGIAN:
    print(b, {j: (v['v2'], v['v3']) for j, v in ring[b].items()}, '| total', sum(v['v2'] for v in ring[b].values()), '->', sum(v['v3'] for v in ring[b].values()))
print('dibuang per bagian:', catat.bagian.value_counts().to_dict())
print('alasan per pasangan:', catat.groupby(['bagian', 'pasangan_bagian']).size().to_dict())
print('label pasangan sama:', catat.groupby('bagian').label_sama.mean().round(3).to_dict())

# bukti: isi v3 sama persis dengan v2, tidak ada yang tersisa dari daftar buang, v2 tidak berubah
sidik = json.load(open(f'{KERJA}/sidik_jenis_v2.json'))
now = {}
for akar, _, fs in os.walk(D2):
    for f in fs:
        p = os.path.join(akar, f)
        now[os.path.relpath(p, D2).replace('\\', '/')] = hashlib.md5(open(p, 'rb').read()).hexdigest()
print('jenis_v2 tidak berubah:', now == sidik, len(now))
salah = 0
n3 = 0
for b in BAGIAN:
    for p in glob.glob(f'{D3}/{b}/*/*'):
        r = os.path.relpath(p, D3).replace('\\', '/')
        n3 += 1
        salah += hashlib.md5(open(p, 'rb').read()).hexdigest() != sidik[r]
print('gambar v3:', n3, '| beda isi dengan v2:', salah)
sisa = sum(os.path.exists(f"{D3}/{p.split('/')[-3]}/{p.split('/')[-2]}/{p.split('/')[-1]}") for p in buang)
print('daftar buang yang masih ada di v3:', sisa)


def lembar(s, nama, n=14):
    s = s.sample(min(n, len(s)), random_state=1)
    T = 78
    im = Image.new('RGB', (len(s) * T, 2 * T + 18), 'white')
    dr = ImageDraw.Draw(im)
    for c, r in enumerate(s.itertuples()):
        im.paste(Image.open(r.tanya).convert('RGB').resize((T, T)), (c * T, 0))
        im.paste(Image.open(r.acuan).convert('RGB').resize((T, T)), (c * T, T))
        dr.text((c * T + 1, 2 * T + 3), f'{r.m32:.3f} w{r.selisih_warna:.0f} {"s" if r.label_sama else "B"}', fill='black')
    im.save(f'{KERJA}/{nama}.jpg', quality=92)


lembar(catat, 'contoh_dibuang')
sisa_df = df[~df.tanya.isin(buang)].sort_values('selisih_warna').drop_duplicates('tanya')
lembar(sisa_df, 'contoh_disimpan_paling_mirip')
