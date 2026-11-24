r"""Uji cepat tanpa membuka aplikasi: muat kedua model lalu jalankan pada satu foto.

Pakai:
    .\.venv\Scripts\python.exe src\uji_cepat.py "path\ke\foto.jpg"
    .\.venv\Scripts\python.exe src\uji_cepat.py --json "path\ke\foto.jpg"   (hasil seperti yang dikirim ke website)
"""
import json
import sys

from PIL import Image, ImageOps

import pipeline

pakai_json = '--json' in sys.argv
detektor = pipeline.muat_deteksi()
model, kelas = pipeline.muat_jenis()
print('model 1:', pipeline.MODEL_DETEKSI, '| model 2:', pipeline.MODEL_JENIS, '| kelas:', kelas)
for path in [a for a in sys.argv[1:] if a != '--json']:
    foto = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    data = pipeline.jalankan_data(foto, detektor, model, kelas)
    print(f"\n{path}: {data['jumlah_jerawat']} jerawat")
    if pakai_json:
        print(json.dumps(data, indent=1, ensure_ascii=False))
        continue
    for r in data['ringkasan']:
        print(f"  [{r['nomor']}] {r['jenis']:12} x {r['jumlah']}")
    for j in data['jerawat']:
        print(f"    [{j['nomor']}] tebakan {j['jenis_tebakan']:10} {j['yakin_jenis']:.0%} (deteksi {j['yakin_deteksi']:.0%})")
print('\nBukan alat diagnosis medis.')
