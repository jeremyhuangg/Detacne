"""Aplikasi Streamlit 2 model: cari jerawat di foto wajah, lalu tebak jenis tiap jerawat.

Model 1: YOLOv8s deteksi v3 + Blackhead (1 kelas "Acne").
Model 2: Gabungan Random Forest + Extra Trees + HistGradientBoosting dengan 60 ciri warna+titik.
Jenis yang sama selalu diberi nomor dan warna yang sama (lihat src/info_jenis.py).

Jalankan dari folder proyek:
    .\\.venv\\Scripts\\streamlit.exe run app\\app.py

Hasil aplikasi ini bukan alat diagnosis medis.
"""
import json
import os
import sys

import streamlit as st
from PIL import Image, ImageOps

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src'))
import pipeline  # noqa: E402
from info_jenis import JENIS, gambar_kotak, hex_warna, jenis_tampil, ke_data  # noqa: E402

DISCLAIMER = ('⚠️ **Bukan alat diagnosis medis.** Kotak dan jenis hanya tebakan model AI: '
              'model deteksi menemukan sekitar 60% jerawat di data uji (Blackheads dan Whiteheads jauh '
              'lebih jarang ditemukan), dan model jenis benar sekitar 73% pada potongan jerawat di data uji '
              '(di foto sungguhan bisa lebih rendah). Untuk masalah kulit, konsultasikan ke dokter.')


@st.cache_resource
def muat_semua():
    model, kelas = pipeline.muat_jenis()
    return pipeline.muat_deteksi(), model, kelas


def lencana(nama):
    """Kotak kecil berwarna berisi nomor jenis, sama seperti di foto."""
    info = JENIS[nama]
    return (f'<span style="background:{hex_warna(nama)};color:{info["teks"]};padding:1px 8px;'
            f'border-radius:4px;font-weight:700">{info["nomor"]}</span>')


def main():
    st.set_page_config(page_title='Deteksi & Jenis Jerawat', page_icon='🔍', layout='wide')
    st.title('🔍 Deteksi & Jenis Jerawat (2 model)')
    st.write('Upload foto wajah atau sebagian wajah. **Model 1** mencari jerawat (kotak), '
             '**model 2** menebak jenis tiap kotak. Bagian yang tidak dikotak tidak dicek jenisnya.')
    st.warning(DISCLAIMER)

    with st.sidebar:
        st.header('Pengaturan')
        conf = st.slider('Keyakinan minimal deteksi (model 1)', 0.05, 0.95, 0.25, 0.05,
                         help='Lebih rendah: lebih banyak kotak, tapi lebih banyak salah kotak.')
        iou = st.slider('Batas tumpang-tindih kotak (IoU)', 0.1, 0.9, 0.45, 0.05,
                        help='Kotak yang bertumpuk lebih dari batas ini dianggap jerawat yang sama.')
        ambang_jenis = st.slider('Keyakinan minimal jenis (model 2)', 0.0, 1.0, 0.5, 0.05,
                                 help='Di bawah ini, jenis ditulis "Kurang yakin" (nomor "?").')
        st.caption(f'Model 1: {pipeline.MODEL_DETEKSI}\n\nModel 2: {pipeline.MODEL_JENIS}')
        st.subheader('Nomor & warna jenis')
        for nama in JENIS:
            st.markdown(f'{lencana(nama)} {nama}', unsafe_allow_html=True)
        st.caption('Model hanya mengenal 5 jenis jerawat. Tahi lalat, bekas jerawat, atau noda '
                   'yang ikut dikotak tetap akan diberi salah satu dari 5 jenis itu.')

    with st.spinner('Memuat model...'):
        detektor, model, kelas = muat_semua()

    f = st.file_uploader('Pilih foto', type=['jpg', 'jpeg', 'png', 'webp', 'bmp'])
    if f is None:
        st.stop()
    foto = ImageOps.exif_transpose(Image.open(f)).convert('RGB')

    with st.spinner('Mencari jerawat dan menebak jenisnya...'):
        hasil = pipeline.jalankan(foto, detektor, model, kelas, conf=conf, iou=iou)
    data = ke_data(hasil, ambang_jenis)

    kiri, kanan = st.columns([3, 2])
    kiri.image(gambar_kotak(foto, hasil, ambang_jenis), caption=f.name)
    with kanan:
        st.metric('Jerawat terdeteksi', data['jumlah_jerawat'])
        if not hasil:
            st.info('Tidak ada jerawat yang terdeteksi. Coba turunkan "Keyakinan minimal deteksi", '
                    'atau pakai foto yang lebih dekat.')
        else:
            st.markdown('**Keterangan nomor di foto**')
            for r in data['ringkasan']:
                st.markdown(f"{lencana(r['jenis'])} **{r['jenis']}** × {r['jumlah']}  \n"
                            f"<small>{r['ciri']}</small>", unsafe_allow_html=True)
            st.caption('Jenis yang sama selalu bernomor dan berwarna sama.')

    if hasil:
        st.subheader('Jerawat di fotomu, dikelompokkan per jenis')
        for r in data['ringkasan']:
            kelompok = [h for h in hasil if jenis_tampil(h, ambang_jenis) == r['jenis']]
            kelompok.sort(key=lambda h: -h['yakin'])
            st.markdown(f"{lencana(r['jenis'])} **{r['jenis']}** ({r['jumlah']})", unsafe_allow_html=True)
            kolom = st.columns(8)
            for i, h in enumerate(kelompok):
                with kolom[i % 8]:
                    st.image(h['potongan'].resize((112, 112)))
                    teks = f"yakin {h['yakin']:.0%}"
                    if r['jenis'] != h['jenis']:
                        teks = f"tebakan {h['jenis']} {h['yakin']:.0%}"
                    st.caption(teks)

        with st.expander('Data hasil (JSON) untuk website'):
            st.code(json.dumps(data, indent=1, ensure_ascii=False), language='json')

    st.divider()
    st.caption(DISCLAIMER)


main()
