"""Nomor, warna, dan penjelasan tiap jenis jerawat (satu tempat untuk aplikasi DAN website).

Jenis yang sama selalu mendapat nomor dan warna yang sama di setiap foto.
Penjelasan berisi ciri yang terlihat di foto, bukan diagnosis. Bukan alat diagnosis medis.
"""
from PIL import ImageDraw, ImageFont

KURANG_YAKIN = 'Kurang yakin'

# urutan = urutan nomor. 'teks' = warna angka di atas kotak warna (supaya terbaca).
JENIS = {
    'Blackheads': {'nomor': '1', 'warna': (40, 40, 40), 'teks': 'white',
                   'ciri': 'Titik hitam kecil di pori (komedo terbuka), datar dan tidak merah.'},
    'Cyst': {'nomor': '2', 'warna': (148, 0, 211), 'teks': 'white',
             'ciri': 'Benjolan besar kemerahan/keunguan, tampak dalam, biasanya tanpa titik nanah jelas.'},
    'Papules': {'nomor': '3', 'warna': (230, 30, 30), 'teks': 'white',
                'ciri': 'Benjolan kecil merah, tanpa titik putih/kuning di tengah.'},
    'Pustules': {'nomor': '4', 'warna': (255, 200, 0), 'teks': 'black',
                 'ciri': 'Benjolan merah dengan titik putih/kuning (nanah) di tengah.'},
    'Whiteheads': {'nomor': '5', 'warna': (0, 170, 255), 'teks': 'black',
                   'ciri': 'Titik putih kecil tertutup kulit (komedo tertutup), tidak merah.'},
    KURANG_YAKIN: {'nomor': '?', 'warna': (160, 160, 160), 'teks': 'black',
                   'ciri': 'Model ragu jenisnya (keyakinan di bawah batas). Bisa juga bukan jerawat.'},
}


def hex_warna(nama):
    return '#%02x%02x%02x' % JENIS[nama]['warna']


def jenis_tampil(h, ambang_jenis=0.5):
    """Jenis yang ditampilkan: jenis tebakan model, atau 'Kurang yakin' kalau keyakinannya rendah."""
    return h['jenis'] if h['yakin'] >= ambang_jenis else KURANG_YAKIN


def gambar_kotak(foto, hasil, ambang_jenis=0.5):
    """Gambar kotak berwarna + nomor jenis di atas foto. Jenis sama = nomor dan warna sama."""
    out = foto.copy()
    dr = ImageDraw.Draw(out)
    tebal = max(2, round(min(foto.size) / 300))
    font = ImageFont.load_default(size=max(12, round(min(foto.size) / 45)))
    # kotak besar digambar dulu, supaya nomor kotak kecil tidak tertutup
    urut = sorted(hasil, key=lambda h: -(h['kotak'][2] - h['kotak'][0]) * (h['kotak'][3] - h['kotak'][1]))
    for h in urut:
        info = JENIS[jenis_tampil(h, ambang_jenis)]
        dr.rectangle(h['kotak'], outline=info['warna'], width=tebal)
        x0, y0 = h['kotak'][:2]
        kiri, atas, kanan, bawah = dr.textbbox((x0, y0), info['nomor'], font=font)
        y_teks = max(0, y0 - (bawah - atas) - 4)
        dr.rectangle((x0, y_teks, x0 + kanan - kiri + 6, y_teks + bawah - atas + 4), fill=info['warna'])
        dr.text((x0 + 3, y_teks + 2 - atas + y0), info['nomor'], font=font, fill=info['teks'])
    return out


def ke_data(hasil, ambang_jenis=0.5):
    """Hasil dalam bentuk data biasa (bisa dijadikan JSON) untuk website.

    Website cukup menggambar kotak dari 'kotak' dengan 'nomor' dan 'warna', lalu
    membuat legenda dari 'ringkasan'.
    """
    jerawat = []
    for i, h in enumerate(hasil):
        tampil = jenis_tampil(h, ambang_jenis)
        jerawat.append({
            'id': i,
            'kotak': [round(v, 1) for v in h['kotak']],      # x0, y0, x1, y1 (piksel foto asli)
            'jenis': tampil,
            'nomor': JENIS[tampil]['nomor'],
            'warna': hex_warna(tampil),
            'jenis_tebakan': h['jenis'],
            'yakin_jenis': round(h['yakin'], 3),
            'yakin_deteksi': round(h['conf'], 3),
        })
    ringkasan = []
    for nama, info in JENIS.items():
        n = sum(j['jenis'] == nama for j in jerawat)
        if n:
            ringkasan.append({'nomor': info['nomor'], 'jenis': nama, 'warna': hex_warna(nama),
                              'jumlah': n, 'ciri': info['ciri']})
    return {'jumlah_jerawat': len(jerawat), 'jerawat': jerawat, 'ringkasan': ringkasan,
            'catatan': 'Bukan alat diagnosis medis.'}
