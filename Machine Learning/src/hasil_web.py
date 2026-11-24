"""Paket hasil untuk website: data (JSON) + foto utuh bergambar kotak + potongan tiap jerawat.

Dipakai api.py. Kalau folder_simpan diisi, foto berkotak disimpan ke folder itu (nama acak) dan
foto_hasil berisi path "/hasil/<nama>.jpg". Kalau tidak diisi, foto_hasil berisi teks base64.

Pakai:
    from hasil_web import jalankan_lengkap
    paket = jalankan_lengkap(foto_pil_rgb, detektor, model, kelas)   # dict, siap jadi JSON

Isi paket = isi `ke_data()` di info_jenis.py (tidak diubah) ditambah:
    lebar_foto, tinggi_foto : ukuran foto asli (piksel). 'kotak' memakai ukuran ini.
    foto_hasil              : foto utuh + kotak berwarna, nomor di kotak = nomor_urut jerawat
    jerawat[i].nomor_urut   : 1, 2, 3, ... (urut keyakinan deteksi, sama dengan nomor di foto_hasil)
    jerawat[i].foto_potongan: potongan kecil jerawat itu (hanya kalau dengan_potongan=True)

Bukan alat diagnosis medis.
"""
import base64
import io
import os
import uuid

from PIL import Image, ImageDraw, ImageFont

from info_jenis import JENIS, jenis_tampil, ke_data

MAKS_HASIL = 1600      # sisi terpanjang foto_hasil (piksel); lebih besar dikecilkan supaya JSON tidak terlalu berat
MAKS_POTONGAN = 150    # sisi terpanjang foto_potongan (piksel)


def _kecilkan(gambar, maks):
    if max(gambar.size) <= maks:
        return gambar
    gambar = gambar.copy()
    gambar.thumbnail((maks, maks), Image.LANCZOS)
    return gambar


def _ke_base64(gambar, kualitas=85):
    buf = io.BytesIO()
    gambar.convert('RGB').save(buf, 'JPEG', quality=kualitas)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')


def simpan_foto(gambar, folder, kualitas=90):
    """Simpan JPEG dengan nama acak (32 heksadesimal). Hasil: nama file."""
    os.makedirs(folder, exist_ok=True)
    nama = uuid.uuid4().hex + '.jpg'
    gambar.convert('RGB').save(os.path.join(folder, nama), 'JPEG', quality=kualitas)
    return nama


def gambar_kotak_urut(foto, hasil, ambang_jenis=0.5):
    """Seperti gambar_kotak() di info_jenis.py, tapi angka di kotak = nomor urut jerawat (1, 2, 3, ...).

    Warna kotak tetap menurut jenis. Nomor urut sama dengan nomor_urut di JSON dan di kartu rincian.
    """
    out = foto.copy()
    dr = ImageDraw.Draw(out)
    tebal = max(2, round(min(foto.size) / 300))
    font = ImageFont.load_default(size=max(12, round(min(foto.size) / 45)))
    # kotak besar digambar dulu, supaya nomor kotak kecil tidak tertutup
    urut = sorted(enumerate(hasil), key=lambda ih: -(ih[1]['kotak'][2] - ih[1]['kotak'][0]) * (ih[1]['kotak'][3] - ih[1]['kotak'][1]))
    for i, h in urut:
        info = JENIS[jenis_tampil(h, ambang_jenis)]
        teks = str(i + 1)
        dr.rectangle(h['kotak'], outline=info['warna'], width=tebal)
        x0, y0 = h['kotak'][:2]
        kiri, atas, kanan, bawah = dr.textbbox((x0, y0), teks, font=font)
        y_teks = max(0, y0 - (bawah - atas) - 4)
        dr.rectangle((x0, y_teks, x0 + kanan - kiri + 6, y_teks + bawah - atas + 4), fill=info['warna'])
        dr.text((x0 + 3, y_teks + 2 - atas + y0), teks, font=font, fill=info['teks'])
    return out


def bangun_paket(foto, hasil, ambang_jenis=0.5, dengan_potongan=False, folder_simpan=None):
    """hasil = keluaran pipeline.jalankan(). Hasil: dict (bisa jadi JSON).

    Nomor di kotak foto_hasil = jerawat[i].nomor_urut, warna kotak = jerawat[i].warna.
    dengan_potongan=True menambah foto_potongan di tiap jerawat (bawaan: tidak).
    """
    data = ke_data(hasil, ambang_jenis)
    data['lebar_foto'], data['tinggi_foto'] = foto.size
    for j, h in zip(data['jerawat'], hasil):
        j['nomor_urut'] = j['id'] + 1
        if dengan_potongan:
            j['foto_potongan'] = _ke_base64(_kecilkan(h['potongan'], MAKS_POTONGAN))
    gambar = _kecilkan(gambar_kotak_urut(foto, hasil, ambang_jenis), MAKS_HASIL)
    data['foto_hasil'] = '/hasil/' + simpan_foto(gambar, folder_simpan) if folder_simpan else _ke_base64(gambar)
    return data


def jalankan_lengkap(foto, detektor, model, kelas, conf=0.25, iou=0.45, ambang_jenis=0.5, dengan_potongan=False,
                     folder_simpan=None):
    """foto: PIL RGB (sudah diputar sesuai EXIF, mis. ImageOps.exif_transpose). Model jalan sekali."""
    import pipeline
    hasil = pipeline.jalankan(foto, detektor, model, kelas, conf=conf, iou=iou)
    return bangun_paket(foto, hasil, ambang_jenis, dengan_potongan, folder_simpan)
